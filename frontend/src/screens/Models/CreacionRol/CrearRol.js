import '../../../styles/CreacionRol/CrearRol.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../../../components/authentication/Auth";
import { motion } from 'framer-motion';
import { Eye, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  FaEdit, FaShieldAlt, FaSearch, FaEraser, FaPlus, FaUsersCog,
  FaChevronDown, FaTimes, FaLock, FaPaintRoller
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { FiBriefcase, FiUsers, FiShield, FiBarChart2, FiBook } from "react-icons/fi";
import { RiArrowLeftSLine } from "react-icons/ri";
import WithPermission from '../../../components/Permisos/WithPermission';

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

const API_HOST = process.env.REACT_APP_API_URL;
const API_ROLES = `${API_HOST}/api/roles`;

const useAuth = () => {
  const getToken = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      return await user.getIdToken();
    } catch (error) {
      return null;
    }
  };
  return { getToken };
};

/* ─── MAPA DE PERMISOS ─── */
const GRUPOS_PERMISOS = {
  MATRICULA:           ['VISUALIZAR_MATRICULA',        'CREAR_MATRICULA',        'ACTUALIZAR_MATRICULA',        'ELIMINAR_MATRICULA'],
  GRADOS:              ['VISUALIZAR_GRADOS',           'CREAR_GRADOS',           'ACTUALIZAR_GRADOS',           'ELIMINAR_GRADOS'],
  HORARIOS:            ['VISUALIZAR_HORARIOS',         'CREAR_HORARIOS',         'ACTUALIZAR_HORARIOS',         'ELIMINAR_HORARIOS'],
  BIBLIOTECA:          ['VISUALIZAR_BIBLIOTECA',       'CREAR_BIBLIOTECA',       'ACTUALIZAR_BIBLIOTECA',       'ELIMINAR_BIBLIOTECA'],
  ACTIVIDADES:         ['VISUALIZAR_ACTIVIDADES',      'CREAR_ACTIVIDADES',      'ACTUALIZAR_ACTIVIDADES',      'ELIMINAR_ACTIVIDADES'],
  CALENDARIO:          ['VISUALIZAR_CALENDARIO',       'CREAR_CALENDARIO',       'ACTUALIZAR_CALENDARIO',       'ELIMINAR_CALENDARIO'],
  BIENES:              ['VISUALIZAR_BIENES',           'CREAR_BIENES',           'ACTUALIZAR_BIENES',           'ELIMINAR_BIENES'],
  DONACIONES:          ['VISUALIZAR_DONACIONES',       'CREAR_DONACIONES',       'ACTUALIZAR_DONACIONES',       'ELIMINAR_DONACIONES'],
  COMPRAS:             ['VISUALIZAR_COMPRAS',          'CREAR_COMPRAS',          'ACTUALIZAR_COMPRAS',          'ELIMINAR_COMPRAS'],
  PROVEEDORES:         ['VISUALIZAR_PROVEEDORES',      'CREAR_PROVEEDORES',      'ACTUALIZAR_PROVEEDORES',      'ELIMINAR_PROVEEDORES'],
  PERSONAL:            ['VISUALIZAR_PERSONAL',         'CREAR_PERSONAL',         'ACTUALIZAR_PERSONAL',         'ELIMINAR_PERSONAL'],
  DIRECTIVA:           ['VISUALIZAR_DIRECTIVA',        'CREAR_DIRECTIVA',        'ACTUALIZAR_DIRECTIVA',        'ELIMINAR_DIRECTIVA'],
  GESTION_DE_USUARIOS: ['VISUALIZAR_SEGURIDAD',        'CREAR_SEGURIDAD',        'ACTUALIZAR_SEGURIDAD',        'ELIMINAR_SEGURIDAD'],
  ROLES:               ['VISUALIZAR_ROLES',            'CREAR_ROLES',            'ACTUALIZAR_ROLES',            'ELIMINAR_ROLES'],
  SOLICITUDES:         ['VISUALIZAR_SOLICITUDES',      'CREAR_SOLICITUDES',      'ACTUALIZAR_SOLICITUDES',      'ELIMINAR_SOLICITUDES'],
  AUDITORIA:           ['VISUALIZAR_AUDITORIA',        'CREAR_AUDITORIA',        'ACTUALIZAR_AUDITORIA',        'ELIMINAR_AUDITORIA'],
  BACKUP:              ['VISUALIZAR_BACKUP',           'CREAR_BACKUP',           'ACTUALIZAR_BACKUP',           'ELIMINAR_BACKUP'],
  DASHBOARD:           ['VISUALIZAR_DASHBOARD'],
  PAGINA_PRINCIPAL:    ['VISUALIZAR_PAGINA_PRINCIPAL', 'CREAR_PAGINA_PRINCIPAL', 'ACTUALIZAR_PAGINA_PRINCIPAL', 'ELIMINAR_PAGINA_PRINCIPAL'],
};

