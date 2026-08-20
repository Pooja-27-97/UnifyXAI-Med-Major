// -----------------------------------------------------------------------
// mockEngine.js
// -----------------------------------------------------------------------
// Simulates the Random Forest + SHAP + LIME + Unified Explainability
// Engine on the frontend so the UI is fully demonstrable before the
// Flask/ML backend is wired in. Every function here has a 1:1 shaped
// counterpart expected from the future API (see /backend/app.py) so
// swapping mockPredict() -> fetch('/api/predict') is a drop-in change.
// -----------------------------------------------------------------------

export const FEATURES = [
  { key: "HighBP", label: "High Blood Pressure", unit: "" },
  { key: "HighChol", label: "High Cholesterol", unit: "" },
  { key: "CholCheck", label: "Cholesterol Check", unit: "" },
  { key: "BMI", label: "BMI", unit: "kg/m²" },
  { key: "Smoker", label: "Smoker", unit: "" },
  { key: "Stroke", label: "History of Stroke", unit: "" },
  { key: "HeartDiseaseorAttack", label: "Heart Disease or Heart Attack", unit: "" },
  { key: "PhysActivity", label: "Physical Activity", unit: "" },
  { key: "Fruits", label: "Fruit Consumption", unit: "" },
  { key: "Veggies", label: "Vegetable Consumption", unit: "" },
  { key: "HvyAlcoholConsump", label: "Heavy Alcohol Consumption", unit: "" },
  { key: "AnyHealthcare", label: "Healthcare Coverage", unit: "" },
  { key: "NoDocbcCost", label: "Unable to See Doctor Due to Cost", unit: "" },
  { key: "GenHlth", label: "General Health", unit: "" },
  { key: "MentHlth", label: "Mental Health", unit: "days" },
  { key: "PhysHlth", label: "Physical Health", unit: "days" },
  { key: "DiffWalk", label: "Difficulty Walking", unit: "" },
  { key: "Sex", label: "Sex", unit: "" },
  { key: "Age", label: "Age Group", unit: "" },
  { key: "Education", label: "Education Level", unit: "" },
  { key: "Income", label: "Income Level", unit: "" },
];

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

// Rough "clinical weight" priors used to bias synthetic SHAP/LIME values
// so the demo output looks medically plausible (glucose & BMI dominate).
const FEATURE_WEIGHT = {
  GenHlth: 1.00,
  BMI: 0.92,
  HighBP: 0.77,
  Age: 0.58,
  HighChol: 0.57,
  Income: 0.40,
  PhysHlth: 0.35,
  Education: 0.28,
  MentHlth: 0.17,
  Sex: 0.17,
  DiffWalk: 0.17,
  HeartDiseaseorAttack: 0.14,
  Fruits: 0.09,
  Smoker: 0.09,
  PhysActivity: 0.08,
  Veggies: 0.07,
  HvyAlcoholConsump: 0.05,
  CholCheck: 0.03,
  NoDocbcCost: 0.03,
  Stroke: 0.03,
  AnyHealthcare: 0.02,
};

const RISK_DIRECTION = {
  HighBP: 1,
  HighChol: 1,
  CholCheck: 0,
  BMI: 1,
  Smoker: 1,
  Stroke: 1,
  HeartDiseaseorAttack: 1,
  PhysActivity: -1,
  Fruits: -1,
  Veggies: -1,
  HvyAlcoholConsump: 1,
  AnyHealthcare: 0,
  NoDocbcCost: 1,
  GenHlth: 1,
  MentHlth: 1,
  PhysHlth: 1,
  DiffWalk: 1,
  Sex: 0,
  Age: 1,
  Education: -1,
  Income: -1,
};

