// ============================================================
// CalendarioActividades.jsx - VERSIÓN COMPLETA
// ✅ Vista Semana: grid de 7 días × 24 horas con eventos posicionados
// ✅ Vista Día: timeline de 24 horas con eventos a escala real
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
import WithPermission from "../Permisos/WithPermission";

const API_URL = process.env.REACT_APP_API_URL + "/api/actividades";

const COLORES_EVENTO = {
  azul:     { nombre: 'Azul',     hex: '#3B82F6', claro: '#DBEAFE', oscuro: '#1E40AF' },
  verde:    { nombre: 'Verde',    hex: '#22C55E', claro: '#DCFCE7', oscuro: '#166534' },
  amarillo: { nombre: 'Amarillo', hex: '#EAB308', claro: '#FEF9C3', oscuro: '#854D0E' },
  morado:   { nombre: 'Morado',   hex: '#A855F7', claro: '#F3E8FF', oscuro: '#6B21A8' },
  rojo:     { nombre: 'Rojo',     hex: '#EF4444', claro: '#FEE2E2', oscuro: '#991B1B' }
};

const MESES_NOMBRES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const DIAS_SEMANA       = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DIAS_SEMANA_LARGO = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const HORAS             = Array.from({ length: 24 }, (_, i) => i); // 0-23

