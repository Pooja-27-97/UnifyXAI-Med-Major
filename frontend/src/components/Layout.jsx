import React from "react";
import Sidebar from "./Sidebar.jsx";
import { ShieldCheck } from "lucide-react";

export function Topbar({ eyebrow, title, right }) {
  return (
    <header className="topbar no-print">
      <div className="topbar-crumb">
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="topbar-actions">
        {right}
        <span className="status-pill">
          <span className="status-dot" />
          Model Online
        </span>
      </div>
    </header>
  );
}

export default function Layout({ eyebrow, title, right, children }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar eyebrow={eyebrow} title={title} right={right} />
        <div className="content fade-in">{children}</div>
        <footer style={{ padding: "8px 28px 28px", fontSize: 11.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }} className="no-print">
          <ShieldCheck size={13} />
          Decision-support only. Not a substitute for clinical judgement.
        </footer>
      </div>
    </div>
  );
}
