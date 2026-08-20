import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, FlaskConical, Loader2 } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useApp } from "../context/AppContext.jsx";
import { DEFAULT_PATIENT, runFullPipeline } from "../data/mockEngine.js";

const NUMERIC_FIELDS = [
  { key: "age", label: "Age", unit: "years", min: 1, max: 120, step: 1 },
  { key: "pregnancies", label: "Pregnancies", unit: "count", min: 0, max: 20, step: 1 },
  { key: "glucose", label: "Glucose", unit: "mg/dL", min: 0, max: 300, step: 1 },
  { key: "bloodPressure", label: "Blood Pressure", unit: "mmHg", min: 0, max: 200, step: 1 },
  { key: "skinThickness", label: "Skin Thickness", unit: "mm", min: 0, max: 100, step: 1 },
  { key: "insulin", label: "Insulin", unit: "mu U/mL", min: 0, max: 900, step: 1 },
  { key: "bmi", label: "BMI", unit: "kg/m²", min: 10, max: 70, step: 0.1 },
  { key: "dpf", label: "Diabetes Pedigree Function", unit: "score", min: 0, max: 2.5, step: 0.01 },
];

export default function NewPrediction() {
  const [patient, setPatient] = useState(DEFAULT_PATIENT);
  const [loading, setLoading] = useState(false);
  const { addPrediction } = useApp();
  const navigate = useNavigate();

  function update(key, value) {
    setPatient((p) => ({ ...p, [key]: value }));
  }

  function handleReset() {
    setPatient(DEFAULT_PATIENT);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const normalized = { ...patient };
    NUMERIC_FIELDS.forEach((f) => { normalized[f.key] = Number(patient[f.key]) || 0; });

    // Simulated inference latency for the RF + SHAP + LIME + Unification pipeline.
    setTimeout(() => {
      const record = runFullPipeline(normalized);
      addPrediction(record);
      setLoading(false);
      navigate("/result");
    }, 900);
  }

  return (
    <Layout eyebrow="New Prediction" title="Patient Intake & Risk Prediction">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div className="card card-pad">
            <div className="card-head">
              <div>
                <h3>Patient Identification</h3>
                <p>Used for report labeling only — not sent to the model.</p>
              </div>
            </div>
            <div className="grid grid-2" style={{ gap: 14 }}>
              <div className="field">
                <label htmlFor="name">Patient Name</label>
                <input id="name" className="input" placeholder="e.g. Anjali Mehta" value={patient.name}
                  onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="pid">Patient ID</label>
                <input id="pid" className="input" placeholder="e.g. PT-10234" value={patient.patientId}
                  onChange={(e) => update("patientId", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" className="select" value={patient.gender} onChange={(e) => update("gender", e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="age">Age (years)</label>
                <input id="age" type="number" className="input" value={patient.age}
                  onChange={(e) => update("age", e.target.value)} min={1} max={120} />
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div className="card-head">
              <div>
                <h3>Clinical Measurements</h3>
                <p>Random Forest model input features</p>
              </div>
              <FlaskConical size={19} color="var(--blue-700)" />
            </div>
            <div className="grid grid-2" style={{ gap: 14 }}>
              {NUMERIC_FIELDS.filter((f) => f.key !== "age").map((f) => (
                <div className="field" key={f.key}>
                  <label htmlFor={f.key}>{f.label} <span className="hint">({f.unit})</span></label>
                  <input
                    id={f.key} type="number" className="input" value={patient[f.key]}
                    min={f.min} max={f.max} step={f.step}
                    onChange={(e) => update(f.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <p style={{ fontSize: 12.5, color: "var(--muted)", maxWidth: 460 }}>
            On submit, the pipeline runs the Random Forest classifier, then SHAP and LIME explainers in
            parallel, and merges both into a single Unified Explainability report.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={15} /> Reset
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <Loader2 size={16} className="mono" style={{ animation: "spin 1s linear infinite" }} /> : <FlaskConical size={16} />}
              {loading ? "Running pipeline…" : "Predict"}
            </button>
          </div>
        </div>
      </form>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