// ── Helpers ────────────────────────────────────────────────────────
const getDiasEnMes = (y, m) => new Date(y, m + 1, 0).getDate();
const getPrimerDiaDelMes = (y, m) => new Date(y, m, 1).getDay();
const getDiasDelMes = (y, m) => {
  const dias = [];
  for (let i = 1; i <= getDiasEnMes(y, m); i++)
    dias.push(new Date(y, m, i).toISOString().split('T')[0]);
  return dias;
};
const getColorPorDefecto = (nombre) => {
  const arr = Object.keys(COLORES_EVENTO);
  return arr[(nombre?.charCodeAt(0) || 0) % arr.length];
};
const isoFecha = (d) => {
  if (!d) return '';
  // Ajustar a GMT-6 Honduras
  const fechaLocal = new Date(d);
  fechaLocal.setHours(fechaLocal.getHours() - 6);
  return fechaLocal.toISOString().split('T')[0];
};
// Devuelve el lunes de la semana que contiene la fecha
const getLunesDeSemana = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Formatea "08:00 a.m." estilo Honduras
const fmtHora = (h, m = 0) => {
  const suffix = h < 12 ? 'a.m.' : 'p.m.';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${suffix}`;
};

const fmtFechaCorta = (dateStr) => {
  try {
    return new Intl.DateTimeFormat('es-HN', {
      day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:true,
      timeZone:'America/Tegucigalpa'
    }).format(new Date(dateStr));
  } catch { return dateStr; }
};

// Altura en px por hora en las vistas de semana/día
const PX_POR_HORA = 64;
const HORA_INICIO = 6; // empezar en 6am por defecto (scroll)

// ─────────────────────────────────────────────────────────────────
const CalendarioActividades = forwardRef((props, ref) => {

  // ── Estado ─────────────────────────────────────────────────────
  const [eventosRaw,    setEventosRaw]    = useState([]);
  const [tooltip,       setTooltip]       = useState({ visible:false, x:0, y:0, content:null });
  const [modal,         setModal]         = useState({ visible:false, content:null });
  const [modalCrear,    setModalCrear]    = useState({ visible:false, fechaInicial:null });
  const [currentYear,   setCurrentYear]   = useState(new Date().getFullYear());
  const [currentMonth,  setCurrentMonth]  = useState(new Date().getMonth());
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [currentView,   setCurrentView]   = useState('mes');
  const [mesDropdownOpen, setMesDropdownOpen] = useState(false);
  const [anoEditando,   setAnoEditando]   = useState(false);
  const [anoInputValue, setAnoInputValue] = useState(String(new Date().getFullYear()));
  const [coloresFiltrados, setColoresFiltrados] = useState(
    Object.keys(COLORES_EVENTO).reduce((a,k) => ({...a,[k]:true}), {})
  );
  const [confirmacion,  setConfirmacion]  = useState({ visible:false, message:'', onConfirm:null });
  const [notification,  setNotification]  = useState({ visible:false, message:'', type:'error' });

  const dropdownRef  = useRef(null);
  const timelineRef  = useRef(null); // para scroll automático
  const semanaRef    = useRef(null);

  // ── API ────────────────────────────────────────────────────────
  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
        const token = await user.getIdToken(); //  Obtener token
          const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const normalizadas = (res.data || []).map(a => ({
        ...a, color: a.color || getColorPorDefecto(a.nombre)
      }));
      setEventosRaw(normalizadas);
    } catch (err) { console.error('Error al cargar:', err); }
  };

  useImperativeHandle(ref, () => ({ cargarActividades }));
  useEffect(() => { cargarActividades(); }, []);

  // Scroll al inicio laboral al cambiar a vista semana/día
  useEffect(() => {
    const ref = currentView === 'semana' ? semanaRef : timelineRef;
    if ((currentView === 'semana' || currentView === 'dia') && ref.current) {
      ref.current.scrollTop = HORA_INICIO * PX_POR_HORA;
    }
  }, [currentView]);

  // Click fuera del dropdown
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMesDropdownOpen(false);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);

  // ── Helpers de conflicto / notificación ────────────────────────
  const existeConflicto = (fechaNueva, idActual = null) => {
    const nueva = new Date(fechaNueva);
    return eventosRaw.some(e => {
      if (idActual && e._id === idActual) return false;
      const ex = new Date(e.fecha);
      return nueva.getFullYear() === ex.getFullYear() &&
             nueva.getMonth()    === ex.getMonth()    &&
             nueva.getDate()     === ex.getDate()     &&
             nueva.getHours()    === ex.getHours()    &&
             nueva.getMinutes()  === ex.getMinutes();
    });
  };

  const mostrarNotificacion = (message, type = 'error') =>
    setNotification({ visible:true, message, type });

  const mostrarConfirmacion = (message, onConfirm) =>
    setConfirmacion({ visible:true, message, onConfirm });

  // ── CRUD ───────────────────────────────────────────────────────
  const handleCrear = async (nueva) => {
    if (existeConflicto(nueva.fecha)) {
      mostrarNotificacion('Ya existe una actividad en esa fecha y hora'); return;
    }
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.post(API_URL, { ...nueva, usuario: user.uid }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalCrear({ visible:false, fechaInicial:null });
      cargarActividades();
      mostrarNotificacion('✓ Actividad creada', 'success');
    } catch (err) {
      mostrarNotificacion(err?.response?.data?.message || 'Error al guardar', 'error');
    }
  };

  const handleActualizar = async (datos) => {
    if (existeConflicto(datos.fecha, datos._id)) {
      mostrarNotificacion('Ya existe otra actividad en esa misma hora'); return;
    }
    try {
      const token = await auth.currentUser.getIdToken();
      const id = datos._id || datos.id;
      await axios.put(`${API_URL}/${id}`, datos, {
        headers: { Authorization: `Bearer ${token}` }
      });
      cerrarModal();
      cargarActividades();
      mostrarNotificacion('✓ Actividad actualizada', 'success');
    } catch (err) {
      mostrarNotificacion(err?.response?.data?.message || 'Error al actualizar', 'error');
      throw err;
    }
  };

  const handleEliminar = (id) => {
    mostrarConfirmacion('¿Seguro que deseas eliminar esta actividad?', async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        cerrarModal();
        cargarActividades();
        mostrarNotificacion('Actividad eliminada', 'success');
      } catch { mostrarNotificacion('Error al eliminar', 'error'); }
    });
  };

  // ── Navegación ──────────────────────────────────────────────────
  const cerrarModal = () => setModal({ visible:false, content:null });

  const irAHoy = () => {
    const h = new Date();
    setCurrentYear(h.getFullYear()); setCurrentMonth(h.getMonth());
    setCurrentDate(new Date(h));
  };

  const navegarAnterior = () => {
    if (currentView === 'mes') {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear-1); }
      else setCurrentMonth(currentMonth-1);
    } else if (currentView === 'dia') {
      const d = new Date(currentDate); d.setDate(d.getDate()-1); setCurrentDate(d);
    } else if (currentView === 'semana') {
      const d = new Date(currentDate); d.setDate(d.getDate()-7); setCurrentDate(d);
    } else if (currentView === 'ano') {
      setCurrentYear(y => y-1);
    }
  };

  const navegarSiguiente = () => {
    if (currentView === 'mes') {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear+1); }
      else setCurrentMonth(currentMonth+1);
    } else if (currentView === 'dia') {
      const d = new Date(currentDate); d.setDate(d.getDate()+1); setCurrentDate(d);
    } else if (currentView === 'semana') {
      const d = new Date(currentDate); d.setDate(d.getDate()+7); setCurrentDate(d);
    } else if (currentView === 'ano') {
      setCurrentYear(y => y+1);
    }
  };

  const handleConfirmarAno = () => {
    const n = parseInt(anoInputValue, 10);
    if (!isNaN(n) && n > 1900 && n < 2100) { setCurrentYear(n); setAnoEditando(false); }
  };

  const handleEventoClick = (e) => setModal({ visible:true, content:e });
  const handleDateClick   = (fechaISO) =>
    setModalCrear({ visible:true, fechaInicial: fechaISO + 'T08:00' });

  const handleEventoMouseEnter = (el, e) => {
    const rect = el.getBoundingClientRect();
    setTooltip({ visible:true, x: rect.left + rect.width/2, y: rect.bottom+10,
      content:{ titulo:e.nombre, fecha: fmtFechaCorta(e.fecha), lugar:e.lugar, descripcion:e.descripcion }
    });
  };
  const handleEventoMouseLeave = () => setTooltip(t => ({...t, visible:false}));

  // ── Eventos filtrados ───────────────────────────────────────────
  const eventosFiltrados = eventosRaw.filter(e => coloresFiltrados[e.color]);

  // ── Vista Mes ──────────────────────────────────────────────────
  const renderVistaMonth = () => {
    const dias = getDiasDelMes(currentYear, currentMonth);
    const primerDia = getPrimerDiaDelMes(currentYear, currentMonth);
    const celdas = [];
    for (let i = 0; i < primerDia; i++)
      celdas.push(<div key={`e-${i}`} className="calendario-celda vacia"/>);
    dias.forEach(f => {
      const evs = eventosFiltrados.filter(e => e.fecha?.split('T')[0] === f);
      const esHoy = f === isoFecha(new Date());
      celdas.push(
     
             
        <div key={f} className={`calendario-celda${esHoy?' hoy':''}`} onClick={() => handleDateClick(f)}>
          <div className="calendario-dia-numero">{f.split('-')[2]}</div>
          <div className="calendario-eventos">
            {evs.slice(0,3).map(e => {
              const c = COLORES_EVENTO[e.color];
              return (
                <div key={e._id} className="calendario-evento"
                  style={{ background:c.claro, color:c.oscuro, borderLeft:`3px solid ${c.hex}` }}
                  onClick={ex => { ex.stopPropagation(); handleEventoClick(e); }}
                  onMouseEnter={ex => handleEventoMouseEnter(ex.currentTarget, e)}
                  onMouseLeave={handleEventoMouseLeave}>
                  {e.nombre}
                </div>
              );
            })}
            {evs.length > 3 && (
              <div style={{ fontSize:'.72rem', color:'#888', padding:'1px 4px' }}>+{evs.length-3} más</div>
            )}
          </div>
        </div> 
      );
    });
    return (
      <div className="calendario-grid-mes">
        {DIAS_SEMANA.map(d => <div key={d} className="calendario-header-dia">{d}</div>)}
        {celdas}
      </div>
    );
  };

  // ── Vista Año ──────────────────────────────────────────────────
  const renderVistaYear = () => (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:20, padding:20 }}>
      {MESES_NOMBRES.map((mes, idx) => (
        <div key={mes} style={{ background:'white', padding:15, borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,.05)' }}>
          <h4 style={{ margin:'0 0 10px', color:'#2b3674' }}>{mes}</h4>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, fontSize:'.7rem' }}>
            {getDiasDelMes(currentYear, idx).map(d => {
              const hasEv = eventosFiltrados.some(e => e.fecha?.split('T')[0] === d);
              return (
                <div key={d} style={{ textAlign:'center', padding:2, cursor: hasEv?'pointer':'default',
                  background: hasEv?'#6C4FBF':'transparent', color: hasEv?'white':'#333', borderRadius:2 }}>
                  {d.split('-')[2]}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Vista Lista ────────────────────────────────────────────────
  const renderVistaLista = () => {
    const evs = eventosFiltrados.slice().sort((a,b) => new Date(a.fecha)-new Date(b.fecha));
    return (
      <div style={{ padding:20 }}>
        {evs.length === 0 && (
          <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>No hay actividades</div>
        )}
        {evs.map(e => {
          const c = COLORES_EVENTO[e.color];
          return (
            <div key={e._id} onClick={() => handleEventoClick(e)} style={{
              borderLeft:`5px solid ${c.hex}`, marginBottom:10, padding:'12px 16px',
              background:'#fff', borderRadius:8, cursor:'pointer',
              boxShadow:'0 1px 4px rgba(0,0,0,.06)', transition:'box-shadow .2s'
            }}>
              <div style={{ fontWeight:700, color:'#2b3674' }}>{e.nombre}</div>
              <div style={{ fontSize:'.8rem', color:'#666', marginTop:3 }}>
                {fmtFechaCorta(e.fecha)} · {e.lugar}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── ✅ Vista Semana ────────────────────────────────────────────
  const renderVistaSemana = () => {
    const lunes = getLunesDeSemana(currentDate);
    // Generar los 7 días (lun → dom)
    const diasSemana = Array.from({ length:7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
    const hoyISO = isoFecha(new Date());

    return (
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Cabecera: días */}
        <div style={{ display:'grid', gridTemplateColumns:'56px repeat(7,1fr)',
          borderBottom:'2px solid #e8e4f4', background:'#faf9ff', position:'sticky', top:0, zIndex:10 }}>
          <div style={{ padding:'10px 0', borderRight:'1px solid #e8e4f4' }}/>
          {diasSemana.map((d, i) => {
            const iso = isoFecha(d);
            const esHoy = iso === hoyISO;
            const evsDia = eventosFiltrados.filter(e => e.fecha?.split('T')[0] === iso);
            return (
              <div key={i} style={{ padding:'8px 6px', textAlign:'center',
                borderRight: i<6 ? '1px solid #e8e4f4' : 'none',
                background: esHoy ? '#EDE9FF' : 'transparent' }}>
                <div style={{ fontSize:'.72rem', fontWeight:600, color: esHoy?'#6C4FBF':'#888',
                  textTransform:'uppercase', letterSpacing:'.05em' }}>
                  {DIAS_SEMANA[d.getDay()]}
                </div>
                <div style={{ fontSize:'1.15rem', fontWeight:700,
                  color: esHoy?'#6C4FBF':'#2b3674', lineHeight:1.2 }}>
                  {d.getDate()}
                </div>
                {evsDia.length > 0 && (
                  <div style={{ display:'flex', justifyContent:'center', gap:2, marginTop:3 }}>
                    {evsDia.slice(0,4).map(e => (
                      <div key={e._id} style={{ width:6, height:6, borderRadius:'50%',
                        background: COLORES_EVENTO[e.color]?.hex || '#A855F7' }}/>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grid de horas */}
        <div ref={semanaRef} style={{ overflowY:'auto', maxHeight:'calc(100vh - 280px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'56px repeat(7,1fr)',
            position:'relative', minHeight: `${24 * PX_POR_HORA}px` }}>

            {/* Columna de horas */}
            <div style={{ borderRight:'1px solid #e8e4f4' }}>
              {HORAS.map(h => (
                <div key={h} style={{ height:PX_POR_HORA, display:'flex', alignItems:'flex-start',
                  justifyContent:'flex-end', paddingRight:8, paddingTop:3,
                  fontSize:'.7rem', color:'#aaa', fontWeight:500, boxSizing:'border-box',
                  borderBottom:'1px solid #f0edf8' }}>
                  {h === 0 ? '' : fmtHora(h)}
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {diasSemana.map((d, colIdx) => {
              const iso = isoFecha(d);
              const esHoy = iso === hoyISO;
              const evsDia = eventosFiltrados.filter(e => e.fecha?.split('T')[0] === iso);

              return (
                <div key={colIdx} style={{ position:'relative', borderRight: colIdx<6?'1px solid #e8e4f4':'none',
                  background: esHoy ? 'rgba(108,79,191,.03)' : 'transparent' }}>

                  {/* Líneas de hora */}
                  {HORAS.map(h => (
                    <div key={h} style={{ position:'absolute', left:0, right:0,
                      top: h * PX_POR_HORA, height: PX_POR_HORA,
                      borderBottom:'1px solid #f0edf8', boxSizing:'border-box',
                      cursor:'pointer' }}
                      onClick={() => {
                        const f = new Date(d);
                        f.setHours(h, 0, 0, 0);
                        setModalCrear({ visible:true, fechaInicial:
                          `${iso}T${String(h).padStart(2,'0')}:00` });
                      }}
                    />
                  ))}

                  {/* Línea de hora actual */}
                  {esHoy && (() => {
                    const now = new Date();
                    const top = (now.getHours() + now.getMinutes()/60) * PX_POR_HORA;
                    return (
                      <div style={{ position:'absolute', left:0, right:0, top,
                        height:2, background:'#EF4444', zIndex:5, pointerEvents:'none' }}>
                        <div style={{ position:'absolute', left:-4, top:-4, width:8, height:8,
                          borderRadius:'50%', background:'#EF4444' }}/>
                      </div>
                    );
                  })()}

                  {/* Eventos del día posicionados por hora */}
                  {evsDia.map(e => {
                    const fecha = new Date(e.fecha);
                    const topPx = (fecha.getHours() + fecha.getMinutes()/60) * PX_POR_HORA;
                    const durPx = PX_POR_HORA * 1; // duración fija 1h visual
                    const c = COLORES_EVENTO[e.color];
                    return (
                      <div key={e._id}
                        onClick={ev => { ev.stopPropagation(); handleEventoClick(e); }}
                        onMouseEnter={ev => handleEventoMouseEnter(ev.currentTarget, e)}
                        onMouseLeave={handleEventoMouseLeave}
                        style={{ position:'absolute', left:2, right:2, top:topPx+1,
                          height: Math.max(durPx-2, 22), zIndex:2,
                          background: c.claro, borderLeft:`3px solid ${c.hex}`,
                          borderRadius:5, padding:'2px 6px',
                          overflow:'hidden', cursor:'pointer',
                          boxShadow:`0 1px 4px ${c.hex}44`,
                          transition:'box-shadow .15s, transform .15s',
                          fontSize:'.72rem', fontWeight:600, color: c.oscuro,
                          display:'flex', flexDirection:'column', justifyContent:'center'
                        }}
                        onMouseOver={ev => { ev.currentTarget.style.boxShadow=`0 3px 10px ${c.hex}66`; ev.currentTarget.style.transform='scaleX(1.02)'; }}
                        onMouseOut={ev => { ev.currentTarget.style.boxShadow=`0 1px 4px ${c.hex}44`; ev.currentTarget.style.transform='scaleX(1)'; }}>
                        <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {e.nombre}
                        </span>
                        <span style={{ fontSize:'.65rem', opacity:.75, fontWeight:500 }}>
                          {fmtHora(fecha.getHours(), fecha.getMinutes())}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── ✅ Vista Día ───────────────────────────────────────────────
  const renderVistaDia = () => {
    const iso    = isoFecha(currentDate);
    const esHoy  = iso === isoFecha(new Date());
    const evsDia = eventosFiltrados.filter(e => e.fecha?.split('T')[0] === iso);
    const diaNombre = DIAS_SEMANA_LARGO[currentDate.getDay()];
    const diaNum    = currentDate.getDate();
    const mesNombre = MESES_NOMBRES[currentDate.getMonth()];

    return (
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Cabecera del día */}
        <div style={{ padding:'14px 20px', borderBottom:'2px solid #e8e4f4',
          background: esHoy ? '#EDE9FF' : '#faf9ff',
          display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
            background: esHoy?'#6C4FBF':'#e8e4f4', borderRadius:12,
            padding:'8px 18px', minWidth:70 }}>
            <span style={{ fontSize:'.7rem', fontWeight:700, color: esHoy?'rgba(255,255,255,.8)':'#888',
              textTransform:'uppercase', letterSpacing:'.06em' }}>
              {diaNombre.slice(0,3).toUpperCase()}
            </span>
            <span style={{ fontSize:'2rem', fontWeight:800, lineHeight:1,
              color: esHoy?'white':'#2b3674' }}>{diaNum}</span>
          </div>
          <div>
            <div style={{ fontSize:'1.1rem', fontWeight:700, color:'#2b3674' }}>
              {diaNombre}, {diaNum} de {mesNombre} de {currentDate.getFullYear()}
            </div>
            <div style={{ fontSize:'.82rem', color:'#888', marginTop:2 }}>
              {evsDia.length === 0 ? 'Sin actividades' :
               evsDia.length === 1 ? '1 actividad' : `${evsDia.length} actividades`}
            </div>
          </div>
          {evsDia.length > 0 && (
            <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>
              {evsDia.map(e => {
                const c = COLORES_EVENTO[e.color];
                return (
                  <span key={e._id} style={{ background:c.claro, color:c.oscuro,
                    border:`1px solid ${c.hex}44`, borderRadius:20,
                    padding:'3px 10px', fontSize:'.75rem', fontWeight:600,
                    cursor:'pointer', whiteSpace:'nowrap' }}
                    onClick={() => handleEventoClick(e)}>
                    {e.nombre}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Timeline de 24 horas */}
        <div ref={timelineRef} style={{ overflowY:'auto', maxHeight:'calc(100vh - 300px)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'70px 1fr',
            minHeight: `${24 * PX_POR_HORA}px`, position:'relative' }}>

            {/* Columna de horas */}
            <div style={{ borderRight:'1px solid #e8e4f4', background:'#faf9ff' }}>
              {HORAS.map(h => (
                <div key={h} style={{ height:PX_POR_HORA, display:'flex', alignItems:'flex-start',
                  justifyContent:'flex-end', paddingRight:10, paddingTop:4,
                  fontSize:'.72rem', color:'#bbb', fontWeight:500, boxSizing:'border-box',
                  borderBottom:'1px solid #f0edf8' }}>
                  {h === 0 ? '' : fmtHora(h)}
                </div>
              ))}
            </div>

            {/* Área de eventos */}
            <div style={{ position:'relative' }}>

              {/* Líneas de hora */}
              {HORAS.map(h => (
                <div key={h} style={{ position:'absolute', left:0, right:0,
                  top: h * PX_POR_HORA, height: PX_POR_HORA,
                  borderBottom:'1px solid #f3f0fb', boxSizing:'border-box',
                  cursor:'pointer',
                  background: h % 2 === 0 ? 'rgba(108,79,191,.012)' : 'transparent' }}
                  onClick={() => setModalCrear({ visible:true,
                    fechaInicial: `${iso}T${String(h).padStart(2,'0')}:00` })}
                />
              ))}

              {/* Línea de hora actual */}
              {esHoy && (() => {
                const now = new Date();
                const top = (now.getHours() + now.getMinutes()/60) * PX_POR_HORA;
                return (
                  <div style={{ position:'absolute', left:0, right:0, top,
                    height:2, background:'#EF4444', zIndex:5, pointerEvents:'none' }}>
                    <div style={{ position:'absolute', left:-5, top:-4.5, width:10, height:10,
                      borderRadius:'50%', background:'#EF4444',
                      boxShadow:'0 0 0 3px rgba(239,68,68,.25)' }}/>
                    <span style={{ position:'absolute', left:14, top:-9,
                      fontSize:'.65rem', fontWeight:700, color:'#EF4444',
                      background:'white', padding:'1px 4px', borderRadius:3 }}>
                      {fmtHora(now.getHours(), now.getMinutes())}
                    </span>
                  </div>
                );
              })()}

              {/* Eventos posicionados */}
              {evsDia.map((e, idx) => {
                const fecha  = new Date(e.fecha);
                const topPx  = (fecha.getHours() + fecha.getMinutes()/60) * PX_POR_HORA;
                const durPx  = PX_POR_HORA * 1.5;
                const c      = COLORES_EVENTO[e.color];

                // Si hay solapamiento, desplazar horizontalmente
                const solapados = evsDia.filter(o => {
                  if (o._id === e._id) return false;
                  const oTop = (new Date(o.fecha).getHours() + new Date(o.fecha).getMinutes()/60) * PX_POR_HORA;
                  return Math.abs(oTop - topPx) < durPx;
                });
                const totalColumnas = solapados.length + 1;
                const columna       = evsDia.filter(o => {
                  if (o._id === e._id) return false;
                  const oTop = (new Date(o.fecha).getHours() + new Date(o.fecha).getMinutes()/60) * PX_POR_HORA;
                  return Math.abs(oTop - topPx) < durPx && evsDia.indexOf(o) < idx;
                }).length;
                const ancho = `calc(${100/totalColumnas}% - 8px)`;
                const izq   = `calc(${columna * (100/totalColumnas)}% + 4px)`;

                return (
                  <div key={e._id}
                    onClick={ev => { ev.stopPropagation(); handleEventoClick(e); }}
                    onMouseEnter={ev => handleEventoMouseEnter(ev.currentTarget, e)}
                    onMouseLeave={handleEventoMouseLeave}
                    style={{ position:'absolute', left:izq, width:ancho,
                      top: topPx + 1, height: durPx - 2, zIndex:3,
                      background: `linear-gradient(135deg, ${c.claro}, white)`,
                      border:`1.5px solid ${c.hex}55`,
                      borderLeft:`4px solid ${c.hex}`,
                      borderRadius:8, padding:'6px 10px',
                      cursor:'pointer', overflow:'hidden',
                      boxShadow:`0 2px 8px ${c.hex}33`,
                      transition:'all .15s'
                    }}
                    onMouseOver={ev => { ev.currentTarget.style.boxShadow=`0 4px 16px ${c.hex}55`; ev.currentTarget.style.transform='translateX(2px)'; }}
                    onMouseOut={ev => { ev.currentTarget.style.boxShadow=`0 2px 8px ${c.hex}33`; ev.currentTarget.style.transform='translateX(0)'; }}>

                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:c.hex, flexShrink:0 }}/>
                      <span style={{ fontSize:'.78rem', fontWeight:700, color:c.oscuro,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {e.nombre}
                      </span>
                    </div>

                    <div style={{ fontSize:'.7rem', color:'#666', display:'flex', alignItems:'center', gap:4, marginBottom:2 }}>
                      <Clock size={10}/>
                      {fmtHora(fecha.getHours(), fecha.getMinutes())}
                    </div>

                    {e.lugar && (
                      <div style={{ fontSize:'.7rem', color:'#888', display:'flex', alignItems:'center', gap:4 }}>
                        <MapPin size={10}/>
                        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.lugar}</span>
                      </div>
                    )}

                    {e.descripcion && durPx > 60 && (
                      <div style={{ fontSize:'.68rem', color:'#999', marginTop:4,
                        overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2,
                        WebkitBoxOrient:'vertical' }}>
                        {e.descripcion}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Zona vacía — clic para crear */}
              {evsDia.length === 0 && (
                <div style={{ position:'absolute', top:'30%', left:0, right:0,
                  display:'flex', flexDirection:'column', alignItems:'center',
                  gap:10, pointerEvents:'none', opacity:.4 }}>
                  <Calendar size={40} color="#C4B5E8"/>
                  <p style={{ margin:0, fontSize:'.9rem', color:'#A89CC8', fontWeight:600 }}>
                    Sin actividades — clic en una hora para crear
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Título de navegación ────────────────────────────────────────
  const renderTituloNav = () => {
    if (currentView === 'semana') {
      const lunes = getLunesDeSemana(currentDate);
      const dom   = new Date(lunes); dom.setDate(lunes.getDate() + 6);
      return `${lunes.getDate()} ${MESES_NOMBRES[lunes.getMonth()].slice(0,3)} – ${dom.getDate()} ${MESES_NOMBRES[dom.getMonth()].slice(0,3)} ${dom.getFullYear()}`;
    }
    if (currentView === 'dia') {
      return `${DIAS_SEMANA_LARGO[currentDate.getDay()]}, ${currentDate.getDate()} de ${MESES_NOMBRES[currentDate.getMonth()]}`;
    }
    if (currentView === 'ano') return String(currentYear);
    return `${MESES_NOMBRES[currentMonth]} ${currentYear}`;
  };

  // ── Render principal ────────────────────────────────────────────
  return (
    <div style={{ background:'#f8f9fe', minHeight:'100vh', padding:20 }}>

      {notification.visible && (
        <Notification message={notification.message} type={notification.type}
          onClose={() => setNotification(n => ({...n, visible:false}))}/>
      )}

      {/* BARRA DE NAVEGACIÓN */}
      <div style={{ background:'white', padding:'15px 20px', borderRadius:12,
        boxShadow:'0 2px 8px rgba(0,0,0,.08)', marginBottom:20,
        display:'flex', alignItems:'center', gap:15, flexWrap:'wrap' }}>

        {/* Prev / Next / Hoy */}
        <div style={{ display:'flex', gap:8 }}>
          {[
            { onClick:navegarAnterior, icon:<ChevronLeft size={18}/>, title:'Anterior' },
            { onClick:navegarSiguiente, icon:<ChevronRight size={18}/>, title:'Siguiente' },
          ].map((b,i) => (
            <button key={i} onClick={b.onClick} title={b.title}
              style={{ background:'#6C4FBF', color:'white', border:'none', borderRadius:6,
                padding:'8px 10px', cursor:'pointer', display:'flex', alignItems:'center', transition:'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background='#4B3090'}
              onMouseLeave={e => e.currentTarget.style.background='#6C4FBF'}>
              {b.icon}
            </button>
          ))}
          <button onClick={irAHoy} style={{ background:'#f0f0f0', color:'#6C4FBF',
            border:'1px solid #ddd', borderRadius:6, padding:'8px 12px',
            cursor:'pointer', fontWeight:600, fontSize:'.85rem', transition:'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.background='#e0dcf5'; e.currentTarget.style.color='#4B3090'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#f0f0f0'; e.currentTarget.style.color='#6C4FBF'; }}>
            Hoy
          </button>
        </div>

        <div style={{ width:1, height:28, background:'#e0e0e0' }}/>

        {/* Selector de mes (solo en vista mes) */}
        {currentView === 'mes' && (
          <div ref={dropdownRef} style={{ position:'relative' }}>
            <button onClick={() => setMesDropdownOpen(!mesDropdownOpen)}
              style={{ background:'white', color:'#2b3674', border:'1.5px solid #E0D9F5',
                borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:600, fontSize:'.9rem' }}>
              {MESES_NOMBRES[currentMonth]}
            </button>
            {mesDropdownOpen && (
              <div style={{ position:'absolute', top:'100%', left:0, background:'white',
                border:'1.5px solid #E0D9F5', borderRadius:8, marginTop:6,
                boxShadow:'0 4px 12px rgba(0,0,0,.12)', zIndex:1000, minWidth:150 }}>
                {MESES_NOMBRES.map((mes, idx) => (
                  <button key={mes} onClick={() => { setCurrentMonth(idx); setMesDropdownOpen(false); }}
                    style={{ display:'block', width:'100%', padding:'10px 14px', border:'none',
                      background: idx===currentMonth?'#f0f0f0':'transparent',
                      color: idx===currentMonth?'#6C4FBF':'#666',
                      fontWeight: idx===currentMonth?700:500, fontSize:'.9rem',
                      cursor:'pointer', textAlign:'left' }}>
                    {mes}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selector de año */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {anoEditando ? (
            <>
              <input type="number" value={anoInputValue}
                onChange={e => setAnoInputValue(e.target.value)}
                onKeyPress={e => e.key==='Enter' && handleConfirmarAno()}
                style={{ width:70, padding:'8px 6px', border:'1.5px solid #E0D9F5',
                  borderRadius:6, fontSize:'.9rem', textAlign:'center' }} autoFocus/>
              <button onClick={handleConfirmarAno}
                style={{ background:'#6C4FBF', color:'white', border:'none',
                  borderRadius:4, padding:'6px 8px', cursor:'pointer' }}>✓</button>
              <button onClick={() => { setAnoEditando(false); setAnoInputValue(String(currentYear)); }}
                style={{ background:'#f0f0f0', color:'#999', border:'none',
                  borderRadius:4, padding:'6px 8px', cursor:'pointer' }}>✕</button>
            </>
          ) : (
            <button onClick={() => setAnoEditando(true)}
              style={{ background:'white', color:'#2b3674', border:'1.5px solid #E0D9F5',
                borderRadius:6, padding:'8px 12px', cursor:'pointer', fontWeight:600,
                fontSize:'.9rem', minWidth:60 }}>
              {currentYear}
            </button>
          )}
        </div>

        <div style={{ width:1, height:28, background:'#e0e0e0' }}/>

        {/* Botones de vista */}
        <div style={{ display:'flex', gap:6 }}>
          {[
            { id:'mes',    label:'Mes',    icon:<Grid3X3 size={15}/> },
            { id:'semana', label:'Semana', icon:<List size={15}/> },
            { id:'dia',    label:'Día',    icon:<Calendar size={15}/> },
            { id:'ano',    label:'Año',    icon:<Grid3X3 size={15}/> },
            { id:'lista',  label:'Lista',  icon:<List size={15}/> },
          ].map(v => (
            <button key={v.id} onClick={() => setCurrentView(v.id)}
              style={{ background: currentView===v.id?'#6C4FBF':'#f0f0f0',
                color: currentView===v.id?'white':'#666',
                border:'none', borderRadius:6, padding:'8px 10px', cursor:'pointer',
                fontSize:'.8rem', fontWeight: currentView===v.id?600:500,
                display:'flex', alignItems:'center', gap:4, transition:'all .2s' }}
              onMouseEnter={e => { if(currentView!==v.id){ e.currentTarget.style.background='#e0dcf5'; e.currentTarget.style.color='#4B3090'; }}}
              onMouseLeave={e => { if(currentView!==v.id){ e.currentTarget.style.background='#f0f0f0'; e.currentTarget.style.color='#666'; }}}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div style={{ width:1, height:28, background:'#e0e0e0' }}/>

        {/* Filtros de color */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:'.8rem', color:'#999', fontWeight:500 }}>Filtros:</span>
          {Object.entries(COLORES_EVENTO).map(([key, color]) => (
            <button key={key}
              onClick={() => setColoresFiltrados(prev => ({...prev,[key]:!prev[key]}))}
              title={color.nombre}
              style={{ width:22, height:22, borderRadius:'50%', background:color.hex,
                border: coloresFiltrados[key]?'3px solid #333':'2px solid #ddd',
                cursor:'pointer', opacity: coloresFiltrados[key]?1:.35, transition:'all .2s' }}/>
          ))}
        </div>

        {/* Título dinámico */}
        <div style={{ marginLeft:'auto' }}>
          <span style={{ fontSize:'.9rem', color:'#666', fontWeight:600 }}>
            {renderTituloNav()}
          </span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ background:'white', borderRadius:12,
        boxShadow:'0 2px 8px rgba(0,0,0,.08)', overflow:'hidden' }}>
        {currentView === 'mes'    && renderVistaMonth()}
        {currentView === 'semana' && renderVistaSemana()}
        {currentView === 'dia'    && renderVistaDia()}
        {currentView === 'ano'    && renderVistaYear()}
        {currentView === 'lista'  && renderVistaLista()}
      </div>

      {/* MODALES */}

      
      {modal.visible && (
          <WithPermission requiredPermissions={"ACTUALIZAR_ACTIVIDADES"}>
        <ModalDetalleActividad actividad={modal.content} onClose={cerrarModal}
          onUpdate={handleActualizar} onDelete={() => handleEliminar(modal.content._id)}/>
          </WithPermission>
      )}
      {modalCrear.visible && (
        <ModalCrearActividad
          onClose={() => setModalCrear({ visible:false, fechaInicial:null })}
          onCreate={handleCrear} fechaInicial={modalCrear.fechaInicial}/>
      )}

      {/* TOOLTIP */}
      {tooltip.visible && tooltip.content && (
        <div style={{ position:'fixed', top:tooltip.y, left:tooltip.x,
          background:'rgba(0,0,0,.85)', color:'white', padding:'8px 12px',
          borderRadius:6, zIndex:9999, transform:'translateX(-50%)',
          fontSize:'.8rem', pointerEvents:'none', maxWidth:220 }}>
          <strong>{tooltip.content.titulo}</strong>
          <div style={{ opacity:.8 }}>{tooltip.content.fecha}</div>
          {tooltip.content.lugar && <div style={{ opacity:.7 }}>{tooltip.content.lugar}</div>}
        </div>
      )}

      {/* CONFIRMACIÓN */}
      {confirmacion.visible && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', padding:24, borderRadius:12,
            textAlign:'center', minWidth:280, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
            <p style={{ margin:'0 0 18px', color:'#2b3674', fontWeight:600 }}>{confirmacion.message}</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => { confirmacion.onConfirm(); setConfirmacion({ visible:false, message:'', onConfirm:null }); }}
                style={{ background:'#6C4FBF', color:'white', border:'none',
                  padding:'9px 20px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
                Confirmar
              </button>
              <button onClick={() => setConfirmacion({ visible:false, message:'', onConfirm:null })}
                style={{ background:'#f0f0f0', color:'#666', border:'none',
                  padding:'9px 20px', borderRadius:8, cursor:'pointer', fontWeight:600 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CalendarioActividades;