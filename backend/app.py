"""
UnifyXAI-Med — Flask API

B8.1:
Real Random Forest prediction API using the saved model artifacts.

Artifacts:
    backend/models/random_forest.pkl
    backend/models/scaler.pkl
    backend/models/feature_names.pkl
"""

from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS


# -------------------------------------------------------------------------
# Flask setup
# -------------------------------------------------------------------------

app = Flask(__name__)
CORS(app)


# -------------------------------------------------------------------------
# Paths
# -------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"


MODEL_PATH = MODEL_DIR / "random_forest.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.pkl"


# -------------------------------------------------------------------------
# Load trained artifacts
# -------------------------------------------------------------------------

print("Loading trained model artifacts...")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
feature_names = joblib.load(FEATURE_NAMES_PATH)

print("Random Forest model loaded successfully!")
print("Scaler loaded successfully!")
print("Feature names loaded successfully!")
print("Number of model features:", len(feature_names))


# -------------------------------------------------------------------------
# Expected input features
# -------------------------------------------------------------------------

EXPECTED_FEATURES = [
    "HighBP",
    "HighChol",
    "CholCheck",
    "BMI",
    "Smoker",
    "Stroke",
    "HeartDiseaseorAttack",
    "PhysActivity",
    "Fruits",
    "Veggies",
    "HvyAlcoholConsump",
    "AnyHealthcare",
    "NoDocbcCost",
    "GenHlth",
    "MentHlth",
    "PhysHlth",
    "DiffWalk",
    "Sex",
    "Age",
    "Education",
    "Income",
]


# -------------------------------------------------------------------------
# Validation
# -------------------------------------------------------------------------

if feature_names != EXPECTED_FEATURES:
    raise ValueError(
        "Feature names in feature_names.pkl do not match the expected "
        "21-feature model input order."
    )


# -------------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------------

def validate_patient(patient):
    """
    Validate that all 21 model features are present.
    """

    missing = [
        feature
        for feature in EXPECTED_FEATURES
        if feature not in patient
    ]

    if missing:
        raise ValueError(
            f"Missing required features: {', '.join(missing)}"
        )


def prepare_input(patient):
    """
    Convert the incoming JSON patient data into the exact
    feature order expected by the trained Random Forest.
    """

    validate_patient(patient)

    values = []

    for feature in EXPECTED_FEATURES:
        try:
            values.append(float(patient[feature]))
        except (TypeError, ValueError):
            raise ValueError(
                f"Invalid value for feature '{feature}'. "
                "Expected a numeric value."
            )

    X = pd.DataFrame(
        [values],
        columns=EXPECTED_FEATURES
    )

    return X


def get_risk_level(probability):
    """
    Simple demo risk categorization based on model probability.

    This is a project-level display category, not a clinical
    risk threshold.
    """

    if probability >= 0.66:
        return "High"

    if probability >= 0.40:
        return "Moderate"

    return "Low"


# -------------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "model": "Random Forest",
        "features": len(feature_names),
        "time": datetime.now(timezone.utc).isoformat(),
    })


@app.post("/api/predict")
def predict():

    try:
        patient = request.get_json(force=True)

        if not patient:
            return jsonify({
                "error": "Request body is empty."
            }), 400

        # -------------------------------------------------------------
        # Prepare patient data
        # -------------------------------------------------------------

        X = prepare_input(patient)

        # -------------------------------------------------------------
        # Apply the SAME scaler used during model training
        # -------------------------------------------------------------

        X_scaled = scaler.transform(X)

        # -------------------------------------------------------------
        # Random Forest prediction
        # -------------------------------------------------------------

        prediction_class = int(model.predict(X_scaled)[0])

        probabilities = model.predict_proba(X_scaled)[0]

        diabetes_probability = float(probabilities[1])
        no_diabetes_probability = float(probabilities[0])

        # -------------------------------------------------------------
        # Convert model output into UI-friendly result
        # -------------------------------------------------------------

        prediction = (
            "Diabetic"
            if prediction_class == 1
            else "Non-Diabetic"
        )

        risk_level = get_risk_level(diabetes_probability)

        result = {
            "prediction": prediction,
            "probability": diabetes_probability,
            "noDiabetesProbability": no_diabetes_probability,
            "diabetesProbability": diabetes_probability,
            "riskLevel": risk_level,
            "predictedClass": prediction_class,
        }

        return jsonify(result)

    except ValueError as e:

        return jsonify({
            "error": str(e)
        }), 400

    except Exception as e:

        print("Prediction error:", e)

        return jsonify({
            "error": "Prediction failed.",
            "details": str(e),
        }), 500


# -------------------------------------------------------------------------
# Main
# -------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )