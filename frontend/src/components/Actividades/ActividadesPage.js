import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import ModalCrearActividad from '../../screens/Models/Actividades/ModalCrearActividad';
import ModalDetalleActividad from '../../screens/Models/Actividades/ModalDetalleActividad';
import Notification from '../Notification';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import '../../../src/styles/Models/Actividades.css';
import { auth } from "../authentication/Auth";
import WithPermission from "../Permisos/WithPermission";
import {
  Calendar, Clock, MapPin, Edit, Trash2,
  Plus, HelpCircle, Search, CheckCircle,
  AlertCircle, Filter, Target,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL + "/api/actividades";

// ── Helpers de fecha — todo via Intl, sin resta manual ──────
const formatearFechaHN = (utcStr) => {
  if (!utcStr) return '—';
  try {
    return new Intl.DateTimeFormat('es-HN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'America/Tegucigalpa',
    }).format(new Date(utcStr));
  } catch { return utcStr; }
};

const formatearDiaCompleto = (utcStr) => {
  if (!utcStr) return '—';
  try {
    return new Intl.DateTimeFormat('es-HN', {
      weekday: 'long', day: '2-digit', month: 'long',
      timeZone: 'America/Tegucigalpa',
    }).format(new Date(utcStr));
  } catch { return utcStr; }
};

const formatearHora = (utcStr) => {
  if (!utcStr) return '';
  try {
    return new Intl.DateTimeFormat('es-HN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
      timeZone: 'America/Tegucigalpa',
    }).format(new Date(utcStr));
  } catch { return ''; }
};

// Retorna "YYYY-MM-DD" en zona HN para comparar solo la fecha del día
const fechaSoloHN = (utcStr) => {
  if (!utcStr) return null;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Tegucigalpa',
    }).format(new Date(utcStr));
  } catch { return null; }
};

const categorizarActividad = (fechaUTC) => {
  if (!fechaUTC) return 'DESCONOCIDA';
  try {
    const hoy  = fechaSoloHN(new Date().toISOString());
    const fAct = fechaSoloHN(fechaUTC);
    if (!hoy || !fAct) return 'DESCONOCIDA';

    const diffMs   = new Date(fAct) - new Date(hoy);
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    if (diffDias === 0)               return 'HOY';
    if (diffDias > 0 && diffDias <= 7) return 'PROXIMA';
    if (diffDias > 7)                 return 'FUTURA';
    return 'FINALIZADA';
  } catch { return 'DESCONOCIDA'; }
};

const detectarConflicto = (actividades, lugar, fechaISO, excludeId = null) => {
  if (!lugar || !fechaISO) return null;
  const t     = new Date(fechaISO).getTime();
  const DOS_H = 2 * 60 * 60 * 1000;
  return actividades.find(a => {
    if (a._id === excludeId || !a.lugar || !a.fecha) return false;
    if (a.lugar.trim().toLowerCase() !== lugar.trim().toLowerCase()) return false;
    return Math.abs(new Date(a.fecha).getTime() - t) < DOS_H;
  }) || null;
};

const CAT_CFG = {
  HOY: {
    label:    'Para Hoy',
    gradient: 'linear-gradient(135deg,#FF6B6B 0%,#EE5A24 100%)',
    badge:    { bg: '#FFF3CD', color: '#7A4100', border: '#FFC107' },
    glow:     '0 8px 28px rgba(238,90,36,.18)',
    accent:   '#EE5A24',
    icon:     <AlertCircle size={17} />,
    emptyMsg: 'No hay actividades programadas para hoy.',
  },
  PROXIMA: {
    label:    'Próximos 7 días',
    gradient: 'linear-gradient(135deg,#6C4FBF 0%,#9B59B6 100%)',
    badge:    { bg: '#EDE9FF', color: '#4B3090', border: '#C4B5E8' },
    glow:     '0 8px 28px rgba(108,79,191,.14)',
    accent:   '#6C4FBF',
    icon:     <Clock size={17} />,
    emptyMsg: 'No hay actividades en los próximos 7 días.',
  },
  FUTURA: {
    label:    'Futuras',
    gradient: 'linear-gradient(135deg,#20BF55 0%,#01BAEF 100%)',
    badge:    { bg: '#D4EDDA', color: '#155724', border: '#C3E6CB' },
    glow:     '0 8px 28px rgba(32,191,85,.13)',
    accent:   '#20BF55',
    icon:     <Target size={17} />,
    emptyMsg: 'No hay actividades futuras programadas.',
  },
  FINALIZADA: {
    label:    'Finalizadas',
    gradient: 'linear-gradient(135deg,#636E72 0%,#2D3436 100%)',
    badge:    { bg: '#E2E3E5', color: '#383D41', border: '#CED4DA' },
    glow:     '0 8px 28px rgba(99,110,114,.10)',
    accent:   '#636E72',
    icon:     <CheckCircle size={17} />,
    emptyMsg: 'No hay actividades finalizadas.',
  },
};

