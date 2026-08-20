import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NewPrediction from "./pages/NewPrediction.jsx";
import PredictionResult from "./pages/PredictionResult.jsx";
import ExplainabilityCenter from "./pages/ExplainabilityCenter.jsx";
import ExplainabilityComparison from "./pages/ExplainabilityComparison.jsx";
import ClinicalReport from "./pages/ClinicalReport.jsx";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/predict" element={<ProtectedRoute><NewPrediction /></ProtectedRoute>} />
          <Route path="/result" element={<ProtectedRoute><PredictionResult /></ProtectedRoute>} />
          <Route path="/explainability" element={<ProtectedRoute><ExplainabilityCenter /></ProtectedRoute>} />
          <Route path="/comparison" element={<ProtectedRoute><ExplainabilityComparison /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ClinicalReport /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