function normalizePatient(patient) {
  return {
    HighBP: Number(patient.HighBP) || 0,

    HighChol: Number(patient.HighChol) || 0,

    CholCheck: Number(patient.CholCheck) || 0,

    BMI: clamp((Number(patient.BMI) - 18) / 25),

    Smoker: Number(patient.Smoker) || 0,

    Stroke: Number(patient.Stroke) || 0,

    HeartDiseaseorAttack:
      Number(patient.HeartDiseaseorAttack) || 0,

    PhysActivity: Number(patient.PhysActivity) || 0,

    Fruits: Number(patient.Fruits) || 0,

    Veggies: Number(patient.Veggies) || 0,

    HvyAlcoholConsump:
      Number(patient.HvyAlcoholConsump) || 0,

    AnyHealthcare:
      Number(patient.AnyHealthcare) || 0,

    NoDocbcCost:
      Number(patient.NoDocbcCost) || 0,

    // Dataset: 1 = excellent, 5 = poor
    GenHlth: clamp((Number(patient.GenHlth) - 1) / 4),

    // 0–30 days
    MentHlth: clamp(Number(patient.MentHlth) / 30),

    PhysHlth: clamp(Number(patient.PhysHlth) / 30),

    DiffWalk: Number(patient.DiffWalk) || 0,

    Sex: Number(patient.Sex) || 0,

    // Dataset: 1 = 18–24, 13 = 80+
    Age: clamp((Number(patient.Age) - 1) / 12),

    // 1–6
    Education: clamp((Number(patient.Education) - 1) / 5),

    // 1–8
    Income: clamp((Number(patient.Income) - 1) / 7),
  };
}

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Simulates a trained RandomForestClassifier.predict_proba() call.
 */
export function mockPredict(patient) {
  const norm = normalizePatient(patient);

  let score = 0;

  Object.keys(norm).forEach((key) => {
    const direction = RISK_DIRECTION[key];

    if (direction === 0) {
      return;
    }

    score +=
      norm[key] *
      FEATURE_WEIGHT[key] *
      direction;
  });

  const maxScore = Object.entries(FEATURE_WEIGHT).reduce(
    (total, [key, weight]) => {
      return RISK_DIRECTION[key] === 0
        ? total
        : total + weight;
    },
    0
  );

  // Shift the score into a usable 0–1 range.
  const rawScore = score / maxScore;

  let probability = clamp(
    0.35 + rawScore * 0.65
  );

  const seed = hashString(
    JSON.stringify(patient)
  );

  const rnd = seededRandom(seed);

  probability = clamp(
    probability * 0.9 + rnd() * 0.1
  );

  const prediction =
    probability >= 0.5
      ? "Diabetic"
      : "Non-Diabetic";

  const riskLevel =
    probability >= 0.66
      ? "High"
      : probability >= 0.4
      ? "Moderate"
      : "Low";

  return {
    prediction,
    probability,
    riskLevel,
    seed,
  };
}

/**
 * Simulates a SHAP TreeExplainer output for the given patient / prediction.
 * Returns signed contribution values (impact toward positive class).
 */
export function mockShap(patient, seed) {
  const norm = normalizePatient(patient);
  const rnd = seededRandom(seed + 11);

  return FEATURES.map((f) => {
    const direction = RISK_DIRECTION[f.key];

    let base = 0;

    if (direction !== 0) {
      base =
        (norm[f.key] - 0.5) *
        2 *
        FEATURE_WEIGHT[f.key] *
        direction;
    }

    const noise =
      (rnd() - 0.5) * 0.12;

    return {
      feature: f.key,
      label: f.label,
      value: round(base + noise),
    };
  }).sort(
    (a, b) =>
      Math.abs(b.value) -
      Math.abs(a.value)
  );
}

/**
 * Simulates a LIME (LimeTabularExplainer) local surrogate output.
 * LIME tends to agree with SHAP directionally but diverges in
 * magnitude/ranking on lower-importance features - this is
 * intentionally modeled below for a realistic Agreement Score < 100%.
 */