const COLOR_HEX = {
  azul: '#3B82F6', verde: '#22C55E', amarillo: '#EAB308', morado: '#A855F7', rojo: '#EF4444',
};

const S = {
  btn: (bg, col = '#fff') => ({
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 10, fontSize: '.86rem',
    fontWeight: 700, border: 'none', cursor: 'pointer',
    background: bg, color: col, fontFamily: 'inherit', transition: 'all .18s',
  }),
};

const Actividades = () => {
  const [actividades,           setActividades]           = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [busqueda,              setBusqueda]              = useState('');
  const [mostrarModalCrear,     setMostrarModalCrear]     = useState(false);
  const [notification,          setNotification]          = useState(null);
  const [mostrarAyuda,          setMostrarAyuda]          = useState(false);
  const [showConfirm,           setShowConfirm]           = useState(false);
  const [actividadAEliminar,    setActividadAEliminar]    = useState(null);
  const [filtroLugar,           setFiltroLugar]           = useState('');
  const [filtroPeriodo,         setFiltroPeriodo]         = useState('todos');
  const [filtroCategoria,       setFiltroCategoria]       = useState('todas');
  const [mostrarFiltros,        setMostrarFiltros]        = useState(false);
  const [preselectedDate,       setPreselectedDate]       = useState(null);

  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
        const token = await user.getIdToken(); //  Obtener token
        const res   = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al obtener actividades');
      setActividades(await res.json());
    } catch (err) { console.error(err.message); }
  };

  useEffect(() => { cargarActividades(); }, []);

  const stats = useMemo(() => ({
    total:       actividades.length,
    hoy:         actividades.filter(a => categorizarActividad(a.fecha) === 'HOY').length,
    proximas:    actividades.filter(a => categorizarActividad(a.fecha) === 'PROXIMA').length,
    finalizadas: actividades.filter(a => categorizarActividad(a.fecha) === 'FINALIZADA').length,
  }), [actividades]);

  const showNotification = (msg, type) => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const lugaresUnicos = useMemo(() =>
    [...new Set(actividades.map(a => a.lugar).filter(Boolean))].sort(), [actividades]);

  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(a => {
      const t = busqueda.toLowerCase();
      if (t && ![a.nombre, a.lugar, a.descripcion].some(f => f?.toLowerCase().includes(t))) return false;
      if (filtroLugar && a.lugar?.trim().toLowerCase() !== filtroLugar.toLowerCase()) return false;
      if (filtroCategoria !== 'todas' && categorizarActividad(a.fecha) !== filtroCategoria) return false;

      if (filtroPeriodo !== 'todos') {
        const fSolo = fechaSoloHN(a.fecha);
        const hSolo = fechaSoloHN(new Date().toISOString());
        if (!fSolo || !hSolo) return false;

        const fDate = new Date(fSolo);
        const hDate = new Date(hSolo);
        const fin   = new Date(hDate);

        if (filtroPeriodo === 'semana') {
          fin.setDate(fin.getDate() + 7);
          if (fDate < hDate || fDate > fin) return false;
        }
        if (filtroPeriodo === 'mes') {
          fin.setMonth(fin.getMonth() + 1);
          if (fDate < hDate || fDate > fin) return false;
        }
      }
      return true;
    });
  }, [actividades, busqueda, filtroLugar, filtroPeriodo, filtroCategoria]);

  const grupos = {
    HOY:        actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'HOY'),
    PROXIMA:    actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'PROXIMA'),
    FUTURA:     actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'FUTURA'),
    FINALIZADA: actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'FINALIZADA'),
  };

  const hayFiltrosActivos = !!(filtroLugar || filtroPeriodo !== 'todos' || filtroCategoria !== 'todas');
  const contadorFiltros   = [filtroLugar, filtroPeriodo !== 'todos' ? '1' : '', filtroCategoria !== 'todas' ? '1' : ''].filter(Boolean).length;

  // ── CRUD ────────────────────────────────────────────────────

