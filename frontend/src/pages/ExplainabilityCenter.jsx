import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Waypoints, Layers3, Sparkles, Plus, ScatterChart, CheckCircle2, XCircle } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useApp } from "../context/AppContext.jsx";
import { SingleImportanceChart, TriCompareChart } from "../components/ImportanceChart.jsx";
import { MethodDot, ScoreRing } from "../components/Atoms.jsx";

const TABS = [
  { id: "overview", label: "Overview", icon: ScatterChart },
  { id: "shap", label: "SHAP", icon: BarChart3 },
  { id: "lime", label: "LIME", icon: Waypoints },
  { id: "unified", label: "Unified", icon: Layers3 },
];

export default function ExplainabilityCenter() {
  const { current } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get("tab") || "overview";
  const [tab, setTab] = useState(TABS.some((t) => t.id === initialTab) ? initialTab : "overview");

  if (!current) {
    return (
      <Layout eyebrow="Explainability Center" title="No Prediction Selected">
        <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--muted)", marginBottom: 16, fontSize: 13.5 }}>
            Run a prediction to unlock SHAP, LIME, and unified explainability views.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/predict")}>
            <Plus size={16} /> Start New Prediction
          </button>
        </div>
      </Layout>
    );
  }

  const { shap, lime, unified, summary, patient, result } = current;

  return (
    <Layout eyebrow="Explainability Center" title={`Why "${result.prediction}"?`}>
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="tag-row" style={{ marginBottom: 4 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="btn"
                style={{
                  background: active ? "var(--blue-700)" : "var(--surface-tint)",
                  color: active ? "white" : "var(--ink-soft)",
                  boxShadow: active ? "var(--shadow-lift)" : "none",
                  padding: "9px 15px",
                }}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview" && <Overview current={current} />}
      {tab === "shap" && (
        <ExplainerPane
          title="SHAP Feature Importance"
          desc="Shapley Additive Explanations — game-theoretic attribution of each feature's contribution to the prediction."
          color="var(--shap)"
          data={shap}
        />
      )}
      {tab === "lime" && (
        <ExplainerPane
          title="LIME Feature Importance"
          desc="Local Interpretable Model-agnostic Explanations — a local linear surrogate fit around this patient."
          color="var(--lime)"
          data={lime}
        />
      )}
      {tab === "unified" && <UnifiedPane current={current} />}
    </Layout>
  );
}

function ExplainerPane({ title, desc, color, data }) {
  return (
    <div className="card card-pad fade-in">
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      </div>
      <SingleImportanceChart data={data} color={color} height={340} />
    </div>
  );
}

function Overview({ current }) {
  const { shap, lime, unified, summary } = current;
  return (
    <div className="fade-in">
      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="card card-pad" style={{ gridColumn: "span 2" }}>
          <div className="card-head">
            <div>
              <h3>SHAP vs LIME vs Unified</h3>
              <p>Per-feature comparison across all three explainability views</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <MethodDot color="var(--shap)" label="SHAP" />
              <MethodDot color="var(--lime)" label="LIME" />
              <MethodDot color="var(--unified)" label="Unified" />
            </div>
          </div>
          <TriCompareChart ranking={unified.ranking} height={360} />
        </div>

        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>Reliability Scores</h3>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Cross-method consensus for this case</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", flex: 1, alignItems: "center" }}>
            <ScoreRing value={unified.agreementScore} label="Agreement" color="var(--teal-600)" size={104} />
            <ScoreRing value={unified.confidenceScore} label="Confidence" color="var(--unified)" size={104} />
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 18, alignItems: "stretch" }}>
        <div className="card card-pad" style={{ gridColumn: "span 2" }}>
          <FeatureComparisonTable ranking={unified.ranking} />
        </div>
        <SummaryCard summary={summary} />
      </div>

      <UnifiedRankingList ranking={unified.ranking} />
    </div>
  );
}

function UnifiedPane({ current }) {
  const { unified, summary } = current;
  return (
    <div className="fade-in">
      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="card card-pad" style={{ gridColumn: "span 2" }}>
          <div className="card-head">
            <div>
              <h3>Unified Feature Importance</h3>
              <p>Merged SHAP + LIME impact, averaged and re-ranked</p>
            </div>
          </div>
          <SingleImportanceChart
            data={unified.ranking.map((r) => ({ label: r.label, value: r.unified }))}
            color="var(--unified)"
            height={340}
          />
        </div>
        <SummaryCard summary={summary} />
      </div>
      <div className="grid grid-2">
        <div className="card card-pad">
          <FeatureComparisonTable ranking={unified.ranking} />
        </div>
        <UnifiedRankingList ranking={unified.ranking} compact />
      </div>
    </div>
  );
}

function FeatureComparisonTable({ ranking }) {
  return (
    <>
      <div className="card-head">
        <div>
          <h3>Feature Comparison Table</h3>
          <p>SHAP vs LIME vs Unified values, side by side</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>SHAP</th>
              <th>LIME</th>
              <th>Unified</th>
              <th>Direction Match</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <tr key={r.feature}>
                <td style={{ fontWeight: 600 }}>{r.label}</td>
                <td className="mono" style={{ color: r.shap >= 0 ? "var(--red-600)" : "var(--green-600)" }}>
                  {r.shap >= 0 ? "+" : ""}{r.shap.toFixed(3)}
                </td>
                <td className="mono" style={{ color: r.lime >= 0 ? "var(--red-600)" : "var(--green-600)" }}>
                  {r.lime >= 0 ? "+" : ""}{r.lime.toFixed(3)}
                </td>
                <td className="mono" style={{ fontWeight: 700, color: r.unified >= 0 ? "var(--red-600)" : "var(--green-600)" }}>
                  {r.unified >= 0 ? "+" : ""}{r.unified.toFixed(3)}
                </td>
                <td>
                  {r.sameSign ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--green-600)", fontSize: 12, fontWeight: 600 }}>
                      <CheckCircle2 size={14} /> Agree
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--red-600)", fontSize: 12, fontWeight: 600 }}>
                      <XCircle size={14} /> Diverge
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SummaryCard({ summary }) {
  return (
    <div className="card card-pad" style={{ background: "linear-gradient(160deg, var(--blue-900), #123A8F)", color: "white", border: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Sparkles size={17} />
        <h3 style={{ fontSize: 14, color: "white" }}>AI-Generated Explanation Summary</h3>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.92)" }}>{summary}</p>
    </div>
  );
}

function UnifiedRankingList({ ranking, compact }) {
  return (
    <div className="card card-pad">
      <div className="card-head">
        <div>
          <h3>Unified Ranking</h3>
          <p>Final feature order after reconciling SHAP and LIME</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ranking.slice(0, compact ? 8 : 8).map((r) => (
          <div key={r.feature} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="mono" style={{ width: 22, fontSize: 12, fontWeight: 700, color: "var(--blue-700)" }}>#{r.rank}</span>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{r.label}</span>
            <div style={{ flex: 2 }}>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.abs(r.unified) * 140)}%`,
                    background: r.unified >= 0 ? "var(--red-600)" : "var(--green-600)",
                  }}
                />
              </div>
            </div>
            <span className="mono" style={{ fontSize: 12, width: 56, textAlign: "right", color: "var(--ink-soft)" }}>
              {r.unified >= 0 ? "+" : ""}{r.unified.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
