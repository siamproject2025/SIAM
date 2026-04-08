// ============================================================
// CalendarioActividades.jsx
//
// CALENDARIO DE EVENTOS INTERACTIVO v2.0
// ============================================================
// Funcionalidades:
// 1. Selector de mes (dropdown personalizado)
// 2. Selector de año (input numérico editable)
// 3. Toggle Vista Mes/Semana/Día/Año + Vista Lista
// 4. Vista Año (12 mini-calendarios)
// 5. Sistema de 5 colores para eventos + filtros
// 6. Navegación con ← → (adaptable a cada vista)
// 7. Navegación por teclado (ArrowLeft, ArrowRight, H, T)
// 8. Soporte touch/swipe en móvil
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

// =========================
// CONSTANTES DE COLORES
// =========================
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

// =========================
// FUNCIONES AUXILIARES
// =========================

// Obtener color aleatorio para eventos sin color asignado
const getColorPorDefecto = (nombre) => {
  const coloresArr = Object.keys(COLORES_EVENTO);
  const code = nombre.charCodeAt(0) || 0;
  return coloresArr[code % coloresArr.length];
};

// Detectar conflicto de lugar ±2h
const detectarConflicto = (actividades, lugar, fechaISO, excludeId = null) => {
  if (!lugar || !fechaISO) return null;
  const fechaNueva = new Date(fechaISO).getTime();
  const DOS_HORAS  = 2 * 60 * 60 * 1000;
  return actividades.find(a => {
    if (a._id === excludeId) return false;
    if (!a.lugar || !a.fecha) return false;
    if (a.lugar.trim().toLowerCase() !== lugar.trim().toLowerCase()) return false;
    return Math.abs(new Date(a.fecha).getTime() - fechaNueva) < DOS_HORAS;
  }) || null;
};

// Obtener número de días en un mes
const getDiasEnMes = (year, month) => new Date(year, month + 1, 0).getDate();

// Obtener primer día del mes (0=domingo)
const getPrimerDiaDelMes = (year, month) => new Date(year, month, 1).getDay();

