// ============================================================
// Actividades.jsx
//
// FIX #2 ALTO   — Filtros por semana, mes y lugar (además de
//                 las categorías temporales existentes)
// FIX #3 ALTO   — Validación de conflicto de lugar y horario:
//                 avisa si ya existe una actividad en el mismo
//                 lugar dentro de ±2 horas
// FIX #5 MEDIO  — Botones consistentes: X estándar en el header
//                 del modal; eliminar separado del modal edición
// ============================================================
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
  Calendar, Clock, MapPin, X, Eye, Edit, Trash2,
  Users, Award, Plus, HelpCircle, Search, Star,
  Target, CheckCircle, AlertCircle, Filter, ChevronDown
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL + "/api/actividades";

// ── Categoriza por proximidad temporal ────────────────────────
function categorizarActividad(fechaActividad) {
  if (!fechaActividad) return 'DESCONOCIDA';
  const fecha = new Date(fechaActividad);
  const hoy   = new Date();
  const fSolo = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
  const hSolo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime();
  const dias  = (fSolo - hSolo) / (1000 * 60 * 60 * 24);
  if (dias === 0)              return 'HOY';
  if (dias > 0 && dias <= 7)  return 'PROXIMA';
  if (dias > 7)               return 'FUTURA';
  if (dias < 0)               return 'FINALIZADA';
  return 'DESCONOCIDA';
}

const formatearFecha = (fecha) => {
  if (!fecha) return "";
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(fecha));
};

// ── FIX #3: detectar conflicto de lugar ──────────────────────
// Devuelve la actividad conflictiva si existe una en el mismo
// lugar dentro de ±2 horas de la fecha dada, excluyendo el
// id indicado (útil al editar).
const detectarConflicto = (actividades, lugar, fechaISO, excludeId = null) => {
  if (!lugar || !fechaISO) return null;
  const fechaNueva = new Date(fechaISO).getTime();
  const DOS_HORAS  = 2 * 60 * 60 * 1000;
  return actividades.find(a => {
    if (a._id === excludeId) return false;
    if (!a.lugar || !a.fecha) return false;
    if (a.lugar.trim().toLowerCase() !== lugar.trim().toLowerCase()) return false;
    const diff = Math.abs(new Date(a.fecha).getTime() - fechaNueva);
    return diff < DOS_HORAS;
  }) || null;
};

