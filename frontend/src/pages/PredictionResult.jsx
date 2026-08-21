import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Waypoints, Layers3, ClipboardList, User2, Plus } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useApp } from "../context/AppContext.jsx";
import { RiskBadge, PredictionBadge, ProbabilityGauge, ScoreRing } from "../components/Atoms.jsx";

export default function PredictionResult() {
  const { current } = useApp();
  const navigate = useNavigate();

  if (!current) {
    return (
      <Layout eyebrow="Prediction Result" title="No Prediction Yet">
        <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--muted)", marginBottom: 16, fontSize: 13.5 }}>
            Run a prediction first to see the model output here.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/predict")}>
            <Plus size={16} /> Start New Prediction
          </button>
        </div>
      </Layout>
    );
  }

  const { patient, result, unified } = current;

  return (
    <Layout
      eyebrow="Prediction Result"
      title={patient.name || patient.patientId || "Patient"}
    >
      <div className="grid grid-2" style={{ alignItems: "start", marginBottom: 18 }}>
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <h3>Model Output</h3>
              <p>RandomForestClassifier · single-patient inference</p>
            </div>
            <PredictionBadge prediction={result.prediction} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
            <div className="stat-icon" style={{ width: 52, height: 52, borderRadius: 14, background: "var(--blue-100)", color: "var(--blue-700)" }}>
              <User2 size={24} />
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700 }}>{result.prediction}</p>
              <p style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {getSexLabel(patient.Sex)} · Age Group{" "}
                {getAgeGroupLabel(patient.Age)}
                {patient.patientId && ` · ID ${patient.patientId}`}
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <RiskBadge level={result.riskLevel} />
            </div>
          </div>

          <ProbabilityGauge probability={result.probability} riskLevel={result.riskLevel} />

          <hr className="divider" />

          <div className="grid grid-3">
            <MiniStat label="Prediction" value={result.prediction} />
            <MiniStat label="Probability" value={`${(result.probability * 100).toFixed(1)}%`} />
            <MiniStat label="Risk Level" value={result.riskLevel} />
          </div>
        </div>

        <div className="card card-pad" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-head">
            <div>
              <h3>Explanation Consensus</h3>
              <p>How well SHAP and LIME agree on this case</p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", flex: 1, alignItems: "center" }}>
            <ScoreRing value={unified.agreementScore} label="Agreement Score" color="var(--teal-600)" />
            <ScoreRing value={unified.confidenceScore} label="Confidence Score" color="var(--unified)" />
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div>
            <h3>Patient Profile</h3>
            <p>Key information submitted for this prediction</p>
          </div>
          <User2 size={19} color="var(--blue-700)" />
        </div>

        <div className="grid grid-4">
          <MiniStat
            label="BMI"
            value={patient.BMI ?? "—"}
          />

          <MiniStat
            label="General Health"
            value={
              {
                1: "Excellent",
                2: "Very Good",
                3: "Good",
                4: "Fair",
                5: "Poor",
              }[patient.GenHlth] || "—"
            }
          />

          <MiniStat
            label="High Blood Pressure"
            value={Number(patient.HighBP) === 1 ? "Yes" : "No"}
          />

          <MiniStat
            label="High Cholesterol"
            value={Number(patient.HighChol) === 1 ? "Yes" : "No"}
          />

          <MiniStat
            label="Physical Activity"
            value={Number(patient.PhysActivity) === 1 ? "Yes" : "No"}
          />

          <MiniStat
            label="Smoker"
            value={Number(patient.Smoker) === 1 ? "Yes" : "No"}
          />

          <MiniStat
            label="Mental Health Days"
            value={`${patient.MentHlth ?? 0} days`}
          />

          <MiniStat
            label="Physical Health Days"
            value={`${patient.PhysHlth ?? 0} days`}
          />
        </div>
        </div>
      <div className="card card-pad">
        <div className="card-head">
          <div>
            <h3>Explore the Explanation</h3>
            <p>
              Choose how you'd like to inspect why the model made this call
            </p>
          </div>
        </div>
        <div className="grid grid-3">
          <ActionTile
            icon={BarChart3}
            color="var(--shap)"
            title="View SHAP"
            desc="Game-theoretic feature attribution for this prediction."
            onClick={() => navigate("/explainability?tab=shap")}
          />

          <ActionTile
            icon={Waypoints}
            color="var(--lime)"
            title="View LIME"
            desc="Local surrogate model explanation around this patient."
            onClick={() => navigate("/explainability?tab=lime")}
          />

          <ActionTile
            icon={Layers3}
            color="var(--unified)"
            title="View Unified Explanation"
            desc="SHAP + LIME reconciled into one doctor-friendly ranking."
            onClick={() => navigate("/explainability?tab=unified")}
          />
        </div>

        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => navigate("/report")}
        >
          <ClipboardList size={15} /> Generate Clinical Report
        </button>
      </div>
    </Layout>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ background: "var(--surface-tint)", borderRadius: 10, padding: "12px 14px" }}>
      <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p className="mono" style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{value}</p>
    </div>
  );
}

function ActionTile({ icon: Icon, color, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", padding: 16, borderRadius: 12, border: "1px solid var(--line)",
        background: "var(--surface)", display: "flex", flexDirection: "column", gap: 10,
        transition: "border-color 0.15s ease, transform 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "1A", color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={17} />
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</p>
      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{desc}</p>
    </button>
  );
}

function getSexLabel(value) {
  return Number(value) === 1 ? "Male" : "Female";
}

function getAgeGroupLabel(value) {
  const groups = {
    1: "18–24",
    2: "25–29",
    3: "30–34",
    4: "35–39",
    5: "40–44",
    6: "45–49",
    7: "50–54",
    8: "55–59",
    9: "60–64",
    10: "65–69",
    11: "70–74",
    12: "75–79",
    13: "80+",
  };

  return groups[value] || "Not specified";
}