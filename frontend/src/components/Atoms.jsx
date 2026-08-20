import React from "react";

export function RiskBadge({ level }) {
  const cls = level === "High" ? "badge-high" : level === "Moderate" ? "badge-moderate" : "badge-low";
  return <span className={`badge ${cls}`}>{level} Risk</span>;
}

export function PredictionBadge({ prediction }) {
  const positive = prediction === "Diabetic";
  return (
    <span className={`badge ${positive ? "badge-high" : "badge-low"}`}>
      {prediction}
    </span>
  );
}

export function MethodDot({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}

export function ScoreRing({ value, label, color = "var(--blue-700)", size = 128 }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <text x="50%" y="47%" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="22" fontWeight="600" fill="var(--ink)">
          {value.toFixed(1)}
        </text>
        <text x="50%" y="63%" textAnchor="middle" fontFamily="Inter" fontSize="11" fill="var(--muted)">
          / 100
        </text>
      </svg>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)" }}>{label}</span>
    </div>
  );
}

export function ProbabilityGauge({ probability, riskLevel }) {
  const pct = probability * 100;
  const color = riskLevel === "High" ? "var(--red-600)" : riskLevel === "Moderate" ? "var(--amber-600)" : "var(--green-600)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Predicted Probability</span>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
