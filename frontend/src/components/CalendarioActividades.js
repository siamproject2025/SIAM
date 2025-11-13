import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import axios from "axios";
import { auth } from "..//components/authentication/Auth";
import {
  Calendar,
  MapPin,
  FileText,
  Tag,
  Inbox,
  X
} from 'lucide-react';
import "../styles/Models/Calendario.css"; // Importamos los estilos

const API_URL = process.env.REACT_APP_API_URL+"/api/actividades"
/* ============================================
   COMPONENTE CALENDARIO DE ACTIVIDADES
   ============================================
   
   Funcionalidades:
   - Vista mensual, semanal, diaria y anual
   - Panel lateral con próximos eventos (30%)
   - Tooltip emergente al pasar el mouse
   - Modal con detalles al hacer click
   - Colores según categoría
   - Responsive para móviles
*/

const CalendarioActividades = forwardRef((props, ref) => {
  // ========== ESTADOS ==========
  
  // Todos los eventos cargados desde el backend
  const [eventos, setEventos] = useState([]);
  
  // Eventos próximos para el sidebar (30%)
  const [proximosEventos, setProximosEventos] = useState([]);
  
  // Estado del tooltip emergente
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: null
  });
  
  // Estado del modal de detalles
  const [modal, setModal] = useState({
    visible: false,
    content: null
  });

  // Referencias
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const calendarRef = useRef(null);

  /* ==========================================
     FUNCIÓN: cargarActividades
     ==========================================
     Carga las actividades desde el backend
     y las formatea para FullCalendar
  */
  const cargarActividades = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const res = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const actividades = res.data;

    const eventosFormateados = actividades.map((actividad) => {
      const categoria = determinarCategoria(actividad.nombre);
      
      return {
        id: actividad._id,
        title: actividad.nombre,
        date: actividad.fecha,
        start: actividad.fecha,
        className: `evento-${categoria}`,
        extendedProps: {
          lugar: actividad.lugar,
          descripcion: actividad.descripcion,
          categoria: categoria
        }
      };
    });

    setEventos(eventosFormateados);
    actualizarProximosEventos(eventosFormateados);
    
  } catch (error) {
    console.error("❌ Error al cargar actividades:", error);
  }
};

  /* ==========================================
     FUNCIÓN: determinarCategoria
     ==========================================
     Analiza el nombre del evento y determina
     su categoría basándose en palabras clave
  */
  const determinarCategoria = (nombre) => {
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes("mantenimiento") || nombreLower.includes("reparación")) {
      return "mantenimiento";
    } else if (nombreLower.includes("préstamo") || nombreLower.includes("prestamo")) {
      return "prestamo";
    } else if (nombreLower.includes("activo") || nombreLower.includes("inventario")) {
      return "activo";
    } else {
      return "general";
    }
  };

  /* ==========================================
     FUNCIÓN: actualizarProximosEventos
     ==========================================
     Filtra eventos futuros y los ordena
     cronológicamente para el sidebar
  */
  const actualizarProximosEventos = (todosLosEventos) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Filtrar solo eventos futuros o del día actual
    const eventosFuturos = todosLosEventos.filter(evento => {
      const fechaEvento = new Date(evento.date || "T00:00:00");
      return fechaEvento >= hoy;
    });
    
    // Ordenar por fecha ascendente
    eventosFuturos.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    // Tomar los primeros 10 eventos
    setProximosEventos(eventosFuturos.slice(0, 10));
  };

  /* ==========================================
     FUNCIÓN: handleEventClick
     ==========================================
     Abre el modal con los detalles del evento
     al hacer click en un evento del calendario
  */
  const handleEventClick = (info) => {
    const evento = info.event;
    const props = evento.extendedProps;
    
    const fechaFormateada = new Date(evento.start).toLocaleString("es-ES", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

    setModal({
      visible: true,
      content: {
        titulo: evento.title,
        fecha: fechaFormateada,
        lugar: props.lugar,
        descripcion: props.descripcion,
        categoria: props.categoria
      }
    });

    // Ocultar tooltip si está visible
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  /* ==========================================
     FUNCIÓN: cerrarModal
     ==========================================
     Cierra el modal de detalles
  */
  const cerrarModal = () => {
    setModal({ visible: false, content: null });
  };

  /* ==========================================
     FUNCIÓN: handleEventMouseEnter
     ==========================================
     Muestra el tooltip al pasar el mouse
     sobre un evento. Posicionado CORRECTAMENTE
     debajo del evento.
  */
  const handleEventMouseEnter = (info) => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const evento = info.event;
    const props = evento.extendedProps;
    const rect = info.el.getBoundingClientRect();

   const fechaFormateada = new Date(evento.start).toLocaleString("es-ES", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

    const tooltipContent = {
      titulo: evento.title,
      fecha: fechaFormateada,
      lugar: props.lugar,
      descripcion: props.descripcion,
      categoria: props.categoria
    };

    // Calcular posición: centrado horizontalmente, debajo verticalmente
    const x = rect.left + (rect.width / 2);
    const y = rect.bottom + 15; // 15px debajo del evento

    // Mostrar tooltip con delay de 300ms
    timeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: true,
        x: x,
        y: y,
        content: tooltipContent
      });
    }, 300);
  };

  /* ==========================================
     FUNCIÓN: handleEventMouseLeave
     ==========================================
     Oculta el tooltip al quitar el mouse
  */
  const handleEventMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: false,
        x: 0,
        y: 0,
        content: null
      });
    }, 100);
  };

  /* ==========================================
     FUNCIÓN: formatearFechaCard
     ==========================================
     Convierte una fecha string a objeto
     con día y mes para las cards
  */
  const formatearFechaCard = (fechaString) => {
    const fecha = new Date(fechaString || "T00:00:00");
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString("es-ES", { month: "short" });
    
    return { dia, mes: mes.toUpperCase() };
  };

  /* ==========================================
     FUNCIÓN: handleCardClick
     ==========================================
     Abre el modal al hacer click en una
     card del sidebar
  */
  const handleCardClick = (evento) => {
    const fechaFormateada = new Date(evento.date || "T00:00:00").toLocaleDateString("es-ES", {
       weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
    });

    setModal({
      visible: true,
      content: {
        titulo: evento.title,
        fecha: fechaFormateada,
        lugar: evento.extendedProps.lugar,
        descripcion: evento.extendedProps.descripcion,
        categoria: evento.extendedProps.categoria
      }
    });
  };

  // ========== HOOKS ==========

  // Exponer función cargarActividades al componente padre
  useImperativeHandle(ref, () => ({
    cargarActividades
  }));

  // Cargar actividades al montar el componente
  useEffect(() => {
    cargarActividades();
    
    // Cleanup al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && modal.visible) {
        cerrarModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modal.visible]);

  // ========== RENDER ==========
  
  return (
    <div className="calendario-container">
      {/* ===== CALENDARIO PRINCIPAL (70%) ===== */}
      <div className="calendario-main">
        <h2>Calendario de Actividades</h2>
        
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          events={eventos}
          
          // Manejadores de eventos
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          
          // Configuración de la barra de herramientas
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridDay,timeGridWeek,dayGridMonth,dayGridYear"
          }}
          
          // Textos de los botones
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Día",
            year: "Año"
          }}
          
          // Configuración de vistas
          views={{
            dayGridYear: {
              type: 'multiMonthYear',
              duration: { months: 12 }
            }
          }}
          
          height="auto"
          weekends={true}
          
          // Formato de hora
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }}
          
          // Limitar eventos mostrados por día
          dayMaxEvents={3}
          contentHeight="auto"
          eventDisplay="block"
          fixedWeekCount={false}
        />

        {/* ===== TOOLTIP EMERGENTE ===== */}
        {tooltip.content && (
          <div
            ref={tooltipRef}
            className={`event-tooltip ${tooltip.visible ? 'visible' : ''}`}
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="tooltip-header">
              <MapPin size={16} className="tooltip-icon" />
              <h3 className="tooltip-title">{tooltip.content.titulo}</h3>
            </div>
            
            <div className="tooltip-content">
              <div className="tooltip-item">
                <Calendar size={16} className="tooltip-item-icon" />
                <div className="tooltip-item-text">
                  <strong>Fecha</strong>
                  {tooltip.content.fecha}
                </div>
              </div>
              
              <div className="tooltip-item">
                <MapPin size={16} className="tooltip-item-icon" />
                <div className="tooltip-item-text">
                  <strong>Lugar</strong>
                  {tooltip.content.lugar}
                </div>
              </div>
              
              <div className="tooltip-item">
                <FileText size={16} className="tooltip-item-icon" />
                <div className="tooltip-item-text">
                  <strong>Descripción</strong>
                  {tooltip.content.descripcion}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SIDEBAR DE PRÓXIMOS EVENTOS (30%) ===== */}
      <div className="eventos-sidebar">
        <h3 style={{ 
          fontSize: "18px", 
          fontWeight: "600", 
          color: "#2c3e50",
          marginBottom: "15px",
          paddingBottom: "10px",
          borderBottom: "2px solid #e0e0e0",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <Calendar size={20} />
          Próximos Eventos
        </h3>
        
        {proximosEventos.length > 0 ? (
          proximosEventos.map((evento) => {
            const fechaInfo = formatearFechaCard(evento.date);
            const categoria = evento.extendedProps.categoria;
            
            return (
              <div 
                key={evento.id} 
                className={`evento-card ${categoria}`}
                onClick={() => handleCardClick(evento)}
              >
                <div className="evento-card-header">
                  {/* FECHA EN ESQUINA SUPERIOR IZQUIERDA */}
                  <div className="evento-fecha-esquina">
                    <div className="fecha-dia">{fechaInfo.dia}</div>
                    <div className="fecha-mes">{fechaInfo.mes}</div>
                  </div>
                  
                  {/* INFORMACIÓN DEL EVENTO */}
                  <div className="evento-info">
                    {/* TÍTULO */}
                    <h4>{evento.title}</h4>
                    
                    {/* DETALLES DEBAJO */}
                    <div className="evento-detalles">
                      <div className="detalle-item">
                        <Calendar size={14} className="detalle-icon" />
                        <span className="detalle-text">
                          {new Date(evento.date || "T00:00:00").toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long"
                          })}
                        </span>
                      </div>
                      
                      <div className="detalle-item">
                        <MapPin size={14} className="detalle-icon" />
                        <span className="detalle-text">{evento.extendedProps.lugar}</span>
                      </div>
                      
                      <div className="detalle-item">
                        <FileText size={14} className="detalle-icon" />
                        <span className="detalle-text">
                          {evento.extendedProps.descripcion.substring(0, 60)}
                          {evento.extendedProps.descripcion.length > 60 ? '...' : ''}
                        </span>
                      </div>
                      
                      <div className="detalle-item">
                        <Tag size={14} className="detalle-icon" />
                        <span className={`evento-badge ${categoria}`}>
                          {categoria}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "30px", 
            color: "#7f8c8d",
            background: "#f8f9fa",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px"
          }}>
            <Inbox size={24} />
            <p style={{ margin: 0, fontSize: "14px" }}>
              No hay eventos próximos
            </p>
          </div>
        )}
      </div>

      {/* ===== MODAL DE DETALLES ===== */}
      {modal.visible && modal.content && (
        <div 
          className={`modal-overlay ${modal.visible ? 'visible' : ''}`}
          onClick={cerrarModal}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">{modal.content.titulo}</h2>
              <button 
                className="modal-close"
                onClick={cerrarModal}
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-item">
                <Calendar size={18} className="modal-item-icon" />
                <div className="modal-item-content">
                  <div className="modal-item-label">Fecha</div>
                  <div className="modal-item-value">{modal.content.fecha}</div>
                </div>
              </div>
              
              <div className="modal-item">
                <MapPin size={18} className="modal-item-icon" />
                <div className="modal-item-content">
                  <div className="modal-item-label">Lugar</div>
                  <div className="modal-item-value">{modal.content.lugar}</div>
                </div>
              </div>
              
              <div className="modal-item">
                <FileText size={18} className="modal-item-icon" />
                <div className="modal-item-content">
                  <div className="modal-item-label">Descripción</div>
                  <div className="modal-item-value">{modal.content.descripcion}</div>
                </div>
              </div>
              
              <div className="modal-item">
                <Tag size={18} className="modal-item-icon" />
                <div className="modal-item-content">
                  <div className="modal-item-label">Categoría</div>
                  <div className="modal-item-value">
                    <span className={`evento-badge ${modal.content.categoria}`}>
                      {modal.content.categoria}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CalendarioActividades;