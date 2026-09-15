import joblib
import numpy as np
import pandas as pd
import shap
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "random_forest.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.pkl"


# ============================================================
# LOAD MODEL ARTIFACTS
# ============================================================

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
feature_names = joblib.load(FEATURE_NAMES_PATH)

print("SHAP: Model loaded successfully!")
print("SHAP: Scaler loaded successfully!")
print("SHAP: Feature names loaded successfully!")


# ============================================================
# CREATE SHAP EXPLAINER
# ============================================================

explainer = shap.TreeExplainer(model)

print("SHAP: TreeExplainer created successfully!")


# ============================================================
# EXPECTED FEATURES
# ============================================================

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


# ============================================================
# FRONTEND-FRIENDLY LABELS
# ============================================================

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


# ============================================================
# VALIDATE FEATURES
# ============================================================

if feature_names != EXPECTED_FEATURES:
    raise ValueError(
        "Feature names in feature_names.pkl do not match "
        "the expected 21-feature model input order."
    )


# ============================================================
# VALIDATE PATIENT INPUT
# ============================================================

def validate_patient(patient):

    missing = [
        feature
        for feature in EXPECTED_FEATURES
        if feature not in patient
    ]

    if missing:
        raise ValueError(
            f"Missing required features: {', '.join(missing)}"
        )


# ============================================================
# PREPARE PATIENT INPUT
# ============================================================

def prepare_input(patient):

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


# ============================================================
# EXPLAIN ONE PATIENT
# ============================================================

def explain_patient(patient):

    """
    Generate SHAP explanation for one patient.

    Input:
        patient -> dictionary containing all 21 features

    Output:
        list of dictionaries containing:
        feature
        label
        value
        effect
    """

    # --------------------------------------------------------
    # Prepare patient
    # --------------------------------------------------------

    X = prepare_input(patient)

    # --------------------------------------------------------
    # Apply the SAME scaler used during training
    # --------------------------------------------------------

    X_scaled = scaler.transform(X)

    # --------------------------------------------------------
    # Calculate SHAP values
    # --------------------------------------------------------

    shap_output = explainer.shap_values(X_scaled)

    # --------------------------------------------------------
    # Handle SHAP versions
    # --------------------------------------------------------

    if isinstance(shap_output, list):

        shap_values = shap_output[1][0]

    else:

        shap_array = np.asarray(shap_output)

        if shap_array.ndim == 3:

            # (samples, features, classes)

            shap_values = shap_array[0, :, 1]

        elif shap_array.ndim == 2:

            # (samples, features)

            shap_values = shap_array[0]

        else:

            raise ValueError(
                f"Unexpected SHAP output shape: "
                f"{shap_array.shape}"
            )

    # --------------------------------------------------------
    # Create result
    # --------------------------------------------------------

    result = []

    for feature, value in zip(
        feature_names,
        shap_values
    ):

        value = float(value)

        result.append({
            "feature": feature,
            "label": FEATURE_LABELS.get(
                feature,
                feature
            ),
            "value": round(value, 6),
            "effect": (
                "Increases Diabetes prediction"
                if value > 0
                else "Decreases Diabetes prediction"
            )
        })

    # --------------------------------------------------------
    # Sort by strongest contribution
    # --------------------------------------------------------

    result.sort(
        key=lambda x: abs(x["value"]),
        reverse=True
    )

    return result