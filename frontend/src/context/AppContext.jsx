import React, { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);

const AUTH_KEY = "unifyxai_auth";
const HISTORY_KEY = "unifyxai_history";

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const [history, setHistory] = useState(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  const [current, setCurrent] = useState(() => history[0] || null);

  useEffect(() => {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 25)));
  }, [history]);

  function login(email) {
    setUser({ email, name: email.split("@")[0].replace(/[._]/g, " "), role: "Clinician" });
  }

  function logout() {
    setUser(null);
  }

  function addPrediction(record) {
    setHistory((prev) => [record, ...prev]);
    setCurrent(record);
  }

  const value = { user, login, logout, history, current, setCurrent, addPrediction };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
