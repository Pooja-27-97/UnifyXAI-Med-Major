"""
UnifyXAI-Med — LIME Explainer

Generates a local LIME explanation for one patient
using the trained Random Forest model.
"""

from pathlib import Path

import joblib
import pandas as pd
import re
from lime.lime_tabular import LimeTabularExplainer


# -------------------------------------------------------------------------
# Paths
# -------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

MODEL_PATH = MODEL_DIR / "random_forest.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.pkl"
DATA_PATH = DATA_DIR / "diabetes.csv"


# -------------------------------------------------------------------------
# Load trained artifacts
# -------------------------------------------------------------------------

print("Loading LIME model artifacts...")

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
feature_names = joblib.load(FEATURE_NAMES_PATH)

print("Model loaded successfully!")
print("Scaler loaded successfully!")
print("Feature names loaded successfully!")


# -------------------------------------------------------------------------
# Load training data
# -------------------------------------------------------------------------

df = pd.read_csv(DATA_PATH)

X = df.drop("Diabetes", axis=1)

print("Dataset loaded successfully!")
print("Dataset shape:", X.shape)


# -------------------------------------------------------------------------
# Scale training data
# -------------------------------------------------------------------------

X_scaled = scaler.transform(X)

print("Training data scaling completed!")


# -------------------------------------------------------------------------
# Create LIME explainer
# -------------------------------------------------------------------------

lime_explainer = LimeTabularExplainer(
    X_scaled,
    feature_names=feature_names,
    class_names=[
        "No Diabetes",
        "Diabetes"
    ],
    mode="classification",
    random_state=42
)

print("LIME explainer created successfully!")


# -------------------------------------------------------------------------
# Feature labels
# -------------------------------------------------------------------------

FEATURE_LABELS = {
    "HighBP": "High Blood Pressure",
    "HighChol": "High Cholesterol",
    "CholCheck": "Cholesterol Check",
    "BMI": "BMI",
    "Smoker": "Smoker",
    "Stroke": "Stroke",
    "HeartDiseaseorAttack": "Heart Disease or Heart Attack",
    "PhysActivity": "Physical Activity",
    "Fruits": "Fruit Consumption",
    "Veggies": "Vegetable Consumption",
    "HvyAlcoholConsump": "Heavy Alcohol Consumption",
    "AnyHealthcare": "Healthcare Coverage",
    "NoDocbcCost": "Unable to See Doctor Due to Cost",
    "GenHlth": "General Health",
    "MentHlth": "Mental Health",
    "PhysHlth": "Physical Health",
    "DiffWalk": "Difficulty Walking",
    "Sex": "Sex",
    "Age": "Age Group",
    "Education": "Education",
    "Income": "Income",
}


# -------------------------------------------------------------------------
# Generate LIME explanation
# -------------------------------------------------------------------------

def explain_patient(patient):
    """
    Generate a LIME explanation for one patient.

    patient:
        Dictionary containing all 21 model features.

    Returns:
        List of feature contributions.
    """

    # -------------------------------------------------------------
    # Put patient values into the exact model feature order
    # -------------------------------------------------------------

    values = []

    for feature in feature_names:

        if feature not in patient:
            raise ValueError(
                f"Missing required feature: {feature}"
            )

        try:
            values.append(float(patient[feature]))

        except (TypeError, ValueError):
            raise ValueError(
                f"Invalid value for feature '{feature}'"
            )

    # -------------------------------------------------------------
    # Create DataFrame
    # -------------------------------------------------------------

    X_patient = pd.DataFrame(
        [values],
        columns=feature_names
    )

    # -------------------------------------------------------------
    # Apply SAME scaler used during model training
    # -------------------------------------------------------------

    X_patient_scaled = scaler.transform(X_patient)

    patient_array = X_patient_scaled[0]

    # -------------------------------------------------------------
    # Generate LIME explanation
    # -------------------------------------------------------------

    explanation = lime_explainer.explain_instance(
        patient_array,
        model.predict_proba,
        num_features=len(feature_names)
    )

    # -------------------------------------------------------------
    # Convert LIME output into frontend-friendly format
    # -------------------------------------------------------------

    result = []

    for feature_text, weight in explanation.as_list():

        matched_feature = None

        # Find which actual model feature appears in the LIME condition
        for feature in feature_names:
            if feature in feature_text:
                matched_feature = feature
                break

        if matched_feature is None:
            continue

        result.append({
            "feature": matched_feature,
            "label": FEATURE_LABELS.get(
                matched_feature,
                matched_feature
            ),
            "condition": feature_text,
            "value": round(float(weight), 4)
        })

    # Sort by absolute contribution
    result.sort(
        key=lambda x: abs(x["value"]),
        reverse=True
    )

    return result


# -------------------------------------------------------------------------
# Test LIME explanation
# -------------------------------------------------------------------------

if __name__ == "__main__":

    sample_index = 0

    print("\nSelecting patient:", sample_index)

    patient = X.iloc[sample_index]

    # Generate explanation
    explanation = explain_patient(patient.to_dict())

    print("\n========================================")
    print("LIME FEATURE CONTRIBUTIONS")
    print("========================================")

    for item in explanation:
        print(f'{item["feature"]}: {item["value"]:+.4f}')