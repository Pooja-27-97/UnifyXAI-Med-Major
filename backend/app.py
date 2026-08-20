"""
UnifyXAI-Med — Flask API
-------------------------------------------------------------------------
API-ready backend for the UnifyXAI-Med frontend. Endpoints are already
shaped to match what the React app expects (see frontend/src/utils/api.js
and frontend/src/data/mockEngine.js for the exact response contracts).

Current state:  runs on a lightweight, deterministic stand-in model so the
                 full stack is runnable end-to-end today.
Next step:       drop a trained RandomForestClassifier into models/, and a
                 fitted SHAP TreeExplainer / LIME LimeTabularExplainer,
                 then replace the three functions marked TODO below.

Run:
    pip install -r requirements.txt
    python app.py
    # Flask serves on http://localhost:5000, Vite proxies /api -> here.
"""

import hashlib
import math
import random
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

FEATURES = [
    ("pregnancies", "Pregnancies"),
    ("glucose", "Glucose"),
    ("bloodPressure", "Blood Pressure"),
    ("skinThickness", "Skin Thickness"),
    ("insulin", "Insulin"),
    ("bmi", "BMI"),
    ("dpf", "Diabetes Pedigree Function"),
    ("age", "Age"),
]

FEATURE_WEIGHT = {
    "glucose": 1.0,
    "bmi": 0.78,
    "age": 0.6,
    "dpf": 0.5,
    "pregnancies": 0.4,
    "insulin": 0.38,
    "bloodPressure": 0.3,
    "skinThickness": 0.22,
}


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def normalize_patient(p):
    return {
        "pregnancies": clamp(p.get("pregnancies", 0) / 12),
        "glucose": clamp((p.get("glucose", 0) - 70) / 130),
        "bloodPressure": clamp((p.get("bloodPressure", 0) - 60) / 60),
        "skinThickness": clamp(p.get("skinThickness", 0) / 50),
        "insulin": clamp(p.get("insulin", 0) / 300),
        "bmi": clamp((p.get("bmi", 0) - 18) / 25),
        "dpf": clamp(p.get("dpf", 0) / 1.5),
        "age": clamp((p.get("age", 0) - 18) / 60),
    }


def seeded_rng(patient):
    digest = hashlib.sha256(str(sorted(patient.items())).encode()).hexdigest()
    seed = int(digest[:8], 16)
    return random.Random(seed), seed


# -------------------------------------------------------------------------
# TODO: replace with `model.predict_proba(X)[0][1]` from a trained
# RandomForestClassifier (e.g. loaded via joblib from models/rf_model.pkl)
# -------------------------------------------------------------------------
def run_prediction(patient):
    norm = normalize_patient(patient)
    score = sum(norm[k] * FEATURE_WEIGHT[k] for k in norm)
    max_score = sum(FEATURE_WEIGHT.values())
    probability = clamp(score / max_score)

    rng, seed = seeded_rng(patient)
    probability = clamp(probability * 0.85 + rng.random() * 0.15)

    prediction = "Diabetic" if probability >= 0.5 else "Non-Diabetic"
    risk_level = "High" if probability >= 0.66 else "Moderate" if probability >= 0.4 else "Low"
    return {"prediction": prediction, "probability": probability, "riskLevel": risk_level}, seed


# -------------------------------------------------------------------------
# TODO: replace with `shap.TreeExplainer(model).shap_values(X)`
# -------------------------------------------------------------------------
def run_shap(patient, seed):
    norm = normalize_patient(patient)
    rng = random.Random(seed + 11)
    out = []
    for key, label in FEATURES:
        base = (norm[key] - 0.5) * 2 * FEATURE_WEIGHT[key]
        noise = (rng.random() - 0.5) * 0.12
        out.append({"feature": key, "label": label, "value": round(base + noise, 3)})
    out.sort(key=lambda r: -abs(r["value"]))
    return out


# -------------------------------------------------------------------------
# TODO: replace with `lime.lime_tabular.LimeTabularExplainer(...).explain_instance(...)`
# -------------------------------------------------------------------------
def run_lime(patient, seed):
    norm = normalize_patient(patient)
    rng = random.Random(seed + 97)
    out = []
    for key, label in FEATURES:
        base = (norm[key] - 0.5) * 2 * FEATURE_WEIGHT[key]
        drift = (rng.random() - 0.5) * 0.28
        value = base * (0.85 + rng.random() * 0.3) + drift
        out.append({"feature": key, "label": label, "value": round(value, 3)})
    out.sort(key=lambda r: -abs(r["value"]))
    return out


