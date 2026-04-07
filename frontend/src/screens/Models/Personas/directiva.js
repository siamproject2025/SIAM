// ============================================================
// Directiva.jsx — REDISEÑO COMPLETO
// • Header estilo mm-* (igual a Sistema de Bienes), estadísticas
//   dinámicas según filtros activos
// • Modales con diseño dn-* (igual a ModalDetalleBien):
//     tabs Información | Cargo | Fotografía | Auditoría
//     banner "cambios sin guardar", punto rojo en tab con error
// • Auditoría completa: creado_por, fecha_creacion_sistema,
//   actualizado_por, fecha_actualizacion
// ============================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../../styles/Directiva.css";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import {
  Users, Mail, Phone, Briefcase, FileText, Hash, Search,
  HelpCircle, Plus, Edit, Trash2, X, Save, Check, Award,
  UserCheck, Clock, Shield, Camera, Calendar,
  AlertTriangle, ImagePlus, Upload,
} from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const API_URL = process.env.REACT_APP_API_URL + "/api/directiva";

// ── Iniciales para avatar ──────────────────────────────────
const iniciales = (n = "") => {
  const p = n.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── Helper fecha ───────────────────────────────────────────
const formatFecha = (fecha) => {
  if (!fecha || fecha === "null") return "No registrado";
  const s = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
  const datePart = s.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (s.includes("T")) {
    const timePart = s.slice(11, 16);
    return `${d}/${m}/${y} ${timePart}`;
  }
  return `${d}/${m}/${y}`;
};

// ── Mapa campo→tab para punto rojo ──────────────────────────
const TAB_DE_CAMPO = {
  nombre: "info", email: "info", telefono: "info", numero_identidad: "info",
  cargo: "cargo", fecha_inicio_cargo: "cargo",
};

const Directiva = () => {
  const [miembros, setMiembros]                 = useState([]);
  const [busqueda, setBusqueda]                 = useState('');
  const [filtroEstado, setFiltroEstado]         = useState('todos');
  const [filtroOrden, setFiltroOrden]           = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);
  const [notification, setNotification]         = useState(null);
  const [mostrarAyuda, setMostrarAyuda]         = useState(false);
  const [loading, setLoading]                   = useState(false);

  // Modal crear
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [tabActivo, setTabActivo]               = useState('info');
  const [errors, setErrors]                     = useState({});
  const [fotoPreview, setFotoPreview]           = useState(null);
  const [hayCambios, setHayCambios]             = useState(false);

  // Modal editar
  const [miembroEditando, setMiembroEditando]   = useState(null);
  const [tabEdicion, setTabEdicion]             = useState('info');
  const [errorsEdit, setErrorsEdit]             = useState({});
  const [fotoPreviewEdit, setFotoPreviewEdit]   = useState(null);
  const [hayCambiosEdit, setHayCambiosEdit]     = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);

  // Eliminar
  const [showConfirm, setShowConfirm]           = useState(false);
  const [miembroAEliminar, setMiembroAEliminar] = useState(null);

  const formVacio = () => ({
    nombre: '', cargo: '', email: '', telefono: '',
    numero_identidad: '', empresa: '', estado: 'activo',
    fecha_inicio_cargo: '', fecha_fin_cargo: '', motivo_salida: '',
    fecha_registro: new Date().toISOString().split('T')[0],
    notas: '', foto: null,
  });

  const [formData, setFormData] = useState(formVacio());

  useEffect(() => { cargarMiembros(); }, []);

  const cargarMiembros = async () => {
    try {
      setLoading(true); loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setMiembros(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      showNotification('Error al cargar los miembros', 'error');
      setMiembros([]);
    } finally { setLoading(false); loadingController.stop(); }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Foto handler ───────────────────────────────────────────
  const handleFotoChange = (e, setPreview, setForm) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('La foto no debe superar 3MB'); return; }
    if (!file.type.startsWith('image/')) { alert('Solo imágenes'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setForm(p => ({ ...p, foto: reader.result.split(',')[1] }));
    };
    reader.readAsDataURL(file);
  };

  // ── Validación ─────────────────────────────────────────────
  const validar = (fd) => {
    const e = {};
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!fd.nombre?.trim())                         e.nombre = 'El nombre es obligatorio';
    else if (!soloLetras.test(fd.nombre.trim()))    e.nombre = 'Solo letras y espacios';
    if (!fd.cargo?.trim())                          e.cargo  = 'El cargo es obligatorio';
    if (!fd.email?.trim())                          e.email  = 'El email es obligatorio';
    if (!fd.telefono)                               e.telefono = 'El teléfono es obligatorio';
    else if (!/^\d+$/.test(fd.telefono.toString())) e.telefono = 'Solo números';
    if (!fd.numero_identidad?.trim())               e.numero_identidad = 'El número de identidad es obligatorio';
    if (!fd.fecha_inicio_cargo)                     e.fecha_inicio_cargo = 'La fecha de inicio del cargo es requerida';
    return e;
  };

  // ── Crear ──────────────────────────────────────────────────
  const handleCrearMiembro = async (e) => {
    e.preventDefault();
    const errs = validar(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActivo(TAB_DE_CAMPO[primer]);
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) { showNotification('No autenticado', 'error'); return; }
      const token = await user.getIdToken();
      const payload = {
        ...formData,
        fecha_registro: new Date(formData.fecha_registro),
        creado_por: user.email || 'sistema',
        fecha_creacion_sistema: new Date().toISOString(),
      };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Error al crear'); }
      await cargarMiembros();
      setMostrarModalCrear(false);
      setFormData(formVacio()); setFotoPreview(null); setErrors({}); setHayCambios(false);
      showNotification(`Miembro "${formData.nombre}" creado exitosamente`, 'success');
    } catch (err) { showNotification(err.message, 'error'); }
  };

  // ── Editar ─────────────────────────────────────────────────
  const handleEditarMiembro = async (e) => {
    e.preventDefault();
    const errs = validar(formData);
    if (Object.keys(errs).length > 0) {
      setErrorsEdit(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabEdicion(TAB_DE_CAMPO[primer]);
      return;
    }
    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const payload = {
        ...formData,
        fecha_registro: new Date(formData.fecha_registro),
        actualizado_por: user.email,
        fecha_actualizacion: new Date().toISOString(),
      };
      const res = await fetch(`${API_URL}/${miembroEditando._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Error al editar'); }
      await cargarMiembros();
      setMiembroEditando(null); setFormData(formVacio()); setFotoPreviewEdit(null);
      setErrorsEdit({}); setHayCambiosEdit(false);
      showNotification(`Miembro "${formData.nombre}" actualizado`, 'success');
    } catch (err) { showNotification(err.message, 'error'); }
    finally { loadingController.stop(); }
  };

  // ── Eliminar ───────────────────────────────────────────────
  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!miembroAEliminar) return;
    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error('No autenticado');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/${miembroAEliminar._id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      await cargarMiembros();
      setMiembroEditando(null); setFormData(formVacio());
      showNotification(`"${miembroAEliminar.nombre}" eliminado`, 'success');
      setMiembroAEliminar(null);
    } catch (err) { showNotification(err.message, 'error'); }
    finally { loadingController.stop(); }
  };

  const handleOpenEditModal = (miembro) => {
    setMiembroEditando(miembro);
    setFormData({
      nombre:           miembro.nombre            || '',
      cargo:            miembro.cargo             || '',
      email:            miembro.email             || '',
      telefono:         miembro.telefono          || '',
      numero_identidad: miembro.numero_identidad  || '',
      empresa:          miembro.empresa           || '',
      estado:           miembro.estado            || 'activo',
      fecha_inicio_cargo: miembro.fecha_inicio_cargo ? new Date(miembro.fecha_inicio_cargo).toISOString().split('T')[0] : '',
      fecha_fin_cargo:    miembro.fecha_fin_cargo    ? new Date(miembro.fecha_fin_cargo).toISOString().split('T')[0]    : '',
      motivo_salida:    miembro.motivo_salida     || '',
      fecha_registro:   miembro.fecha_registro    ? new Date(miembro.fecha_registro).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notas:            miembro.notas             || '',
      foto:             miembro.foto              || null,
    });
    if (miembro.foto) setFotoPreviewEdit(`data:image/jpeg;base64,${miembro.foto}`);
    else setFotoPreviewEdit(null);
    setTabEdicion('info'); setErrorsEdit({}); setHayCambiosEdit(false);
  };

  const handleCloseEditModal = () => {
    if (hayCambiosEdit) { setShowConfirmCerrar(true); return; }
    setMiembroEditando(null); setFormData(formVacio());
    setFotoPreviewEdit(null); setErrorsEdit({}); setHayCambiosEdit(false);
  };

  // ── Filtrado ───────────────────────────────────────────────
  const miembrosFiltradosPorEstado = miembros.filter(m => {
    if (filtroEstado === 'todos') return true;
    return m.estado === filtroEstado;
  });

  const miembrosFiltrados = miembrosFiltradosPorEstado.filter(m => {
    const t = busqueda.toLowerCase();
    return m.nombre?.toLowerCase().includes(t) || m.cargo?.toLowerCase().includes(t) ||
           m.email?.toLowerCase().includes(t)  || m.numero_identidad?.toLowerCase().includes(t);
  });

  const miembrosOrdenados = [...miembrosFiltrados].sort((a, b) => {
    switch (filtroOrden) {
      case 'nombre-az': return (a.nombre || '').localeCompare(b.nombre || '');
      case 'nombre-za': return (b.nombre || '').localeCompare(a.nombre || '');
      case 'cargo-az':  return (a.cargo  || '').localeCompare(b.cargo  || '');
      case 'estado-activo': return ({ activo:1, suspendido:2, inactivo:3 }[a.estado]||9) - ({ activo:1, suspendido:2, inactivo:3 }[b.estado]||9);
      default: return 0;
    }
  });

  // Stats dinámicas sobre miembros filtrados
  const statsBase       = miembrosFiltrados;
  const totalFiltrado   = miembrosOrdenados.length;
  const activosFiltrado = statsBase.filter(m => m.estado === 'activo').length;
  const inactivosFilt   = statsBase.filter(m => m.estado === 'inactivo').length;
  const suspendidosFilt = statsBase.filter(m => m.estado === 'suspendido').length;
  const esFiltrado      = busqueda || filtroEstado !== 'todos';

  // ── Helpers de tab ─────────────────────────────────────────
  const tabTieneError = (tabKey, errs) =>
    Object.keys(errs).some(c => TAB_DE_CAMPO[c] === tabKey);

  // ── Formulario compartido ──────────────────────────────────
  const renderFormulario = ({
    onSubmit, esEdicion, miembro,
    tab, setTab,
    errs, setErrs,
    preview, setPreview,
    hasCambios, setHasCambios,
    onCancel,
    onEliminar,
  }) => {

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(p => ({ ...p, [name]: value }));
      setHasCambios(true);
      if (errs[name]) setErrs(p => { const n = { ...p }; delete n[name]; return n; });
    };

    const tabBtn = (key, label, ico) => (
      <button
        key={key} type="button"
        className={`dn-tab-btn${tab === key ? ' active' : ''}${tabTieneError(key, errs) ? ' has-error' : ''}`}
        onClick={() => setTab(key)}
      >
        {ico} {label}
        {tabTieneError(key, errs) && <span className="dn-tab-error-dot" />}
      </button>
    );

    return (
      <form onSubmit={onSubmit} noValidate>
        {/* Tabs */}
        <div className="dn-modal-tabs">
          {tabBtn('info',   'Información',  <FileText  size={14} />)}
          {tabBtn('cargo',  'Cargo',        <Briefcase size={14} />)}
          {tabBtn('foto',   'Fotografía',   <Camera    size={14} />)}
          {esEdicion && tabBtn('auditoria', 'Auditoría', <Clock size={14} />)}
        </div>

        {/* TAB: Información */}
        {tab === 'info' && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Datos Personales</div>
            <div className="dn-form-grid">

              <div className={`dn-form-group${errs.nombre ? ' dn-field-error' : ''}`}>
                <label>Nombre Completo <span className="req">*</span></label>
                <input name="nombre" value={formData.nombre} onChange={handleChange}
                  placeholder="Nombre y apellido" className={errs.nombre ? 'dn-input-err' : ''} />
                {errs.nombre && <span className="dn-err-msg">{errs.nombre}</span>}
              </div>

              <div className={`dn-form-group${errs.numero_identidad ? ' dn-field-error' : ''}`}>
                <label>Número de Identidad <span className="req">*</span></label>
                <input name="numero_identidad" value={formData.numero_identidad} onChange={handleChange}
                  placeholder="0000-0000-00000" className={errs.numero_identidad ? 'dn-input-err' : ''} />
                {errs.numero_identidad && <span className="dn-err-msg">{errs.numero_identidad}</span>}
              </div>

              <div className={`dn-form-group${errs.email ? ' dn-field-error' : ''}`}>
                <label>Correo Electrónico <span className="req">*</span></label>
                <input name="email" type="email" value={formData.email} onChange={handleChange}
                  placeholder="correo@ejemplo.com" className={errs.email ? 'dn-input-err' : ''} />
                {errs.email && <span className="dn-err-msg">{errs.email}</span>}
              </div>

              <div className={`dn-form-group${errs.telefono ? ' dn-field-error' : ''}`}>
                <label>Teléfono <span className="req">*</span></label>
                <input name="telefono" value={formData.telefono} onChange={handleChange}
                  placeholder="Número de teléfono" className={errs.telefono ? 'dn-input-err' : ''} />
                {errs.telefono && <span className="dn-err-msg">{errs.telefono}</span>}
              </div>

              <div className="dn-form-group">
                <label>Empresa / Institución</label>
                <input name="empresa" value={formData.empresa} onChange={handleChange}
                  placeholder="Empresa u organización" />
              </div>

              <div className="dn-form-group">
                <label>Estado</label>
                <select name="estado" value={formData.estado} onChange={handleChange}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              <div className="dn-form-group">
                <label>Fecha de Registro</label>
                <input name="fecha_registro" type="date" value={formData.fecha_registro} onChange={handleChange} />
              </div>

              <div className="dn-form-group dn-full">
                <label>Notas</label>
                <textarea name="notas" value={formData.notas} onChange={handleChange}
                  placeholder="Observaciones adicionales..." rows="2" />
              </div>
            </div>
          </div>
        )}

        {/* TAB: Cargo y Vigencia */}
        {tab === 'cargo' && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Cargo y Vigencia</div>
            <div className="dn-form-grid">

              <div className={`dn-form-group dn-full${errs.cargo ? ' dn-field-error' : ''}`}>
                <label>Cargo en la Directiva <span className="req">*</span></label>
                <input name="cargo" value={formData.cargo} onChange={handleChange}
                  placeholder="Ej: Presidente, Secretario..." className={errs.cargo ? 'dn-input-err' : ''} />
                {errs.cargo && <span className="dn-err-msg">{errs.cargo}</span>}
              </div>

              <div className={`dn-form-group${errs.fecha_inicio_cargo ? ' dn-field-error' : ''}`}>
                <label>Fecha de Inicio en el Cargo <span className="req">*</span></label>
                <input name="fecha_inicio_cargo" type="date" value={formData.fecha_inicio_cargo} onChange={handleChange}
                  className={errs.fecha_inicio_cargo ? 'dn-input-err' : ''} />
                {errs.fecha_inicio_cargo
                  ? <span className="dn-err-msg">{errs.fecha_inicio_cargo}</span>
                  : <small className="dn-hint">Fecha real de inicio del cargo</small>}
              </div>

              <div className="dn-form-group">
                <label>Fecha de Finalización Prevista</label>
                <input name="fecha_fin_cargo" type="date" value={formData.fecha_fin_cargo}
                  onChange={handleChange} min={formData.fecha_inicio_cargo || undefined} />
                <small className="dn-hint">Dejar en blanco si aún está vigente</small>
              </div>

              {formData.fecha_fin_cargo && (
                <div className="dn-form-group dn-full">
                  <label><AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Motivo de Salida / Fin de Cargo
                  </label>
                  <textarea name="motivo_salida" value={formData.motivo_salida} onChange={handleChange}
                    placeholder="Ej: Renuncia voluntaria, fin de período, destitución..." rows="3" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Fotografía */}
        {tab === 'foto' && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Fotografía del Miembro</div>
            <div className="dn-upload-area">
              {preview ? (
                <div className="dn-preview-wrap">
                  <img src={preview} alt="Preview" className="dn-img-preview" />
                  <div className="dn-preview-actions">
                    <input type="file" accept="image/*"
                      onChange={e => handleFotoChange(e, setPreview, setFormData)}
                      style={{ display: 'none' }} id="dir-foto-replace" />
                    <label htmlFor="dir-foto-replace" className="dn-btn-secondary">
                      <Upload size={15} /> Cambiar foto
                    </label>
                    <button type="button" className="dn-btn-danger-sm"
                      onClick={() => { setPreview(null); setFormData(p => ({ ...p, foto: null })); setHasCambios(true); }}>
                      <X size={15} /> Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dn-upload-empty">
                  <Upload size={42} color="#9b59b6" style={{ marginBottom: '0.75rem' }} />
                  <p>Arrastra una imagen o haz clic para seleccionar</p>
                  <input type="file" accept="image/*"
                    onChange={e => { handleFotoChange(e, setPreview, setFormData); setHasCambios(true); }}
                    style={{ display: 'none' }} id="dir-foto-new" />
                  <label htmlFor="dir-foto-new" className="dn-btn-primary-sm">
                    <ImagePlus size={16} /> Seleccionar imagen
                  </label>
                  <small>JPG, PNG · máx. 3 MB</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: Auditoría (solo edición) */}
        {tab === 'auditoria' && esEdicion && miembro && (
          <div className="dn-tab-content">
            <div className="dn-form-section-title">Auditoría del Miembro</div>
            <div className="dn-audit-card">

              <div className="dn-audit-row">
                <UserCheck size={16} className="dn-audit-ico" />
                <div>
                  <div className="dn-audit-label">Creación</div>
                  <div className="dn-audit-val">
                    Creado por: <strong>{miembro.creado_por || 'N/D'}</strong>
                    &nbsp;·&nbsp;
                    Fecha: <strong>{formatFecha(miembro.fecha_creacion_sistema || miembro.fecha_registro || miembro.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {(miembro.actualizado_por || miembro.fecha_actualizacion || miembro.updatedAt) && (
                <div className="dn-audit-row">
                  <Clock size={16} className="dn-audit-ico" />
                  <div>
                    <div className="dn-audit-label">Última Actualización</div>
                    <div className="dn-audit-val">
                      Por: <strong>{miembro.actualizado_por || 'N/D'}</strong>
                      &nbsp;·&nbsp;
                      <strong>{formatFecha(miembro.fecha_actualizacion || miembro.updatedAt)}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="dn-audit-ids">
                <small>ID: <strong>{miembro._id}</strong></small>
                <small>Estado: <strong>{miembro.estado || 'N/D'}</strong></small>
                {miembro.numero_identidad && <small>Identidad: <strong>{miembro.numero_identidad}</strong></small>}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="dn-modal-footer">
          {esEdicion && (
            <button type="button" className="dn-btn-danger"
              onClick={() => { setMiembroAEliminar(miembro); setShowConfirm(true); }}>
              <Trash2 size={15} /> Eliminar
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="dn-btn-cancel" onClick={onCancel}>
              <X size={15} /> Cancelar
            </button>
            <button type="submit" className="dn-btn-save">
              {esEdicion ? <><Save size={15} /> Guardar Cambios</> : <><Check size={15} /> Crear Miembro</>}
            </button>
          </div>
        </div>
      </form>
    );
  };

  // ── Tabla ──────────────────────────────────────────────────
  const renderTabla = (lista) => (
    <motion.div className="tabla-directiva" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <motion.div className="tabla-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 1fr 80px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><UserCheck size={14} /> MIEMBRO</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><Hash size={14} /> IDENTIDAD</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><Briefcase size={14} /> CARGO</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><Calendar size={14} /> VIGENCIA</div>
        <div style={{ textAlign:'center' }}>ESTADO</div>
        <div style={{ textAlign:'center' }}>ACCIÓN</div>
      </motion.div>
      <div className="tabla-body">
        {lista.length === 0 ? (
          <motion.div className="directiva-vacio" initial={{ opacity:0 }} animate={{ opacity:1 }}>
            No hay miembros que coincidan con la búsqueda.
          </motion.div>
        ) : lista.map((m, idx) => (
          <motion.div key={m._id} className="tabla-fila"
            initial={{ opacity:0, x:-40 }} animate={{ opacity:1, x:0 }}
            transition={{ delay: Math.min(idx * 0.05, 1), type:'spring', stiffness:120 }}
            style={{ gridTemplateColumns:'2fr 1.5fr 1.5fr 1.2fr 1fr 80px' }}>

            {/* Avatar + nombre */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#6C4FBF,#9B59B6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden', fontWeight:800, color:'#fff', fontSize:'.85rem' }}>
                {m.foto ? <img src={`data:image/jpeg;base64,${m.foto}`} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : iniciales(m.nombre)}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:'1rem', color:'#333' }}>{m.nombre}</div>
                <div style={{ fontSize:'.82rem', color:'#666' }}>{m.email}</div>
                {m.creado_por && <div style={{ fontSize:'.72rem', color:'#aaa' }}>Reg. por {m.creado_por}</div>}
              </div>
            </div>

            <div style={{ fontSize:'.86rem', color:'#555', fontFamily:'monospace' }}>
              {m.numero_identidad || <span style={{ color:'#E74C3C', fontSize:'.78rem', fontFamily:'inherit' }}>⚠ Sin identidad</span>}
            </div>

            <div style={{ fontWeight:600, color:'#667eea', fontSize:'.9rem' }}>{m.cargo}</div>

            <div style={{ fontSize:'.8rem', color:'#666' }}>
              {m.fecha_inicio_cargo && <div>Desde: {new Date(m.fecha_inicio_cargo).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</div>}
              {m.fecha_fin_cargo
                ? <div style={{ color:'#b45309' }}>Hasta: {new Date(m.fecha_fin_cargo).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</div>
                : m.fecha_inicio_cargo && <div style={{ color:'#1a7a40' }}>En curso</div>}
            </div>

            <div style={{ display:'flex', justifyContent:'center' }}>
              <span className={`estado-badge ${m.estado?.toLowerCase()}`}>{m.estado}</span>
            </div>

            <div style={{ display:'flex', justifyContent:'center' }}>
              <motion.button whileHover={{ scale:1.2 }} whileTap={{ scale:.9 }}
                onClick={e => { e.stopPropagation(); handleOpenEditModal(m); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#2196F3', padding:'5px', display:'flex', alignItems:'center' }} title="Editar">
                <Edit size={18} />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div className="directiva-container">

        {/* ── HEADER estilo mm-* ──────────────────────────── */}
        <motion.div className="mm-header"
          initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, type:'spring', stiffness:120 }}>
          <div className="mm-hi">
            <div className="mm-ht">
              <motion.div className="mm-htitle"
                initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}>
                <motion.span initial={{ rotate:-180, scale:0 }} animate={{ rotate:0, scale:1 }}
                  transition={{ type:'spring', stiffness:200, delay:0.2 }}>
                  <Users size={34} color="white" fill="white" />
                </motion.span>
                Gestión de Directiva
              </motion.div>
            </div>

            <motion.p className="mm-sub" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
              {esFiltrado
                ? `Mostrando ${totalFiltrado} miembro${totalFiltrado !== 1 ? 's' : ''} filtrado${totalFiltrado !== 1 ? 's' : ''}`
                : 'Administra los miembros de la directiva con plena identificación y trazabilidad'}
            </motion.p>

            <motion.div className="mm-stats" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}>
              {[
                { ico:<Users size={18} color="white"/>,      val: esFiltrado ? totalFiltrado   : miembros.length, lbl: esFiltrado ? 'Filtrados' : 'Total' },
                { ico:<UserCheck size={18} color="white"/>,  val: activosFiltrado,   lbl:'Activos' },
                { ico:<Clock size={18} color="white"/>,      val: inactivosFilt,     lbl:'Inactivos' },
                { ico:<Shield size={18} color="white"/>,     val: suspendidosFilt,   lbl:'Suspendidos' },
              ].map((s, i) => (
                <motion.div key={i} className="mm-stat"
                  whileHover={{ scale:1.04, y:-2 }} transition={{ type:'spring', stiffness:300 }}>
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

        {/* ── BARRA DE ACCIONES ──────────────────────────── */}
        <motion.div className="directiva-action-area"
          initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}>

          <div className="directiva-action-bar">
            {/* Búsqueda */}
            <div className="directiva-search-wrapper">
              <span className="directiva-search-icon"><Search size={16} /></span>
              <input type="text" className="directiva-search-input"
                placeholder="Buscar por nombre, cargo, email o identidad..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              {busqueda && (
                <button className="directiva-search-clear" onClick={() => setBusqueda('')}>×</button>
              )}
            </div>

            {/* Botones */}
            <div className="directiva-bar-buttons">
              {/* Filtro orden */}
              <div style={{ position:'relative' }}>
                <button className="btn-ayuda" onClick={() => setMostrarMenuFiltros(p => !p)}>
                  <Briefcase size={16} /> Ordenar
                </button>
                <AnimatePresence>
                  {mostrarMenuFiltros && (
                    <motion.div className="filtros-menu"
                      initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:-8 }} transition={{ duration:.18 }}>
                      {[
                        { v:'ninguno',       l:'Sin ordenar' },
                        { v:'nombre-az',     l:'Nombre A-Z' },
                        { v:'nombre-za',     l:'Nombre Z-A' },
                        { v:'cargo-az',      l:'Cargo A-Z' },
                        { v:'estado-activo', l:'Activos Primero' },
                      ].map(o => (
                        <div key={o.v} className={`filtro-opcion${filtroOrden === o.v ? ' active' : ''}`}
                          onClick={() => { setFiltroOrden(o.v); setMostrarMenuFiltros(false); }}>
                          {o.l}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)}>
                <HelpCircle size={16} /> Ayuda
              </button>
              <button className="btn-ayuda btn-nuevo" onClick={() => {
                setFormData(formVacio()); setFotoPreview(null);
                setErrors({}); setTabActivo('info'); setHayCambios(false);
                setMostrarModalCrear(true);
              }}>
                <Plus size={16} /> Nuevo Miembro
              </button>
            </div>
          </div>

          {/* Pills de estado */}
          <div className="directiva-filters-bar">
            <span className="directiva-filter-label">Estado:</span>
            <div className="directiva-filter-pills">
              {[
                { v:'todos',      l:'Todos' },
                { v:'activo',     l:'Activos' },
                { v:'inactivo',   l:'Inactivos' },
                { v:'suspendido', l:'Suspendidos' },
              ].map(p => (
                <button key={p.v} className={`directiva-pill${filtroEstado === p.v ? ' active' : ''}`}
                  onClick={() => setFiltroEstado(p.v)}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── TABLA ──────────────────────────────────────── */}
        <div className="directiva-body-area">
          {loading && miembros.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem' }}>
              <Users size={40} color="#6C4FBF" />
              <p style={{ color:'#6C4FBF', fontWeight:600 }}>Cargando miembros...</p>
            </div>
          ) : renderTabla(miembrosOrdenados)}
        </div>
      </div>

      {/* ══ MODAL CREAR ═════════════════════════════════════ */}
      <AnimatePresence>
        {mostrarModalCrear && (
          <motion.div className="dn-overlay" onClick={() => {
            if (hayCambios) return; // no cerrar si hay cambios sin guardar
            setMostrarModalCrear(false); setFormData(formVacio()); setFotoPreview(null); setErrors({});
          }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="dn-modal" onClick={e => e.stopPropagation()}
              initial={{ scale:.85, y:40 }} animate={{ scale:1, y:0 }}
              exit={{ scale:.85, y:40 }} transition={{ type:'spring', damping:22 }}>

              <div className="dn-modal-header">
                <h3><Plus size={20} /> Agregar Nuevo Miembro</h3>
                <button className="dn-modal-close" onClick={() => {
                  setMostrarModalCrear(false); setFormData(formVacio()); setFotoPreview(null); setErrors({});
                }}><X size={18} /></button>
              </div>

              {hayCambios && <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>}

              {renderFormulario({
                onSubmit:  handleCrearMiembro,
                esEdicion: false,
                miembro:   null,
                tab:       tabActivo,  setTab:       setTabActivo,
                errs:      errors,     setErrs:      setErrors,
                preview:   fotoPreview, setPreview:  setFotoPreview,
                hasCambios: hayCambios, setHasCambios: setHayCambios,
                onCancel: () => {
                  setMostrarModalCrear(false); setFormData(formVacio());
                  setFotoPreview(null); setErrors({}); setHayCambios(false);
                },
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL EDITAR ════════════════════════════════════ */}
      <AnimatePresence>
        {miembroEditando && (
          <motion.div className="dn-overlay" onClick={handleCloseEditModal}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="dn-modal" onClick={e => e.stopPropagation()}
              initial={{ scale:.85, y:40 }} animate={{ scale:1, y:0 }}
              exit={{ scale:.85, y:40 }} transition={{ type:'spring', damping:22 }}>

              <div className="dn-modal-header">
                <h3><Edit size={20} /> Editar: {miembroEditando.nombre}</h3>
                <button className="dn-modal-close" onClick={handleCloseEditModal}><X size={18} /></button>
              </div>

              {hayCambiosEdit && <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>}

              {renderFormulario({
                onSubmit:  handleEditarMiembro,
                esEdicion: true,
                miembro:   miembroEditando,
                tab:       tabEdicion,  setTab:       setTabEdicion,
                errs:      errorsEdit,  setErrs:      setErrorsEdit,
                preview:   fotoPreviewEdit, setPreview: setFotoPreviewEdit,
                hasCambios: hayCambiosEdit, setHasCambios: setHayCambiosEdit,
                onCancel:  handleCloseEditModal,
                onEliminar: () => { setMiembroAEliminar(miembroEditando); setShowConfirm(true); },
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CONFIRM ELIMINAR ════════════════════════════════ */}
      {showConfirm && (
        <ConfirmDialog
          message={`¿Eliminar a "${miembroAEliminar?.nombre}"?`}
          onConfirm={confirmarEliminacion}
          onCancel={() => { setShowConfirm(false); setMiembroAEliminar(null); }}
          visible={showConfirm}
        />
      )}

      {/* ══ CONFIRM CERRAR CON CAMBIOS ══════════════════════ */}
      {showConfirmCerrar && (
        <ConfirmDialog
          message="Tienes cambios sin guardar. ¿Seguro que deseas cerrar?"
          onConfirm={() => {
            setShowConfirmCerrar(false);
            setMiembroEditando(null); setFormData(formVacio());
            setFotoPreviewEdit(null); setErrorsEdit({}); setHayCambiosEdit(false);
          }}
          onCancel={() => setShowConfirmCerrar(false)}
          visible={showConfirmCerrar}
        />
      )}

      {/* ══ MODAL AYUDA ═════════════════════════════════════ */}
      <AnimatePresence>
        {mostrarAyuda && (
          <motion.div className="dn-overlay" onClick={() => setMostrarAyuda(false)}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div className="dn-modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}
              initial={{ scale:.9, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:.9, y:30 }}
              transition={{ type:'spring', damping:22 }}>
              <div className="dn-modal-header">
                <h3><HelpCircle size={20} /> Ayuda — Directiva</h3>
                <button className="dn-modal-close" onClick={() => setMostrarAyuda(false)}><X size={18} /></button>
              </div>
              <div style={{ padding:'1.5rem' }}>
                <div style={{ marginBottom:16 }}>
                  <h4 style={{ fontWeight:700, marginBottom:8, color:'#333' }}>Campos del miembro</h4>
                  <ul style={{ paddingLeft:'1.2rem', fontSize:'.88rem', color:'#555', lineHeight:1.8 }}>
                    <li><strong>Número de Identidad:</strong> Obligatorio y único por miembro.</li>
                    <li><strong>Foto:</strong> Identificación visual del miembro en el sistema.</li>
                    <li><strong>Cargo y Vigencia:</strong> Fecha de inicio, fin y motivo de salida.</li>
                    <li><strong>Auditoría:</strong> El sistema registra automáticamente quién y cuándo registró.</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontWeight:700, marginBottom:8, color:'#333' }}>Estados</h4>
                  <ul style={{ paddingLeft:'1.2rem', fontSize:'.88rem', color:'#555', lineHeight:1.8 }}>
                    <li><strong>Activo:</strong> Miembro en funciones.</li>
                    <li><strong>Inactivo:</strong> Ya no ocupa el cargo.</li>
                    <li><strong>Suspendido:</strong> En proceso administrativo.</li>
                  </ul>
                </div>
              </div>
              <div className="dn-modal-footer">
                <button className="dn-btn-cancel" onClick={() => setMostrarAyuda(false)}>Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ NOTIFICACIÓN ════════════════════════════════════ */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity:0, y:-50 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-50 }}
            style={{ position:'fixed', top:20, right:20, zIndex:10000,
              background: notification.type === 'success' ? '#4CAF50' : '#f44336',
              color:'white', padding:'1rem 1.5rem', borderRadius:12,
              boxShadow:'0 4px 16px rgba(0,0,0,.15)', display:'flex',
              alignItems:'center', gap:10, fontWeight:700, fontFamily:'inherit' }}>
            {notification.message}
            <button onClick={() => setNotification(null)}
              style={{ background:'none', border:'none', color:'white', cursor:'pointer', display:'flex' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Directiva;