import React from "react";

export default function StatCard({ icon: Icon, label, value, sub, tint = "blue", trend }) {
  const tints = {
    blue: { bg: "var(--blue-100)", fg: "var(--blue-700)" },
    teal: { bg: "var(--teal-100)", fg: "var(--teal-600)" },
    purple: { bg: "#F1EAFD", fg: "var(--unified)" },
    amber: { bg: "var(--amber-100)", fg: "var(--amber-600)" },
  }[tint];

  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: tints.bg, color: tints.fg }}>
        <Icon size={17} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{sub}</div>}
      {trend && (
        <div className="stat-trend" style={{ color: trend.up ? "var(--green-600)" : "var(--red-600)" }}>
          {trend.text}
        </div>
      )}
    </div>
  );
}