/* ─── ESTRUCTURA ─── */
const ESTRUCTURA_PERMISOS = [
  {
    categoria: 'Académico',
    icon: <FiBook size={16} />,
    color: '#0ea5e9',
    grupos: [
      { label: 'Gestión académica',       modulos: ['MATRICULA', 'GRADOS', 'HORARIOS'] },
      { label: 'Recursos bibliográficos', modulos: ['BIBLIOTECA'] },
      { label: 'Eventos',                 modulos: ['ACTIVIDADES', 'CALENDARIO'] },
    ],
  },
  {
    categoria: 'Operativo',
    icon: <FiBriefcase size={16} />,
    color: '#f59e0b',
    grupos: [
      { label: 'Inventario',    modulos: ['BIENES', 'DONACIONES'] },
      { label: 'Adquisiciones', modulos: ['COMPRAS', 'PROVEEDORES'] },
    ],
  },
  {
    categoria: 'RRHH',
    icon: <FiUsers size={16} />,
    color: '#10b981',
    grupos: [
      { label: 'Talento humano', modulos: ['PERSONAL', 'DIRECTIVA'] },
    ],
  },
  {
    categoria: 'Seguridad',
    icon: <FiShield size={16} />,
    color: '#ef4444',
    grupos: [
      { label: 'Control de accesos',      modulos: ['GESTION_DE_USUARIOS', 'ROLES', 'SOLICITUDES'] },
      { label: 'Respaldo y recuperación', modulos: ['BACKUP'] },
      { label: 'Historial de acciones',   modulos: ['AUDITORIA'] },
    ],
  },
  {
    categoria: 'Dashboard',
    icon: <FiBarChart2 size={16} />,
    color: '#8b5cf6',
    grupos: [{ label: 'Dashboard', modulos: ['DASHBOARD'] }],
  },
  {
    categoria: 'Personalización',
    icon: <FaPaintRoller size={14} />,
    color: '#ec4899',
    grupos: [{ label: 'Personalización', modulos: ['PAGINA_PRINCIPAL'] }],
  },
];

/* ─── LABELS ─── */
const MODULO_LABEL = {
  MATRICULA: 'Matrícula', GRADOS: 'Grados', HORARIOS: 'Horarios',
  BIBLIOTECA: 'Biblioteca', ACTIVIDADES: 'Actividades', CALENDARIO: 'Calendario',
  BIENES: 'Bienes', DONACIONES: 'Donaciones', COMPRAS: 'Compras', PROVEEDORES: 'Proveedores',
  PERSONAL: 'Personal', DIRECTIVA: 'Directiva', GESTION_DE_USUARIOS: 'Usuarios',
  ROLES: 'Roles', SOLICITUDES: 'Solicitudes', AUDITORIA: 'Auditoría',
  BACKUP: 'Backup', DASHBOARD: 'Dashboard', PAGINA_PRINCIPAL: 'Página principal',
};

const ACCION_META = [
  { key: 'VISUALIZAR', label: 'Ver',      icon: <Eye    size={11} /> },
  { key: 'CREAR',      label: 'Crear',    icon: <Plus   size={11} /> },
  { key: 'ACTUALIZAR', label: 'Editar',   icon: <Pencil size={11} /> },
  { key: 'ELIMINAR',   label: 'Eliminar', icon: <Trash2 size={11} /> },
];

const permisosDeModulos   = (mods) => mods.flatMap(m => GRUPOS_PERMISOS[m] ?? []);
const permisosDeCategoria = (cat)  => permisosDeModulos(cat.grupos.flatMap(g => g.modulos));

