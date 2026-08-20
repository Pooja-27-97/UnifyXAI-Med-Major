import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Activity, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

export default function Login() {
  const { user, login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter both email and password to continue.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login(email);
      setLoading(false);
      navigate("/dashboard");
    }, 500);
  }

  return (
    <div className="auth-shell">
      <div className="auth-form-side">
        <div className="auth-brand">
          <div className="brand-mark"><Activity size={20} /></div>
          <div>
            <h1>UnifyXAI-Med</h1>
            <span>A Unified Explainability Pipeline for Healthcare AI</span>
          </div>
        </div>

        <h2>Sign in to your workspace</h2>
        <p className="lead">Access diabetes risk predictions with unified SHAP + LIME explainability.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-icon-wrap">
              <Mail size={15} />
              <input
                id="email" type="email" className="input" placeholder="dr.rao@unifyxai-med.io"
                value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={15} />
              <input
                id="password" type="password" className="input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              />
            </div>
          </div>

          <div className="auth-row-between">
            <label className="auth-check">
              <input type="checkbox" defaultChecked /> Keep me signed in
            </label>
            <a className="auth-link" href="#!" onClick={(e) => e.preventDefault()}>Forgot password?</a>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? "Signing in…" : "Log In"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-demo-hint">
          Demo mode — any email + password (4+ chars) signs you in. No PHI is stored; this build runs on a simulated inference engine pending Flask/RF/SHAP/LIME integration.
        </div>
      </div>

      <div className="auth-visual">
        <div className="auth-visual-top">
          <span className="kicker">Explainable AI · Clinical Decision Support</span>
          <h3>One prediction. Two explainers. One trustworthy answer for the care team.</h3>
        </div>
        <div className="auth-readout">
          <div className="rt-row"><span className="rt-label">Model</span><span className="rt-value">RandomForestClassifier</span></div>
          <div className="rt-row"><span className="rt-label">Explainers</span><span className="rt-value">SHAP · LIME</span></div>
          <div className="rt-row"><span className="rt-label">Fusion Engine</span><span className="rt-value">Unified Ranking v1</span></div>
          <div className="rt-row"><span className="rt-label">Avg. Agreement Score</span><span className="rt-value">87.4%</span></div>
          <div className="rt-row"><span className="rt-label">Avg. Confidence Score</span><span className="rt-value">91.2%</span></div>
        </div>
      </div>
    </div>
  );
}
