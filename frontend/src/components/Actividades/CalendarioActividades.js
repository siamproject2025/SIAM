// ============================================================
// CalendarioActividades.jsx - VERSIÓN COMPLETA Y CORREGIDA
// ============================================================
import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import axios from "axios";
import { auth } from "../authentication/Auth";
import { 
  Calendar, MapPin, FileText, Tag, Inbox, X, Plus,
  ChevronLeft, ChevronRight, Grid3X3, List, Clock
} from 'lucide-react';
import ModalCrearActividad from '../../screens/Models/Actividades/ModalCrearActividad';
import ModalDetalleActividad from '../../screens/Models/Actividades/ModalDetalleActividad';
import "../../styles/Models/Calendario.css";
import Notification from "../Notification";

const API_URL = process.env.REACT_APP_API_URL + "/api/actividades";

const COLORES_EVENTO = {
  azul:     { nombre: 'Azul',      hex: '#3B82F6', claro: '#DBEAFE', oscuro: '#1E40AF' },
  verde:    { nombre: 'Verde',     hex: '#22C55E', claro: '#DCFCE7', oscuro: '#166534' },
  amarillo: { nombre: 'Amarillo',  hex: '#EAB308', claro: '#FEF9C3', oscuro: '#854D0E' },
  morado:   { nombre: 'Morado',    hex: '#A855F7', claro: '#F3E8FF', oscuro: '#6B21A8' },
  rojo:     { nombre: 'Rojo',      hex: '#EF4444', claro: '#FEE2E2', oscuro: '#991B1B' }
};

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// --- Helpers de Fecha ---
const getDiasEnMes = (year, month) => new Date(year, month + 1, 0).getDate();
const getPrimerDiaDelMes = (year, month) => new Date(year, month, 1).getDay();
const getDiasDelMes = (year, month) => {
  const dias = [];
  const cantDias = getDiasEnMes(year, month);
  for (let i = 1; i <= cantDias; i++) {
    const d = new Date(year, month, i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias;
};
const getColorPorDefecto = (nombre) => {
  const coloresArr = Object.keys(COLORES_EVENTO);
  const code = nombre?.charCodeAt(0) || 0;
  return coloresArr[code % coloresArr.length];
};

const CalendarioActividades = forwardRef((props, ref) => {
  // ===== ESTADOS =====
  const [eventosRaw, setEventosRaw] = useState([]);
  const [proximosEventos, setProximosEventos] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });
  const [modal, setModal] = useState({ visible: false, content: null, tipo: null });
  const [modalCrear, setModalCrear] = useState({ visible: false, fechaInicial: null });
  

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('mes');

  const [mesDropdownOpen, setMesDropdownOpen] = useState(false);
  const [anoEditando, setAnoEditando] = useState(false);
  const [anoInputValue, setAnoInputValue] = useState(new Date().getFullYear().toString());
  const [coloresFiltrados, setColoresFiltrados] = useState(Object.keys(COLORES_EVENTO).reduce((a, k) => ({ ...a, [k]: true }), {}));
  const [busquedaLista, setBusquedaLista] = useState('');

  const [confirmacion, setConfirmacion] = useState({
  visible: false,
  message: "",
  onConfirm: null
});

const mostrarConfirmacion = (message, onConfirm) => {
  setConfirmacion({
    visible: true,
    message,
    onConfirm
  });
};

  

  const [notification, setNotification] = useState({
  visible: false,
  message: '',
  type: 'error'
});
const existeConflictoHora = (fechaNueva, idActual = null) => {
  const nueva = new Date(fechaNueva);

  return eventosRaw.some(e => {
    if (idActual && e._id === idActual) return false;

    const existente = new Date(e.fecha);

    return (
      nueva.getFullYear() === existente.getFullYear() &&
      nueva.getMonth() === existente.getMonth() &&
      nueva.getDate() === existente.getDate() &&
      nueva.getHours() === existente.getHours() &&
      nueva.getMinutes() === existente.getMinutes()
    );
  });
};

const mostrarNotificacion = (message, type = "error") => {
  setNotification({
    visible: true,
    message,
    type
  });
};
  const dropdownRef = useRef(null);

  // ===== LÓGICA DE API (SIN HEADER USUARIO PARA EVITAR CORS) =====
  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const actividades = res.data || [];
      const normalizadas = actividades.map(a => ({ ...a, color: a.color || getColorPorDefecto(a.nombre) }));
      setEventosRaw(normalizadas);
      actualizarProximosEventos(normalizadas);
    } catch (err) { console.error("Error al cargar:", err); }
  };

 const handleCrearDesdeCalendario = async (nuevaActividad) => {
  try {
    // 🔴 VALIDACIÓN
    if (existeConflictoHora(nuevaActividad.fecha)) {
  mostrarNotificacion("Ya existe una actividad en esa fecha y hora");
  return;
}

    const user = auth.currentUser;
    const token = await user.getIdToken();
    const payload = { ...nuevaActividad, usuario: user.uid };

    await axios.post(API_URL, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setModalCrear({ visible: false, fechaInicial: null });
    cargarActividades();

  } catch (err) {
    alert("Error al guardar");
  }
};
  const handleActualizarActividad = async (datos) => {
  try {
    // 🔴 VALIDACIÓN
    if (existeConflictoHora(datos.fecha, datos._id)) {
  mostrarNotificacion("Ya existe otra actividad en esa misma hora");
  return;
}

    const token = await auth.currentUser.getIdToken();

    await axios.put(`${API_URL}/${datos._id}`, datos, {
      headers: { Authorization: `Bearer ${token}` }
    });

    cerrarModal();
    cargarActividades();

  } catch (err) {
    alert("Error al actualizar");
  }
};
const handleEliminarActividad = (id) => {
  mostrarConfirmacion("¿Seguro que deseas eliminar esta actividad?", async () => {
    try {
      const token = await auth.currentUser.getIdToken();

      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      cerrarModal(); // 👈 cerrar el modal de detalle
      cargarActividades();
      mostrarNotificacion("Actividad eliminada correctamente", "success");

    } catch (err) {
      mostrarNotificacion("Error al eliminar", "error");
    }
  });
};
  // ===== FUNCIONES DE NAVEGACIÓN Y SOPORTE =====
  const actualizarProximosEventos = (todos) => {
    const hoy = new Date();
    const futuros = todos.filter(e => new Date(e.fecha) >= hoy).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    setProximosEventos(futuros.slice(0, 10));
  };

  const irAHoy = () => {
    const h = new Date();
    setCurrentYear(h.getFullYear()); setCurrentMonth(h.getMonth()); setCurrentDate(new Date(h));
  };

  const navegarAnterior = () => {
    if (currentView === 'mes') {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
      else setCurrentMonth(currentMonth - 1);
    } else if (currentView === 'dia') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    } else if (currentView === 'semana') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    } else {
        setCurrentYear(currentYear - 1);
    }
  };

  const navegarSiguiente = () => {
    if (currentView === 'mes') {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
      else setCurrentMonth(currentMonth + 1);
    } else if (currentView === 'dia') {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    } else if (currentView === 'semana') {
        setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    } else {
        setCurrentYear(currentYear + 1);
    }
  };

  const handleSeleccionarMes = (idx) => { setCurrentMonth(idx); setMesDropdownOpen(false); };
  
  const handleConfirmarAno = () => {
    const n = parseInt(anoInputValue, 10);
    if (!isNaN(n) && n > 1900 && n < 2100) { setCurrentYear(n); setAnoEditando(false); }
  };

  const handleEventoClick = (e) => setModal({ visible: true, content: e, tipo: 'editar' });
  const handleDateClick = (fechaISO) => setModalCrear({ visible: true, fechaInicial: fechaISO + 'T08:00' });
  const cerrarModal = () => setModal({ visible: false, content: null, tipo: null });

  const handleEventoMouseEnter = (el, e) => {
    const rect = el.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
      content: { titulo: e.nombre, fecha: new Date(e.fecha).toLocaleString(), lugar: e.lugar, descripcion: e.descripcion }
    });
  };
  const handleEventoMouseLeave = () => setTooltip({ ...tooltip, visible: false });

  useImperativeHandle(ref, () => ({ cargarActividades }));
  useEffect(() => { cargarActividades(); }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMesDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== RENDERIZADOS DE VISTAS =====
  const renderVistaMonth = () => {
    const dias = getDiasDelMes(currentYear, currentMonth);
    const primerDia = getPrimerDiaDelMes(currentYear, currentMonth);
    const celdas = [];
    for (let i = 0; i < primerDia; i++) celdas.push(<div key={`empty-${i}`} className="calendario-celda vacia"></div>);
    
    dias.forEach(f => {
      const evs = eventosRaw.filter(e => e.fecha.split('T')[0] === f && coloresFiltrados[e.color]);
      const esHoy = f === new Date().toISOString().split('T')[0];
      celdas.push(
        <div key={f} className={`calendario-celda ${esHoy ? 'hoy' : ''}`} onClick={() => handleDateClick(f)}>
          <div className="calendario-dia-numero">{f.split('-')[2]}</div>
          <div className="calendario-eventos">
            {evs.slice(0, 3).map(e => (
              <div key={e._id} className="calendario-evento" 
                   style={{ backgroundColor: COLORES_EVENTO[e.color].claro, color: COLORES_EVENTO[e.color].oscuro, borderLeft: `3px solid ${COLORES_EVENTO[e.color].hex}` }}
                   onClick={(ex) => { ex.stopPropagation(); handleEventoClick(e); }}
                   onMouseEnter={(ex) => handleEventoMouseEnter(ex.currentTarget, e)}
                   onMouseLeave={handleEventoMouseLeave}>
                {e.nombre}
              </div>
            ))}
          </div>
        </div>
      );
    });
    return <div className="calendario-grid-mes">{DIAS_SEMANA.map(d => <div key={d} className="calendario-header-dia">{d}</div>)}{celdas}</div>;
  };

  const renderVistaYear = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, padding: 20 }}>
      {MESES_NOMBRES.map((mes, idx) => (
        <div key={mes} className="mini-mes-card" style={{ background: 'white', padding: 15, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#2b3674' }}>{mes}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: '0.7rem' }}>
            {getDiasDelMes(currentYear, idx).map(d => {
                const hasEv = eventosRaw.some(e => e.fecha.split('T')[0] === d);
                return <div key={d} style={{ textAlign: 'center', padding: 2, background: hasEv ? '#6C4FBF' : 'transparent', color: hasEv ? 'white' : '#333', borderRadius: 2 }}>{d.split('-')[2]}</div>
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderVistaLista = () => {
    const evs = eventosRaw.filter(e => coloresFiltrados[e.color]).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
    return (
        <div style={{ padding: 20 }}>
            {evs.map(e => (
                <div key={e._id} className="evento-card" style={{ borderLeft: `5px solid ${COLORES_EVENTO[e.color].hex}`, marginBottom: 10, padding: 15, background: '#fff', borderRadius: 8 }} onClick={() => handleEventoClick(e)}>
                    <div style={{ fontWeight: 700 }}>{e.nombre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(e.fecha).toLocaleString()} - {e.lugar}</div>
                </div>
            ))}
        </div>
    )
  };

  // ===== RENDER PRINCIPAL =====
  return (
    <div style={{ background: '#f8f9fe', minHeight: '100vh', padding: 20 }}>
      {notification.visible && (
  <Notification
    message={notification.message}
    type={notification.type}
    onClose={() => setNotification({ ...notification, visible: false })}
  />
)}
      {/* BARRA DE NAVEGACIÓN PERSONALIZADA (Estilos de la versión antigua) */}
      <div style={{
        background: 'white', padding: '15px 20px', borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20, display: 'flex',
        alignItems: 'center', gap: 15, flexWrap: 'wrap'
      }}>
        
        {/* Botones de navegación anterior/siguiente */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={navegarAnterior}
            style={{
              background: '#6C4FBF', color: 'white', border: 'none', borderRadius: 6,
              padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4B3090'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6C4FBF'}
            title="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={navegarSiguiente}
            style={{
              background: '#6C4FBF', color: 'white', border: 'none', borderRadius: 6,
              padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4B3090'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6C4FBF'}
            title="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={irAHoy}
            style={{
              background: '#f0f0f0', color: '#6C4FBF', border: '1px solid #ddd', borderRadius: 6,
              padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e0dcf5'; e.currentTarget.style.color = '#4B3090'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#6C4FBF'; }}
            title="Hoy"
          >
            Hoy
          </button>
        </div>

        <div style={{ width: 1, height: 28, background: '#e0e0e0' }}></div>

        {/* Selector de mes (dropdown) */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMesDropdownOpen(!mesDropdownOpen)}
            style={{
              background: 'white', color: '#2b3674', border: '1.5px solid #E0D9F5', borderRadius: 6,
              padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f7ff'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            {MESES_NOMBRES[currentMonth]}
          </button>
          {mesDropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, background: 'white', border: '1.5px solid #E0D9F5',
              borderRadius: 8, marginTop: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 1000, minWidth: 150
            }}>
              {MESES_NOMBRES.map((mes, idx) => (
                <button
                  key={mes}
                  onClick={() => handleSeleccionarMes(idx)}
                  style={{
                    display: 'block', width: '100%', padding: '10px 14px', border: 'none',
                    background: idx === currentMonth ? '#f0f0f0' : 'transparent',
                    color: idx === currentMonth ? '#6C4FBF' : '#666',
                    fontWeight: idx === currentMonth ? 700 : 500,
                    fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (idx !== currentMonth) e.currentTarget.style.background = '#f8f7ff'; }}
                  onMouseLeave={(e) => { if (idx !== currentMonth) e.currentTarget.style.background = 'transparent'; }}
                >
                  {mes}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selector de año (input) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {anoEditando ? (
            <>
              <input
                type="number"
                value={anoInputValue}
                onChange={(e) => setAnoInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirmarAno()}
                style={{
                  width: 70, padding: '8px 6px', border: '1.5px solid #E0D9F5',
                  borderRadius: 6, fontSize: '0.9rem', textAlign: 'center'
                }}
                autoFocus
              />
              <button
                onClick={handleConfirmarAno}
                style={{ background: '#6C4FBF', color: 'white', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ✓
              </button>
              <button
                onClick={() => { setAnoEditando(false); setAnoInputValue(currentYear.toString()); }}
                style={{ background: '#f0f0f0', color: '#999', border: 'none', borderRadius: 4, padding: '6px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => setAnoEditando(true)}
              style={{
                background: 'white', color: '#2b3674', border: '1.5px solid #E0D9F5', borderRadius: 6,
                padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', minWidth: 60
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f7ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              {currentYear}
            </button>
          )}
        </div>

        <div style={{ width: 1, height: 28, background: '#e0e0e0' }}></div>

        {/* Botones de vista */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'mes', label: 'Mes', icon: <Grid3X3 size={16} /> },
            { id: 'semana', label: 'Semana', icon: <List size={16} /> },
            { id: 'dia', label: 'Día', icon: <Calendar size={16} /> },
            { id: 'ano', label: 'Año', icon: <Grid3X3 size={16} /> },
            { id: 'lista', label: 'Lista', icon: <List size={16} /> }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setCurrentView(view.id)}
              style={{
                background: currentView === view.id ? '#6C4FBF' : '#f0f0f0',
                color: currentView === view.id ? 'white' : '#666',
                border: 'none', borderRadius: 6, padding: '8px 10px', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: currentView === view.id ? 600 : 500,
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentView !== view.id) {
                  e.currentTarget.style.background = '#e0dcf5';
                  e.currentTarget.style.color = '#4B3090';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== view.id) {
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.color = '#666';
                }
              }}
              title={view.label}
            >
              {view.icon}
              <span style={{ display: '@media (max-width: 600px)' ? 'none' : 'inline' }}>{view.label}</span>
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 28, background: '#e0e0e0' }}></div>

        {/* Filtros de colores */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 500 }}>Filtros:</span>
          {Object.entries(COLORES_EVENTO).map(([key, color]) => (
            <button
              key={key}
              onClick={() => setColoresFiltrados({ ...coloresFiltrados, [key]: !coloresFiltrados[key] })}
              style={{
                width: 24, height: 24, borderRadius: '50%', background: color.hex,
                border: coloresFiltrados[key] ? '3px solid #333' : '2px solid #ddd',
                cursor: 'pointer', opacity: coloresFiltrados[key] ? 1 : 0.4, transition: 'all 0.2s'
              }}
              title={color.nombre}
            />
          ))}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: 600 }}>
            {MESES_NOMBRES[currentMonth]} {currentYear}
          </span>
        </div>
      </div>

      {/* CONTENIDO DE VISTAS */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {currentView === 'mes' && renderVistaMonth()}
        {currentView === 'ano' && renderVistaYear()}
        {currentView === 'lista' && renderVistaLista()}
        {(currentView === 'semana' || currentView === 'dia') && <div style={{ padding: 40, textAlign: 'center' }}>Vista {currentView} en mantenimiento</div>}
      </div>

          
      {/* MODALES */}
      {modal.visible && (
        <ModalDetalleActividad actividad={modal.content} onClose={cerrarModal} onUpdate={handleActualizarActividad} onDelete={() => handleEliminarActividad(modal.content._id)} />
      )}
      {modalCrear.visible && (
        <ModalCrearActividad onClose={() => setModalCrear({ visible: false, fechaInicial: null })} onCreate={handleCrearDesdeCalendario} fechaInicial={modalCrear.fechaInicial} />
      )}

      {/* TOOLTIP */}
      {tooltip.visible && tooltip.content && (
        <div style={{ position: 'fixed', top: tooltip.y, left: tooltip.x, background: 'rgba(0,0,0,0.85)', color: 'white', padding: '8px 12px', borderRadius: 6, zIndex: 9999, transform: 'translateX(-50%)', fontSize: '0.8rem', pointerEvents: 'none' }}>
          <strong>{tooltip.content.titulo}</strong>
          <div>{tooltip.content.lugar}</div>
        </div>
      )}
      {/* MODAL DE CONFIRMACION */}
      {confirmacion.visible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 8, textAlign: 'center' }}>
            <p>{confirmacion.message}</p>
            <button onClick={() => { confirmacion.onConfirm(); setConfirmacion({ visible: false, message: "", onConfirm: null }); }} style={{ background: '#6C4FBF', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
              Confirmar
            </button>
            <button onClick={() => setConfirmacion({ visible: false, message: "", onConfirm: null })} style={{ background: '#f0f0f0', color: '#666', border: 'none', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', marginLeft: 10 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  
  );
});

export default CalendarioActividades;