const handleCrearActividad = async (nueva) => {
  try {
    const token = await auth.currentUser.getIdToken();
    const res   = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify(nueva),
    });
    const json = await res.json();
    if (!res.ok) throw Object.assign(new Error(json.message || 'Error al crear'), { data: json });

    // ✅ El servidor envuelve la actividad en json.data
    const actividad = { ...json.data, _id: json.data._id || json.data.id };

    setMostrarModalCrear(false);
    setPreselectedDate(null);
    setActividades(prev => [...prev, actividad]);
    showNotification(`✓ Actividad "${actividad.nombre}" creada`, 'success');
  } catch (err) {
    showNotification(err.message || 'Error al crear la actividad', 'error');
  }
};
  const handleEditarActividad = async (payload) => {
    const id = payload._id || payload.id;
    if (!id) {
      const err = new Error('No se pudo identificar la actividad a actualizar.');
      showNotification(err.message, 'error');
      throw err;
    }
    /*
    const conflicto = detectarConflicto(actividades, payload.lugar, payload.fecha, id);
    if (conflicto) {
      const msg = `⚠ Conflicto: "${conflicto.nombre}" ya está en "${conflicto.lugar}" el ${formatearFechaHN(conflicto.fecha)}.`;
      showNotification(msg, 'error');
      throw new Error(msg);
    }*/

    try {
      const token = await auth.currentUser.getIdToken();
      const res   = await fetch(`${API_URL}/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || 'Error al actualizar la actividad');
        err.response = { data };
        throw err;
      }

      setActividades(prev => prev.map(a => a._id === data._id ? data : a));
      setActividadSeleccionada(null);
      showNotification(`✓ Actividad "${data.nombre}" actualizada`, 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Error al actualizar';
      showNotification(msg, 'error');
      throw err;
    }
  };

  const handleEliminarActividad = (id) => {
    const encontrada = actividades.find(x => x._id === id);
    setActividadAEliminar(encontrada || { _id: id, nombre: 'esta actividad' });
    setShowConfirm(true);
  };

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!actividadAEliminar) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res   = await fetch(`${API_URL}/${actividadAEliminar._id}`, {
        method:  'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar');
      }
      setActividades(prev => prev.filter(a => a._id !== actividadAEliminar._id));
      setActividadSeleccionada(null);
      showNotification('✓ Actividad eliminada correctamente', 'success');
    } catch (err) {
      showNotification(err.message || 'Error al eliminar', 'error');
    } finally {
      setActividadAEliminar(null);
    }
  };

  // ── Card ─────────────────────────────────────────────────────

  const renderCard = (actividad, idx, cat) => {
    const cfg      = CAT_CFG[cat];
    const colorHex = COLOR_HEX[actividad.color] || '#A855F7';
    const esHoy    = cat === 'HOY';

    return (
      <motion.div
        key={actividad._id}
        className={`act-card${esHoy ? ' act-card--hoy' : ''}`}
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: .95 }}
        transition={{ delay: Math.min(idx * 0.055, 0.45), duration: .32, type: 'spring', stiffness: 130 }}
        whileHover={{ y: -5, transition: { duration: .18 } }}
        style={{ '--c-accent': colorHex }}
      >
        <div className="act-card__stripe" style={{ background: colorHex }} />
        <div className="act-card__body">
          <div className="act-card__top">
            <span className="act-card__badge" style={{ background: cfg.badge.bg, color: cfg.badge.color, borderColor: cfg.badge.border }}>
              {cfg.icon}
              {cat === 'HOY' ? '¡HOY!' : cat === 'PROXIMA' ? 'PRÓXIMA' : cat === 'FUTURA' ? 'FUTURA' : 'FINALIZADA'}
            </span>
            <div className="act-card__hora">
              <Clock size={12} />
              {formatearHora(actividad.fecha)}
            </div>
            <div className="act-card__btns" onClick={e => e.stopPropagation()}>
              <WithPermission requiredPermissions={["ACTUALIZAR_ACTIVIDADES"]}>
              <button  className="bienes-btn-icon edit" title="Editar"
                onClick={() => setActividadSeleccionada(actividad)}>
                <Edit size={13} />
              </button>
              </WithPermission>

                <WithPermission requiredPermissions={["ELIMINAR_ACTIVIDADES"]}>
              <button className="act-ibtn act-ibtn--del" title="Eliminar"
                onClick={() => handleEliminarActividad(actividad._id)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
              </WithPermission>
            </div>
          </div>
          <h4 className="act-card__nombre" >
            {actividad.nombre}
          </h4>
          <div className="act-card__meta">
            <Calendar size={12} />
            <span style={{ textTransform: 'capitalize' }}>{formatearDiaCompleto(actividad.fecha)}</span>
          </div>
          <div className="act-card__meta">
            <MapPin size={12} />
            {actividad.lugar}
          </div>
          {actividad.descripcion && (
            <p className="act-card__desc">{actividad.descripcion}</p>
          )}
          <div className="act-card__footer">
            <div className="act-card__color-dot" style={{ background: colorHex }}>
              <span>{actividad.color || 'morado'}</span>
            </div>
            <span className="act-card__cat">{actividad.categoria || 'general'}</span>
          </div>
        </div>
        {esHoy && <span className="act-card__pulse" style={{ background: colorHex }} />}
      </motion.div>
    );
  };

  // ── Grupo ────────────────────────────────────────────────────

  const renderGrupo = (cat) => {
    const cfg   = CAT_CFG[cat];
    const lista = grupos[cat];

    // Solo ocultar si no hay filtros activos, no hay búsqueda Y hay actividades en total
    if (lista.length === 0 && !hayFiltrosActivos && busqueda === '' && actividades.length > 0) return null;
    if (lista.length === 0 && actividades.length === 0) return null;

    return (
      <motion.section key={cat} className="act-grupo"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }}>
        <div className="act-grupo__head">
          <div className="act-grupo__left">
            <div className="act-grupo__icon" style={{ background: cfg.gradient }}>
              {cfg.icon}
            </div>
            <div>
              <h3 className="act-grupo__title">{cfg.label}</h3>
              <span className="act-grupo__count">
                {lista.length} {lista.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </div>
          </div>
          <div className="act-grupo__line" style={{ background: cfg.gradient }} />
        </div>
        {lista.length === 0 ? (
          <div className="act-empty">
            <div className="act-empty__icon" style={{ background: cfg.gradient }}>{cfg.icon}</div>
            <p>{cfg.emptyMsg}</p>
          </div>
        ) : (
          <div className="act-grid">
            <AnimatePresence>
              {lista.map((a, i) => renderCard(a, i, cat))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>
    );
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="bienes-app">
      <AnimatePresence>
        {notification && (
          <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
        )}
      </AnimatePresence>

      <motion.div className="mm-header"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5, type: 'spring', stiffness: 120 }}>
        <div className="mm-hi">
          <div className="mm-ht">
            <motion.div className="mm-htitle"
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .15 }}>
              <motion.span
                initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: .2 }}>
                <Calendar size={34} color="white" fill="white" />
              </motion.span>
              Sistema de Actividades
            </motion.div>
          </div>
          <motion.p className="mm-sub"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 }}>
            Organiza y gestiona todas tus actividades de manera eficiente
          </motion.p>
          <motion.div className="mm-stats"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35 }}>
            {[
              { ico: <Calendar size={18} color="white" />,    val: stats.total,       lbl: 'Total' },
              { ico: <AlertCircle size={18} color="white" />, val: stats.hoy,         lbl: 'Para Hoy' },
              { ico: <Clock size={18} color="white" />,       val: stats.proximas,    lbl: 'Próximas' },
              { ico: <CheckCircle size={18} color="white" />, val: stats.finalizadas, lbl: 'Finalizadas' },
            ].map((s, i) => (
              <motion.div key={i} className="mm-stat"
                whileHover={{ scale: 1.04, y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div className="mm-stat-ico">{s.ico}</div>
                <div>
                  <div className="mm-stat-val">{s.val}</div>
                  <div className="mm-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="bienes-action-area">
        <div className="bienes-action-bar">
          <div className="bienes-search-wrapper">
            <span className="bienes-search-icon"><Search size={16} /></span>
            <input type="text" className="bienes-search-input"
              placeholder="Buscar por nombre, lugar o descripción..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {busqueda && <button className="bienes-search-clear" onClick={() => setBusqueda('')}>×</button>}
          </div>
          <div className="bienes-bar-buttons">
            <button style={{ ...S.btn('#E0D9F5', '#6C4FBF'), position: 'relative' }}
              onClick={() => setMostrarFiltros(p => !p)}>
              <Filter size={15} /> Filtros
              {contadorFiltros > 0 && (
                <span style={{ background: '#6C4FBF', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 2 }}>
                  {contadorFiltros}
                </span>
              )}
            </button>
            <button style={S.btn('#E0D9F5', '#6C4FBF')} onClick={() => setMostrarAyuda(true)}>
              <HelpCircle size={15} /> Ayuda
            </button>
            <WithPermission requiredPermissions={["CREAR_ACTIVIDADES"]}>
              <button style={S.btn('#6C4FBF')} onClick={() => setMostrarModalCrear(true)}>
                <Plus size={15} /> Nueva Actividad
              </button>
            </WithPermission>
          </div>
        </div>

        <AnimatePresence>
          {mostrarFiltros && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', background: '#FAFAFA', borderRadius: 12, border: '1px solid #E0D9F5', marginTop: 4, padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  {
                    label: 'Estado', val: filtroCategoria, set: setFiltroCategoria,
                    opts: [['todas', 'Todos'], ['HOY', 'Hoy'], ['PROXIMA', 'Próximas'], ['FUTURA', 'Futuras'], ['FINALIZADA', 'Finalizadas']],
                  },
                  {
                    label: 'Período', val: filtroPeriodo, set: setFiltroPeriodo,
                    opts: [['todos', 'Todas las fechas'], ['semana', 'Esta semana'], ['mes', 'Este mes']],
                  },
                  {
                    label: 'Lugar', val: filtroLugar, set: setFiltroLugar,
                    opts: [['', 'Todos los lugares'], ...lugaresUnicos.map(l => [l, l])],
                  },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: '.75rem', fontWeight: 700, color: '#7A6FA0', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <select value={f.val} onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #E0D9F5', borderRadius: 8, fontFamily: 'inherit', fontSize: '.88rem', outline: 'none', background: '#fff' }}>
                      {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  {hayFiltrosActivos && (
                    <button onClick={() => { setFiltroLugar(''); setFiltroPeriodo('todos'); setFiltroCategoria('todas'); }}
                      style={{ width: '100%', padding: '8px 12px', border: '2px dashed #C4B5E8', borderRadius: 8, background: 'none', color: '#6C4FBF', fontWeight: 700, cursor: 'pointer', fontSize: '.85rem' }}>
                      × Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
              {hayFiltrosActivos && (
                <p style={{ marginTop: 10, fontSize: '.82rem', color: '#7A6FA0' }}>
                  Mostrando {actividadesFiltradas.length} de {actividades.length} actividades
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="act-contenido">
        {actividades.length === 0 ? (
          <motion.div className="act-zero" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="act-zero__icon"><Calendar size={52} color="#C4B5E8" /></div>
            <h3>No hay actividades aún</h3>
            <p>Crea tu primera actividad para comenzar a organizarte.</p>
            <WithPermission requiredPermissions={["CREAR_ACTIVIDADES"]}>
              <button style={{ ...S.btn('#6C4FBF'), marginTop: 8 }} onClick={() => setMostrarModalCrear(true)}>
                <Plus size={16} /> Crear primera actividad
              </button>
            </WithPermission>
          </motion.div>
        ) : actividadesFiltradas.length === 0 ? (
          <motion.div className="act-zero" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="act-zero__icon"><Search size={46} color="#C4B5E8" /></div>
            <h3>Sin resultados</h3>
            <p>No hay actividades que coincidan con los filtros.</p>
            <button style={{ ...S.btn('#E0D9F5', '#6C4FBF'), marginTop: 8 }}
              onClick={() => { setBusqueda(''); setFiltroLugar(''); setFiltroPeriodo('todos'); setFiltroCategoria('todas'); }}>
              × Limpiar búsqueda
            </button>
          </motion.div>
        ) : (
          <>
            {renderGrupo('HOY')}
            {renderGrupo('PROXIMA')}
            {renderGrupo('FUTURA')}
            {renderGrupo('FINALIZADA')}
          </>
        )}
      </div>

      {mostrarModalCrear && (
        <ModalCrearActividad
          onClose={() => { setMostrarModalCrear(false); setPreselectedDate(null); }}
          onCreate={handleCrearActividad}
          fechaInicial={preselectedDate}
        />
      )}
      {actividadSeleccionada && (
        <ModalDetalleActividad
          actividad={actividadSeleccionada}
          onClose={() => setActividadSeleccionada(null)}
          onUpdate={handleEditarActividad}
          onDelete={handleEliminarActividad}
        />
      )}
      {showConfirm && (
        <ConfirmDialog
          message={`¿Eliminar la actividad "${actividadAEliminar?.nombre}"?`}
          onConfirm={confirmarEliminacion}
          onCancel={() => { setShowConfirm(false); setActividadAEliminar(null); }}
          visible={showConfirm}
        />
      )}

      {mostrarAyuda && (
        <div className="bienes-modal-overlay">
          <div className="bienes-modal sm">
            <div className="bienes-modal-header">
              <h3 className="bienes-modal-title"><Calendar size={20} /> Ayuda – Actividades</h3>
              <button className="bienes-modal-close" onClick={() => setMostrarAyuda(false)}>✕</button>
            </div>
            <div className="bienes-modal-body">
              <div className="bienes-help-section">
                <div className="bienes-help-title">Funcionalidades</div>
                <ul className="bienes-help-list">
                  <li><strong>Búsqueda libre:</strong> Por nombre, lugar o descripción.</li>
                  <li><strong>Estado:</strong> Filtra por Hoy, Próximas, Futuras o Finalizadas.</li>
                  <li><strong>Período:</strong> Esta semana (7 días) o este mes.</li>
                  <li><strong>Lugar:</strong> Filtra por lugar específico.</li>
                  <li><strong>Conflictos:</strong> Avisa si hay otra actividad en el mismo lugar dentro de ±2 horas.</li>
                  <li><strong>Zona horaria:</strong> Todas las fechas en hora Honduras (GMT-6).</li>
                </ul>
              </div>
              <div className="bienes-help-section">
                <div className="bienes-help-title">Estados temporales</div>
                <div className="bienes-estados-grid">
                  {[['HOY', 'Actividades del día actual'], ['PRÓXIMA', 'Dentro de los próximos 7 días'], ['FUTURA', 'Más de 7 días adelante'], ['FINALIZADA', 'Fecha ya pasada']].map(([l, d]) => (
                    <div key={l} className="bienes-estado-item"><strong>{l}:</strong> {d}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bienes-modal-footer">
              <button className="bienes-btn bienes-btn-primary" onClick={() => setMostrarAyuda(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actividades;