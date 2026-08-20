import React from "react";
import {
  User, TreePine, Target, BarChart3, Waypoints, Layers3,
  GitCompareArrows, Gauge, Stethoscope, ArrowDown,
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useApp } from "../context/AppContext.jsx";

const STEPS = [
  { icon: User, title: "Patient Data", desc: "Glucose, BMI, insulin, age, and other clinical measurements are collected at intake.", tint: "blue" },
  { icon: TreePine, title: "Random Forest", desc: "An ensemble of decision trees evaluates the patient's feature vector.", tint: "blue" },
  { icon: Target, title: "Prediction", desc: "The model outputs a class (Diabetic / Non-Diabetic) with a probability score.", tint: "blue" },
  { icon: BarChart3, title: "SHAP", desc: "Shapley values attribute the prediction back to each input feature, globally consistent.", tint: "shap" },
  { icon: Waypoints, title: "LIME", desc: "A local surrogate model explains the prediction in the neighborhood of this patient.", tint: "lime" },
  { icon: Layers3, title: "Unified Explainability Engine", desc: "SHAP and LIME outputs are merged into one ranked, doctor-friendly feature importance.", tint: "unified" },
  { icon: GitCompareArrows, title: "Agreement Analysis", desc: "Directional and magnitude consensus between SHAP and LIME is scored per feature.", tint: "teal" },
  { icon: Gauge, title: "Confidence Score", desc: "Cross-method variance is converted into a single explanation reliability metric.", tint: "purple" },
  { icon: Stethoscope, title: "Doctor-Friendly Explanation", desc: "A plain-language summary and clinical report are generated for the care team.", tint: "amber" },
];

const TINTS = {
  blue: { bg: "var(--blue-100)", fg: "var(--blue-700)" },
  shap: { bg: "#E4EDFC", fg: "var(--shap)" },
  lime: { bg: "var(--teal-100)", fg: "var(--lime)" },
  unified: { bg: "#F1EAFD", fg: "var(--unified)" },
  teal: { bg: "var(--teal-100)", fg: "var(--teal-600)" },
  purple: { bg: "#F1EAFD", fg: "var(--unified)" },
  amber: { bg: "var(--amber-100)", fg: "var(--amber-600)" },
};

export default function ExplainabilityComparison() {
  const { current } = useApp();

  return (
    <Layout eyebrow="Pipeline Workflow" title="Explainability Comparison">
      <div className="grid grid-2" style={{ alignItems: "start" }}>
        <div className="card card-pad">
          <div className="card-head">
            <div>
              <h3>End-to-End Pipeline</h3>
              <p>How a single prediction becomes a unified, doctor-friendly explanation</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const t = TINTS[s.tint];
              return (
                <React.Fragment key={s.title}>
                  <div style={{
                    width: "100%", display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "14px 16px", borderRadius: 12, border: "1px solid var(--line)",
                    background: "var(--surface)",
                  }}>
                    <div className="stat-icon" style={{ background: t.bg, color: t.fg, width: 38, height: 38, borderRadius: 10, flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13.5, fontWeight: 700 }}>{i + 1}. {s.title}</p>
                      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>{s.desc}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ padding: "6px 0", color: "var(--line)" }}>
                      <ArrowDown size={16} color="var(--blue-500)" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 84 }}>
          <div className="card card-pad">
            <div className="card-head">
              <div>
                <h3>Why Two Explainers?</h3>
                <p>SHAP and LIME answer overlapping but distinct questions</p>
              </div>
            </div>
            <ComparisonRow
              label="Basis"
              shap="Cooperative game theory (Shapley values)"
              lime="Local linear surrogate model"
            />
            <ComparisonRow
              label="Scope"
              shap="Globally consistent, additive"
              lime="Locally faithful around one patient"
            />
            <ComparisonRow
              label="Speed"
              shap="Slower, exact for tree models"
              lime="Fast, approximate, sampling-based"
            />
            <ComparisonRow
              label="Risk"
              shap="Can be less intuitive to explain"
              lime="Can be unstable across re-runs"
              last
            />
          </div>

          <div className="card card-pad">
            <div className="card-head">
              <div>
                <h3>This Case</h3>
                <p>{current ? "Live scores from your most recent prediction" : "Run a prediction to populate live scores"}</p>
              </div>
            </div>
            {current ? (
              <div className="grid grid-2">
                <MiniMetric label="Agreement" value={`${current.unified.agreementScore.toFixed(1)}%`} color="var(--teal-600)" />
                <MiniMetric label="Confidence" value={`${current.unified.confidenceScore.toFixed(1)}%`} color="var(--unified)" />
              </div>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--muted)" }}>No prediction yet.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ComparisonRow({ label, shap, lime, last }) {
  return (
    <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: last ? "none" : "1px solid var(--line-soft)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)", marginBottom: 8 }}>{label}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: "var(--shap)", marginTop: 4, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{shap}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: "var(--lime)", marginTop: 4, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{lime}</span>
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color }) {
  return (
    <div style={{ background: "var(--surface-tint)", borderRadius: 10, padding: "14px" }}>
      <p style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{label}</p>
      <p className="mono" style={{ fontSize: 20, fontWeight: 700, color, marginTop: 4 }}>{value}</p>
    </div>
  );
}