/* ═══════════════ COMPONENTE PRINCIPAL ═══════════════ */
function App() {
  const navigate = useNavigate();
  const [roles, setRoles]               = useState([]);
  const [selectedRol, setSelectedRol]   = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('crear');
  const [loading, setLoading]           = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [expandedCard, setExpandedCard] = useState(null);
  const [filtros, setFiltros]           = useState({ busqueda: '' });

  const { getToken } = useAuth();

  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No se pudo obtener el token');
      const r = await fetch(API_ROLES, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!r.ok) throw new Error(`Error ${r.status}: ${r.statusText}`);
      setRoles(await r.json());
    } catch (e) {
      showNotification('Error al cargar los roles: ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { cargarRoles(); }, []);

  const agruparPermisosPorModulo = (permisos) => {
    const g = {};
    permisos.forEach(p => {
      const parts = p.split('_');
      const mod   = parts.slice(1).join('_');
      const acc   = parts[0];
      if (!g[mod]) g[mod] = [];
      g[mod].push(acc);
    });
    return g;
  };

  const obtenerResumenPermisos = (permisos) => {
    const mods = new Set(permisos.map(p => p.split('_').slice(1).join(' ')));
    return Array.from(mods).slice(0, 3);
  };

  const handleEditarRol = (rol) => { setSelectedRol(rol); setModalMode('editar'); setShowModal(true); };

  const handleEliminarRol = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este rol?')) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const r = await fetch(`${API_ROLES}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!r.ok) throw new Error(`Error ${r.status}`);
      await cargarRoles();
      setShowModal(false);
      showNotification('Rol eliminado exitosamente', 'success');
    } catch (e) {
      showNotification('Error al eliminar: ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  const handleGuardarRol = async (rolData) => {
    setLoading(true);
    try {
      const token  = await getToken();
      if (!token) throw new Error('No token');
      const datos  = { ...rolData, _id: rolData._id.toUpperCase().replace(/\s+/g, '_') };
      const url    = modalMode === 'crear' ? API_ROLES : `${API_ROLES}/${selectedRol._id}`;
      const method = modalMode === 'crear' ? 'POST' : 'PUT';
      const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message || `Error ${r.status}`); }
      await cargarRoles();
      setShowModal(false); setSelectedRol(null);
      showNotification(modalMode === 'crear' ? 'Rol creado exitosamente' : 'Rol actualizado exitosamente', 'success');
    } catch (e) {
      showNotification('Error al guardar: ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  const toggleExpandCard = (id) => setExpandedCard(expandedCard === id ? null : id);
  const rolesFiltrados   = roles.filter(r => !filtros.busqueda || r.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()));

  return (
    <div className="rols-css-app">
      {notification.show && (
        <div className={`rols-css-notification rols-css-notification-${notification.type}`}>{notification.message}</div>
      )}

      {/* HEADER */}
      <motion.div className="mm-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}>
        <div className="mm-hi">
          <div className="mm-ht">
            <motion.div className="mm-htitle" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <motion.span initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                <FaShieldAlt size={30} color="white" />
              </motion.span>
              Gestión de Roles y Permisos
            </motion.div>
            <motion.button className="mm-btn-back" onClick={() => navigate('/seguridad')} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <RiArrowLeftSLine size={20} /> Asignar Roles
            </motion.button>
          </div>
          <motion.p className="mm-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Crea, edita y administra los roles y permisos del sistema
          </motion.p>
          <motion.div className="mm-stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {[
              { ico: <FaShieldAlt size={18} color="white" />, val: roles.length,          lbl: 'Total Roles' },
              { ico: <FaLock      size={18} color="white" />, val: roles.reduce((a, r) => a + (r.permisos?.length || 0), 0), lbl: 'Permisos asignados' },
              { ico: <FaUsersCog  size={18} color="white" />, val: rolesFiltrados.length, lbl: filtros.busqueda ? 'Roles filtrados' : 'Roles activos' },
            ].map((s, i) => (
              <motion.div key={i} className="mm-stat" whileHover={{ scale: 1.04, y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div className="mm-stat-ico">{s.ico}</div>
                <div><div className="mm-stat-val">{s.val}</div><div className="mm-stat-lbl">{s.lbl}</div></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* FILTROS */}
      <div className="rols-css-filtros-container">
        <div className="rols-css-filtros-grid">
          <div className="rols-css-filtro-item">
            <FaSearch className="rols-css-filtro-icon" />
            <input type="text" placeholder="Buscar por nombre de rol" value={filtros.busqueda} onChange={e => setFiltros({ busqueda: e.target.value })} />
          </div>
        </div>
        <div className="rols-css-filtros-actions">
          <button className="rols-css-btn rols-css-btn-outline" onClick={() => setFiltros({ busqueda: '' })} disabled={loading}><FaEraser /> Limpiar Filtros</button>
          <WithPermission requiredPermissions={["CREAR_ROLES"]}>
            <button type="submit" style={S.btn('#6C4FBF')} onClick={() => { setModalMode('crear'); setSelectedRol(null); setShowModal(true); }} disabled={loading}><FaPlus /> Nuevo Rol</button>
          </WithPermission>
        </div>
      </div>

      {/* LISTA */}
      <div className="rols-css-roles-header">
        <h3><FaUsersCog /> Roles del Sistema ({rolesFiltrados.length})</h3>
        {loading && <div className="rols-css-loading">Cargando...</div>}
      </div>

      <div className="rols-css-roles-grid">
        {rolesFiltrados.map(rol => {
          const permisosAgrupados = agruparPermisosPorModulo(rol.permisos);
          const totalPermisos     = rol.permisos.length;
          const resumenModulos    = obtenerResumenPermisos(rol.permisos);
          const isExpanded        = expandedCard === rol._id;
          return (
            <div key={rol._id} className="rols-css-rol-card">
              <div className="rols-css-rol-card-header">
                <div className="rols-css-rol-info">
                  <h4>{rol.nombre}</h4>
                  <span className="rols-css-rol-id">{rol._id}</span>
                </div>
                <div className="rols-css-rol-actions">
                  <WithPermission requiredPermissions={["ACTUALIZAR_ROLES"]}>
                    <button className="rols-css-btn-icon" onClick={() => handleEditarRol(rol)} disabled={loading} type="button" title="Editar"><FaEdit /></button>
                  </WithPermission>
                  <WithPermission requiredPermissions={["ELIMINAR_ROLES"]}>
                    <button className="rols-css-btn-icon rols-css-btn-icon-delete" onClick={() => handleEliminarRol(rol._id)} disabled={loading} type="button" title="Eliminar"><MdDelete /></button>
                  </WithPermission>
                </div>
              </div>
              <p className="rols-css-rol-descripcion">{rol.descripcion || 'Sin descripción'}</p>
              <div className="rols-css-rol-resumen" onClick={() => toggleExpandCard(rol._id)}>
                <div className="rols-css-resumen-header">
                  <span className="rols-css-resumen-titulo"><FaShieldAlt /> {totalPermisos} permisos</span>
                  <span className="rols-css-resumen-modulos">
                    {resumenModulos.map((m, i) => <span key={i} className="rols-css-modulo-resumen">{m}</span>)}
                    {resumenModulos.length < totalPermisos && <span className="rols-css-modulo-resumen-mas">...</span>}
                  </span>
                  <span className={`rols-css-expand-icon ${isExpanded ? 'rols-css-expanded' : ''}`}><FaChevronDown /></span>
                </div>
              </div>
              {isExpanded && (
                <div className="rols-css-rol-permisos-detallados">
                  <h5>Permisos detallados:</h5>
                  {Object.entries(permisosAgrupados).map(([mod, accs]) => (
                    <div key={mod} className="rols-css-modulo-permisos">
                      <span className="rols-css-modulo-nombre">{MODULO_LABEL[mod] || mod}</span>
                      <div className="rols-css-acciones-container">
                        {accs.includes('VISUALIZAR') && <span className="rols-css-accion-badge rols-css-accion-ver">Ver</span>}
                        {accs.includes('CREAR')      && <span className="rols-css-accion-badge rols-css-accion-crear">Crear</span>}
                        {accs.includes('ACTUALIZAR') && <span className="rols-css-accion-badge rols-css-accion-actualizar">Editar</span>}
                        {accs.includes('ELIMINAR')   && <span className="rols-css-accion-badge rols-css-accion-eliminar">Eliminar</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <ModalRol
          mode={modalMode}
          rol={selectedRol}
          onClose={() => { setShowModal(false); setSelectedRol(null); }}
          onSave={handleGuardarRol}
          onDelete={handleEliminarRol}
          loading={loading}
        />
      )}
    </div>
  );
}

/* ═══════════════ MODAL ═══════════════ */
function ModalRol({ mode, rol, onClose, onSave, onDelete, loading }) {
  const [formData, setFormData] = useState({ _id: '', nombre: '', descripcion: '', permisos: [] });
  const [idError, setIdError]   = useState('');
  const [openCats, setOpenCats] = useState({});

  const toggleCat = (cat) => setOpenCats(p => ({ ...p, [cat]: !p[cat] }));

  useEffect(() => {
    setFormData(rol
      ? { _id: rol._id || '', nombre: rol.nombre || '', descripcion: rol.descripcion || '', permisos: rol.permisos || [] }
      : { _id: '', nombre: '', descripcion: '', permisos: [] }
    );
    setOpenCats({});
  }, [rol]);

  const handleIdChange = (e) => {
    const limpio = e.target.value.toUpperCase().replace(/[^A-Z_]/g, '');
    setFormData(p => ({ ...p, _id: limpio }));
    setIdError(e.target.value !== limpio ? 'Solo mayúsculas y guiones bajos' : '');
  };

  const toggle = (perm) =>
    setFormData(p => ({
      ...p,
      permisos: p.permisos.includes(perm) ? p.permisos.filter(x => x !== perm) : [...p.permisos, perm],
    }));

  const toggleLista = (lista) =>
    setFormData(p => {
      const todos = lista.every(x => p.permisos.includes(x));
      return { ...p, permisos: todos ? p.permisos.filter(x => !lista.includes(x)) : [...new Set([...p.permisos, ...lista])] };
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData._id.match(/^[A-Z_]+$/)) { setIdError('Solo mayúsculas y guiones bajos'); return; }
    if (!formData.nombre.trim()) { alert('El nombre del rol es requerido'); return; }
    onSave(formData);
  };

  const handleClose = (e) => { if (e) e.preventDefault(); onClose(); };

  return (
    <div className="rols-css-modal-overlay" onClick={handleClose}>
      <div className="rols-css-modal-content" onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div className="rols-css-modal-header">
          <h3>{mode === 'crear' ? 'Crear Nuevo Rol' : 'Editar Rol'}</h3>
          <button className="rols-css-btn-icon" onClick={handleClose} type="button" disabled={loading}><FaTimes /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* CAMPOS BÁSICOS */}
          <div className="rols-css-modal-fields">
            <div className="rols-css-form-group">
              <label>Nombre del rol <span className="rols-css-required">*</span></label>
              <input
                type="text"
                className={`rols-css-form-control ${idError ? 'rols-css-form-control-error' : ''}`}
                value={formData._id}
                onChange={handleIdChange}
                placeholder="ADMIN, COMPRAS, RRHH…"
                required
                disabled={mode === 'editar' || loading}
              />
              {idError && <small className="rols-css-error-message">{idError}</small>}
              <small>Solo mayúsculas y guiones bajos — sin espacios ni números</small>
            </div>

            <div className="rols-css-form-group">
              <label>Etiqueta <span className="rols-css-required">*</span></label>
              <input
                type="text"
                className="rols-css-form-control"
                value={formData.nombre}
                onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Administrador, Gestor de Compras"
                required
                disabled={loading}
              />
            </div>

            <div className="rols-css-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Descripción</label>
              <textarea
                className="rols-css-form-control"
                value={formData.descripcion}
                onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                rows="2"
                placeholder="Breve descripción del rol…"
                disabled={loading}
              />
            </div>
          </div>

          {/* PERMISOS */}
          <div className="rols-css-form-group">
            <div className="rols-css-permisos-header-label">
              <FaShieldAlt />
              <label style={{ margin: 0 }}>Permisos</label>
              <span className="rols-css-permisos-count-badge">{formData.permisos.length} seleccionados</span>
            </div>

            {/* Grid de tarjetas de categoría */}
            <div className="rols-css-cats-grid">
              {ESTRUCTURA_PERMISOS.map(cat => {
                const todosCat = permisosDeCategoria(cat);
                const selCat   = todosCat.filter(p => formData.permisos.includes(p)).length;
                const checkCat = selCat === todosCat.length && todosCat.length > 0;
                const indCat   = selCat > 0 && !checkCat;
                const isOpen   = !!openCats[cat.categoria];

                return (
                  <div
                    key={cat.categoria}
                    className={`rols-css-cat-card ${isOpen ? 'rols-css-cat-card-open' : ''}`}
                    style={{ '--cat-color': cat.color }}
                  >
                    {/* Cabecera clickeable */}
                    <div className="rols-css-cat-card-header" onClick={() => toggleCat(cat.categoria)}>
                      <div className="rols-css-cat-card-left">
                        <label className="rols-css-cat-check-wrap" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checkCat}
                            ref={el => { if (el) el.indeterminate = indCat; }}
                            onChange={() => toggleLista(todosCat)}
                            disabled={loading}
                          />
                        </label>
                        <div className="rols-css-cat-icon-wrap" style={{ background: `${cat.color}1a`, color: cat.color }}>
                          {cat.icon}
                        </div>
                        <div className="rols-css-cat-info">
                          <span className="rols-css-cat-name2">{cat.categoria}</span>
                          <span className="rols-css-cat-sub" style={{ color: cat.color }}>
                            {selCat}/{todosCat.length} permisos
                          </span>
                        </div>
                      </div>
                      <FaChevronDown
                        size={12}
                        style={{
                          color: cat.color,
                          transition: 'transform .25s ease',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          flexShrink: 0,
                        }}
                      />
                    </div>

                    {/* Cuerpo colapsable */}
                    {isOpen && (
                      <div className="rols-css-cat-card-body">
                        {cat.grupos.map(grupo => {
                          const permGrupo  = permisosDeModulos(grupo.modulos);
                          const selGrupo   = permGrupo.filter(p => formData.permisos.includes(p)).length;
                          const checkGrupo = selGrupo === permGrupo.length && permGrupo.length > 0;
                          const indGrupo   = selGrupo > 0 && !checkGrupo;

                          return (
                            <div key={grupo.label} className="rols-css-grupo-section">
                              <div className="rols-css-grupo-header">
                                <label className="rols-css-grupo-label">
                                  <input
                                    type="checkbox"
                                    checked={checkGrupo}
                                    ref={el => { if (el) el.indeterminate = indGrupo; }}
                                    onChange={() => toggleLista(permGrupo)}
                                    disabled={loading}
                                  />
                                  <span className="rols-css-grupo-title">{grupo.label}</span>
                                </label>
                              </div>

                              <div className="rols-css-mods-grid">
                                {grupo.modulos.map(modKey => {
                                  const permisosMod = GRUPOS_PERMISOS[modKey];
                                  if (!permisosMod) return null;
                                  const selMod   = permisosMod.filter(p => formData.permisos.includes(p)).length;
                                  const checkMod = selMod === permisosMod.length;
                                  const indMod   = selMod > 0 && !checkMod;

                                  return (
                                    <div key={modKey} className="rols-css-mod-card2">
                                      <div className="rols-css-mod-card2-header">
                                        <label className="rols-css-mod-label2">
                                          <input
                                            type="checkbox"
                                            checked={checkMod}
                                            ref={el => { if (el) el.indeterminate = indMod; }}
                                            onChange={() => toggleLista(permisosMod)}
                                            disabled={loading}
                                          />
                                          <span className="rols-css-mod-name2">{MODULO_LABEL[modKey] || modKey}</span>
                                        </label>
                                        {selMod > 0 && (
                                          <span className="rols-css-mod-badge2" style={{ background: `${cat.color}18`, color: cat.color }}>
                                            {selMod}
                                          </span>
                                        )}
                                      </div>
                                      <div className="rols-css-chips-row">
                                        {permisosMod.map(permiso => {
                                          const accion  = permiso.split('_')[0];
                                          const meta    = ACCION_META.find(a => a.key === accion);
                                          const checked = formData.permisos.includes(permiso);
                                          return (
                                            <label
                                              key={permiso}
                                              className={`rols-css-chip2 ${checked ? 'rols-css-chip2-active' : ''}`}
                                              style={{ '--chip-color': cat.color }}
                                              title={permiso}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggle(permiso)}
                                                disabled={loading}
                                                className="rols-css-chip-input"
                                              />
                                              {meta?.icon}
                                              {meta?.label || accion}
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER */}
          <div className="rols-css-modal-footer">
            <div>
              {mode === 'editar' && onDelete && (
                <button type="button" className="rols-css-btn-footer-delete" onClick={() => onDelete(rol._id)} disabled={loading}>
                  <Trash2 size={15} /> Eliminar
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="rols-css-btn-footer-cancel" onClick={handleClose} disabled={loading}>Cancelar</button>
              <button type="submit" className="rols-css-btn-footer-save" disabled={loading}>
                {loading ? 'Guardando…' : mode === 'crear' ? 'Guardar' : 'Actualizar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;