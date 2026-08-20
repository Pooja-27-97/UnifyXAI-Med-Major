# models/

Place trained artifacts here when ready to go live:

- `rf_model.pkl` — trained `RandomForestClassifier` (joblib-dumped)
- `shap_explainer.pkl` — fitted `shap.TreeExplainer(rf_model)`
- `lime_explainer.pkl` — fitted `lime.lime_tabular.LimeTabularExplainer(...)`
- `feature_scaler.pkl` — any preprocessing/scaler used at train time

Then in `app.py`, replace `run_prediction`, `run_shap`, and `run_lime`
with calls into these loaded artifacts, following the exact input/output
shapes already used by the stand-in implementations (see the `TODO`
comments above each function).

Suggested dataset: Pima Indians Diabetes Dataset (8 features used by this
UI: Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI,
DiabetesPedigreeFunction, Age).
