import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Target, Gauge, Clock, ArrowUpRight, Plus, FlaskConical } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import Layout from "../components/Layout.jsx";
import StatCard from "../components/StatCard.jsx";
import { RiskBadge, PredictionBadge } from "../components/Atoms.jsx";

export default function Dashboard() {
  const { user, history, setCurrent } = useApp();
  const navigate = useNavigate();

  const total = history.length;
  const avgAgreement = total ? history.reduce((a, h) => a + h.unified.agreementScore, 0) / total : 0;
  const avgConfidence = total ? history.reduce((a, h) => a + h.unified.confidenceScore, 0) / total : 0;
  const latest = history[0];

  function openLatest() {
    if (!latest) return;
    setCurrent(latest);
    navigate("/result");
  }

  return (
    <Layout
      eyebrow="Workspace"
      title={`Welcome back, ${user?.name?.split(" ")[0] || "Doctor"}`}
      right={
        <button className="btn btn-primary" onClick={() => navigate("/predict")}>
          <Plus size={16} /> New Prediction
        </button>
      }
    >
      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <StatCard icon={Sparkles} tint="blue" label="Total Predictions" value={total} sub="All-time, this workspace" />
        <StatCard icon={Target} tint="teal" label="Avg. Agreement Score" value={total ? `${avgAgreement.toFixed(1)}%` : "—"} sub="SHAP ↔ LIME consensus" />
        <StatCard icon={Gauge} tint="purple" label="Avg. Confidence Score" value={total ? `${avgConfidence.toFixed(1)}%` : "—"} sub="Explanation reliability" />
        <StatCard
          icon={Clock} tint="amber" label="Latest Prediction"
          value={latest ? latest.result.prediction : "—"}
          sub={latest ? `Last updated · ${new Date(latest.timestamp).toLocaleString()}` : "No predictions yet"}        />
      </div>

      <div className="grid grid-2" style={{ alignItems: "stretch" }}>
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <h3>Start a New Prediction</h3>
              <p>Run the patient through Random Forest, SHAP, LIME and the Unified Explainability Engine.</p>
            </div>
            <FlaskConical size={20} color="var(--blue-700)" />
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 18 }}>
            Enter patient health and lifestyle information once and receive a diabetes prediction alongside a clear, doctor-friendly explanation powered by SHAP and LIME.
          </p>
          <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Explainability Pipeline
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PipelineStatus label="Random Forest" status="Ready" ready />
            <PipelineStatus label="SHAP Explanation" status="Ready" ready />
            <PipelineStatus label="LIME Explanation" status="Coming Soon" />
            <PipelineStatus label="Unified XAI" status="Coming Soon" />
          </div>
        </div>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate("/predict")}>
            <Plus size={17} /> Start New Prediction
          </button>
        </div>

        <div className="card card-pad">
          <div className="card-head">
            <div>
              <h3>Recent Predictions</h3>
              <p>Your last {Math.min(5, total)} explained predictions</p>
            </div>
            <a className="btn btn-ghost" href="#!" onClick={(e) => { e.preventDefault(); openLatest(); }}>
              View latest <ArrowUpRight size={14} />
            </a>
          </div>

          {total === 0 ? (
            <EmptyHistory onStart={() => navigate("/predict")} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {history.slice(0, 5).map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(h); navigate("/result"); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 13px", borderRadius: 10, border: "1px solid var(--line)",
                    background: "var(--surface)", textAlign: "left", width: "100%",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {h.patient.name || `Patient #${String(total - i).padStart(3, "0")}`}
                      {h.patient.patientId && ` · ${h.patient.patientId}`}                    
                    </p>
                    <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <PredictionBadge prediction={h.result.prediction} />
                    <RiskBadge level={h.result.riskLevel} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmptyHistory({ onStart }) {
  return (
    <div style={{ textAlign: "center", padding: "26px 10px" }}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        No predictions yet. Run your first patient through the pipeline to see results here.
      </p>
      <button className="btn btn-secondary" onClick={onStart}>Run first prediction</button>
    </div>
  );
}

function PipelineStatus({ label, status, ready = false }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 10px",
        border: "1px solid var(--line)",
        borderRadius: 8,
        background: "var(--surface)",
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: "var(--ink-soft)",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: ready ? "var(--green-700)" : "var(--muted)",
        }}
      >
        {ready ? "✓ " : "○ "}
        {status}
      </span>
    </div>
  );
}