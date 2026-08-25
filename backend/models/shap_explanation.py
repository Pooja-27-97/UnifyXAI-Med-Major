import pandas as pd
import joblib
import shap

# ==========================================
# LOAD SAVED MODEL
# ==========================================

model = joblib.load("random_forest.pkl")

# Load scaler
scaler = joblib.load("scaler.pkl")

# Load feature names
feature_names = joblib.load("feature_names.pkl")

print("Saved model loaded successfully!")
print("Scaler loaded successfully!")
print("Feature names loaded successfully!")


# ==========================================
# LOAD DATASET
# ==========================================

df = pd.read_csv("../data/diabetes.csv")

# Separate features and target
X = df.drop("Diabetes", axis=1)
y = df["Diabetes"]

# Use the same feature order as training
X = X[feature_names]

# Scale the data using the SAVED scaler
X_scaled = scaler.transform(X)

print("Dataset loaded and scaled successfully!")
print("Dataset shape:", X_scaled.shape)


# ==========================================
# CREATE SHAP EXPLAINER
# ==========================================

explainer = shap.TreeExplainer(model)

print("SHAP TreeExplainer created successfully!")


# ==========================================
# SELECT SMALL SAMPLE FOR SHAP
# ==========================================

X_shap = X_scaled[:100]

print("\nCalculating SHAP values for 100 samples...")


# ==========================================
# CALCULATE SHAP VALUES
# ==========================================

shap_values = explainer.shap_values(X_shap)

print("SHAP values generated successfully!")


# ==========================================
# GLOBAL SHAP FEATURE IMPORTANCE
# ==========================================

import numpy as np

# Convert SHAP values to numpy array
shap_array = np.asarray(shap_values)

print("\nSHAP output shape:", shap_array.shape)

# Handle SHAP output dimensions
if shap_array.ndim == 3:
    # Shape: (samples, features, classes)
    # Select class 1 (Diabetes = 1)
    values = shap_array[:, :, 1]

elif shap_array.ndim == 2:
    # Shape: (samples, features)
    values = shap_array

else:
    raise ValueError(
        f"Unexpected SHAP output shape: {shap_array.shape}"
    )

# Calculate mean absolute SHAP value for each feature
mean_abs_shap = np.abs(values).mean(axis=0)

# Create feature importance table
feature_importance = pd.DataFrame({
    "Feature": feature_names,
    "Mean_Abs_SHAP": mean_abs_shap
})

# Sort from most important to least important
feature_importance = feature_importance.sort_values(
    by="Mean_Abs_SHAP",
    ascending=False
)

print("\nGlobal SHAP Feature Importance:")
print(feature_importance.to_string(index=False))


# ==========================================
# GLOBAL SHAP BAR CHART
# ==========================================

import matplotlib.pyplot as plt

# Select top 15 features
top_features = feature_importance.head(15)

plt.figure(figsize=(10, 7))

plt.barh(
    top_features["Feature"][::-1],
    top_features["Mean_Abs_SHAP"][::-1]
)

plt.xlabel("Mean Absolute SHAP Value")
plt.ylabel("Feature")
plt.title("Global SHAP Feature Importance")

plt.tight_layout()

plt.savefig("global_shap_importance.png", dpi=300)

plt.show()


# ==========================================
# PHASE 3.6 - INDIVIDUAL SHAP EXPLANATION
# ==========================================

# Select one patient
patient_index = 0

patient_data = X_shap[patient_index:patient_index + 1]

# Get model prediction
patient_prediction = model.predict(patient_data)[0]

# Get prediction probability
patient_probability = model.predict_proba(patient_data)[0]

print("\nIndividual Patient Explanation")
print("--------------------------------")
print("Patient index:", patient_index)
print("Predicted class:", patient_prediction)
print("Probability of No Diabetes:", patient_probability[0])
print("Probability of Diabetes:", patient_probability[1])

# Calculate SHAP values for this patient
patient_shap = explainer.shap_values(patient_data)

print("\nIndividual SHAP values generated successfully!")


# ==========================================
# INDIVIDUAL SHAP FEATURE CONTRIBUTIONS
# ==========================================

# Convert SHAP output to numpy array
patient_shap_array = np.asarray(patient_shap)

print("\nIndividual SHAP output shape:", patient_shap_array.shape)

# Handle SHAP output dimensions
if patient_shap_array.ndim == 3:
    # Shape: (samples, features, classes)
    patient_values = patient_shap_array[0, :, 1]

elif patient_shap_array.ndim == 2:
    # Shape: (samples, features)
    patient_values = patient_shap_array[0]

else:
    raise ValueError(
        f"Unexpected SHAP output shape: {patient_shap_array.shape}"
    )

# Get original patient values
patient_original = X.iloc[patient_index]

# Create explanation table
patient_explanation = pd.DataFrame({
    "Feature": feature_names,
    "Patient_Value": patient_original.values,
    "SHAP_Value": patient_values
})

# Add direction of contribution
patient_explanation["Effect"] = patient_explanation["SHAP_Value"].apply(
    lambda x: "Increases Diabetes prediction"
    if x > 0
    else "Decreases Diabetes prediction"
)

# Sort by absolute SHAP contribution
patient_explanation["Absolute_SHAP"] = np.abs(
    patient_explanation["SHAP_Value"]
)

patient_explanation = patient_explanation.sort_values(
    by="Absolute_SHAP",
    ascending=False
)

print("\nIndividual Patient SHAP Explanation:")
print(
    patient_explanation[
        ["Feature", "Patient_Value", "SHAP_Value", "Effect"]
    ].to_string(index=False)
)


# ==========================================
# SHAP WATERFALL PLOT
# ==========================================

# Create SHAP Explanation object
patient_explanation_object = explainer(
    patient_data
)

# Select the Diabetes = 1 class
patient_explanation_class1 = patient_explanation_object[0, :, 1]

# Create waterfall plot
shap.plots.waterfall(
    patient_explanation_class1,
    max_display=15,
    show=False
)

plt.tight_layout()

plt.savefig(
    "individual_patient_shap.png",
    dpi=300,
    bbox_inches="tight"
)

plt.show()

print("\nIndividual SHAP waterfall plot saved successfully!")