export function mockLime(patient, seed) {
  const norm = normalizePatient(patient);
  const rnd = seededRandom(seed + 97);

  return FEATURES.map((f) => {
    const direction = RISK_DIRECTION[f.key];

    let base = 0;

    if (direction !== 0) {
      base =
        (norm[f.key] - 0.5) *
        2 *
        FEATURE_WEIGHT[f.key] *
        direction;
    }

    const drift =
      (rnd() - 0.5) * 0.28;

    return {
      feature: f.key,
      label: f.label,
      value: round(
        base *
          (0.85 + rnd() * 0.3) +
          drift
      ),
    };
  }).sort(
    (a, b) =>
      Math.abs(b.value) -
      Math.abs(a.value)
  );
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

/**
 * The Unified Explainability Engine: merges SHAP + LIME into a single
 * doctor-friendly ranking, and computes Agreement Score (rank + sign
 * consensus) and Confidence Score (inverse of cross-method variance).
 */
export function unify(shap, lime) {
  const byFeature = {};
  shap.forEach((s) => { byFeature[s.feature] = { ...byFeature[s.feature], shap: s.value, label: s.label }; });
  lime.forEach((l) => { byFeature[l.feature] = { ...byFeature[l.feature], lime: l.value, label: l.label }; });

  const merged = Object.entries(byFeature).map(([feature, v]) => {
    const unifiedValue = round((v.shap + v.lime) / 2);
    const sameSign = Math.sign(v.shap) === Math.sign(v.lime) || Math.abs(v.shap) < 0.02 || Math.abs(v.lime) < 0.02;
    const magDiff = Math.abs(Math.abs(v.shap) - Math.abs(v.lime));
    return { feature, label: v.label, shap: v.shap, lime: v.lime, unified: unifiedValue, sameSign, magDiff };
  });

  merged.sort((a, b) => Math.abs(b.unified) - Math.abs(a.unified));
  merged.forEach((m, i) => (m.rank = i + 1));

  // Agreement: % of features where SHAP & LIME agree on direction,
  // weighted lightly by how close their magnitudes are.
  const agreementRaw = merged.reduce((acc, m) => {
    const signPart = m.sameSign ? 1 : 0;
    const magPart = 1 - Math.min(1, m.magDiff / 0.5);
    return acc + (signPart * 0.7 + magPart * 0.3);
  }, 0);
  const agreementScore = round((agreementRaw / merged.length) * 100 * 10) / 10;

  // Confidence: inverse of average cross-method variance, scaled to %.
  const variance = merged.reduce((acc, m) => acc + Math.pow(m.shap - m.lime, 2), 0) / merged.length;
  const confidenceScore = round(Math.max(0, 100 - variance * 180) * 10) / 10;

  return { ranking: merged, agreementScore, confidenceScore };
}

/**
 * Generates a doctor-friendly natural-language explanation summary.
 * (Placeholder for a future LLM-generated / templated clinical summary.)
 */
export function buildSummary(patient, result, unified) {
  const top3 = unified.ranking.slice(0, 3);
  const direction = (v) => (v >= 0 ? "increased" : "decreased");
  const driverSentence = top3
    .map((f) => `${f.label} (${direction(f.unified)} risk, unified impact ${f.unified >= 0 ? "+" : ""}${f.unified.toFixed(2)})`)
    .join(", ");

  const agreementNote =
    unified.agreementScore >= 85
      ? "SHAP and LIME strongly agree on the leading risk drivers, indicating a stable and trustworthy explanation."
      : unified.agreementScore >= 65
      ? "SHAP and LIME largely agree, with minor divergence on lower-ranked features."
      : "SHAP and LIME show notable disagreement on some features; interpret the ranking with additional clinical judgement.";

  return `The model classifies this patient as ${result.prediction.toLowerCase()} with a predicted probability of ${(result.probability * 100).toFixed(1)}% and a ${result.riskLevel.toLowerCase()} overall risk level. The top contributing factors, after unifying SHAP and LIME, are ${driverSentence}. ${agreementNote} Overall model confidence in this explanation is ${unified.confidenceScore.toFixed(1)}%.`;
}

export function runFullPipeline(patient) {
  const result = mockPredict(patient);
  const shap = mockShap(patient, result.seed);
  const lime = mockLime(patient, result.seed);
  const unified = unify(shap, lime);
  const summary = buildSummary(patient, result, unified);
  return { patient, result, shap, lime, unified, summary, timestamp: new Date().toISOString() };
}

export const DEFAULT_PATIENT = {
  // Identification
  name: "",
  patientId: "",

  // Model features
  HighBP: 0,
  HighChol: 0,
  CholCheck: 1,
  BMI: 25.0,
  Smoker: 0,
  Stroke: 0,
  HeartDiseaseorAttack: 0,
  PhysActivity: 1,
  Fruits: 1,
  Veggies: 1,
  HvyAlcoholConsump: 0,
  AnyHealthcare: 1,
  NoDocbcCost: 0,
  GenHlth: 3,
  MentHlth: 0,
  PhysHlth: 0,
  DiffWalk: 0,
  Sex: 0,
  Age: 6,
  Education: 4,
  Income: 4,
};