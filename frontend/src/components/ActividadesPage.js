import React, { useRef } from "react";
import FormularioActividad from "./FormularioActividad";
import CalendarioActividades from "./CalendarioActividades";

const ActividadesPage = () => {
  const calendarioRef = useRef(null);

  const manejarActividadCreada = () => {
    if (calendarioRef.current) {
      calendarioRef.current.cargarActividades(); // recarga el calendario
    }
  };

  return (
    <div>
      <h1>📚 Gestión de Actividades</h1>
      <FormularioActividad onActividadCreada={manejarActividadCreada} />
      
    </div>
  );
};

export default ActividadesPage;
