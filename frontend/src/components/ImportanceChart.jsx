import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 12px", boxShadow: "var(--shadow-md)" }}>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="mono" style={{ fontSize: 11.5, color: p.color }}>
          {p.name}: {p.value >= 0 ? "+" : ""}{p.value.toFixed(3)}
        </p>
      ))}
    </div>
  );
}

/** Single-series horizontal bar chart (used for SHAP-only / LIME-only / Unified-only views) */
export function SingleImportanceChart({
  data,
  dataKey = "value",
  color = "var(--blue-700)",
  height = 620,
}) {
  const sorted = [...data].sort(
    (a, b) =>
      Math.abs(b[dataKey]) -
      Math.abs(a[dataKey])
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          fontSize: 11.5,
          color: "var(--muted)",
        }}
      >
        <span>
          <strong style={{ color: "var(--red-600)" }}>●</strong>{" "}
          Increases Diabetes prediction
        </span>

        <span>
          <strong style={{ color: "var(--green-600)" }}>●</strong>{" "}
          Decreases Diabetes prediction
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{
            top: 4,
            right: 24,
            left: 8,
            bottom: 4,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--line-soft)"
            horizontal={false}
          />

          <XAxis
            type="number"
            tick={{
              fontSize: 11,
              fill: "var(--muted)",
            }}
            tickFormatter={(v) => v.toFixed(2)}
          />

          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tick={{
              fontSize: 11.5,
              fill: "var(--ink-soft)",
            }}
          />

          <ReferenceLine
            x={0}
            stroke="var(--line)"
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              fill: "var(--surface-tint)",
            }}
          />

          <Bar
            dataKey={dataKey}
            radius={[4, 4, 4, 4]}
            barSize={16}
          >
            {sorted.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry[dataKey] >= 0
                    ? "var(--red-600)"
                    : "var(--green-600)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped tri-bar chart: SHAP vs LIME vs Unified, per feature */
export function TriCompareChart({ ranking, height = 620 }) {
  const data = [...ranking]
    .sort((a, b) => Math.abs(b.unified) - Math.abs(a.unified))
    .map((r) => ({ label: r.label, SHAP: r.shap, LIME: r.lime, Unified: r.unified }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }} barCategoryGap={16}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} tickFormatter={(v) => v.toFixed(2)} />
        <YAxis type="category" dataKey="label" width={175} tick={{ fontSize: 11.5, fill: "var(--ink-soft)" }} />
        <ReferenceLine x={0} stroke="var(--line)" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-tint)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="SHAP" fill="var(--shap)" radius={[3, 3, 3, 3]} barSize={9} />
        <Bar dataKey="LIME" fill="var(--lime)" radius={[3, 3, 3, 3]} barSize={9} />
        <Bar dataKey="Unified" fill="var(--unified)" radius={[3, 3, 3, 3]} barSize={9} />
      </BarChart>
    </ResponsiveContainer>
  );
}
