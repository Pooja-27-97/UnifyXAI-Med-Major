# UnifyXAI-Med

**A Unified Explainability Pipeline for Healthcare AI**

A clinical-decision-support web app that predicts diabetes risk with a
Random Forest model and explains every prediction using **SHAP** and
**LIME** — then reconciles both into a single, doctor-friendly
explanation via a Unified Explainability Engine.

This is an explainability platform, not a hospital management system.
The entire UI is built around one question: *why did the model say that?*

---

## Tech stack

| Layer      | Choice |
|------------|--------|
| Frontend   | React 18 + Vite, plain CSS (design tokens), Recharts, lucide-react |
| Backend    | Flask (API-ready, CORS-enabled) |
| ML (next)  | scikit-learn RandomForestClassifier, SHAP, LIME |

---

## Project structure

```
unifyxai-med/
├── frontend/
│   ├── src/
│   │   ├── components/     Sidebar, Layout, charts, shared UI atoms
│   │   ├── context/        AppContext (auth + prediction history)
│   │   ├── data/           mockEngine.js — simulated RF/SHAP/LIME pipeline
│   │   ├── pages/          Login, Dashboard, NewPrediction, Result,
│   │   │                   ExplainabilityCenter, ExplainabilityComparison,
│   │   │                   ClinicalReport
│   │   ├── styles/         tokens.css, app.css, auth.css
│   │   └── utils/api.js    Flask API client (drop-in swap for mock engine)
│   └── package.json
└── backend/
    ├── app.py              Flask API — /predict, /explain/shap,
    │                       /explain/lime, /explain/unified, /pipeline/run
    ├── requirements.txt
    └── models/README.md    Where to drop trained RF/SHAP/LIME artifacts
```

---

## Running it

### Frontend (works standalone today, on the mock engine)

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`. Log in with **any email + a password of
4+ characters** (demo auth, no backend required).

### Backend (optional today, required for live ML)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Flask serves on `http://localhost:5000`. Vite's dev server already
proxies `/api/*` to it (see `frontend/vite.config.js`).

To make the frontend call the real API instead of the mock engine, copy
`frontend/.env.example` to `frontend/.env` and set:

```
VITE_USE_LIVE_API=true
```

---

## How the explainability pipeline works

```
Patient Data → Random Forest → Prediction → SHAP → LIME →
Unified Explainability Engine → Agreement Analysis →
Confidence Score → Doctor-Friendly Explanation
```

- **SHAP** — Shapley Additive Explanations; globally consistent,
  game-theoretic feature attribution.
- **LIME** — Local Interpretable Model-agnostic Explanations; a fast,
  locally faithful linear surrogate around one patient.
- **Unified Explainability Engine** — averages SHAP and LIME per
  feature, re-ranks, and computes:
  - **Agreement Score** — how often SHAP and LIME agree on direction
    and magnitude, per feature.
  - **Confidence Score** — inverse of cross-method variance; how
    reliable the merged explanation is.
- **Doctor-Friendly Explanation** — a templated natural-language
  summary of the top drivers, agreement, and confidence (a good seed
  for a future LLM-generated clinical summary).

## Going live with real ML

1. Train a `RandomForestClassifier` on the Pima Indians Diabetes
   Dataset (or your own cohort) using the 8 features in
   `frontend/src/data/mockEngine.js` → `FEATURES`.
2. Fit `shap.TreeExplainer` and `lime.lime_tabular.LimeTabularExplainer`
   on the same training data.
3. Save all three with `joblib` into `backend/models/`.
4. Replace `run_prediction`, `run_shap`, `run_lime` in `backend/app.py`
   with calls into the loaded artifacts — the JSON response shapes are
   already correct, so nothing on the frontend needs to change.
5. Set `VITE_USE_LIVE_API=true` in the frontend `.env`.

---

## Disclaimer

Decision-support only. Not a diagnostic tool and not a substitute for
clinical judgement.