def unify(shap_vals, lime_vals):
    by_feature = {}
    for s in shap_vals:
        by_feature.setdefault(s["feature"], {})["shap"] = s["value"]
        by_feature[s["feature"]]["label"] = s["label"]
    for l in lime_vals:
        by_feature.setdefault(l["feature"], {})["lime"] = l["value"]
        by_feature[l["feature"]]["label"] = l["label"]

    merged = []
    for feature, v in by_feature.items():
        shap_v, lime_v = v["shap"], v["lime"]
        unified_val = round((shap_v + lime_v) / 2, 3)
        same_sign = (shap_v >= 0) == (lime_v >= 0) or abs(shap_v) < 0.02 or abs(lime_v) < 0.02
        mag_diff = abs(abs(shap_v) - abs(lime_v))
        merged.append({
            "feature": feature, "label": v["label"], "shap": shap_v, "lime": lime_v,
            "unified": unified_val, "sameSign": same_sign, "magDiff": mag_diff,
        })

    merged.sort(key=lambda r: -abs(r["unified"]))
    for i, m in enumerate(merged):
        m["rank"] = i + 1

    agreement_raw = 0.0
    for m in merged:
        sign_part = 1.0 if m["sameSign"] else 0.0
        mag_part = 1.0 - min(1.0, m["magDiff"] / 0.5)
        agreement_raw += sign_part * 0.7 + mag_part * 0.3
    agreement_score = round((agreement_raw / len(merged)) * 100, 1)

    variance = sum((m["shap"] - m["lime"]) ** 2 for m in merged) / len(merged)
    confidence_score = round(max(0.0, 100 - variance * 180), 1)

    return {"ranking": merged, "agreementScore": agreement_score, "confidenceScore": confidence_score}


def build_summary(result, unified):
    top3 = unified["ranking"][:3]
    direction = lambda v: "increased" if v >= 0 else "decreased"
    drivers = ", ".join(
        f'{f["label"]} ({direction(f["unified"])} risk, unified impact {f["unified"]:+.2f})' for f in top3
    )
    if unified["agreementScore"] >= 85:
        agreement_note = "SHAP and LIME strongly agree on the leading risk drivers, indicating a stable and trustworthy explanation."
    elif unified["agreementScore"] >= 65:
        agreement_note = "SHAP and LIME largely agree, with minor divergence on lower-ranked features."
    else:
        agreement_note = "SHAP and LIME show notable disagreement on some features; interpret the ranking with additional clinical judgement."

    return (
        f'The model classifies this patient as {result["prediction"].lower()} with a predicted probability of '
        f'{result["probability"] * 100:.1f}% and a {result["riskLevel"].lower()} overall risk level. '
        f'The top contributing factors, after unifying SHAP and LIME, are {drivers}. {agreement_note} '
        f'Overall model confidence in this explanation is {unified["confidenceScore"]:.1f}%.'
    )


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "time": datetime.now(timezone.utc).isoformat()})


@app.post("/api/predict")
def predict():
    patient = request.get_json(force=True)
    result, _ = run_prediction(patient)
    return jsonify(result)


@app.post("/api/explain/shap")
def explain_shap():
    patient = request.get_json(force=True)
    _, seed = run_prediction(patient)
    return jsonify(run_shap(patient, seed))


@app.post("/api/explain/lime")
def explain_lime():
    patient = request.get_json(force=True)
    _, seed = run_prediction(patient)
    return jsonify(run_lime(patient, seed))


@app.post("/api/explain/unified")
def explain_unified():
    patient = request.get_json(force=True)
    _, seed = run_prediction(patient)
    shap_vals = run_shap(patient, seed)
    lime_vals = run_lime(patient, seed)
    return jsonify(unify(shap_vals, lime_vals))


@app.post("/api/pipeline/run")
def pipeline_run():
    """Runs the full Random Forest -> SHAP -> LIME -> Unified Engine pipeline in one call."""
    patient = request.get_json(force=True)
    result, seed = run_prediction(patient)
    shap_vals = run_shap(patient, seed)
    lime_vals = run_lime(patient, seed)
    unified = unify(shap_vals, lime_vals)
    summary = build_summary(result, unified)
    return jsonify({
        "patient": patient,
        "result": result,
        "shap": shap_vals,
        "lime": lime_vals,
        "unified": unified,
        "summary": summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
