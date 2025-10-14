import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import axios from "axios";

const CalendarioActividades = forwardRef((props, ref) => {
  const [eventos, setEventos] = useState([]);

  const cargarActividades = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/actividades"); // corregido
      const actividades = res.data;

      const eventosFormateados = actividades.map((actividad) => ({
        title: actividad.nombre,
        date: actividad.fecha,
        extendedProps: {
          lugar: actividad.lugar,
          descripcion: actividad.descripcion
        }
      }));

      setEventos(eventosFormateados);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    }
  };

  // Exponer función al padre
  useImperativeHandle(ref, () => ({
    cargarActividades
  }));

  useEffect(() => {
    cargarActividades();
  }, []);

  return (
    <div>
      <h2>Calendario de Actividades</h2>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        locale="es"
        events={eventos}
        eventClick={(info) => {
          alert(
            `📌 ${info.event.title}\n📅 ${info.event.start.toLocaleDateString()}\n📍 ${info.event.extendedProps.lugar}\n📝 ${info.event.extendedProps.descripcion}`
          );
        }}
      />
    </div>
  );
});

export default CalendarioActividades;