const Actividades = () => {
  const [actividades,          setActividades]          = useState([]);
  const [actividadSeleccionada,setActividadSeleccionada]= useState(null);
  const [busqueda,             setBusqueda]             = useState('');
  const [mostrarModalCrear,    setMostrarModalCrear]    = useState(false);
  const [notification,         setNotification]         = useState(null);
  const [mostrarAyuda,         setMostrarAyuda]         = useState(false);
  const [showConfirm,          setShowConfirm]          = useState(false);
  const [actividadAEliminar,   setActividadAEliminar]   = useState(null);

  // FIX #2: estado de filtros avanzados
  const [filtroLugar,      setFiltroLugar]      = useState('');
  const [filtroPeriodo,    setFiltroPeriodo]    = useState('todos'); // todos|semana|mes
  const [mostrarFiltros,   setMostrarFiltros]   = useState(false);
  const [preselectedDate,  setPreselectedDate]  = useState(null); // FIX #4

  // ── Carga de datos ──────────────────────────────────────────
  const cargarActividades = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const res = await fetch(API_URL, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}` // SOLO TOKEN, como la versión antigua
        }
      });
      
      if (!res.ok) throw new Error('Error al obtener actividades');
      const data = await res.json();
      setActividades(data);
    } catch (err) { 
      console.error("Error:", err.message); 
    }
  };

  useEffect(() => { cargarActividades(); }, []);

  // ── Stats ───────────────────────────────────────────────────
  const totalActividades         = actividades.length;
  const actividadesHoyCount      = actividades.filter(a => categorizarActividad(a.fecha) === 'HOY').length;
  const actividadesProximasCount = actividades.filter(a => categorizarActividad(a.fecha) === 'PROXIMA').length;
  const actividadesFinalizadasCount = actividades.filter(a => categorizarActividad(a.fecha) === 'FINALIZADA').length;

  const showNotification = (message, type) => setNotification({ message, type });
  const closeNotification = () => setNotification(null);

  // FIX #2: valores únicos de lugares para el dropdown
  const lugaresUnicos = useMemo(() =>
    [...new Set(actividades.map(a => a.lugar).filter(Boolean))].sort(), [actividades]);

  // ── FIX #2: filtrado avanzado ────────────────────────────────
  const actividadesFiltradas = useMemo(() => {
    const hoy   = new Date();
    const hSolo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return actividades.filter(a => {
      // Búsqueda libre
      const t = busqueda.toLowerCase();
      const matchBusqueda = !t || [a.nombre, a.lugar, a.descripcion].some(f => f?.toLowerCase().includes(t));
      if (!matchBusqueda) return false;
      // Filtro por lugar — FIX #2
      if (filtroLugar && a.lugar?.trim().toLowerCase() !== filtroLugar.toLowerCase()) return false;
      // Filtro por período — FIX #2
      if (filtroPeriodo !== 'todos') {
        const fFecha = new Date(a.fecha);
        if (filtroPeriodo === 'semana') {
          const fin = new Date(hSolo); fin.setDate(fin.getDate() + 7);
          if (fFecha < hSolo || fFecha > fin) return false;
        } else if (filtroPeriodo === 'mes') {
          const fin = new Date(hSolo); fin.setMonth(fin.getMonth() + 1);
          if (fFecha < hSolo || fFecha > fin) return false;
        }
      }
      return true;
    });
  }, [actividades, busqueda, filtroLugar, filtroPeriodo]);

  const actividadesHoy        = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'HOY');
  const actividadesProximas   = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'PROXIMA');
  const actividadesFuturas    = actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'FUTURA');
  const actividadesFinalizadas= actividadesFiltradas.filter(a => categorizarActividad(a.fecha) === 'FINALIZADA');

  const hayFiltrosActivos = filtroLugar || filtroPeriodo !== 'todos';
  const contadorFiltros   = [filtroLugar, filtroPeriodo !== 'todos' ? '1' : ''].filter(Boolean).length;

  // ── FIX #3: Crear con validación de conflicto ────────────────
  const handleCrearActividad = async (nuevaActividad) => {
    if (!nuevaActividad.nombre?.trim())       { showNotification('El nombre es obligatorio', 'error'); return; }
    if (!nuevaActividad.fecha)                { showNotification('La fecha y hora son obligatorias', 'error'); return; }
    if (!nuevaActividad.lugar?.trim())        { showNotification('El lugar es obligatorio', 'error'); return; }
    if (!nuevaActividad.descripcion?.trim())  { showNotification('La descripción es obligatoria', 'error'); return; }
    if (new Date(nuevaActividad.fecha) < new Date()) { showNotification('No puedes crear una actividad con fecha pasada', 'error'); return; }

    // FIX #3: validar conflicto de lugar
    const conflicto = detectarConflicto(actividades, nuevaActividad.lugar, nuevaActividad.fecha);
    if (conflicto) {
      showNotification(
        `⚠ Conflicto de lugar: "${conflicto.nombre}" ya está programada en "${conflicto.lugar}" el ${formatearFecha(conflicto.fecha)}. Por favor elige otro lugar u horario.`,
        'error'
      );
      return;
    }

   try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // SOLO TOKEN
        },
        body: JSON.stringify(nuevaActividad)
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.message || 'Error al crear');
      }
      
      const creada = await res.json();
      setActividades(prev => [...prev, creada]);
      setMostrarModalCrear(false);
      showNotification(`Actividad "${creada.nombre}" creada`, 'success');
    } catch (err) { 
      showNotification(err.message, 'error'); 
    }
  };

  // ── FIX #3: Editar con validación de conflicto ───────────────
  const handleEditarActividad = async (actividadActualizada) => {
    if (!actividadActualizada.nombre?.trim())      { showNotification('El nombre es obligatorio', 'error'); return; }
    if (!actividadActualizada.fecha)               { showNotification('La fecha y hora son obligatorias', 'error'); return; }
    if (!actividadActualizada.lugar?.trim())       { showNotification('El lugar es obligatorio', 'error'); return; }
    if (!actividadActualizada.descripcion?.trim()) { showNotification('La descripción es obligatoria', 'error'); return; }

    // FIX #3: validar conflicto excluyendo la misma actividad
    const conflicto = detectarConflicto(actividades, actividadActualizada.lugar, actividadActualizada.fecha, actividadActualizada._id);
    if (conflicto) {
      showNotification(
        `⚠ Conflicto: "${conflicto.nombre}" ya está en "${conflicto.lugar}" el ${formatearFecha(conflicto.fecha)}.`,
        'error'
      );
      return;
    }

   try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const res = await fetch(`${API_URL}/${actividadActualizada._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // SOLO TOKEN
        },
        body: JSON.stringify(actividadActualizada)
      });

      if (!res.ok) throw new Error('Error al actualizar');
      
      const actualizada = await res.json();
      setActividades(prev => prev.map(a => a._id === actualizada._id ? actualizada : a));
      setActividadSeleccionada(null);
      showNotification('Actividad actualizada', 'success');
    } catch (err) { 
      showNotification(err.message, 'error'); 
    }
  };

  const handleEliminarActividad = (id) => {
    const a = actividades.find(x => x._id === id);
    setActividadAEliminar(a);
    setShowConfirm(true);
  };

 const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!actividadAEliminar) return;
    
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const res = await fetch(`${API_URL}/${actividadAEliminar._id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` // SOLO TOKEN
        }
      });

      if (!res.ok) throw new Error('Error al eliminar');
      
      setActividades(prev => prev.filter(a => a._id !== actividadAEliminar._id));
      showNotification('Actividad eliminada', 'success');
    } catch (err) { 
      showNotification(err.message, 'error'); 
    }
  };

  // ── Render de grupo de actividades ────────────────────────────
  const renderGrupoActividades = (titulo, lista, color) => (
    <motion.div className="actividad-categoria-section"
      initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
      <motion.div className="actividad-categoria-header"
        initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.2}}>
        <h3 className="actividad-subtitulo">
          <motion.div initial={{rotate:-180,scale:0}} animate={{rotate:0,scale:1}}
            transition={{type:"spring",stiffness:200,damping:15}} style={{color}}>
            <Calendar size={20}/>
          </motion.div>
          {titulo} ({lista.length})
        </h3>
      </motion.div>
      {lista.length === 0 ? (
        <motion.p className="actividad-vacio" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.3}}>
          No hay actividades en esta categoría.
        </motion.p>
      ) : (
        <motion.div className="actividad-listado"
          initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.5}}>
          {lista.map((actividad, idx) => {
            const cat = categorizarActividad(actividad.fecha);
            return (
              <motion.div key={actividad._id} className="actividad-card"
                onClick={() => setActividadSeleccionada(actividad)}
                initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}}
                transition={{delay:Math.min(idx*.05,1),duration:.4,type:"spring",stiffness:100}}
                whileHover={{scale:1.02,transition:{duration:.2}}}>
                <div className="actividad-card-header">
                  <span className={`actividad-estado-badge ${cat}`}>
                    {cat==='HOY'&&<AlertCircle size={14}/>}
                    {cat==='PROXIMA'&&<Clock size={14}/>}
                    {cat==='FUTURA'&&<Target size={14}/>}
                    {cat==='FINALIZADA'&&<CheckCircle size={14}/>}
                    {cat==='HOY'&&'HOY'}{cat==='PROXIMA'&&'PRÓXIMA'}{cat==='FUTURA'&&'FUTURA'}{cat==='FINALIZADA'&&'FINALIZADA'}
                  </span>
                  <span className="actividad-fecha">{formatearFecha(actividad.fecha)}</span>
                </div>
                <div className="actividad-card-body">
                  <div className="actividad-info-item full-width">
                    <span className="actividad-info-label">Nombre</span>
                    <span className="actividad-info-value actividad-nombre">{actividad.nombre}</span>
                  </div>
                  <div className="actividad-info-item">
                    <span className="actividad-info-label"><MapPin size={14}/> Lugar</span>
                    <span className="actividad-info-value">{actividad.lugar}</span>
                  </div>
                  <div className="actividad-info-item full-width">
                    <span className="actividad-info-label">Descripción</span>
                    <span className="actividad-info-value actividad-descripcion">{actividad.descripcion}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="actividad-container">
      <AnimatePresence>
        {notification && <Notification message={notification.message} type={notification.type} onClose={closeNotification}/>}
      </AnimatePresence>

      {/* HEADER */}
      <motion.div className="actividad-header"
        initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} transition={{duration:.7,type:"spring",stiffness:100}}>
        <motion.div className="header-gradient"
          initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.1,duration:.6}}>
          <div className="header-pattern"/>
          <div className="header-content">
            <motion.h2 initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.2,duration:.5}}>
              <motion.div initial={{rotate:-180,scale:0}} animate={{rotate:0,scale:1}}
                transition={{type:"spring",stiffness:200,damping:15,delay:.3}}>
                <Calendar size={36} fill="white" color="white"/>
              </motion.div>
              Sistema de Actividades
              <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.1,1]}}
                transition={{duration:2,repeat:Infinity,repeatDelay:5}} className="floating-main-icon">
                <Target size={32} color="white"/>
              </motion.div>
            </motion.h2>
            <motion.p initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}}
              transition={{delay:.3,duration:.5}} className="header-subtitle">
              Organiza y gestiona todas tus actividades programadas de manera profesional
            </motion.p>
            <motion.div className="header-stats"
              initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.5}}>
              {[
                {ico:<Calendar size={20} color="white"/>,  val:totalActividades,          lbl:'Total Actividades'},
                {ico:<AlertCircle size={20} color="white"/>,val:actividadesHoyCount,      lbl:'Para Hoy'},
                {ico:<Clock size={20} color="white"/>,      val:actividadesProximasCount,  lbl:'Próximas'},
                {ico:<CheckCircle size={20} color="white"/>,val:actividadesFinalizadasCount,lbl:'Finalizadas'},
              ].map((s,i)=>(
                <motion.div key={i} className="stat-item"
                  whileHover={{scale:1.05,y:-2}} transition={{type:"spring",stiffness:300,delay:i*.1}}>
                  <div className="stat-icon">{s.ico}</div>
                  <div className="stat-text">
                    <div className="stat-value" style={{color:"white"}}>{s.val}</div>
                    <div className="stat-label" style={{color:"white"}}>{s.lbl}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div className="floating-icons"
              initial={{opacity:0,scale:0}} animate={{opacity:1,scale:1}} transition={{delay:.6,duration:.5}}>
              {[<Users size={20} color="white"/>,<Award size={20} color="white"/>,<Star size={20} color="white"/>].map((ico,i)=>(
                <motion.div key={i} className="floating-icon"
                  animate={{y:[0,-10,0],rotate:[0,5,-5,0]}}
                  transition={{duration:4+i*.2,repeat:Infinity,ease:"easeInOut",delay:i*.5}}>
                  {ico}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* BARRA BÚSQUEDA + FILTROS — FIX #2 */}
        <motion.div className="actividad-busqueda-bar"
          initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5,duration:.5}}>
          <div style={{position:'relative',flex:1}}>
            <motion.div animate={{scale:[1,1.2,1]}} transition={{duration:2,repeat:Infinity}}
              style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#666'}}>
              <Search size={18}/>
            </motion.div>
            <input type="text" className="actividad-busqueda"
              placeholder="Buscar por nombre, lugar o descripción..."
              value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
          </div>

          {/* FIX #2: botón de filtros avanzados */}
          <motion.button className={`btn-ayuda${hayFiltrosActivos?' active':''}`}
            onClick={()=>setMostrarFiltros(p=>!p)}
            whileHover={{scale:1.08}} whileTap={{scale:.95}}
            style={{position:'relative', ...(hayFiltrosActivos?{background:'#EDE9FF',color:'#6C4FBF',border:'1px solid #C4B5E8'}:{})}}>
            <Filter size={18}/>
            Filtros{contadorFiltros>0&&<span style={{background:'#6C4FBF',color:'#fff',borderRadius:'50%',width:18,height:18,fontSize:11,display:'inline-flex',alignItems:'center',justifyContent:'center',marginLeft:4}}>{contadorFiltros}</span>}
          </motion.button>

          <motion.button className="btn-ayuda" onClick={()=>setMostrarAyuda(true)}
            whileHover={{scale:1.08}} whileTap={{scale:.95}}>
            <HelpCircle size={18}/> Ayuda
          </motion.button>

          <WithPermission requiredPermissions={["CREAR_ACTIVIDADES"]}>
            <motion.button className="btn-nueva-actividad" onClick={()=>setMostrarModalCrear(true)}
              whileHover={{scale:1.08,boxShadow:"0 6px 20px rgba(102,126,234,.4)"}} whileTap={{scale:.95}}>
              <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}}>
                <Plus size={18}/>
              </motion.div>
              Nueva Actividad
            </motion.button>
          </WithPermission>
        </motion.div>

        {/* FIX #2: Panel de filtros avanzados desplegable */}
        <AnimatePresence>
          {mostrarFiltros && (
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              style={{overflow:'hidden',background:'#fff',borderRadius:12,border:'1px solid #E0D9F5',marginTop:10,padding:'14px 18px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {/* Período */}
                <div>
                  <label style={{fontSize:'.75rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:4}}>Período</label>
                  <select value={filtroPeriodo} onChange={e=>setFiltroPeriodo(e.target.value)}
                    style={{width:'100%',padding:'8px 12px',border:'1px solid #E0D9F5',borderRadius:8,fontFamily:'inherit',fontSize:'.88rem',outline:'none'}}>
                    <option value="todos">Todas las fechas</option>
                    <option value="semana">Esta semana (7 días)</option>
                    <option value="mes">Este mes (30 días)</option>
                  </select>
                </div>
                {/* Lugar */}
                <div>
                  <label style={{fontSize:'.75rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:4}}>Lugar</label>
                  <select value={filtroLugar} onChange={e=>setFiltroLugar(e.target.value)}
                    style={{width:'100%',padding:'8px 12px',border:'1px solid #E0D9F5',borderRadius:8,fontFamily:'inherit',fontSize:'.88rem',outline:'none'}}>
                    <option value="">Todos los lugares</option>
                    {lugaresUnicos.map(l=><option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {/* Limpiar */}
                <div style={{display:'flex',alignItems:'flex-end'}}>
                  {hayFiltrosActivos && (
                    <button onClick={()=>{setFiltroLugar('');setFiltroPeriodo('todos');}}
                      style={{width:'100%',padding:'8px 12px',border:'2px dashed #C4B5E8',borderRadius:8,background:'none',color:'#6C4FBF',fontWeight:700,cursor:'pointer',fontSize:'.85rem'}}>
                      × Limpiar filtros
                    </button>
                  )}
                </div>
              </div>
              {hayFiltrosActivos && (
                <div style={{marginTop:10,fontSize:'.82rem',color:'#7A6FA0'}}>
                  Mostrando {actividadesFiltradas.length} de {actividades.length} actividades
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CONTENIDO */}
      <motion.div className="actividad-categorias-container"
        initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.3}}>
        {renderGrupoActividades("Actividades de Hoy",      actividadesHoy,         "#FF6B6B")}
        {renderGrupoActividades("Próximos 7 días",          actividadesProximas,    "#FFD93D")}
        {renderGrupoActividades("Actividades futuras",      actividadesFuturas,     "#6BCF7F")}
        {renderGrupoActividades("Actividades finalizadas",  actividadesFinalizadas, "#4D4D4D")}
      </motion.div>

      {/* MODALES */}
      {mostrarModalCrear && (
        <ModalCrearActividad
          onClose={()=>{setMostrarModalCrear(false);setPreselectedDate(null);}}
          onCreate={handleCrearActividad}
          // FIX #4: fecha preseleccionada si viene del calendario
          fechaInicial={preselectedDate}
        />
      )}
      {actividadSeleccionada && (
        <ModalDetalleActividad
          actividad={actividadSeleccionada}
          onClose={()=>setActividadSeleccionada(null)}
          showNotification={showNotification}
          onUpdate={handleEditarActividad}
          onDelete={handleEliminarActividad}
        />
      )}
      {showConfirm && (
        <ConfirmDialog
          message={`¿Eliminar la actividad "${actividadAEliminar?.nombre}" del ${new Date(actividadAEliminar?.fecha).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})}?`}
          onConfirm={confirmarEliminacion}
          onCancel={()=>{setShowConfirm(false);setActividadAEliminar(null);}}
          visible={showConfirm}
        />
      )}

      {/* Modal Ayuda */}
      {mostrarAyuda && (
        <div className="horarios-modal-overlay horarios-modal-show">
          <div className="horarios-modal-content">
            <div className="horarios-modal-header">
              <h3 className="horarios-modal-title"><Calendar size={24}/> Ayuda - Sistema de Actividades</h3>
              {/* FIX #5: X estándar */}
              <button className="horarios-modal-close" onClick={()=>setMostrarAyuda(false)}>
                <X size={20}/>
              </button>
            </div>
            <div className="horarios-modal-body">
              <div className="horarios-help-section">
                <h4 className="horarios-help-title">Filtros disponibles</h4>
                <ul className="horarios-help-list">
                  <li className="horarios-help-item"><strong>Búsqueda libre:</strong> Por nombre, lugar o descripción.</li>
                  <li className="horarios-help-item"><strong>Período:</strong> Esta semana (7 días), este mes (30 días) o todas las fechas.</li>
                  <li className="horarios-help-item"><strong>Lugar:</strong> Filtra por lugar específico desde los que ya existen.</li>
                </ul>
              </div>
              <div className="horarios-help-section">
                <h4 className="horarios-help-title">Validación de conflictos</h4>
                <p className="horarios-help-text">
                  El sistema avisa si ya existe una actividad en el mismo lugar dentro de ±2 horas de la fecha que intentas crear o editar. Puedes continuar eligiendo un lugar diferente u otro horario.
                </p>
              </div>
              <div className="horarios-help-section">
                <h4 className="horarios-help-title">Categorías temporales</h4>
                <div className="horarios-icons-grid">
                  <div className="horarios-icon-item"><AlertCircle size={16} className="horarios-icon-danger"/><span>HOY</span></div>
                  <div className="horarios-icon-item"><Clock size={16} className="horarios-icon-warning"/><span>PRÓXIMOS 7 DÍAS</span></div>
                  <div className="horarios-icon-item"><Calendar size={16} className="horarios-icon-success"/><span>FUTURAS (+ 7 días)</span></div>
                  <div className="horarios-icon-item"><CheckCircle size={16} className="horarios-icon-secondary"/><span>FINALIZADAS</span></div>
                </div>
              </div>
            </div>
            <div className="horarios-modal-footer">
              <button className="horarios-modal-btn-close" onClick={()=>setMostrarAyuda(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actividades;
