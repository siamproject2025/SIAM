// src/App.js
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Grados
import GradosIndex from "./pages/grados/GradosIndex";
import GradosForm from "./pages/grados/GradosForm";

// Opcional
import Footer from "./components/Footer";

// Asegúrate de tener src/ErrorBoundary.jsx export default
import ErrorBoundary from "./ErrorBoundary";

export default function App() {
  return (
    <>
      <div className="App with-margin unauthenticated">
        <ErrorBoundary>
          <Routes>
            {/* Listado */}
            <Route path="/grados" element={<GradosIndex />} />

            {/* Formularios */}
            <Route path="/grados/nuevo" element={<GradosForm />} />
            <Route path="/grados/:id" element={<GradosForm />} />
            <Route path="/grados/:id/editar" element={<GradosForm />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/grados" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>

      {/* Quita el Footer si no lo necesitas ahora */}
      <Footer />
    </>
  );
}

