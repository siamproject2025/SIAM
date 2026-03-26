// CalendarioHorarios.jsx
// CAMBIOS: slotMaxTime → 15:00 (clases terminan a las 2:30)
// El calendario se ve compacto y ordenado sin espacio vacío.
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { motion } from "framer-motion";

const PALETA = [
  { bg:"#6C4FBF", border:"#4B3090" },
  { bg:"#2271B3", border:"#155a8a" },
  { bg:"#E67E22", border:"#b45309" },
  { bg:"#27AE60", border:"#1a7a40" },
  { bg:"#E74C3C", border:"#b02a2a" },
  { bg:"#8E44AD", border:"#6C3483" },
  { bg:"#16A085", border:"#0e6655" },
  { bg:"#D35400", border:"#a04000" },
  { bg:"#1ABC9C", border:"#148f77" },
  { bg:"#2C3E50", border:"#1a252f" },
];

const colorPorAsig = (() => {
  const cache = {};
  return (n = "") => {
    if (cache[n]) return cache[n];
    let h = 0;
    for (let i = 0; i < n.length; i++) h = ((h << 5) - h) + n.charCodeAt(i);
    cache[n] = PALETA[Math.abs(h) % PALETA.length];
    return cache[n];
  };
})();

const FC_CSS = `
  .fc-cal-wrapper .fc {
    font-family:'Nunito','Segoe UI',sans-serif;
    border-radius:16px; overflow:hidden;
    box-shadow:0 4px 24px rgba(108,79,191,.1);
    border:1.5px solid #E0D9F5; background:#fff;
  }
  .fc-cal-wrapper .fc-toolbar {
    background:linear-gradient(135deg,#6C4FBF 0%,#9B59B6 100%);
    padding:12px 18px; margin-bottom:0!important;
    border-radius:14px 14px 0 0;
  }
  .fc-cal-wrapper .fc-toolbar-title { color:#fff!important; font-size:.95rem!important; font-weight:800!important; }
  .fc-cal-wrapper .fc-button {
    background:rgba(255,255,255,.18)!important; border:1px solid rgba(255,255,255,.3)!important;
    color:#fff!important; border-radius:8px!important; font-weight:700!important;
    font-size:.78rem!important; padding:4px 11px!important; transition:all .18s!important;
  }
  .fc-cal-wrapper .fc-button:hover { background:rgba(255,255,255,.3)!important; }
  .fc-cal-wrapper .fc-button-active,.fc-cal-wrapper .fc-button:focus { background:rgba(255,255,255,.35)!important; box-shadow:none!important; outline:none!important; }
  .fc-cal-wrapper .fc-col-header-cell { background:#F4F3FB; padding:7px 4px!important; }
  .fc-cal-wrapper .fc-col-header-cell-cushion { color:#6C4FBF!important; font-weight:800!important; font-size:.78rem!important; text-decoration:none!important; text-transform:uppercase; letter-spacing:.04em; }
  .fc-cal-wrapper .fc-col-header-cell-cushion:hover { text-decoration:none!important; }
  .fc-cal-wrapper .fc-timegrid-slot-label-cushion { font-size:.74rem!important; color:#7A6FA0!important; font-weight:600; }
  .fc-cal-wrapper .fc-timegrid-slot { border-color:#F0EBF8!important; }
  .fc-cal-wrapper .fc-timegrid-col { border-color:#E8E2F5!important; }
  .fc-cal-wrapper .fc-timegrid-now-indicator-line { border-color:#E74C3C!important; border-width:2px!important; }
  .fc-cal-wrapper .fc-timegrid-now-indicator-arrow { border-top-color:#E74C3C!important; }
  .fc-cal-wrapper .fc-event {
    border-radius:7px!important; border-left-width:4px!important;
    border-top-width:0!important; border-right-width:0!important; border-bottom-width:0!important;
    padding:2px 5px!important; cursor:pointer!important;
    transition:transform .15s,box-shadow .15s!important;
    box-shadow:0 2px 6px rgba(0,0,0,.1)!important;
  }
  .fc-cal-wrapper .fc-event:hover { transform:scale(1.015)!important; box-shadow:0 4px 14px rgba(0,0,0,.18)!important; z-index:10!important; }
  .fc-cal-wrapper .fc-day-today { background:rgba(108,79,191,.04)!important; }
  .fc-cal-wrapper .fc-scroller::-webkit-scrollbar { width:4px; }
  .fc-cal-wrapper .fc-scroller::-webkit-scrollbar-thumb { background:#C4B5E8; border-radius:4px; }
`;

const CalendarioHorarios = ({ horarios = [], onDetalleHorario }) => {
  const diasMap = { DOM:0, LUN:1, MAR:2, MIE:3, JUE:4, VIE:5, SAB:6 };

  const eventos = horarios.flatMap((h) => {
    const c = colorPorAsig(h.asignatura || "");
    return (h.dia || []).map((dia) => ({
      id: `${h._id?.$oid || h._id}-${dia}`,
      title: h.asignatura || "Sin asignatura",
      daysOfWeek:      [diasMap[dia.toUpperCase()] ?? 1],
      startTime:       h.inicio,
      endTime:         h.fin,
      backgroundColor: c.bg,
      borderColor:     c.border,
      textColor:       "#fff",
      extendedProps:   { _id: h._id?.$oid || h._id, grado: h.grado, asignatura: h.asignatura },
    }));
  });

  const renderEventContent = (info) => {
    const { asignatura, grado } = info.event.extendedProps;
    return (
      <div style={{ padding:"1px 2px", overflow:"hidden" }}>
        <div style={{ fontWeight:800, fontSize:".75rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {asignatura}
        </div>
        <div style={{ fontSize:".65rem", opacity:.88, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
          {info.timeText}{grado ? ` · ${grado}` : ""}
        </div>
      </div>
    );
  };

  return (
    <motion.div className="fc-cal-wrapper"
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ delay:.15, duration:.35 }}
      style={{ padding:"4px 0 12px" }}>
      <style>{FC_CSS}</style>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left:"prev,next today", center:"title", right:"dayGridMonth,timeGridWeek,timeGridDay" }}
        hiddenDays={[0]}
        events={eventos}
        slotMinTime="06:30:00"
        slotMaxTime="15:00:00"   /* ← recortado: clases hasta las 2:30 */
        allDaySlot={false}
        locale={esLocale}
        height="auto"
        eventDisplay="block"
        nowIndicator={true}
        editable={false}
        selectable={false}
        dayHeaderFormat={{ weekday:"short", day:"numeric" }}
        slotLabelFormat={{ hour:"2-digit", minute:"2-digit", hour12:false }}
        eventTimeFormat={{ hour:"2-digit", minute:"2-digit", hour12:false }}
        buttonText={{ today:"Hoy", month:"Mes", week:"Semana", day:"Día" }}
        eventClick={(info) => onDetalleHorario && onDetalleHorario(info.event.extendedProps._id)}
        eventContent={renderEventContent}
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
      />
    </motion.div>
  );
};

export default CalendarioHorarios;