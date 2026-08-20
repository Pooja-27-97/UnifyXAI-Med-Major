import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutGrid, FilePlus2, FlaskConical, Layers3, GitBranch,
  ClipboardList, Activity, LogOut,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/predict", label: "New Prediction", icon: FilePlus2 },
  { to: "/result", label: "Prediction Result", icon: FlaskConical },
  { to: "/explainability", label: "Explainability Center", icon: Layers3 },
  { to: "/comparison", label: "Pipeline Workflow", icon: GitBranch },
  { to: "/report", label: "Clinical Report", icon: ClipboardList },
];

export default function Sidebar() {
  const { user, logout } = useApp();
  const initials = user?.name
    ? user.name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("")
    : "DR";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><Activity size={18} /></div>
        <div className="brand-text">
          <h1>UnifyXAI-Med</h1>
          <span>Unified Healthcare XAI</span>
        </div>
      </div>

      <nav className="nav">
        <p className="nav-section-label">Workspace</p>
        {NAV.slice(0, 2).map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
        <p className="nav-section-label">Explainability</p>
        {NAV.slice(2, 5).map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
        <p className="nav-section-label">Documentation</p>
        {NAV.slice(5).map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="avatar-chip">{initials}</div>
        <div className="who">
          <p>{user?.name || "Clinician"}</p>
          <span>{user?.role || "Care Team"}</span>
        </div>
        <button className="logout-btn" onClick={logout} title="Log out" aria-label="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
      <Icon size={17} strokeWidth={2.1} />
      {item.label}
    </NavLink>
  );
}
