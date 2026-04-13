import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Donaciones.css"
import { auth } from "..//../components/authentication/Auth";
import { loadingController } from "../../api/loadingController";
import {
  Heart, Music, Music2, BookOpen, Video,
  Apple, Shirt, Pill, Armchair, Wine, Book, Droplet, Package,
  Search, HelpCircle, Plus, Warehouse, Calendar, Hash, Edit, Trash2,
  X, Save, ImagePlus, Upload, AlertCircle, CheckCircle, Ban,
  FileText, Paperclip, Clock, UserCheck, FileCheck,
  DollarSign,
} from 'lucide-react';

import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import WithPermission from '../../components/Permisos/WithPermission';

const API_URL      = process.env.REACT_APP_API_URL + '/api/donaciones';
const API_CATALOGOS = process.env.REACT_APP_API_URL + '/api/catalogos';

// ─── Constantes ──────────────────────────────────────────────────────────────
const ESTADOS = ['Recibida', 'Pendiente', 'Procesada', 'Anulada'];

const S = {
  sec:   { marginBottom: 24 },
  title: { display:'flex', alignItems:'center', gap:8, fontFamily:'Poppins,sans-serif', fontSize:'.88rem', fontWeight:700, color:'#6C4FBF', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #E0D9F5' },
  grid:  { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:13 },
  full:  { gridColumn:'1/-1' },
  field: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:'.77rem', fontWeight:700, color:'#7A6FA0', textTransform:'uppercase', letterSpacing:'.04em' },
  req:   { color:'#E74C3C' },
  inp:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:e?'#FFF8F8':'#FAF9FF', outline:'none', width:'100%', transition:'border-color .2s' }),
  inpRO: { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#6C4FBF', fontWeight:700, background:'#F0ECFF', outline:'none', width:'100%' },
  sel:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%' }),
  ta:    { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%', resize:'vertical', minHeight:90 },
  errMsg:{ fontSize:'.73rem', color:'#E74C3C', fontWeight:600 },
  banner:{ display:'flex', gap:10, alignItems:'flex-start', padding:'11px 14px', borderRadius:10, marginBottom:14, fontSize:'.85rem', background:'#FDE8E8', borderLeft:'4px solid #E74C3C', color:'#7a1010' },
  info:  { display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', borderRadius:9, marginBottom:12, fontSize:'.84rem', background:'#E8F4FD', borderLeft:'4px solid #2980B9', color:'#0c4a6e' },
  foot:  { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #E0D9F5', marginTop:8 },
  btn:   (bg, col='#fff') => ({ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, fontSize:'.86rem', fontWeight:700, border:'none', cursor:'pointer', background:bg, color:col, fontFamily:'inherit', transition:'all .18s' }),
  upload:{ border:'2px dashed #C4B5E8', borderRadius:12, padding:'26px 20px', textAlign:'center', background:'#FAF9FF' },
  card:  { background:'#F4F3FB', border:'1px solid #E0D9F5', borderRadius:12, padding:'14px 16px', marginBottom:12, position:'relative' },
  cardTitle: { fontFamily:'Poppins,sans-serif', fontSize:'.82rem', fontWeight:700, color:'#6C4FBF', marginBottom:10, display:'flex', alignItems:'center', gap:6 },
  delBtn:{ position:'absolute', top:10, right:10, background:'#FDE8E8', color:'#E74C3C', border:'none', borderRadius:7, padding:'5px 8px', cursor:'pointer', fontSize:'.8rem', fontWeight:700, display:'flex', alignItems:'center', gap:4 },
};

const estadoConfig = {
  Recibida:  { color: '#27ae60', bg: '#eafaf1', label: 'RECIBIDA'  },
  Pendiente: { color: '#f39c12', bg: '#fef9e7', label: 'PENDIENTE' },
  Procesada: { color: '#2980b9', bg: '#ebf5fb', label: 'PROCESADA' },
  Anulada:   { color: '#e74c3c', bg: '#fdedec', label: 'ANULADA'   },
};

const fmt    = (n) => Number(n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString('es-HN');

const valorDonacion = (don) =>
  parseFloat(don.valor_total) ||
  (parseFloat(don.precio_unitario || 0) * parseFloat(don.cantidad_donacion || 0));

// ─── Stats del header — se calculan sobre la lista YA FILTRADA ───────────────
const getHeaderStats = (filtradas, hayFiltro) => {
  const hoy      = new Date();
  const mes      = hoy.getMonth();
  const anio     = hoy.getFullYear();
  const mesLabel = hoy.toLocaleString('es-HN', { month: 'long' });

  const nuevasMes = filtradas.filter(d => {
    const raw = d.fecha_ingreso || d.createdAt;
    if (!raw) return false;
    const f = new Date(raw);
    return !isNaN(f) && f.getMonth() === mes && f.getFullYear() === anio;
  }).length;

  const activas    = filtradas.filter(d => ['Recibida','Pendiente','Procesada'].includes(d.estado)).length;
  const valorTotal = filtradas.filter(d => d.estado !== 'Anulada').reduce((s,d) => s + valorDonacion(d), 0);
  const totalLbl   = hayFiltro ? 'Filtradas' : 'Total Donaciones';

  return [
    { ico: <Package size={18} color="white"/>,     val: filtradas.length,        lbl: totalLbl                      },
    { ico: <CheckCircle size={18} color="white"/>, val: activas,                 lbl: 'Activas'                     },
    { ico: <UserCheck size={18} color="white"/>,   val: nuevasMes,               lbl: `Nuevas (${mesLabel} ${anio})` },
    { ico: <DollarSign size={18} color="white"/>,  val: `L. ${fmt(valorTotal)}`, lbl: 'Valor Total Activos'         },
  ];
};

// ─── Componente ───────────────────────────────────────────────────────────────
const Donaciones = () => {
  const [donaciones,           setDonaciones]           = useState([]);
  const [busqueda,             setBusqueda]             = useState('');
  const [filtroEstado,         setFiltroEstado]         = useState('Todos');
  const [fechaDesde,           setFechaDesde]           = useState('');
  const [fechaHasta,           setFechaHasta]           = useState('');
  const [mostrarModal,         setMostrarModal]         = useState(false);
  const [mostrarModalEditar,   setMostrarModalEditar]   = useState(false);
  const [mostrarAyuda,         setMostrarAyuda]         = useState(false);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [donEliminarDirecto,   setDonEliminarDirecto]   = useState(null);
  const [notification,         setNotification]         = useState(null);
  const [tabActiva,            setTabActiva]            = useState('datos');
  const [hasUnsavedChanges,    setHasUnsavedChanges]    = useState(false);
  const [showConfirm,          setShowConfirm]          = useState(false);
  const [showConfirmClose,     setShowConfirmClose]     = useState(false);
  const [showConfirmAnular,    setShowConfirmAnular]    = useState(false);
  const [paginaActual,         setPaginaActual]         = useState(1);
  const [seleccionados,        setSeleccionados]        = useState([]);
  const [erroresCampos,        setErroresCampos]        = useState({});
  const [intentoGuardar,       setIntentoGuardar]       = useState(false);

  // ── Catálogos dinámicos (igual que Personal) ───────────────────────────────
  const [catTipoDonacion, setCatTipoDonacion] = useState([]);
  const [catAlmacen,      setCatAlmacen]      = useState([]);

  const POR_PAGINA = 10;

  const emptyForm = () => ({
    tipo_donacion:     '',
    cantidad_donacion: '',
    precio_unitario:   '',
    descripcion:       '',
    observaciones:     '',
    id_almacen:        '',
    fecha:             new Date().toISOString().split('T')[0],
    estado:            'Recibida',
    imagen:            null,
    foto_preview:      null,
    documento:         null,
    documento_nombre:  '',
  });

  const [formData, setFormData] = useState(emptyForm());

  const valorCalculado = (parseFloat(formData.precio_unitario) || 0) * (parseFloat(formData.cantidad_donacion) || 0);

  // ── Carga de donaciones ────────────────────────────────────────────────────
  useEffect(() => {
    cargarDonaciones();
    const interval = setInterval(cargarDonaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Carga de catálogos dinámicos (igual que Personal) ─────────────────────
  useEffect(() => {
    const cargarCatalogos = async () => {
      const cargarCat = async (endpoint, setter) => {
        try {
          const res = await fetch(`${API_CATALOGOS}/donaciones/${endpoint}`);
          if (!res.ok) return;
          const data = await res.json();
          const arr  = Array.isArray(data) ? data : data.data;
          if (arr && arr.length > 0) {
            setter(arr.map(item => ({
              valor:    item.valor,
              etiqueta: item.etiqueta || item.valor,
            })));
          }
        } catch (err) {
          console.error(`Error cargando catálogo ${endpoint}:`, err);
        }
      };

      await Promise.all([
        cargarCat('tipo_donacion', setCatTipoDonacion),
        cargarCat('id_almacen',   setCatAlmacen),
      ]);
    };
    cargarCatalogos();
  }, []);

  useEffect(() => {
    return () => { if (formData.foto_preview?.startsWith('blob:')) URL.revokeObjectURL(formData.foto_preview); };
  }, [formData.foto_preview]);

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No estás autenticado');
    return user.getIdToken(true);
  };

  const getLocalDate = (utcDate) => {
    if (!utcDate) return "";
    const date = new Date(utcDate);
    const offsetMs = -6 * 60 * 60 * 1000;
    const localDate = new Date(date.getTime() + offsetMs);
    const day   = String(localDate.getUTCDate()).padStart(2, "0");
    const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const year  = localDate.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const cargarDonaciones = async () => {
    try {
      const token = await getToken();
      loadingController.start();
      const res   = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al cargar donaciones');
      const result = await res.json();
      setDonaciones(Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []);
    } catch (err) {
      console.error(err);
      mostrarNotificacion('Error al cargar las donaciones', 'error');
      setDonaciones([]);
    } finally { loadingController.stop(); }
  };

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ message: mensaje, type: tipo });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Helpers de catálogo — reemplazan los mapas hardcodeados ───────────────
  // Devuelve la etiqueta de un almacén dado su valor (id)
  const getNombreAlmacen = (id) => {
    if (catAlmacen.length > 0) {
      const found = catAlmacen.find(a => String(a.valor) === String(id));
      return found ? found.etiqueta : `Almacén ${id}`;
    }
    // Fallback mientras carga
    return { 1:'Almacén 1', 2:'Almacén 2', 3:'Almacén 3', 4:'Almacén 4', 5:'Almacén 5' }[id] || `Almacén ${id}`;
  };

const getColorAlmacen = () => '#9b59b6'

  // ── Validación campo a campo ──────────────────────────────────────────────
  const validarCampos = (data) => {
    const errs = {};
    if (!data.tipo_donacion)
      errs.tipo_donacion = 'Selecciona un tipo de donación';
    if (!data.cantidad_donacion || Number(data.cantidad_donacion) <= 0)
      errs.cantidad_donacion = 'Ingresa una cantidad válida (> 0)';
    if (!data.id_almacen)
      errs.id_almacen = 'Selecciona un almacén';
    if (!data.fecha)
      errs.fecha = 'Selecciona la fecha de donación';
    else {
      const f = new Date(data.fecha); const hoy = new Date(); hoy.setHours(0,0,0,0);
      if (f > hoy) errs.fecha = 'La fecha no puede ser futura';
    }
    return errs;
  };

  const tabDeCampo = {
    tipo_donacion: 'datos', cantidad_donacion: 'datos',
    id_almacen: 'datos', fecha: 'datos',
  };

  const tabTieneError = (tabKey) =>
    Object.keys(erroresCampos).some(c => tabDeCampo[c] === tabKey);

  // ── Form ───────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
    if (intentoGuardar && erroresCampos[name]) {
      setErroresCampos(prev => { const n = {...prev}; delete n[name]; return n; });
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5*1024*1024) { mostrarNotificacion('La imagen no debe superar 5MB','error'); return; }
    if (!file.type.startsWith('image/')) { mostrarNotificacion('Solo imágenes','error'); return; }
    if (formData.foto_preview?.startsWith('blob:')) URL.revokeObjectURL(formData.foto_preview);
    setFormData(prev => ({ ...prev, imagen: file, foto_preview: URL.createObjectURL(file) }));
    setHasUnsavedChanges(true);
  };

  const handleDocumentoChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const ok = ['application/pdf','image/jpeg','image/png','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!ok.includes(file.type)) { mostrarNotificacion('Formatos: PDF, JPG, PNG, DOC, DOCX','error'); return; }
    if (file.size > 10*1024*1024) { mostrarNotificacion('El documento no debe superar 10MB','error'); return; }
    setFormData(prev => ({ ...prev, documento: file, documento_nombre: file.name }));
    setHasUnsavedChanges(true);
  };

  const eliminarFoto = () => {
    if (formData.foto_preview?.startsWith('blob:')) URL.revokeObjectURL(formData.foto_preview);
    setFormData(prev => ({ ...prev, imagen: null, foto_preview: null }));
    setHasUnsavedChanges(true);
  };

  // ── Modales ────────────────────────────────────────────────────────────────
  const handleCloseModals = () => { hasUnsavedChanges ? setShowConfirmClose(true) : closeModals(); };

  const closeModals = () => {
    setMostrarModal(false); setMostrarModalEditar(false);
    setDonacionSeleccionada(null); setHasUnsavedChanges(false);
    setShowConfirmClose(false); setShowConfirm(false); setShowConfirmAnular(false);
    setErroresCampos({}); setIntentoGuardar(false);
    setTabActiva('datos');
    if (formData.foto_preview?.startsWith('blob:')) URL.revokeObjectURL(formData.foto_preview);
    setFormData(emptyForm());
  };

  const handleNuevaDonacion = () => { setFormData(emptyForm()); setHasUnsavedChanges(false); setTabActiva('datos'); setMostrarModal(true); };

  const handleFilaClick = (don) => {
    setDonacionSeleccionada(don);
    setFormData({
      tipo_donacion:     don.tipo_donacion     || '',
      cantidad_donacion: don.cantidad_donacion || '',
      precio_unitario:   don.precio_unitario   || '',
      descripcion:       don.descripcion       || '',
      observaciones:     don.observaciones     || '',
      id_almacen:        don.id_almacen        || '',
      fecha:             don.fecha ? new Date(don.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      estado:            don.estado            || 'Recibida',
      imagen:            null,
      foto_preview:      don.imagen ? `data:image/jpeg;base64,${don.imagen}` : null,
      documento:         null,
      documento_nombre:  don.documento_nombre  || '',
    });
    setHasUnsavedChanges(false); setTabActiva('datos'); setMostrarModalEditar(true);
  };

  const buildFd = (data) => {
    const fd = new FormData();
    fd.append('tipo_donacion',     data.tipo_donacion);
    fd.append('cantidad_donacion', data.cantidad_donacion);
    fd.append('precio_unitario',   data.precio_unitario || 0);
    fd.append('valor_total',       ((parseFloat(data.precio_unitario)||0)*(parseFloat(data.cantidad_donacion)||0)).toFixed(2));
    fd.append('descripcion',       data.descripcion  || '');
    fd.append('observaciones',     data.observaciones || '');
    fd.append('id_almacen',        data.id_almacen);
    fd.append('fecha',             data.fecha);
    fd.append('estado',            data.estado || 'Recibida');
    if (data.imagen)    fd.append('imagen',    data.imagen);
    if (data.documento) fd.append('documento', data.documento);
    return fd;
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmitNueva = async (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    const errs = validarCampos(formData);
    if (Object.keys(errs).length > 0) {
      setErroresCampos(errs);
      const primerCampo = Object.keys(errs)[0];
      if (tabDeCampo[primerCampo]) setTabActiva(tabDeCampo[primerCampo]);
      mostrarNotificacion('Revisa los campos marcados en rojo','error');
      return;
    }
    setErroresCampos({});
    try {
      const token = await getToken();
      const res   = await fetch(API_URL, { method:'POST', body:buildFd(formData), headers:{Authorization:`Bearer ${token}`} });
      const data  = await res.json();
      if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
      setHasUnsavedChanges(false);
      mostrarNotificacion('¡Donación registrada exitosamente!','success');
      closeModals(); await cargarDonaciones();
    } catch (err) { mostrarNotificacion(err.message||'Error al guardar','error'); }
  };

  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    if (!donacionSeleccionada) return;
    if (donacionSeleccionada.estado === 'Anulada') { mostrarNotificacion('No se puede editar una donación anulada','error'); return; }
    setIntentoGuardar(true);
    const errs = validarCampos(formData);
    if (Object.keys(errs).length > 0) {
      setErroresCampos(errs);
      const primerCampo = Object.keys(errs)[0];
      if (tabDeCampo[primerCampo]) setTabActiva(tabDeCampo[primerCampo]);
      mostrarNotificacion('Revisa los campos marcados en rojo','error');
      return;
    }
    setErroresCampos({});
    try {
      const token = await getToken();
      const res   = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, { method:'PUT', body:buildFd(formData), headers:{Authorization:`Bearer ${token}`} });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      setHasUnsavedChanges(false);
      mostrarNotificacion('¡Donación actualizada exitosamente!','success');
      closeModals(); await cargarDonaciones();
    } catch (err) { mostrarNotificacion(err.message||'Error al actualizar','error'); }
  };

  const prepararEliminacion = (don = null) => {
    if (don) setDonEliminarDirecto(don);
    setShowConfirm(true);
  };

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    const target = donEliminarDirecto || donacionSeleccionada;
    if (!target) return;
    try {
      const token = await getToken();
      const res   = await fetch(`${API_URL}/${target.id_donacion}`, { method:'DELETE', headers:{Authorization:`Bearer ${token}`} });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      setHasUnsavedChanges(false);
      mostrarNotificacion('Donación eliminada exitosamente','success');
      setDonEliminarDirecto(null); closeModals(); await cargarDonaciones();
    } catch (err) { mostrarNotificacion(err.message||'Error al eliminar','error'); }
  };

  const prepararAnulacion = () => { if (donacionSeleccionada) setShowConfirmAnular(true); };

  const confirmarAnulacion = async () => {
    setShowConfirmAnular(false);
    if (!donacionSeleccionada) return;
    try {
      const token = await getToken();
      const fd = new FormData();
      Object.entries({
        tipo_donacion:     donacionSeleccionada.tipo_donacion,
        cantidad_donacion: donacionSeleccionada.cantidad_donacion,
        precio_unitario:   donacionSeleccionada.precio_unitario || 0,
        valor_total:       donacionSeleccionada.valor_total || 0,
        descripcion:       donacionSeleccionada.descripcion || '',
        observaciones:     donacionSeleccionada.observaciones || '',
        id_almacen:        donacionSeleccionada.id_almacen,
        fecha:             donacionSeleccionada.fecha || new Date().toISOString(),
        estado:            'Anulada',
      }).forEach(([k,v]) => fd.append(k,v));
      const res = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, { method:'PUT', body:fd, headers:{Authorization:`Bearer ${token}`} });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      mostrarNotificacion('Donación anulada. El registro se conserva.','success');
      closeModals(); await cargarDonaciones();
    } catch (err) { mostrarNotificacion(err.message||'Error al anular','error'); }
  };

  // ── Helpers visuales ───────────────────────────────────────────────────────
  const getIconoTipo = (tipo) => ({
    'Alimentos':<Apple size={18}/>, 'Vestimenta':<Shirt size={18}/>, 'Medicina':<Pill size={18}/>,
    'Enseres':<Armchair size={18}/>, 'Bebidas':<Wine size={18}/>, 'Útiles escolares':<Book size={18}/>,
    'Productos de higiene':<Droplet size={18}/>, 'Instrumentos musicales':<Music size={18}/>,
    'Accesorios musicales':<Music2 size={18}/>, 'Material Audiovisual':<Video size={18}/>,
    'Material didactico':<BookOpen size={18}/>, 'Otro':<Package size={18}/>,
  }[tipo] || <Package size={18}/>);

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const toLocalDate = (fechaStr, incluirHoraFin = false) => {
    if (!fechaStr) return null;
    let fecha = new Date(fechaStr);
    if (incluirHoraFin) {
      fecha = new Date(`${fechaStr}T23:59:59`);
    }
    return new Date(fecha.getTime() - 6 * 60 * 60 * 1000);
  };

  const donacionesFiltradas = donaciones.filter(d => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || d.tipo_donacion?.toLowerCase().includes(q) ||
                   d.descripcion?.toLowerCase().includes(q) ||
                   getNombreAlmacen(d.id_almacen).toLowerCase().includes(q);
    const matchE = filtroEstado === 'Todos' || d.estado === filtroEstado;

    const fech         = d.fecha ? toLocalDate(d.fecha) : null;
    const fechaDesdeDate = fechaDesde ? toLocalDate(fechaDesde) : null;
    const fechaHastaDate = fechaHasta ? toLocalDate(fechaHasta, true) : null;

    const matchD = !fechaDesdeDate || (fech && fech >= fechaDesdeDate);
    const matchH = !fechaHastaDate || (fech && fech <= fechaHastaDate);

    return matchQ && matchE && matchD && matchH;
  });

  const hayFiltro = !!(fechaDesde || fechaHasta || filtroEstado !== 'Todos' || busqueda);
  const stats = getHeaderStats(donacionesFiltradas, hayFiltro);
  const limpiarFechas = () => { setFechaDesde(''); setFechaHasta(''); setPaginaActual(1); };

  const valorFiltrados = donacionesFiltradas.filter(d=>d.estado!=='Anulada').reduce((s,d)=>s+valorDonacion(d),0);

  const totalPaginas = Math.max(1, Math.ceil(donacionesFiltradas.length / POR_PAGINA));
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const paginados    = donacionesFiltradas.slice((paginaSegura-1)*POR_PAGINA, paginaSegura*POR_PAGINA);

  // ── Helper: clase CSS de campo con error ─────────────────────────────────
  const clsField = (campo) => erroresCampos[campo] ? ' dn-field-error' : '';

  // ── Tabs formulario ────────────────────────────────────────────────────────
  const renderFormTabs = () => (
    <>
      <div className="dn-modal-tabs">
        {[
          {key:'datos',     label:'Datos',      ico:<FileText size={14}/>  },
          {key:'imagen',    label:'Fotografía', ico:<ImagePlus size={14}/> },
          {key:'docs',      label:'Documentos', ico:<Paperclip size={14}/> },
          {key:'auditoria', label:'Auditoría',  ico:<Clock size={14}/>     },
        ].map(t => (
          <button key={t.key} type="button"
            className={`dn-tab-btn${tabActiva===t.key?' active':''}${tabTieneError(t.key)?' has-error':''}`}
            onClick={()=>setTabActiva(t.key)}>
            {t.ico} {t.label}
            {tabTieneError(t.key) && <span className="dn-tab-error-dot" aria-label="campos requeridos"/>}
          </button>
        ))}
      </div>

      {/* Datos */}
      {tabActiva==='datos' && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Identificación de la Donación</div>
          <div className="dn-form-grid">

            {/* ── Tipo de Donación — dinámico desde catálogo ── */}
            <div className={`dn-form-group${clsField('tipo_donacion')}`}>
              <label>Tipo de Donación <span className="req">*</span></label>
              <select name="tipo_donacion" value={formData.tipo_donacion} onChange={handleInputChange} required
                className={erroresCampos.tipo_donacion ? 'dn-input-err' : ''}>
                <option value="">Seleccionar tipo</option>
                {catTipoDonacion.map(t => (
                  <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
                ))}
              </select>
              {erroresCampos.tipo_donacion && <span className="dn-err-msg">{erroresCampos.tipo_donacion}</span>}
            </div>

            <div className="dn-form-group">
              <label>Estado <span className="req">*</span></label>
              <select name="estado" value={formData.estado} onChange={handleInputChange} required>
                {ESTADOS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className={`dn-form-group${clsField('cantidad_donacion')}`}>
              <label>Cantidad <span className="req">*</span></label>
              <input type="number" name="cantidad_donacion" value={formData.cantidad_donacion}
                onChange={handleInputChange} min="1" placeholder="Ej. 100" required
                className={erroresCampos.cantidad_donacion ? 'dn-input-err' : ''}/>
              {erroresCampos.cantidad_donacion && <span className="dn-err-msg">{erroresCampos.cantidad_donacion}</span>}
            </div>

            <div className="dn-form-group">
              <label>Precio Unitario (L.) <span className="req">*</span></label>
              <input type="number" name="precio_unitario" value={formData.precio_unitario}
                onChange={handleInputChange} min="0" step="0.01" placeholder="0.00"/>
            </div>

            {/* Valor calculado */}
            <div className="dn-form-group dn-full">
              <div className="dn-valor-total-box">
                <span className="dn-vt-label"><DollarSign size={14}/> Valor Total Calculado</span>
                <span className="dn-vt-value">L. {fmt(valorCalculado)}</span>
                <span className="dn-vt-hint">{fmtInt(formData.cantidad_donacion||0)} unid. × L. {fmt(formData.precio_unitario||0)}</span>
              </div>
            </div>

            {/* ── Almacén — dinámico desde catálogo ── */}
            <div className={`dn-form-group${clsField('id_almacen')}`}>
              <label>Almacén <span className="req">*</span></label>
              <select name="id_almacen" value={formData.id_almacen} onChange={handleInputChange} required
                className={erroresCampos.id_almacen ? 'dn-input-err' : ''}>
                <option value="">Seleccionar almacén</option>
                {catAlmacen.map(a => (
                  <option key={a.valor} value={a.valor}>{a.etiqueta}</option>
                ))}
              </select>
              {erroresCampos.id_almacen && <span className="dn-err-msg">{erroresCampos.id_almacen}</span>}
            </div>

            <div className={`dn-form-group${clsField('fecha')}`}>
              <label>Fecha de Donación <span className="req">*</span></label>
              <input type="date" name="fecha" value={formData.fecha}
                onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} required
                className={erroresCampos.fecha ? 'dn-input-err' : ''}/>
              {erroresCampos.fecha
                ? <span className="dn-err-msg">{erroresCampos.fecha}</span>
                : <small className="dn-hint">Fecha real de recepción</small>}
            </div>

            <div className="dn-form-group dn-full">
              <label>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange}
                placeholder="Describe la donación..." maxLength="1000" rows={3}/>
              <small className="dn-char">{formData.descripcion.length}/1000</small>
            </div>

            <div className="dn-form-group dn-full">
              <label>Observaciones</label>
              <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange}
                placeholder="Notas adicionales..." maxLength="500" rows={2}/>
              <small className="dn-char">{formData.observaciones.length}/500</small>
            </div>
          </div>
        </div>
      )}

      {/* Imagen */}
      {tabActiva==='imagen' && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Fotografía de la Donación</div>
          <div className="dn-upload-area">
            {formData.foto_preview ? (
              <div className="dn-preview-wrap">
                <img src={formData.foto_preview} alt="Preview" className="dn-img-preview"/>
                <div className="dn-preview-actions">
                  <input type="file" accept="image/*" onChange={handleFotoChange} style={{display:'none'}} id="foto-replace"/>
                  <label htmlFor="foto-replace" className="dn-btn-secondary"><Upload size={15}/> Cambiar foto</label>
                  <button type="button" className="dn-btn-danger-sm" onClick={eliminarFoto}><X size={15}/> Eliminar</button>
                </div>
              </div>
            ) : (
              <div className="dn-upload-empty">
                <Upload size={42} color="#9b59b6" style={{marginBottom:'0.75rem'}}/>
                <p>Arrastra una imagen o haz clic para seleccionar</p>
                <input type="file" accept="image/*" onChange={handleFotoChange} style={{display:'none'}} id="foto-upload"/>
                <label htmlFor="foto-upload" className="dn-btn-primary-sm"><ImagePlus size={16}/> Seleccionar imagen</label>
                <small>JPG, PNG, WEBP — máx. 5 MB</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documentos */}
      {tabActiva==='docs' && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Documentos Adjuntos (Google Drive)</div>
          <p className="dn-docs-hint">Adjunta el acta de recepción, la firma del donante u otro respaldo oficial.</p>
          <div className="dn-upload-area">
            {formData.documento_nombre ? (
              <div className="dn-doc-preview">
                <FileCheck size={36} color="#27ae60"/>
                <div className="dn-doc-info">
                  <strong>{formData.documento_nombre}</strong>
                  {formData.documento && <span>{(formData.documento.size/1024).toFixed(1)} KB</span>}
                </div>
                <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem'}}>
                  {donacionSeleccionada?.documento_url && (
                    <a href={donacionSeleccionada.documento_url} target="_blank" rel="noreferrer" className="dn-btn-secondary">Ver en Drive</a>
                  )}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocumentoChange} style={{display:'none'}} id="doc-replace"/>
                  <label htmlFor="doc-replace" className="dn-btn-secondary"><Upload size={14}/> Reemplazar</label>
                </div>
              </div>
            ) : (
              <div className="dn-upload-empty">
                <Paperclip size={42} color="#9b59b6" style={{marginBottom:'0.75rem'}}/>
                <p>Adjunta el acta de recepción o firma del donante</p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleDocumentoChange} style={{display:'none'}} id="doc-upload"/>
                <label htmlFor="doc-upload" className="dn-btn-primary-sm"><Paperclip size={16}/> Seleccionar documento</label>
                <small>PDF, JPG, PNG, DOC, DOCX — máx. 10 MB</small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auditoría */}
      {tabActiva==='auditoria' && donacionSeleccionada && (
        <div className="dn-tab-content">
          <div className="dn-form-section-title">Auditoría del Bien</div>
          <div className="dn-audit-card">
            <div className="dn-audit-row">
              <UserCheck size={16} className="dn-audit-ico"/>
              <div>
                <div className="dn-audit-label">Creación</div>
                <div className="dn-audit-val">
                  Creado por: <strong>{donacionSeleccionada.creado_por_email||donacionSeleccionada.creado_por||'N/D'}</strong>
                  &nbsp;·&nbsp;
                  Fecha registro: <strong>{donacionSeleccionada.fecha_ingreso ? new Date(donacionSeleccionada.fecha_ingreso).toLocaleString('es-HN') : donacionSeleccionada.createdAt ? new Date(donacionSeleccionada.createdAt).toLocaleString('es-HN') : 'N/D'}</strong>
                </div>
              </div>
            </div>
            {donacionSeleccionada.updatedAt && (
              <div className="dn-audit-row">
                <Clock size={16} className="dn-audit-ico"/>
                <div>
                  <div className="dn-audit-label">Última Actualización</div>
                  <div className="dn-audit-val">
                    Por: <strong>{donacionSeleccionada.actualizado_por_email||donacionSeleccionada.actualizado_por||'N/D'}</strong>
                    &nbsp;·&nbsp;
                    <strong>{new Date(donacionSeleccionada.updatedAt).toLocaleString('es-HN')}</strong>
                  </div>
                </div>
              </div>
            )}
            <div className="dn-audit-ids">
              <small>ID: <strong>#{donacionSeleccionada.id_donacion}</strong></small>
              <small>Estado: <strong>{donacionSeleccionada.estado||'N/D'}</strong></small>
              {donacionSeleccionada.precio_unitario && <small>Precio unit.: <strong>L. {fmt(donacionSeleccionada.precio_unitario)}</strong></small>}
              {donacionSeleccionada.valor_total     && <small>Valor total: <strong>L. {fmt(donacionSeleccionada.valor_total)}</strong></small>}
            </div>
          </div>
        </div>
      )}
      {tabActiva==='auditoria' && !donacionSeleccionada && (
        <div className="dn-tab-content">
          <p style={{color:'#999',textAlign:'center',padding:'2rem'}}>La auditoría estará disponible luego de guardar la donación.</p>
        </div>
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="dn-root">

        {/* ══ HEADER ══ */}
        <motion.div className="mm-header"
          initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
          transition={{duration:0.5,type:'spring',stiffness:120}}>
          <div className="mm-hi">
            <div className="mm-ht">
              <motion.div className="mm-htitle"
                initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{delay:0.15}}>
                <motion.span initial={{rotate:-180,scale:0}} animate={{rotate:0,scale:1}}
                  transition={{type:'spring',stiffness:200,delay:0.2}}>
                  <Heart size={34} color="white" fill="white"/>
                </motion.span>
                Sistema de Donaciones
              </motion.div>
            </div>
            <motion.p className="mm-sub" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}>
              Gestiona y controla todas las donaciones recibidas con eficiencia
            </motion.p>
            <motion.div className="mm-stats" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
              {stats.map((s,i)=>(
                <motion.div key={i} className="mm-stat"
                  whileHover={{scale:1.04,y:-2}} transition={{type:'spring',stiffness:300}}>
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

        {/* ══ BARRA ACCIONES ══ */}
        <motion.div className="dn-action-bar"
          initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.45}}>

          <div className="dn-search-wrap">
            <Search size={16} className="dn-search-ico"/>
            <input type="text" className="dn-search"
              placeholder="Buscar por tipo, descripción o almacén..."
              value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPaginaActual(1);}}/>
          </div>

          <div className="dn-filtros">
            <span className="dn-filtros-label">ESTADO:</span>
            {['Todos',...ESTADOS].map(est=>(
              <button key={est} className={`dn-filtro-btn${filtroEstado===est?' active':''}`}
                onClick={()=>{setFiltroEstado(est);setPaginaActual(1);}}>{ est}</button>
            ))}
          </div>

          {/* Rango de fechas */}
          <div className="dn-fecha-rango">
            <span className="dn-filtros-label"><Calendar size={12}/> FECHA:</span>
            <input type="date" className="dn-fecha-input" value={fechaDesde}
              onChange={e=>setFechaDesde(e.target.value)} title="Desde"/>
            <span className="dn-fecha-sep">→</span>
            <input type="date" className="dn-fecha-input" value={fechaHasta}
              onChange={e=>setFechaHasta(e.target.value)} title="Hasta"/>
            {(fechaDesde||fechaHasta) && (
              <button className="dn-fecha-clear" onClick={limpiarFechas} title="Limpiar">
                <X size={12}/>
              </button>
            )}
          </div>

          <div className="dn-bar-actions">
            <motion.button style={S.btn('#E0D9F5','#6C4FBF')} onClick={()=>setMostrarAyuda(true)}
              whileHover={{scale:1.05}} whileTap={{scale:0.96}}>
              <HelpCircle size={16}/> Ayuda
            </motion.button>
            <WithPermission requiredPermissions={"CREAR_DONACIONES"}>
            <motion.button className="dn-btn-new" onClick={handleNuevaDonacion}
              whileHover={{scale:1.05}} whileTap={{scale:0.96}}>
              <Plus size={16}/> Nueva Donación
            </motion.button>
            </WithPermission>
          </div>
        </motion.div>

        {/* ══ TABLA ══ */}
        <div className="dn-table-wrap">
          {donacionesFiltradas.length === 0 ? (
            <motion.div className="dn-empty" initial={{opacity:0}} animate={{opacity:1}}>
              <Package size={56} color="#ccc"/>
              <p>No se encontraron donaciones</p>
            </motion.div>
          ) : (
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>
              <div className="dn-card">
                {/* Meta */}
                <div className="dn-card-meta">
                  Mostrando <strong>{Math.min((paginaActual-1)*POR_PAGINA+1, donacionesFiltradas.length)}–{Math.min(paginaActual*POR_PAGINA, donacionesFiltradas.length)}</strong> de <strong>{donacionesFiltradas.length}</strong> donaciones
                  {hayFiltro && <span className="dn-meta-badge">filtrado</span>}
                </div>

                {/* Tabla */}
                <table className="dn-bienes-table">
                  <thead>
                    <tr>
                      <th>ID ↑</th>
                      <th>TIPO &amp; DESCRIPCIÓN</th>
                      <th>ALMACÉN</th>
                      <th>F. DONACIÓN</th>
                      <th style={{textAlign:'right'}}>CANTIDAD</th>
                      <th style={{textAlign:'right'}}>VALOR</th>
                      <th style={{textAlign:'center'}}>ESTADO</th>
                      <th style={{textAlign:'center'}}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {paginados.map((don,idx) => {
                        const est   = estadoConfig[don.estado] || estadoConfig.Recibida;
                        const valor = valorDonacion(don);
                        const selId = don._id || don.id_donacion;
                        const selec = seleccionados.includes(selId);
                        return (
                          <motion.tr key={selId}
                            className={`dn-bienes-tr${don.estado==='Anulada'?' anulada':''}${selec?' selected':''}`}
                            initial={{opacity:0,x:-12}} animate={{opacity:1,x:0}}
                            exit={{opacity:0}} transition={{delay:idx*0.02}}
                            onClick={()=>handleFilaClick(don)}
                            style={{cursor:'pointer'}}>
                            <td>
                              <span className="dn-id-badge">DON-{String(don.id_donacion||idx+1).padStart(4,'0')}</span>
                            </td>
                            <td>
                              <div className="dn-tipo-cell">
                                <span className="dn-tipo-ico">{getIconoTipo(don.tipo_donacion)}</span>
                                <div>
                                  <div className="dn-tipo-name">{don.tipo_donacion}</div>
                                  <div className="dn-tipo-desc">{don.descripcion||'Sin descripción'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="dn-badge-almacen" style={{background:getColorAlmacen(don.id_almacen)}}>
                                {getNombreAlmacen(don.id_almacen)}
                              </span>
                            </td>
                            <td className="dn-td-fecha">
                              {getLocalDate(don.fecha)}
                            </td>
                            <td style={{textAlign:'right',fontWeight:600,color:'#2d3436'}}>
                              {fmtInt(don.cantidad_donacion)}
                            </td>
                            <td style={{textAlign:'right',fontWeight:700,color:'#27ae60',fontSize:'0.97rem'}}>
                              L {fmt(valor)}
                            </td>
                            <td style={{textAlign:'center'}}>
                              <span className="dn-estado-pill"
                                style={{color:est.color,background:est.bg,border:`1px solid ${est.color}44`}}>
                                {est.label}
                              </span>
                            </td>
                            <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                              <div className="dn-acciones-cell">
                                  <WithPermission requiredPermissions={"ACTUALIZAR_DONACIONES"}>
                                <motion.button  className="bienes-btn-icon edit" title="Editar"
                                  onClick={()=>handleFilaClick(don)}
                                  whileHover={{scale:1.15}} whileTap={{scale:0.92}}>
                                  <Edit size={15}/>
                                </motion.button>
                                </WithPermission>
                                <WithPermission requiredPermissions={"ELIMINAR_DONACIONES"}>
                                <motion.button  className="bienes-btn-icon delete"title="Eliminar"
                                  onClick={()=>prepararEliminacion(don)}
                                  whileHover={{scale:1.15}} whileTap={{scale:0.92}}>
                                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </motion.button>
                                </WithPermission>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>

                {/* Pie: valor total + paginación */}
                <div className="dn-card-footer">
                  <div className="dn-footer-valor">
                    Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
                    &nbsp;·&nbsp;
                    Valor visible (activas): <strong style={{color:'#6C4FBF'}}>L. {fmt(valorFiltrados)}</strong>
                  </div>
                  <div className="dn-pagination">
                    <button className="dn-page-btn" onClick={()=>setPaginaActual(1)}        disabled={paginaActual===1}>«</button>
                    <button className="dn-page-btn" onClick={()=>setPaginaActual(p=>p-1)}   disabled={paginaActual===1}>‹</button>
                    {Array.from({length:totalPaginas},(_,i)=>i+1)
                      .filter(p=> p===1 || p===totalPaginas || Math.abs(p-paginaActual)<=1)
                      .reduce((acc,p,i,arr)=>{
                        if(i>0 && arr[i-1]!==p-1) acc.push('...');
                        acc.push(p); return acc;
                      },[])
                      .map((p,i)=> p==='...'
                        ? <span key={`e${i}`} className="dn-page-ellipsis">…</span>
                        : <button key={p} className={`dn-page-btn${paginaActual===p?' active':''}`} onClick={()=>setPaginaActual(p)}>{p}</button>
                      )
                    }
                    <button className="dn-page-btn" onClick={()=>setPaginaActual(p=>p+1)}       disabled={paginaActual===totalPaginas}>›</button>
                    <button className="dn-page-btn" onClick={()=>setPaginaActual(totalPaginas)} disabled={paginaActual===totalPaginas}>»</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* ══ MODAL NUEVA ══ */}
        <AnimatePresence>
          {mostrarModal && (
            <motion.div className="dn-overlay" onClick={handleCloseModals}
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div className="dn-modal" onClick={e=>e.stopPropagation()}
                initial={{scale:0.85,y:40}} animate={{scale:1,y:0}} exit={{scale:0.85,y:40}}
                transition={{type:'spring',damping:22}}>
                <div className="dn-modal-header">
                  <h3><Plus size={20}/> Nueva Donación</h3>
                  <button className="dn-modal-close" onClick={handleCloseModals}><X size={18}/></button>
                </div>
                <form onSubmit={handleSubmitNueva} noValidate>
                  {renderFormTabs()}
                  <div className="dn-modal-footer">
                    <button type="button"  style={S.btn('#E0D9F5','#6C4FBF')} onClick={handleCloseModals}>Cancelar</button>
                    <button type="submit" style={S.btn('#6C4FBF')}>Guardar</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ MODAL EDITAR ══ */}
        <AnimatePresence>
          {mostrarModalEditar && donacionSeleccionada && (
            <motion.div className="dn-overlay" onClick={handleCloseModals}
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div className="dn-modal" onClick={e=>e.stopPropagation()}
                initial={{scale:0.85,y:40}} animate={{scale:1,y:0}} exit={{scale:0.85,y:40}}
                transition={{type:'spring',damping:22}}>
                <div className="dn-modal-header">
                  <h3><Edit size={20}/> Editar Donación</h3>
                  <button className="dn-modal-close" onClick={handleCloseModals}><X size={18}/></button>
                </div>
                {hasUnsavedChanges && <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>}
                {donacionSeleccionada.estado==='Anulada' && (
                  <div className="dn-anulada-banner"><Ban size={15}/> Esta donación está anulada y no puede editarse.</div>
                )}
                <form onSubmit={handleSubmitEditar} noValidate>
                  {renderFormTabs()}
                  <div className="dn-modal-footer">
                    {donacionSeleccionada.estado!=='Anulada' && (
                      <button type="button" className="dn-btn-anular" onClick={prepararAnulacion}>Anular</button>
                    )}
                    <button type="button" style={S.btn('#E74C3C')} onClick={()=>prepararEliminacion()}>Eliminar</button>
                    <button type="button"style={S.btn('#E0D9F5','#6C4FBF')} onClick={handleCloseModals}>Cancelar</button>
                    {donacionSeleccionada.estado!=='Anulada' && (
                      <button type="submit" style={S.btn('#6C4FBF')}>Actualizar</button>
                    )}
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ CONFIRMS ══ */}
        {showConfirm && (donEliminarDirecto||donacionSeleccionada) && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar la donación de "${(donEliminarDirecto||donacionSeleccionada).tipo_donacion}" (Cant: ${(donEliminarDirecto||donacionSeleccionada).cantidad_donacion})?`}
            onConfirm={confirmarEliminacion}
            onCancel={()=>{setShowConfirm(false);setDonEliminarDirecto(null);}}
            visible={showConfirm}
          />
        )}
        {showConfirmAnular && donacionSeleccionada && (
          <ConfirmDialog
            message={`¿Deseas anular la donación #${donacionSeleccionada.id_donacion}? El registro se conservará.`}
            onConfirm={confirmarAnulacion}
            onCancel={()=>setShowConfirmAnular(false)}
            visible={showConfirmAnular}
          />
        )}
        {showConfirmClose && (
          <ConfirmDialog
            message="Tienes cambios sin guardar. ¿Cerrar sin guardar?"
            onConfirm={closeModals}
            onCancel={()=>setShowConfirmClose(false)}
            visible={showConfirmClose}
          />
        )}

        {/* ══ NOTIFICACIONES ══ */}
        <AnimatePresence>
          {notification && (
            <motion.div className={`dn-notification ${notification.type}`}
              initial={{opacity:0,y:-50,x:100}} animate={{opacity:1,y:0,x:0}}
              exit={{opacity:0,y:-50,x:100}} transition={{type:'spring',damping:20}}>
              {notification.type==='success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
              <span>{notification.message}</span>
              <button onClick={()=>setNotification(null)}><X size={16}/></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ AYUDA ══ */}
        <AnimatePresence>
          {mostrarAyuda && (
            <motion.div className="dn-overlay" onClick={()=>setMostrarAyuda(false)}
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div className="dn-modal dn-modal-sm" onClick={e=>e.stopPropagation()}
                initial={{scale:0.85}} animate={{scale:1}} exit={{scale:0.85}}>
                <div className="dn-modal-header">
                  <h3><Heart size={18}/> Ayuda — Donaciones</h3>
                  <button className="dn-modal-close" onClick={()=>setMostrarAyuda(false)}><X size={18}/></button>
                </div>
                <div className="dn-help-body">
                  <h4>Estados del ciclo de vida</h4>
                  <div className="dn-help-estados">
                    {ESTADOS.map(s=>{const c=estadoConfig[s]; return (
                      <div key={s} className="dn-help-estado-item" style={{borderLeft:`3px solid ${c.color}`}}>
                        <strong style={{color:c.color}}>{s}</strong>
                        <span>{{Recibida:'Recibida físicamente.',Pendiente:'Pendiente de verificación.',Procesada:'Ingresada al inventario.',Anulada:'Anulada; conservada para trazabilidad.'}[s]}</span>
                      </div>
                    );})}
                  </div>
                  <h4 style={{marginTop:'1rem'}}>Valor de activos</h4>
                  <p style={{fontSize:'0.85rem',color:'#555'}}>El valor se calcula automáticamente: <strong>Cantidad × Precio Unitario</strong>. El encabezado muestra el total de donaciones activas.</p>
                  <h4 style={{marginTop:'1rem'}}>Filtro de fechas</h4>
                  <p style={{fontSize:'0.85rem',color:'#555'}}>Selecciona un rango "Desde → Hasta" en la barra de acciones para filtrar por fecha de donación.</p>
                  <ul className="dn-help-tips" style={{marginTop:'0.5rem'}}>
                    <li>El botón <strong>🗑</strong> en cada fila elimina directamente sin abrir el modal.</li>
                    <li>Usa <strong>Anular</strong> (no Eliminar) para conservar trazabilidad histórica.</li>
                    <li>Datos sincronizados automáticamente cada 30 segundos.</li>
                  </ul>
                </div>
                <div className="dn-modal-footer">
                  <button className="dn-btn-save" onClick={()=>setMostrarAyuda(false)}>Cerrar</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default Donaciones;