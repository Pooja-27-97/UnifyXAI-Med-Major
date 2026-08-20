// -----------------------------------------------------------------------
// api.js — thin client for the future Flask backend.
// -----------------------------------------------------------------------
// Every endpoint below mirrors a route already stubbed in /backend/app.py.
// Today the app runs entirely on the mock engine (src/data/mockEngine.js).
// To go live: set VITE_USE_LIVE_API=true and implement the model/SHAP/LIME
// loading in the Flask routes — no other frontend code needs to change.

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
