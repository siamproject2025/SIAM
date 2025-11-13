// LoadingOverlay.jsx
import React from "react";
import { useLoading } from "./LoadingContext";
import "../../styles/LoadingGlobal/LoadingOverlay.css"; // estilos aparte

export default function LoadingOverlay() {
  const { loading } = useLoading();

  if (!loading) return null; // si no está cargando, no muestra nada

  return (
    <div className="loading-overlay">
      <div className="loader"></div>
      <p>Cargando...</p>
    </div>
  );
}
