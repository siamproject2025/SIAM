import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { motion } from "framer-motion";

const CalendarioHorarios = ({ horarios = [], onDetalleHorario }) => {
  // Función para convertir los horarios a eventos de FullCalendar
  const convertirAEventos = () => {
    return horarios
      .map((horario) => {
        // Mapear días abreviados a números (0=Dom, 1=Lun, ..., 6=Sab)
        const diasMap = {
          DOM: 0,
          LUN: 1,
          MAR: 2,
          MIE: 3,
          JUE: 4,
          VIE: 5,
          SAB: 6,
        };

        // Crear eventos para cada día del horario
        return horario.dia.map((dia) => {
          const diaNumero = diasMap[dia.toUpperCase()];

          return {
            id: `${horario._id?.$oid || horario._id}-${dia}`,
            title: `${horario.asignatura} - ${horario.grado}`,
            daysOfWeek: [diaNumero], // Array con el número del día
            startTime: horario.inicio,
            endTime: horario.fin,
            extendedProps: {
              _id: horario._id?.$oid || horario._id,
              aula_id: horario.aula_id?.$oid || horario.aula_id,
              grado: horario.grado,
              asignatura: horario.asignatura,
            },
          };
        });
      })
      .flat(); // Aplanar el array de arrays
  };

  // Función que se ejecuta al hacer click en un evento
  const handleEventClick = (clickInfo) => {
    if (onDetalleHorario) {
      // Extraer el _id del horario desde las extendedProps
      const horarioId = clickInfo.event.extendedProps._id;
      onDetalleHorario(horarioId);
    }
  };

  const eventos = convertirAEventos();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="calendario-container"
    >
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        hiddenDays={[0]} // Oculta específicamente el domingo (0)
        events={eventos}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        locale={esLocale}
        height="auto"
        eventColor="#3788d8"
        eventDisplay="block"
        nowIndicator={true}
        editable={false}
        selectable={false}
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        slotLabelFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
        }}
        eventClick={handleEventClick} // Maneja el click en eventos
      />
    </motion.div>
  );
};

export default CalendarioHorarios;
