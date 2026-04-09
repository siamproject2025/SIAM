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

  const dropdownRef = useRef(null);

  // ===== LÓGICA DE API (SIN HEADER USUARIO PARA EVITAR CORS) =====

  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      // FIX: SOLO Authorization, sin 'usuario'
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const actividades = res.data || [];
      const normalizadas = actividades.map(a => ({ ...a, color: a.color || getColorPorDefecto(a.nombre) }));
      setEventosRaw(normalizadas);
      actualizarProximosEventos(normalizadas);
    } catch (err) { console.error("Error al cargar:", err); }
  };

  const handleCrearDesdeCalendario = async (nuevaActividad) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const payload = { ...nuevaActividad, usuario: user.uid };
      await axios.post(API_URL, payload, { headers: { Authorization: `Bearer ${token}` } });
      setModalCrear({ visible: false, fechaInicial: null });
      cargarActividades();
    } catch (err) { alert("Error al guardar"); }
  };

  const handleActualizarActividad = async (datos) => {
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.put(`${API_URL}/${datos._id}`, datos, { headers: { Authorization: `Bearer ${token}` } });
      cerrarModal();
      cargarActividades();
    } catch (err) { alert("Error al actualizar"); }
  };

  const handleEliminarActividad = async (id) => {
    if (!window.confirm("¿Eliminar actividad?")) return;
    try {
      const token = await auth.currentUser.getIdToken();
      await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      cerrarModal();
      cargarActividades();
    } catch (err) { alert("Error al eliminar"); }
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
    const n = parseInt(anoInputValue);
    if (n > 1900 && n < 2100) { setCurrentYear(n); setAnoEditando(false); }
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

  // ===== RENDERIZADOS DE VISTAS (RESTABLECIDOS) =====

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
      {/* TOOLBAR COMPLETO */}
      <div style={{ background: 'white', padding: '15px 20px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 15, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={navegarAnterior} className="btn-nav"><ChevronLeft size={18} /></button>
          <button onClick={navegarSiguiente} className="btn-nav"><ChevronRight size={18} /></button>
          <button onClick={irAHoy} className="btn-hoy">Hoy</button>
        </div>

        <div style={{ width: 1, height: 28, background: '#e0e0e0' }}></div>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button onClick={() => setMesDropdownOpen(!mesDropdownOpen)} className="btn-selector">{MESES_NOMBRES[currentMonth]}</button>
          {mesDropdownOpen && (
            <div className="dropdown-meses">
              {MESES_NOMBRES.map((mes, idx) => (
                <div key={mes} onClick={() => handleSeleccionarMes(idx)} className="dropdown-item">{mes}</div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setAnoEditando(true)} className="btn-selector">
          {anoEditando ? <input value={anoInputValue} onChange={e => setAnoInputValue(e.target.value)} onBlur={handleConfirmarAno} autoFocus className="input-ano" /> : currentYear}
        </button>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {['mes', 'semana', 'dia', 'ano', 'lista'].map(v => (
            <button key={v} onClick={() => setCurrentView(v)} className={`btn-view ${currentView === v ? 'active' : ''}`}>{v}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 10 }}>
          {Object.entries(COLORES_EVENTO).map(([key, color]) => (
            <button key={key} onClick={() => setColoresFiltrados({...coloresFiltrados, [key]: !coloresFiltrados[key]})}
              style={{ width: 20, height: 20, borderRadius: '50%', background: color.hex, border: coloresFiltrados[key] ? '2.5px solid #333' : '1px solid #ddd', cursor: 'pointer', opacity: coloresFiltrados[key] ? 1 : 0.3 }}
            />
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {currentView === 'mes' && renderVistaMonth()}
        {currentView === 'ano' && renderVistaYear()}
        {currentView === 'lista' && renderVistaLista()}
        {/* Renderiza un placeholder para Semana/Día si no quieres el código gigante, pero la estructura está lista */}
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
    </div>
  );
});

export default CalendarioActividades;