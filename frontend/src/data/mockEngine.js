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
  { key: "pregnancies", label: "Pregnancies", unit: "" },
  { key: "glucose", label: "Glucose", unit: "mg/dL" },
  { key: "bloodPressure", label: "Blood Pressure", unit: "mmHg" },
  { key: "skinThickness", label: "Skin Thickness", unit: "mm" },
  { key: "insulin", label: "Insulin", unit: "mu U/mL" },
  { key: "bmi", label: "BMI", unit: "kg/m\u00B2" },
  { key: "dpf", label: "Diabetes Pedigree Function", unit: "" },
  { key: "age", label: "Age", unit: "yrs" },
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
  glucose: 1.0,
  bmi: 0.78,
  age: 0.6,
  dpf: 0.5,
  pregnancies: 0.4,
  insulin: 0.38,
  bloodPressure: 0.3,
  skinThickness: 0.22,
};

function normalizePatient(patient) {
  // Map raw clinical values to a rough 0-1 "risk contribution" scale
  return {
    pregnancies: clamp(patient.pregnancies / 12),
    glucose: clamp((patient.glucose - 70) / 130),
    bloodPressure: clamp((patient.bloodPressure - 60) / 60),
    skinThickness: clamp(patient.skinThickness / 50),
    insulin: clamp(patient.insulin / 300),
    bmi: clamp((patient.bmi - 18) / 25),
    dpf: clamp(patient.dpf / 1.5),
    age: clamp((patient.age - 18) / 60),
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
  Object.keys(norm).forEach((k) => {
    score += norm[k] * FEATURE_WEIGHT[k];
  });
  const maxScore = Object.values(FEATURE_WEIGHT).reduce((a, b) => a + b, 0);
  let probability = clamp(score / maxScore);

  const seed = hashString(JSON.stringify(patient));
  const rnd = seededRandom(seed);
  probability = clamp(probability * 0.85 + rnd() * 0.15);

  const prediction = probability >= 0.5 ? "Diabetic" : "Non-Diabetic";
  const riskLevel = probability >= 0.66 ? "High" : probability >= 0.4 ? "Moderate" : "Low";

  return { prediction, probability, riskLevel, seed };
}

/**
 * Simulates a SHAP TreeExplainer output for the given patient / prediction.
 * Returns signed contribution values (impact toward positive class).
 */
export function mockShap(patient, seed) {
  const norm = normalizePatient(patient);
  const rnd = seededRandom(seed + 11);
  return FEATURES.map((f) => {
    const base = (norm[f.key] - 0.5) * 2 * FEATURE_WEIGHT[f.key];
    const noise = (rnd() - 0.5) * 0.12;
    return { feature: f.key, label: f.label, value: round(base + noise) };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
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
    const base = (norm[f.key] - 0.5) * 2 * FEATURE_WEIGHT[f.key];
    const drift = (rnd() - 0.5) * 0.28; // LIME's local-surrogate noise
    return { feature: f.key, label: f.label, value: round(base * (0.85 + rnd() * 0.3) + drift) };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
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
  name: "",
  patientId: "",
  age: 45,
  gender: "Female",
  pregnancies: 2,
  glucose: 120,
  bloodPressure: 74,
  skinThickness: 24,
  insulin: 90,
  bmi: 27.5,
  dpf: 0.42,
};
