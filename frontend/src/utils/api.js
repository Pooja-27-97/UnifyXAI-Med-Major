// -----------------------------------------------------------------------
// api.js — client for the Flask ML backend.
// -----------------------------------------------------------------------
// These endpoints connect the React frontend to the real
// Random Forest + SHAP + LIME + Unified Explainability pipeline.
// -----------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const USE_LIVE_API = import.meta.env.VITE_USE_LIVE_API === "true";

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  isLive: USE_LIVE_API,
  predict: (patient) => post("/predict", patient),
  explainShap: (patient) => post("/explain/shap", patient),
  explainLime: (patient) => post("/explain/lime", patient),
  explainUnified: (patient) => post("/explain/unified", patient),
  fullPipeline: (patient) => post("/pipeline/run", patient),
};
