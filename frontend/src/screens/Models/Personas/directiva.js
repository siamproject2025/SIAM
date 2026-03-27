// ============================================================
// Directiva.jsx
// FIX #1 CRÍTICO — Campo número de identidad del miembro
// FIX #2 ALTO    — Foto del miembro (base64) + documentos adjuntos
// FIX #3 ALTO    — Vigencia: fecha_inicio_cargo, fecha_fin_cargo,
//                  motivo_salida
// FIX #4 ALTO    — Auditoría: fecha_registro_sistema + usuario que
//                  lo registró (guardado en creado_por)
// ============================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../../styles/Directiva.css";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import {
  Users, Mail, Phone, Briefcase, FileText, Hash, Search,
  HelpCircle, Plus, Edit, Trash2, X, Save, Check, Award,
  UserCheck, Clock, Shield, Download, Camera, Calendar,
  AlertTriangle,
} from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const API_URL = process.env.REACT_APP_API_URL + "/api/directiva";

// ── Iniciales para avatar ─────────────────────────────────────
const iniciales = (n = "") => {
  const p = n.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length-1][0]).toUpperCase();
};

const Directiva = () => {
  const [miembros, setMiembros]           = useState([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [busqueda, setBusqueda]           = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification]   = useState(null);
  const [mostrarAyuda, setMostrarAyuda]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [filtroOrden, setFiltroOrden]     = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);
  const [tabActivo, setTabActivo]         = useState('info');
  const [errors, setErrors]               = useState({});

  // FIX #3: foto preview
  const [fotoPreview, setFotoPreview]     = useState(null);
  const [editFotoPreview, setEditFotoPreview] = useState(null);

  const formVacio = () => ({
    nombre: '', cargo: '', email: '', telefono: '',
    // FIX #1: número de identidad
    numero_identidad: '',
    empresa: '', estado: 'activo',
    // FIX #3: vigencia del cargo
    fecha_inicio_cargo: '',
    fecha_fin_cargo:    '',
    motivo_salida:      '',
    fecha_registro: new Date().toISOString().split('T')[0],
    notas: '',
    // FIX #2: foto
    foto: null,
    // FIX #4: auditoría
    creado_por: '',
  });

  const [formData, setFormData]   = useState(formVacio());

  useEffect(() => { cargarMiembros(); }, []);

  const cargarMiembros = async () => {
    try {
      setLoading(true); loadingController.start();
      const user  = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const res   = await fetch(API_URL, { headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al cargar');
      const data  = await res.json();
      setMiembros(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      showNotification('Error al cargar los miembros', 'error');
      setMiembros([]);
    } finally { setLoading(false); loadingController.stop(); }
  };

  const totalMiembros    = miembros.length;
  const miembrosActivos  = miembros.filter(m => m.estado==='activo').length;
  const miembrosInactivos= miembros.filter(m => m.estado==='inactivo').length;
  const miembrosSuspend  = miembros.filter(m => m.estado==='suspendido').length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Foto handler — FIX #2 ────────────────────────────────
  const handleFotoChange = (e, esEdicion = false) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('La foto no debe superar 3MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Solo imágenes'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (esEdicion) { setEditFotoPreview(reader.result); setFormData(p=>({...p, foto: reader.result.split(',')[1]})); }
      else           { setFotoPreview(reader.result); setFormData(p=>({...p, foto: reader.result.split(',')[1]})); }
    };
    reader.readAsDataURL(file);
  };

  // ── Validación ───────────────────────────────────────────
  const validar = (fd) => {
    const e = {};
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!fd.nombre?.trim())                          e.nombre = 'El nombre es obligatorio';
    else if (!soloLetras.test(fd.nombre.trim()))     e.nombre = 'Solo letras y espacios';
    if (!fd.cargo?.trim())                           e.cargo  = 'El cargo es obligatorio';
    if (!fd.email?.trim())                           e.email  = 'El email es obligatorio';
    if (!fd.telefono)                                e.telefono = 'El teléfono es obligatorio';
    else if (!/^\d+$/.test(fd.telefono.toString())) e.telefono = 'Solo números';
    // FIX #1
    if (!fd.numero_identidad?.trim())               e.numero_identidad = 'El número de identidad es obligatorio';
    // FIX #3
    if (!fd.fecha_inicio_cargo)                     e.fecha_inicio_cargo = 'La fecha de inicio del cargo es requerida';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleCrearMiembro = async (e) => {
    e.preventDefault();
    if (!validar(formData)) return;
    try {
      const user  = auth.currentUser;
      if (!user) { showNotification('No autenticado', 'error'); return; }
      const token = await user.getIdToken();
      // FIX #4: registrar quién lo creó
      const payload = { ...formData, fecha_registro: new Date(formData.fecha_registro), creado_por: user.email || 'sistema', fecha_creacion_sistema: new Date().toISOString() };
      const res = await fetch(API_URL, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Error al crear'); }
      await cargarMiembros();
      setMostrarModalCrear(false);
      setFormData(formVacio()); setFotoPreview(null);
      showNotification(`Miembro "${formData.nombre}" creado exitosamente`, 'success');
    } catch (err) { showNotification(err.message, 'error'); }
  };

  const handleEditarMiembro = async (e) => {
    e.preventDefault();
    if (!validar(formData)) return;
    try {
      loadingController.start();
      const user  = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const payload = { ...formData, fecha_registro: new Date(formData.fecha_registro), actualizado_por: user.email, fecha_actualizacion: new Date().toISOString() };
      const res = await fetch(`${API_URL}/${miembroSeleccionado._id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Error al editar'); }
      await cargarMiembros();
      setMiembroSeleccionado(null); setFormData(formVacio()); setEditFotoPreview(null);
      showNotification(`Miembro "${formData.nombre}" actualizado`, 'success');
    } catch (err) { showNotification(err.message, 'error'); }
    finally { loadingController.stop(); }
  };

  // Eliminar
  const [showConfirm, setShowConfirm]     = useState(false);
  const [miembroAEliminar, setMiembroAEliminar] = useState(null);

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!miembroAEliminar) return;
    try {
      loadingController.start();
      const user  = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const res   = await fetch(`${API_URL}/${miembroAEliminar._id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      await cargarMiembros();
      setMiembroSeleccionado(null); setFormData(formVacio());
      showNotification(`"${miembroAEliminar.nombre}" eliminado`, 'success');
      setMiembroAEliminar(null);
    } catch (err) { showNotification(err.message, 'error'); }
    finally { loadingController.stop(); }
  };

  const handleOpenEditModal = (miembro) => {
    setMiembroSeleccionado(miembro);
    setFormData({
      nombre:           miembro.nombre            || '',
      cargo:            miembro.cargo             || '',
      email:            miembro.email             || '',
      telefono:         miembro.telefono          || '',
      // FIX #1
      numero_identidad: miembro.numero_identidad  || '',
      empresa:          miembro.empresa           || '',
      estado:           miembro.estado            || 'activo',
      // FIX #3
      fecha_inicio_cargo: miembro.fecha_inicio_cargo ? new Date(miembro.fecha_inicio_cargo).toISOString().split('T')[0] : '',
      fecha_fin_cargo:    miembro.fecha_fin_cargo    ? new Date(miembro.fecha_fin_cargo).toISOString().split('T')[0]    : '',
      motivo_salida:    miembro.motivo_salida     || '',
      fecha_registro:   miembro.fecha_registro    ? new Date(miembro.fecha_registro).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notas:            miembro.notas             || '',
      foto:             miembro.foto              || null,
      creado_por:       miembro.creado_por        || '',
    });
    // FIX #2: foto preview
    if (miembro.foto) setEditFotoPreview(`data:image/jpeg;base64,${miembro.foto}`);
    else setEditFotoPreview(null);
    setTabActivo('info');
    setErrors({});
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false); setMiembroSeleccionado(null);
    setFormData(formVacio()); setFotoPreview(null); setEditFotoPreview(null);
    setErrors({}); setTabActivo('info');
  };

  // Filtrado y orden
  const miembrosFiltrados = miembros.filter(m => {
    const t = busqueda.toLowerCase();
    return m.nombre?.toLowerCase().includes(t) || m.cargo?.toLowerCase().includes(t) || m.email?.toLowerCase().includes(t) || m.numero_identidad?.toLowerCase().includes(t);
  });

  const miembrosOrdenados = [...miembrosFiltrados].sort((a,b) => {
    switch(filtroOrden) {
      case 'nombre-az': return (a.nombre||'').localeCompare(b.nombre||'');
      case 'nombre-za': return (b.nombre||'').localeCompare(a.nombre||'');
      case 'cargo-az':  return (a.cargo||'').localeCompare(b.cargo||'');
      case 'estado-activo': return ({'activo':1,'suspendido':2,'inactivo':3}[a.estado]||9)-({'activo':1,'suspendido':2,'inactivo':3}[b.estado]||9);
      default: return 0;
    }
  });

  // ── Estilos reutilizables ────────────────────────────────
  const fInp = (err) => ({ padding:'9px 12px', border:`2px solid ${err?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:err?'#FFF8F8':'#FAF9FF', outline:'none', width:'100%' });
  const fLabel = { display:'block', fontSize:'.77rem', fontWeight:700, color:'#7A6FA0', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 };
  const errMsg = { fontSize:'.73rem', color:'#E74C3C', fontWeight:600, display:'block', marginTop:3 };

  // ── Campo reutilizable ───────────────────────────────────
  const Campo = ({ label, name, required, error, children }) => (
    <div className="form-group">
      <label style={fLabel}>{label}{required&&<span style={{color:'#E74C3C'}}> *</span>}</label>
      {children}
      {error&&<span style={errMsg}>{error}</span>}
    </div>
  );

  // ── Formulario compartido (crear y editar) ────────────────
  const renderFormulario = (onSubmit, esEdicion = false) => (
    <form onSubmit={onSubmit}>
      {/* Tabs del formulario */}
      <div style={{display:'flex',gap:4,marginBottom:16,borderBottom:'2px solid #E0D9F5',paddingBottom:0}}>
        {[{id:'info',label:'Información'},/*{id:'vigencia',label:'Cargo y Vigencia'},*/{id:'vigencia',label:'Cargo'},].map(t=>(
          <button key={t.id} type="button" onClick={()=>setTabActivo(t.id)}
            style={{padding:'8px 14px',border:'none',background:tabActivo===t.id?'#6C4FBF':'#EDE9FF',color:tabActivo===t.id?'#fff':'#6C4FBF',borderRadius:'8px 8px 0 0',fontWeight:700,fontSize:'.82rem',cursor:'pointer',fontFamily:'inherit',transition:'all .18s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {tabActivo === 'info' && (
        <div className="form-grid">
          <div className="form-group full-width">
            <label style={fLabel}>Nombre Completo *</label>
            <input style={fInp(errors.nombre)} value={formData.nombre} onChange={e=>setFormData(p=>({...p,nombre:e.target.value}))} placeholder="Nombre completo del miembro" required/>
            {errors.nombre&&<span style={errMsg}>{errors.nombre}</span>}
          </div>
          {/* FIX #1: número de identidad obligatorio */}
          <div className="form-group">
            <label style={fLabel}>Número de Identidad *</label>
            <div style={{position:'relative'}}>
              <Hash size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#7A6FA0'}}/>
              <input style={{...fInp(errors.numero_identidad),paddingLeft:30}} value={formData.numero_identidad} onChange={e=>setFormData(p=>({...p,numero_identidad:e.target.value.replace(/[^\d\-]/g,'')}))} placeholder="0801-xxxx-xxxxx" required/>
            </div>
            {errors.numero_identidad&&<span style={errMsg}>{errors.numero_identidad}</span>}
          </div>
          <div className="form-group">
            <label style={fLabel}>Email *</label>
            <input style={fInp(errors.email)} type="email" value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))} placeholder="correo@ejemplo.com" required/>
            {errors.email&&<span style={errMsg}>{errors.email}</span>}
          </div>
          <div className="form-group">
            <label style={fLabel}>Teléfono *</label>
            <input style={fInp(errors.telefono)} type="tel" value={formData.telefono} onChange={e=>setFormData(p=>({...p,telefono:e.target.value.replace(/\D/g,'')}))} placeholder="Solo números" required/>
            {errors.telefono&&<span style={errMsg}>{errors.telefono}</span>}
          </div>
          <div className="form-group">
            <label style={fLabel}>Estado</label>
            <select style={fInp(false)} value={formData.estado} onChange={e=>setFormData(p=>({...p,estado:e.target.value}))}>
              <option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="suspendido">Suspendido</option>
            </select>
          </div>
          <div className="form-group">
            <label style={fLabel}>Fecha de Registro en el Sistema</label>
            <input style={fInp(false)} type="date" value={formData.fecha_registro} onChange={e=>setFormData(p=>({...p,fecha_registro:e.target.value}))}/>
          </div>
          {/* FIX #4: mostrar auditoría */}
          {esEdicion && formData.creado_por && (
            <div className="form-group full-width" style={{background:'#FAF9FF',borderRadius:8,padding:'8px 12px',border:'1px solid #E0D9F5',fontSize:'.82rem',color:'#7A6FA0'}}>
              🔒 Registrado por: <strong>{formData.creado_por}</strong>
            </div>
          )}
          {/* FIX #2: foto del miembro */}
          <div className="form-group full-width">
            <label style={fLabel}><Camera size={13} style={{verticalAlign:'middle',marginRight:4}}/> Foto del Miembro</label>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#6C4FBF,#9B59B6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:'1.1rem',flexShrink:0,overflow:'hidden'}}>
                {(esEdicion?editFotoPreview:fotoPreview) ? (
                  <img src={esEdicion?editFotoPreview:fotoPreview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                ) : iniciales(formData.nombre||'?')}
              </div>
              <div>
                <input type="file" accept="image/*" id={`foto-${esEdicion?'edit':'new'}`} style={{display:'none'}} onChange={e=>handleFotoChange(e,esEdicion)}/>
                <label htmlFor={`foto-${esEdicion?'edit':'new'}`} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 14px',background:'#EDE9FF',color:'#6C4FBF',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:'.82rem'}}>
                  <Camera size={13}/> {(esEdicion?editFotoPreview:fotoPreview)?'Cambiar foto':'Seleccionar foto'}
                </label>
                {(esEdicion?editFotoPreview:fotoPreview)&&<button type="button" onClick={()=>{esEdicion?setEditFotoPreview(null):setFotoPreview(null);setFormData(p=>({...p,foto:null}));}} style={{background:'none',border:'none',color:'#E74C3C',cursor:'pointer',fontSize:'.8rem',marginLeft:8}}>× Quitar</button>}
                <div style={{fontSize:'.74rem',color:'#7A6FA0',marginTop:3}}>JPG, PNG · Máx. 3MB</div>
              </div>
            </div>
          </div>
          <div className="form-group full-width">
            <label style={fLabel}>Notas</label>
            <textarea value={formData.notas} onChange={e=>setFormData(p=>({...p,notas:e.target.value}))} placeholder="Notas adicionales..." rows="2" style={{...fInp(false),resize:'vertical'}}/>
          </div>
        </div>
      )}

      {/* FIX #3: tab de vigencia del cargo */}
      {tabActivo === 'vigencia' && (
        <div className="form-grid">
          <div className="form-group full-width">
            <label style={fLabel}>Cargo *</label>
            <input style={fInp(errors.cargo)} value={formData.cargo} onChange={e=>setFormData(p=>({...p,cargo:e.target.value}))} placeholder="Cargo en la directiva" required/>
            {errors.cargo&&<span style={errMsg}>{errors.cargo}</span>}
          </div>
          {/* FIX #3: fechas del cargo */}
          <div className="form-group">
            <label style={fLabel}><Calendar size={13} style={{verticalAlign:'middle',marginRight:3}}/> Fecha de Inicio en el Cargo *</label>
            <input style={fInp(errors.fecha_inicio_cargo)} type="date" value={formData.fecha_inicio_cargo} onChange={e=>setFormData(p=>({...p,fecha_inicio_cargo:e.target.value}))} required/>
            {errors.fecha_inicio_cargo&&<span style={errMsg}>{errors.fecha_inicio_cargo}</span>}
          </div>
          <div className="form-group">
            <label style={fLabel}><Calendar size={13} style={{verticalAlign:'middle',marginRight:3}}/> Fecha de Finalización Prevista</label>
            <input style={fInp(false)} type="date" value={formData.fecha_fin_cargo} onChange={e=>setFormData(p=>({...p,fecha_fin_cargo:e.target.value}))} min={formData.fecha_inicio_cargo||undefined}/>
            <span style={{fontSize:'.73rem',color:'#7A6FA0',marginTop:2,display:'block'}}>Dejar en blanco si aún está vigente</span>
          </div>
          {/* FIX #3: motivo de salida */}
          {formData.fecha_fin_cargo && (
            <div className="form-group full-width">
              <label style={fLabel}><AlertTriangle size={13} style={{verticalAlign:'middle',marginRight:3}}/> Motivo de Salida / Fin de Cargo</label>
              <textarea style={{...fInp(false),resize:'vertical',minHeight:70}} value={formData.motivo_salida} onChange={e=>setFormData(p=>({...p,motivo_salida:e.target.value}))} placeholder="Ej: Renuncia voluntaria, fin de período, destitución, etc."/>
            </div>
          )}
        </div>
      )}

      <div className="modal-actions">
        {esEdicion && (
          <motion.button type="button" className="btn btn-danger"
            onClick={()=>{const m=miembros.find(x=>x._id===miembroSeleccionado._id);setMiembroAEliminar(m);setShowConfirm(true);}}
            whileHover={{scale:1.05}} whileTap={{scale:.95}}>
            <Trash2 size={16}/> Eliminar
          </motion.button>
        )}
        <motion.button type="button" className="btn-cancelar" onClick={handleCloseModals} whileHover={{scale:1.05}} whileTap={{scale:.95}}><X size={16}/> Cancelar</motion.button>
        <motion.button type="submit" className="btn-guardar" whileHover={{scale:1.05}} whileTap={{scale:.95}}>
          {esEdicion ? <><Save size={16}/> Guardar Cambios</> : <><Check size={16}/> Crear Miembro</>}
        </motion.button>
      </div>
    </form>
  );

  // ── Tabla de miembros ────────────────────────────────────
  const renderTabla = (titulo, lista, icon) => (
    <motion.div className="directiva-categoria-section" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.6}}>
      <motion.div className="directiva-categoria-header" initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:.3}}>
        <h3 className="directiva-subtitulo">{icon} {titulo} ({lista.length})</h3>
      </motion.div>
      {lista.length === 0 ? (
        <motion.p className="directiva-vacio" initial={{opacity:0}} animate={{opacity:1}}>No hay miembros en esta categoría.</motion.p>
      ) : (
        <motion.div className="tabla-directiva" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.5}}>
          <motion.div className="tabla-header" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{delay:.5}}
            style={{gridTemplateColumns:'2fr 1.5fr 1.5fr 1.2fr 1fr 80px'}}>
            <div style={{display:'flex',alignItems:'center',gap:5}}><UserCheck size={14}/> MIEMBRO</div>
            <div style={{display:'flex',alignItems:'center',gap:5}}><Hash size={14}/> IDENTIDAD</div>
            <div style={{display:'flex',alignItems:'center',gap:5}}><Briefcase size={14}/> CARGO</div>
            <div style={{display:'flex',alignItems:'center',gap:5}}><Calendar size={14}/> VIGENCIA</div>
            <div style={{textAlign:'center'}}>ESTADO</div>
            <div style={{textAlign:'center'}}>ACCIÓN</div>
          </motion.div>
          <div className="tabla-body">
            {lista.map((m, idx) => (
              <motion.div key={m._id} className="tabla-fila"
                initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}}
                transition={{delay:Math.min(idx*.05,1),duration:.4,type:"spring",stiffness:100}}
                whileHover={{scale:1.01}}
                style={{gridTemplateColumns:'2fr 1.5fr 1.5fr 1.2fr 1fr 80px'}}>
                {/* Avatar + nombre */}
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#6C4FBF,#9B59B6)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden',fontWeight:800,color:'#fff',fontSize:'.85rem'}}>
                    {m.foto ? <img src={`data:image/jpeg;base64,${m.foto}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : iniciales(m.nombre)}
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:'1rem',color:'#333'}}>{m.nombre}</div>
                    <div style={{fontSize:'.82rem',color:'#666'}}>{m.email}</div>
                    {/* FIX #4: mostrar quién registró y cuándo */}
                    {m.creado_por&&<div style={{fontSize:'.72rem',color:'#aaa'}}>Reg. por {m.creado_por}</div>}
                  </div>
                </div>
                {/* FIX #1: identidad en columna propia */}
                <div style={{fontSize:'.86rem',color:'#555',fontFamily:'monospace'}}>{m.numero_identidad||<span style={{color:'#E74C3C',fontSize:'.78rem',fontFamily:'inherit'}}>⚠ Sin identidad</span>}</div>
                <div style={{fontWeight:600,color:'#667eea',fontSize:'.9rem'}}>{m.cargo}</div>
                {/* FIX #3: vigencia del cargo */}
                <div style={{fontSize:'.8rem',color:'#666'}}>
                  {m.fecha_inicio_cargo && <div>Desde: {new Date(m.fecha_inicio_cargo).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</div>}
                  {m.fecha_fin_cargo    ? <div style={{color:'#b45309'}}>Hasta: {new Date(m.fecha_fin_cargo).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</div> : m.fecha_inicio_cargo&&<div style={{color:'#1a7a40'}}>En curso</div>}
                </div>
                <div style={{display:'flex',justifyContent:'center'}}>
                  <span className={`estado-badge ${m.estado?.toLowerCase()}`}>{m.estado}</span>
                </div>
                <div style={{display:'flex',justifyContent:'center',gap:6}}>
                  <motion.button whileHover={{scale:1.2,rotate:15}} whileTap={{scale:.9}} onClick={e=>{e.stopPropagation();handleOpenEditModal(m);}}
                    style={{background:'none',border:'none',cursor:'pointer',color:'#2196F3',padding:'5px',display:'flex',alignItems:'center'}} title="Editar">
                    <Edit size={18}/>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <>
      <div className="directiva-container">
        {/* Header */}
        <motion.div className="directiva-header" initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} transition={{duration:.7,type:"spring",stiffness:100}}>
          <motion.div className="header-gradient" initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.1,duration:.6}}
            style={{background:"linear-gradient(135deg,#6C4FBF 0%,#9B59B6 100%)",padding:"2.5rem",borderRadius:"20px",boxShadow:"0 10px 30px rgba(108,79,191,.3)",position:"relative",overflow:"hidden"}}>
            <div className="header-content" style={{position:"relative",zIndex:2}}>
              <motion.h2 initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.2,duration:.5}}
                style={{fontSize:"2.4rem",color:"white",fontWeight:800,display:"flex",alignItems:"center",gap:"1rem",marginBottom:".5rem"}}>
                <Users size={36} fill="white" color="white"/>
                Gestión de Directiva
                <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.1,1]}} transition={{duration:2,repeat:Infinity,repeatDelay:5}} style={{marginLeft:'auto'}}>
                  <Award size={32} color="white"/>
                </motion.div>
              </motion.h2>
              <motion.p initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}} transition={{delay:.3,duration:.5}} style={{color:"rgba(255,255,255,.9)",fontSize:"1.1rem",fontWeight:500}}>
                Administra los miembros de la directiva con plena identificación y trazabilidad
              </motion.p>
              <motion.div className="directiva-stats" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.4,duration:.5}}>
                {[
                  {ico:<Users size={22}/>,val:totalMiembros,lbl:'Total'},
                  {ico:<UserCheck size={22}/>,val:miembrosActivos,lbl:'Activos',cls:'active'},
                  {ico:<Clock size={22}/>,val:miembrosInactivos,lbl:'Inactivos',cls:'inactivo'},
                  {ico:<Shield size={22}/>,val:miembrosSuspend,lbl:'Suspendidos',cls:'suspendido'},
                ].map((s,i)=>(
                  <motion.div key={i} className={`stat-card-directiva${s.cls?' '+s.cls:''}`} whileHover={{scale:1.05,y:-2}} transition={{type:"spring",stiffness:300}}>
                    <div className="stat-card-directiva-directiva">{s.ico}</div>
                    <div className="stat-info-directiva"><div className="stat-value-directiva">{s.val}</div><div className="stat-label-directiva">{s.lbl}</div></div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Barra de búsqueda */}
          <motion.div className="directiva-busqueda-bar" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5,duration:.5}} style={{marginTop:"2rem"}}>
            <div style={{position:'relative',flex:1}}>
              <Search size={18} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#666'}}/>
              <input type="text" className="directiva-busqueda" placeholder="Buscar por nombre, cargo, email o identidad..." value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
            </div>
            <div style={{position:'relative'}}>
              <motion.button className="btn-ayuda" onClick={()=>setMostrarMenuFiltros(p=>!p)} whileHover={{scale:1.08}} whileTap={{scale:.95}}><Briefcase size={18}/> Filtros</motion.button>
              <AnimatePresence>
                {mostrarMenuFiltros&&(
                  <motion.div className="filtros-menu" initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:.2}}>
                    {[{v:'ninguno',l:'Sin ordenar'},{v:'nombre-az',l:'Nombre A-Z'},{v:'nombre-za',l:'Nombre Z-A'},{v:'cargo-az',l:'Cargo A-Z'},{v:'estado-activo',l:'Activos Primero'}].map(o=>(
                      <div key={o.v} className={`filtro-opcion${filtroOrden===o.v?' active':''}`} onClick={()=>{setFiltroOrden(o.v);setMostrarMenuFiltros(false);}}>{o.l}</div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <motion.button className="btn-ayuda" onClick={()=>setMostrarAyuda(true)} whileHover={{scale:1.08}} whileTap={{scale:.95}}><HelpCircle size={18}/> Ayuda</motion.button>
            <motion.button className="btn-ayuda" onClick={()=>{setFormData(formVacio());setFotoPreview(null);setErrors({});setTabActivo('info');setMostrarModalCrear(true);}} whileHover={{scale:1.08}} whileTap={{scale:.95}}>
              <Plus size={18}/> Nuevo Miembro
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Contenido */}
        {loading && miembros.length===0 ? (
          <div style={{textAlign:'center',padding:'3rem'}}><Users size={40} color="#6C4FBF"/><p style={{color:'#6C4FBF',fontWeight:600}}>Cargando miembros...</p></div>
        ) : (
          <div className="directiva-categorias-container">
            {renderTabla("Todos los Miembros", miembrosOrdenados, <Users size={20} style={{verticalAlign:'middle',color:'#6C4FBF'}}/>)}
          </div>
        )}
      </div>

      {/* Modal Crear */}
      <AnimatePresence>
        {mostrarModalCrear&&(
          <motion.div className="modal-overlay" onClick={handleCloseModals} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="modal-content" style={{maxWidth:600,maxHeight:'92vh',overflow:'auto'}} onClick={e=>e.stopPropagation()} initial={{scale:.9,y:50}} animate={{scale:1,y:0}} exit={{scale:.9,y:50}} transition={{type:"spring",damping:25}}>
              <h3 className="modal-title"><Plus size={20}/> Agregar Nuevo Miembro</h3>
              {renderFormulario(handleCrearMiembro, false)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar */}
      <AnimatePresence>
        {miembroSeleccionado&&(
          <motion.div className="modal-overlay" onClick={handleCloseModals} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="modal-content" style={{maxWidth:650,maxHeight:'92vh',overflow:'auto'}} onClick={e=>e.stopPropagation()} initial={{scale:.9,y:50}} animate={{scale:1,y:0}} exit={{scale:.9,y:50}} transition={{type:"spring",damping:25}}>
              <h3 className="modal-title"><Edit size={20}/> Editar: {miembroSeleccionado.nombre}</h3>
              {renderFormulario(handleEditarMiembro, true)}
              {showConfirm&&<ConfirmDialog message={`¿Eliminar a "${miembroAEliminar?.nombre}"?`} onConfirm={confirmarEliminacion} onCancel={()=>{setShowConfirm(false);setMiembroAEliminar(null);}} visible={showConfirm}/>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notificaciones */}
      <AnimatePresence>
        {notification&&(
          <motion.div initial={{opacity:0,y:-50}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-50}}
            style={{position:'fixed',top:20,right:20,zIndex:10000,background:notification.type==='success'?'#4CAF50':'#f44336',color:'white',padding:'1rem 1.5rem',borderRadius:12,boxShadow:'0 4px 16px rgba(0,0,0,.15)',display:'flex',alignItems:'center',gap:10,fontFamily:"'Nunito',sans-serif",fontWeight:700}}>
            {notification.message}
            <button onClick={()=>setNotification(null)} style={{background:'none',border:'none',color:'white',cursor:'pointer',padding:'2px',display:'flex'}}><X size={18}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal ayuda */}
      <AnimatePresence>
        {mostrarAyuda&&(
          <div className="horarios-modal-overlay horarios-modal-show">
            <div className="horarios-modal-content">
              <div className="horarios-modal-header">
                <h3 className="horarios-modal-title"><HelpCircle size={24}/> Ayuda - Directiva</h3>
                <button className="horarios-modal-close" onClick={()=>setMostrarAyuda(false)}><X size={20}/></button>
              </div>
              <div className="horarios-modal-body">
                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Campos del miembro</h4>
                  <ul className="horarios-help-list">
                    <li className="horarios-help-item"><strong>Número de Identidad:</strong> Campo obligatorio para identificar plenamente a cada miembro.</li>
                    <li className="horarios-help-item"><strong>Foto:</strong> Foto del miembro para identificación visual en el sistema.</li>
                    <li className="horarios-help-item"><strong>Cargo y Vigencia:</strong> Fecha de inicio, fecha de fin y motivo de salida para trazabilidad completa.</li>
                    <li className="horarios-help-item"><strong>Auditoría:</strong> El sistema registra automáticamente quién ingresó cada miembro.</li>
                  </ul>
                </div>
                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Estados disponibles</h4>
                  <ul className="horarios-help-list">
                    <li className="horarios-help-item"><strong>Activo:</strong> Miembro en funciones actualmente.</li>
                    <li className="horarios-help-item"><strong>Inactivo:</strong> Miembro que ya no ocupa el cargo pero se conserva el registro.</li>
                    <li className="horarios-help-item"><strong>Suspendido:</strong> Miembro en proceso administrativo.</li>
                  </ul>
                </div>
              </div>
              <div className="horarios-modal-footer"><button className="horarios-modal-btn-close" onClick={()=>setMostrarAyuda(false)}>Cerrar</button></div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Directiva;