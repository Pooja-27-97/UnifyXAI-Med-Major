import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load dataset
df = pd.read_csv("../data/diabetes.csv")

# Count each class
print(df["Diabetes"].value_counts())

# Basic information
print(df.head())
print(df.info())
print(df.isnull().sum())
print(df.describe())

# Features and Target
X = df.drop("Diabetes", axis=1)
y = df["Diabetes"]

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42, 
    stratify=y
)

# Feature Scaling
scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

print("Dataset loaded successfully!")
print("Training set:", X_train.shape)
print("Testing set:", X_test.shape)

from imblearn.over_sampling import SMOTE

smote = SMOTE(random_state=42)

X_train, y_train = smote.fit_resample(X_train, y_train)

print("After SMOTE:")
print(y_train.value_counts())


# ==========================================
# PHASE 3.1 - TRAIN RANDOM FOREST
# ==========================================

from sklearn.ensemble import RandomForestClassifier

# Create Random Forest model
model = RandomForestClassifier(
    n_estimators=50,
    random_state=42,
    n_jobs=-1
)

# Train the model
model.fit(X_train, y_train)

print("\nRandom Forest trained successfully!")


# ==========================================
# PHASE 3.2 - EVALUATE RANDOM FOREST
# ==========================================

# Make predictions on test data
y_pred = model.predict(X_test)

print("\nPredictions generated successfully!")

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\nModel Evaluation:")
print("Accuracy :", accuracy)
print("Precision:", precision)
print("Recall   :", recall)
print("F1 Score :", f1)

from sklearn.metrics import classification_report

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# ==========================================
# PHASE 3.3 - SAVE TRAINED MODEL
# ==========================================

import joblib

# Save the trained Random Forest model
joblib.dump(model, "random_forest.pkl")

# Save the scaler
joblib.dump(scaler, "scaler.pkl")

# Save feature names
joblib.dump(X.columns.tolist(), "feature_names.pkl")

print("\nModel, scaler, and feature names saved successfully!")

# ==========================================
# PHASE 3.4 - SHAP INTEGRATION
# ==========================================

import shap

# Create SHAP TreeExplainer
explainer = shap.TreeExplainer(model)

print("\nSHAP TreeExplainer created successfully!")

# ==========================================
# PHASE 3.5 - GLOBAL SHAP EXPLANATION
# ==========================================

# Use a sample of test data for SHAP
X_shap = X_test[:100]

# Calculate SHAP values
shap_values = explainer.shap_values(X_shap)

print("\nGlobal SHAP values generated successfully!")
print("SHAP data shape:", X_shap.shape)