// Obtener array de todas las fechas de un mes en formato YYYY-MM-DD
const getDiasDelMes = (year, month) => {
  const dias = [];
  const cantDias = getDiasEnMes(year, month);
  for (let i = 1; i <= cantDias; i++) {
    const d = new Date(year, month, i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias;
};

const CalendarioActividades = forwardRef((props, ref) => {
  // ===== ESTADO PRINCIPAL =====
  const [eventosRaw, setEventosRaw] = useState([]);
  const [proximosEventos, setProximosEventos] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null });
  const [modal, setModal] = useState({ visible: false, content: null });
  const [modalCrear, setModalCrear] = useState({ visible: false, fechaInicial: null });

  // ===== ESTADO DE NAVEGACIÓN =====
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('mes'); // 'mes'|'semana'|'dia'|'ano'|'lista'

  // ===== ESTADO DE UI =====
  const [mesDropdownOpen, setMesDropdownOpen] = useState(false);
  const [anoEditando, setAnoEditando] = useState(false);
  const [anoInputValue, setAnoInputValue] = useState(currentYear.toString());
  const [coloresFiltrados, setColoresFiltrados] = useState(Object.keys(COLORES_EVENTO).reduce((a, k) => ({ ...a, [k]: true }), {}));
  const [busquedaLista, setBusquedaLista] = useState('');
  const [usuarioUID, setUsuarioUID] = useState(null);

  // ===== REFS =====
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const touchStartRef = useRef(null);

  // ===== CARGAR USUARIO UID =====
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUsuarioUID(user.uid);
    }
  }, []);

  // =====  CARGAR ACTIVIDADES =====
  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          usuario: user.uid
        }
      });
      const actividades = res.data || [];
      
      // Normalizar datos con colores
      const actividadesNormalizadas = actividades.map(a => ({
        ...a,
        color: a.color || getColorPorDefecto(a.nombre)
      }));
      
      setEventosRaw(actividadesNormalizadas);
      actualizarProximosEventos(actividadesNormalizadas);
    } catch (err) {
      console.error("Error al cargar actividades:", err);
    }
  };

  const actualizarProximosEventos = (todos) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const futuros = todos.filter(e => new Date(e.fecha || '2000-01-01') >= hoy);
    futuros.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    setProximosEventos(futuros.slice(0, 10));
  };

  // ===== HANDLERS DE NAVEGACIÓN =====
  const irAHoy = () => {
    const hoy = new Date();
    setCurrentYear(hoy.getFullYear());
    setCurrentMonth(hoy.getMonth());
    setCurrentDate(new Date(hoy));
    setCurrentView('mes');
  };

  const navegarAnterior = () => {
    switch (currentView) {
      case 'dia':
        setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
        break;
      case 'semana':
        setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'mes':
        if (currentMonth === 0) {
          setCurrentMonth(11);
          setCurrentYear(currentYear - 1);
        } else {
          setCurrentMonth(currentMonth - 1);
        }
        break;
      case 'ano':
        setCurrentYear(currentYear - 1);
        break;
      default:
        break;
    }
  };

  const navegarSiguiente = () => {
    switch (currentView) {
      case 'dia':
        setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        break;
      case 'semana':
        setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
        break;
      case 'mes':
        if (currentMonth === 11) {
          setCurrentMonth(0);
          setCurrentYear(currentYear + 1);
        } else {
          setCurrentMonth(currentMonth + 1);
        }
        break;
      case 'ano':
        setCurrentYear(currentYear + 1);
        break;
      default:
        break;
    }
  };

  // ===== HANDLERS DE SELECTOR DE MES =====
  const handleSeleccionarMes = (mes) => {
    setCurrentMonth(mes);
    setMesDropdownOpen(false);
  };

  // ===== HANDLERS DE SELECTOR DE AÑO =====
  const handleConfirmarAno = () => {
    const nuevoAno = parseInt(anoInputValue, 10);
    if (!isNaN(nuevoAno) && nuevoAno >= 1900 && nuevoAno <= 2100) {
      setCurrentYear(nuevoAno);
      setAnoEditando(false);
    }
  };

  // Cerrar menú de mes al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMesDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== NAVEGACIÓN POR TECLADO =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modal.visible || modalCrear.visible || anoEditando) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navegarAnterior();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navegarSiguiente();
      } else if (e.key === 'h' || e.key === 'H' || e.key === 't' || e.key === 'T') {
        e.preventDefault();
        irAHoy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal.visible, modalCrear.visible, anoEditando]);

  // ===== NAVEGACIÓN TOUCH/SWIPE =====
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e) => {
      if (!touchStartRef.current) return;
      const touchEnd = e.changedTouches[0].clientX;
      const diff = touchStartRef.current - touchEnd;
      const THRESHOLD = 50;
      if (diff > THRESHOLD) {
        navegarSiguiente();
      } else if (diff < -THRESHOLD) {
        navegarAnterior();
      }
      touchStartRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView, currentMonth, currentYear, currentDate]);

  // Cargar actividades al montar
  useImperativeHandle(ref, () => ({ cargarActividades }));
  useEffect(() => {
    cargarActividades();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // ===== HANDLERS DE EVENTOS =====
  const handleEventoClick = (evento) => {
    const fechaFmt = new Date(evento.fecha).toLocaleString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    setModal({
      visible: true,
      content: evento,
      tipo: 'editar'
    });
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  const cerrarModal = () => setModal({ visible: false, content: null, tipo: null });

  const handleEventoMouseEnter = (info, evento) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rect = info.getBoundingClientRect();
    const fechaFmt = new Date(evento.fecha).toLocaleString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    timeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: true,
        x: rect.left + (rect.width / 2),
        y: rect.bottom + 15,
        content: { titulo: evento.nombre, fecha: fechaFmt, lugar: evento.lugar, descripcion: evento.descripcion, color: evento.color }
      });
    }, 300);
  };

  const handleEventoMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setTooltip({ visible: false, x: 0, y: 0, content: null }), 100);
  };

  const handleDateClick = (fechaISO) => {
    const fecha = fechaISO + 'T08:00';
    setModalCrear({ visible: true, fechaInicial: fecha });
  };

  // ===== VALIDACIÓN DE CONFLICTOS (±2 horas) =====
  const validarConflicto = (lugar, fechaISO, excludeId = null) => {
    if (!lugar || !fechaISO) return null;
    const fechaNueva = new Date(fechaISO).getTime();
    const DOS_HORAS = 2 * 60 * 60 * 1000;
    
    return eventosRaw.find(a => {
      if (a._id === excludeId) return false;
      if (!a.lugar || !a.fecha) return false;
      if (a.lugar.trim().toLowerCase() !== lugar.trim().toLowerCase()) return false;
      return Math.abs(new Date(a.fecha).getTime() - fechaNueva) < DOS_HORAS;
    }) || null;
  };

  // ===== CREAR ACTIVIDAD =====
  const handleCrearDesdeCalendario = async (nuevaActividad) => {
    const { nombre, fecha, lugar, descripcion, color } = nuevaActividad;
    
    if (!nombre?.trim() || !fecha || !lugar?.trim() || !descripcion?.trim()) {
      alert('⚠️ Por favor completa todos los campos requeridos.');
      return;
    }

    // Validar conflicto antes de guardar
    const conflicto = validarConflicto(lugar, fecha);
    if (conflicto) {
      const ok = window.confirm(
        `⚠️ CONFLICTO DETECTADO\n\n"${conflicto.nombre}" ya está en "${conflicto.lugar}" 
        cerca de ese horario.\n\n¿Deseas guardar de todas formas?`
      );
      if (!ok) return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const payload = {
        nombre: nombre.trim(),
        fecha,
        lugar: lugar.trim(),
        descripcion: descripcion.trim(),
        color: color || 'morado',
        usuario: user.uid
      };

      const res = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          usuario: user.uid
        }
      });

      if (res.status === 201 || res.status === 200) {
        setModalCrear({ visible: false, fechaInicial: null });
        await cargarActividades();
      }
    } catch (err) {
      console.error('Error al crear actividad:', err);
      alert(`❌ Error al guardar: ${err.response?.data?.message || err.message}`);
    }
  };

  // ===== ACTUALIZAR ACTIVIDAD =====
  const handleActualizarActividad = async (datosActualizados) => {
    const { _id, nombre, fecha, lugar, descripcion, color } = datosActualizados;

    if (!nombre?.trim() || !fecha || !lugar?.trim() || !descripcion?.trim()) {
      alert('⚠️ Por favor completa todos los campos requeridos.');
      return;
    }

    // Validar conflicto (excluir el propio evento)
    const conflicto = validarConflicto(lugar, fecha, _id);
    if (conflicto) {
      const ok = window.confirm(
        `⚠️ CONFLICTO DETECTADO\n\n"${conflicto.nombre}" ya está en "${conflicto.lugar}" 
        cerca de ese horario.\n\n¿Deseas guardar de todas formas?`
      );
      if (!ok) return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const payload = {
        nombre: nombre.trim(),
        fecha,
        lugar: lugar.trim(),
        descripcion: descripcion.trim(),
        color: color || 'morado'
      };

      const res = await axios.put(`${API_URL}/${_id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          usuario: user.uid
        }
      });

      if (res.status === 200) {
        cerrarModal();
        await cargarActividades();
      }
    } catch (err) {
      console.error('Error al actualizar actividad:', err);
      alert(`❌ Error al actualizar: ${err.response?.data?.message || err.message}`);
    }
  };

  // ===== ELIMINAR ACTIVIDAD =====
  const handleEliminarActividad = async (eventoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const res = await axios.delete(`${API_URL}/${eventoId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          usuario: user.uid
        }
      });

      if (res.status === 200) {
        cerrarModal();
        await cargarActividades();
      }
    } catch (err) {
      console.error('Error al eliminar actividad:', err);
      alert(`❌ Error al eliminar: ${err.response?.data?.message || err.message}`);
    }
  };

  // ===== FUNCIONES DE RENDERIZACIÓN =====

  // Renderizar vista MES
  const renderVistaMonth = () => {
    const diasDelMes = getDiasDelMes(currentYear, currentMonth);
    const primerDia = getPrimerDiaDelMes(currentYear, currentMonth);
    
    const eventosPorFecha = {};
    eventosRaw.forEach(e => {
      const fecha = e.fecha?.split('T')[0];
      if (fecha && diasDelMes.includes(fecha)) {
        if (!eventosPorFecha[fecha]) eventosPorFecha[fecha] = [];
        if (coloresFiltrados[e.color]) {
          eventosPorFecha[fecha].push(e);
        }
      }
    });

    const celdas = [];
    // Espacios vacíos al inicio
    for (let i = 0; i < primerDia; i++) {
      celdas.push(<div key={`empty-${i}`} className="calendario-celda vacia"></div>);
    }
    // Días del mes
    diasDelMes.forEach((fechaISO, idx) => {
      const dia = idx + 1;
      const eventos = eventosPorFecha[fechaISO] || [];
      const esHoy = fechaISO === new Date().toISOString().split('T')[0];
      celdas.push(
        <div
          key={fechaISO}
          className={`calendario-celda ${esHoy ? 'hoy' : ''}`}
          onClick={() => handleDateClick(fechaISO)}
          style={{ borderRadius: 8, border: esHoy ? '2px solid #6C4FBF' : 'none' }}
        >
          <div className="calendario-dia-numero">{dia}</div>
          <div className="calendario-eventos">
            {eventos.slice(0, 2).map((e, i) => (
              <div
                key={e._id}
                className="calendario-evento"
                style={{
                  backgroundColor: COLORES_EVENTO[e.color].claro,
                  borderLeftColor: COLORES_EVENTO[e.color].hex,
                  color: COLORES_EVENTO[e.color].oscuro
                }}
                onMouseEnter={(ev) => handleEventoMouseEnter(ev.currentTarget, e)}
                onMouseLeave={handleEventoMouseLeave}
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleEventoClick(e);
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{e.nombre.substring(0, 12)}</span>
              </div>
            ))}
            {eventos.length > 2 && (
              <div style={{ fontSize: '0.65rem', color: '#999', padding: '2px 4px' }}>
                +{eventos.length - 2} más
              </div>
            )}
          </div>
        </div>
      );
    });

    return (
      <div className="calendario-grid-mes">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="calendario-header-dia">{d}</div>
        ))}
        {celdas}
      </div>
    );
  };

  // Renderizar vista LISTA
  const renderVistaLista = () => {
    const diasDelMes = getDiasDelMes(currentYear, currentMonth);
    
    let eventosDelMes = eventosRaw.filter(e => {
      const fecha = e.fecha?.split('T')[0];
      return fecha && diasDelMes.includes(fecha) && coloresFiltrados[e.color];
    });

    eventosDelMes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    if (busquedaLista) {
      eventosDelMes = eventosDelMes.filter(e =>
        e.nombre.toLowerCase().includes(busquedaLista.toLowerCase()) ||
        e.lugar.toLowerCase().includes(busquedaLista.toLowerCase()) ||
        e.descripcion.toLowerCase().includes(busquedaLista.toLowerCase())
      );
    }

    // Agrupar por fecha
    const eventosAgrupados = {};
    eventosDelMes.forEach(e => {
      const fecha = e.fecha?.split('T')[0];
      if (!eventosAgrupados[fecha]) {
        eventosAgrupados[fecha] = [];
      }
      eventosAgrupados[fecha].push(e);
    });

    return (
      <div style={{ padding: '20px', maxWidth: '100%' }}>
        <div style={{
          marginBottom: 20, display: 'flex', gap: 10,
          background: '#f0f0f0', padding: 10, borderRadius: 8
        }}>
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={busquedaLista}
            onChange={(e) => setBusquedaLista(e.target.value)}
            style={{
              flex: 1, padding: '8px 12px', border: '1px solid #ddd',
              borderRadius: 6, fontSize: '0.9rem'
            }}
          />
        </div>

        {Object.keys(eventosAgrupados).length > 0 ? (
          Object.entries(eventosAgrupados).map(([fecha, eventos]) => (
            <div key={fecha} style={{ marginBottom: 30 }}>
              <h4 style={{ color: '#2b3674', fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>
                {new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
              {eventos.map(e => (
                <div
                  key={e._id}
                  className="evento-card"
                  style={{
                    borderLeftColor: COLORES_EVENTO[e.color].hex,
                    marginBottom: 10,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEventoClick(e)}
                  onMouseEnter={(ev) => handleEventoMouseEnter(ev.currentTarget, e)}
                  onMouseLeave={handleEventoMouseLeave}
                >
                  <h4 style={{ margin: '0 0 8px 0', color: '#2b3674' }}>{e.nombre}</h4>
                  <div className="detalle-item">
                    <Clock size={14} style={{ color: COLORES_EVENTO[e.color].hex }} />
                    <span>{new Date(e.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="detalle-item">
                    <MapPin size={14} style={{ color: COLORES_EVENTO[e.color].hex }} />
                    <span>{e.lugar}</span>
                  </div>
                  <div className="detalle-item">
                    <FileText size={14} style={{ color: COLORES_EVENTO[e.color].hex }} />
                    <span>{e.descripcion.substring(0, 50)}{e.descripcion.length > 50 ? '...' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>
            <Inbox size={32} style={{ margin: '0 auto', marginBottom: 10 }} />
            <p>No hay eventos que coincidan con tu búsqueda</p>
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista AÑO (12 mini-calendarios)
  const renderVistaYear = () => {
    const eventosAgrupados = {};
    eventosRaw.forEach(e => {
      const fecha = e.fecha?.split('T')[0];
      if (fecha && coloresFiltrados[e.color]) {
        const [y, m, d] = fecha.split('-');
        if (parseInt(y) === currentYear) {
          if (!eventosAgrupados[fecha]) eventosAgrupados[fecha] = [];
          eventosAgrupados[fecha].push(e);
        }
      }
    });

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        padding: 20
      }}>
        {MESES_NOMBRES.map((mes, mesIdx) => {
          const primerDia = getPrimerDiaDelMes(currentYear, mesIdx);
          const diasEnMes = getDiasEnMes(currentYear, mesIdx);
          const celdas = [];

          // Espacios vacíos
          for (let i = 0; i < primerDia; i++) {
            celdas.push(<div key={`empty-${i}`} style={{ aspectRatio: 1 }}></div>);
          }

          // Días
          for (let dia = 1; dia <= diasEnMes; dia++) {
            const fecha = `${currentYear}-${String(mesIdx + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const hoyStr = new Date().toISOString().split('T')[0];
            const esHoy = fecha === hoyStr;
            const eventos = eventosAgrupados[fecha] || [];

            celdas.push(
              <div
                key={fecha}
                onClick={() => {
                  setCurrentMonth(mesIdx);
                  setCurrentView('mes');
                }}
                style={{
                  aspectRatio: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  background: esHoy ? '#6C4FBF' : '#f5f5f5',
                  color: esHoy ? 'white' : '#2b3674',
                  fontWeight: esHoy ? 700 : 600,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (!esHoy) e.currentTarget.style.background = '#e0dcf5'; }}
                onMouseLeave={(e) => { if (!esHoy) e.currentTarget.style.background = '#f5f5f5'; }}
              >
                <span>{dia}</span>
                {eventos.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 4,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: COLORES_EVENTO[eventos[0].color].hex
                  }}></div>
                )}
              </div>
            );
          }

          return (
            <div
              key={mes}
              style={{
                background: 'white',
                padding: 15,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#2b3674', fontWeight: 700 }}>
                {mes} {currentYear}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4
              }}>
                {DIAS_SEMANA.map(d => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#999',
                      padding: '4px 0'
                    }}
                  >
                    {d}
                  </div>
                ))}
                {celdas}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar vista SEMANA
  const renderVistaSemana = () => {
    // Obtener el primer día de la semana (lunes)
    const fecha = new Date(currentDate);
    const diaSemana = fecha.getDay();
    const diferencia = fecha.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    const inicio = new Date(fecha.setDate(diferencia));

    const diasSemana = [];
    const eventosAgrupados = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      const fechaISO = d.toISOString().split('T')[0];
      diasSemana.push(d);

      if (!eventosAgrupados[fechaISO]) {
        eventosAgrupados[fechaISO] = [];
      }
    }

    eventosRaw.forEach(e => {
      const fecha = e.fecha?.split('T')[0];
      if (fecha && coloresFiltrados[e.color] && eventosAgrupados[fecha]) {
        eventosAgrupados[fecha].push(e);
      }
    });

    diasSemana.forEach(d => {
      const fechaISO = d.toISOString().split('T')[0];
      eventosAgrupados[fechaISO].sort((a, b) => {
        const horaA = parseInt(a.fecha.split('T')[1]);
        const horaB = parseInt(b.fecha.split('T')[1]);
        return horaA - horaB;
      });
    });

    const hoyStr = new Date().toISOString().split('T')[0];

    return (
      <div style={{ padding: 20 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 12
        }}>
          {diasSemana.map((d, idx) => {
            const fechaISO = d.toISOString().split('T')[0];
            const esHoy = fechaISO === hoyStr;
            const eventos = eventosAgrupados[fechaISO] || [];

            return (
              <div
                key={fechaISO}
                style={{
                  background: esHoy ? '#f0f0ff' : '#f8f9fe',
                  border: esHoy ? '2px solid #6C4FBF' : '1px solid #e0e0e0',
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 400,
                  overflow: 'auto'
                }}
              >
                <div style={{
                  textAlign: 'center',
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', fontWeight: 600 }}>
                    {DIAS_SEMANA[d.getDay()]}
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: esHoy ? '#6C4FBF' : '#2b3674'
                  }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>
                    {d.toLocaleDateString('es-ES', { month: 'short' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {eventos.length > 0 ? (
                    eventos.map(e => (
                      <div
                        key={e._id}
                        style={{
                          background: COLORES_EVENTO[e.color].claro,
                          borderLeft: `4px solid ${COLORES_EVENTO[e.color].hex}`,
                          padding: 8,
                          borderRadius: 6,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(ev) => {
                          ev.currentTarget.style.transform = 'translateY(-2px)';
                          ev.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(ev) => {
                          ev.currentTarget.style.transform = 'translateY(0)';
                          ev.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => handleEventoClick(e)}
                      >
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: COLORES_EVENTO[e.color].oscuro, marginBottom: 4 }}>
                          {e.nombre.substring(0, 20)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: COLORES_EVENTO[e.color].oscuro }}>
                          {new Date(e.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 2 }}>
                          {e.lugar.substring(0, 15)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999', fontSize: '0.85rem' }}>
                      Sin eventos
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar vista DÍA
  const renderVistaDia = () => {
    const fechaISO = currentDate.toISOString().split('T')[0];
    const eventos = eventosRaw.filter(e => {
      const fecha = e.fecha?.split('T')[0];
      return fecha === fechaISO && coloresFiltrados[e.color];
    });

    eventos.sort((a, b) => {
      const horaA = parseInt(a.fecha.split('T')[1]);
      const horaB = parseInt(b.fecha.split('T')[1]);
      return horaA - horaB;
    });

    const hoyStr = new Date().toISOString().split('T')[0];
    const esHoy = fechaISO === hoyStr;

    return (
      <div style={{ padding: 30, maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          background: esHoy ? '#f0f0ff' : '#f8f9fe',
          border: esHoy ? '2px solid #6C4FBF' : '1px solid #e0e0e0',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#999', fontWeight: 600, marginBottom: 8 }}>
            {DIAS_SEMANA[currentDate.getDay()]}, {currentDate.toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <button
            onClick={() => handleDateClick(fechaISO)}
            style={{
              background: '#6C4FBF',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginTop: 10
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4B3090'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6C4FBF'}
          >
            <Plus size={16} style={{ marginRight: 6, display: 'inline' }} /> Agregar evento
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {eventos.length > 0 ? (
            eventos.map((e, idx) => (
              <div
                key={e._id}
                style={{
                  background: COLORES_EVENTO[e.color].claro,
                  borderLeft: `4px solid ${COLORES_EVENTO[e.color].hex}`,
                  padding: 15,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.transform = 'translateX(4px)';
                  ev.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.transform = 'translateX(0)';
                  ev.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => handleEventoClick(e)}
              >
                <h3 style={{ margin: '0 0 10px 0', color: COLORES_EVENTO[e.color].oscuro, fontSize: '1.1rem', fontWeight: 700 }}>
                  {e.nombre}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: COLORES_EVENTO[e.color].oscuro }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Clock size={16} />
                    <span>{new Date(e.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <MapPin size={16} />
                    <span>{e.lugar}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8 }}>
                    <FileText size={16} style={{ marginTop: 2 }} />
                    <div style={{ lineHeight: 1.5 }}>{e.descripcion}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <Inbox size={40} style={{ margin: '0 auto', marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: '1rem', fontWeight: 500 }}>No hay eventos para este día</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  useEffect(() => {
    const handleEsc = e => {
      if (e.key === 'Escape' && (modal.visible || modalCrear.visible)) {
        if (modal.visible) cerrarModal();
        if (modalCrear.visible) setModalCrear({ visible: false, fechaInicial: null });
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modal.visible, modalCrear.visible]);

  // ===== RENDER =====
  return (
    <div style={{ background: '#f8f9fe', minHeight: '100vh', padding: 20 }}>
      {/* BARRA DE NAVEGACIÓN PERSONALIZADA */}
      <div style={{
        background: 'white',
        padding: '15px 20px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        flexWrap: 'wrap'
      }}>
        {/* Botones de navegación anterior/siguiente */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={navegarAnterior}
            style={{
              background: '#6C4FBF',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4B3090'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6C4FBF'}
            title="Anterior (LeftArrow)"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={navegarSiguiente}
            style={{
              background: '#6C4FBF',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4B3090'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6C4FBF'}
            title="Siguiente (RightArrow)"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={irAHoy}
            style={{
              background: '#f0f0f0',
              color: '#6C4FBF',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e0dcf5'; e.currentTarget.style.color = '#4B3090'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#6C4FBF'; }}
            title="Hoy (H o T)"
          >
            Hoy
          </button>
        </div>

        {/* Separador */}
        <div style={{ width: 1, height: 28, background: '#e0e0e0' }}></div>

        {/* Selector de mes (dropdown) */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMesDropdownOpen(!mesDropdownOpen)}
            style={{
              background: 'white',
              color: '#2b3674',
              border: '1.5px solid #E0D9F5',
              borderRadius: 6,
              padding: '8px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8f7ff'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            {MESES_NOMBRES[currentMonth]}
          </button>
          {mesDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'white',
              border: '1.5px solid #E0D9F5',
              borderRadius: 8,
              marginTop: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              zIndex: 1000,
              minWidth: 150
            }}>
              {MESES_NOMBRES.map((mes, idx) => (
                <button
                  key={mes}
                  onClick={() => handleSeleccionarMes(idx)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    background: idx === currentMonth ? '#f0f0f0' : 'transparent',
                    color: idx === currentMonth ? '#6C4FBF' : '#666',
                    fontWeight: idx === currentMonth ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s'
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
                  width: 70,
                  padding: '8px 6px',
                  border: '1.5px solid #E0D9F5',
                  borderRadius: 6,
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
                autoFocus
              />
              <button
                onClick={handleConfirmarAno}
                style={{
                  background: '#6C4FBF',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✓
              </button>
              <button
                onClick={() => {
                  setAnoEditando(false);
                  setAnoInputValue(currentYear.toString());
                }}
                style={{
                  background: '#f0f0f0',
                  color: '#999',
                  border: 'none',
                  borderRadius: 4,
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => setAnoEditando(true)}
              style={{
                background: 'white',
                color: '#2b3674',
                border: '1.5px solid #E0D9F5',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                minWidth: 60
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f7ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              {currentYear}
            </button>
          )}
        </div>

        {/* Separador */}
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
                border: 'none',
                borderRadius: 6,
                padding: '8px 10px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: currentView === view.id ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s'
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

        {/* Separador */}
        <div style={{ width: 1, height: 28, background: '#e0e0e0' }}></div>

        {/* Filtros de colores */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 500 }}>Filtros:</span>
          {Object.entries(COLORES_EVENTO).map(([key, color]) => (
            <button
              key={key}
              onClick={() => setColoresFiltrados({ ...coloresFiltrados, [key]: !coloresFiltrados[key] })}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color.hex,
                border: coloresFiltrados[key] ? '3px solid #333' : '2px solid #ddd',
                cursor: 'pointer',
                opacity: coloresFiltrados[key] ? 1 : 0.4,
                transition: 'all 0.2s'
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

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Renderizar según vista */}
        {currentView === 'mes' && renderVistaMonth()}
        {currentView === 'semana' && renderVistaSemana()}
        {currentView === 'dia' && renderVistaDia()}
        {currentView === 'lista' && renderVistaLista()}
        {currentView === 'ano' && renderVistaYear()}

        {/* Próximos eventos - sidebar */}
        { /*{currentView === 'mes' && (
          <div style={{
            position: 'fixed',
            right: 20,
            top: 150,
            width: 300,
            maxHeight: '70vh',
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            overflowY: 'auto',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2b3674', marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} /> Próximos
            </h3>
           {proximosEventos.length > 0 ? (
              proximosEventos.slice(0, 5).map(evento => (
                <div
                  key={evento._id}
                  className="evento-card"
                  style={{
                    borderLeftColor: COLORES_EVENTO[evento.color].hex,
                    marginBottom: 10,
                    cursor: 'pointer',
                    padding: 10,
                    fontSize: '0.85rem'
                  }}
                  onClick={() => handleEventoClick(evento)}
                >
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#2b3674' }}>{evento.nombre.substring(0, 25)}</h4>
                  <div className="detalle-item" style={{ fontSize: '0.75rem' }}>
                    <span>{new Date(evento.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))*
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: '0.9rem' }}>
                <Inbox size={20} style={{ margin: '0 auto', marginBottom: 8 }} />
                Sin eventos próximos
              </div>
            )}
          </div>
        )}*/}
      </div>

      {/* TOOLTIP */}
      {tooltip.content && (
        <div
          ref={tooltipRef}
          className={`event-tooltip ${tooltip.visible ? 'visible' : ''}`}
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%)',
            position: 'fixed',
            zIndex: 9999
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6, color: '#2b3674' }}>
            {tooltip.content.titulo}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.4 }}>
            <div>{tooltip.content.fecha}</div>
            <div>{tooltip.content.lugar}</div>
            <div style={{ color: '#999', marginTop: 4 }}>{tooltip.content.descripcion.substring(0, 50)}</div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES - MODAL EDITABLE */}
      {modal.visible && modal.content && modal.tipo === 'editar' && (
        <ModalDetalleActividad
          actividad={modal.content}
          onClose={cerrarModal}
          onUpdate={handleActualizarActividad}
          onDelete={handleEliminarActividad}
        />
      )}

      {/* MODAL CREAR ACTIVIDAD */}
      {modalCrear.visible && (
        <ModalCrearActividad
          onClose={() => setModalCrear({ visible: false, fechaInicial: null })}
          onCreate={handleCrearDesdeCalendario}
          fechaInicial={modalCrear.fechaInicial}
        />
      )}
    </div>
  );
});

CalendarioActividades.displayName = 'CalendarioActividades';
export default CalendarioActividades;
