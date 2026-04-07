import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../../styles/Proveedores.css"
import { auth } from "../../../components/authentication/Auth";
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import { loadingController } from "../../../api/loadingController";
import { 
  Building2, Mail, Phone, MapPin, Hash, Search, HelpCircle, Plus, Edit, Trash2,
  X, Clock, Save, Check, Package, Briefcase, Users, Truck, CheckCircle, XCircle,
  Settings, Boxes, Star, Eye, Award, Copy
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL + "/api/proveedores";

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroOrden, setFiltroOrden] = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filtros avanzados
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCiudad, setFiltroCiudad] = useState('todos');
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [mostrarNotas, setMostrarNotas] = useState(null);

  // Errores de validación por campo
  const [errores, setErrores] = useState({});

  const [formData, setFormData] = useState({
    id_proveedor: '',
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    pais: '',
    contacto: '',
    sitio_web: '',
    rtn: '',
    tipo_proveedor: 'PRODUCTOS',
    estado: 'ACTIVO',
    calificacion: 5,
    notas: '',
    condiciones_pago: '',
    tiempo_entrega_promedio: ''
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      loadingController.start();
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al cargar proveedores');
      const data = await res.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener los proveedores:', err);
      showNotification(err.message || 'Error al cargar los proveedores', 'error');
      setProveedores([]);
    } finally {
      setLoading(false);
      loadingController.stop();
    }
  };

  const totalProveedores = proveedores.length;
  const proveedoresActivos = proveedores.filter(p => p.estado === "ACTIVO").length;
  const proveedoresProductos = proveedores.filter(p => p.tipo_proveedor === "PRODUCTOS").length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setFormData({
      id_proveedor: '', nombre: '', empresa: '', email: '', telefono: '',
      direccion: '', ciudad: '', pais: '', contacto: '', sitio_web: '', rtn: '',
      tipo_proveedor: 'PRODUCTOS', estado: 'ACTIVO', calificacion: 5,
      notas: '', condiciones_pago: '', tiempo_entrega_promedio: ''
    });
    setErrores({});
  };

  const generarIdProveedor = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return parseInt(timestamp.slice(-3) + random);
  };

  // ─── VALIDACIÓN CENTRAL ───────────────────────────────────────────────────
 const validarFormulario = () => {
  const nuevosErrores = {};

  if (!formData.nombre.trim())
    nuevosErrores.nombre = 'El nombre es obligatorio';

  if (!formData.empresa.trim())                          // ← AGREGAR
    nuevosErrores.empresa = 'La empresa es obligatoria'; // ← AGREGAR

  if (!formData.email.trim())
    nuevosErrores.email = 'El email es obligatorio';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    nuevosErrores.email = 'El email no tiene un formato válido';

  if (!formData.telefono.trim())
    nuevosErrores.telefono = 'El teléfono es obligatorio';

  if (!formData.direccion.trim())
    nuevosErrores.direccion = 'La dirección es obligatoria';

  if (!formData.ciudad.trim())
    nuevosErrores.ciudad = 'La ciudad es obligatoria';

  if (!formData.pais.trim())
    nuevosErrores.pais = 'El país es obligatorio';

  if (!formData.rtn.trim())                              // ← CAMBIAR
    nuevosErrores.rtn = 'El RTN es obligatorio';        // ← CAMBIAR
  else if (formData.rtn.length !== 14)                   // ← CAMBIAR
    nuevosErrores.rtn = 'El RTN debe tener exactamente 14 dígitos'; // ← CAMBIAR

  setErrores(nuevosErrores);
  return Object.keys(nuevosErrores).length === 0;
};

  // ─── CREAR ────────────────────────────────────────────────────────────────
  const handleCrearProveedor = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      showNotification('Por favor corrige los errores antes de continuar', 'error');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const datosProveedor = {
        ...formData,
        id_proveedor: generarIdProveedor(),
        calificacion: parseInt(formData.calificacion) || 5,
        tiempo_entrega_promedio: formData.tiempo_entrega_promedio
          ? parseInt(formData.tiempo_entrega_promedio) : undefined
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(datosProveedor)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el proveedor');
      }

      await cargarProveedores();
      setMostrarModalCrear(false);
      resetForm();
      showNotification(`Proveedor "${formData.nombre}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el proveedor', 'error');
    }
  };

  // ─── EDITAR ───────────────────────────────────────────────────────────────
  const handleEditarProveedor = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      showNotification('Por favor corrige los errores antes de continuar', 'error');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const datosActualizados = {
        ...formData,
        calificacion: parseInt(formData.calificacion) || 5,
        tiempo_entrega_promedio: formData.tiempo_entrega_promedio
          ? parseInt(formData.tiempo_entrega_promedio) : undefined
      };

      const res = await fetch(`${API_URL}/${proveedorSeleccionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(datosActualizados)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el proveedor');
      }

      await cargarProveedores();
      setProveedorSeleccionado(null);
      resetForm();
      showNotification(`Proveedor "${formData.nombre}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el proveedor', 'error');
    }
  };

  // ─── ELIMINAR ─────────────────────────────────────────────────────────────
  const prepararEliminacionProveedor = () => {
    if (!proveedorSeleccionado) return;
    const proveedor = proveedores.find(p => p._id === proveedorSeleccionado._id);
    if (!proveedor) return;
    setProveedorAEliminar(proveedor);
    setShowConfirm(true);
  };

  const confirmarEliminacionProveedor = async () => {
    setShowConfirm(false);
    if (!proveedorAEliminar) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/${proveedorAEliminar._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el proveedor');
      }
      await cargarProveedores();
      setProveedorSeleccionado(null);
      resetForm();
      showNotification(`Proveedor "${proveedorAEliminar.nombre}" eliminado exitosamente`, 'success');
      setProveedorAEliminar(null);
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el proveedor', 'error');
    }
  };

  const cancelarEliminacionProveedor = () => {
    setShowConfirm(false);
    setProveedorAEliminar(null);
  };

  const proveedoresFiltrados = proveedores.filter(p => {
    // Búsqueda por texto
    const t = busqueda.toLowerCase();
    const cumplebusqueda = (
      p.nombre?.toLowerCase().includes(t) ||
      p.empresa?.toLowerCase().includes(t) ||
      p.email?.toLowerCase().includes(t) ||
      p.telefono?.toString().includes(t) ||
      p.ciudad?.toLowerCase().includes(t) ||
      p.pais?.toLowerCase().includes(t) ||
      p.contacto?.toLowerCase().includes(t)
    );

    // Filtro por estado
    const cumpleEstado = filtroEstado === 'todos' || p.estado === filtroEstado;

    // Filtro por tipo
    const cumpleTipo = filtroTipo === 'todos' || p.tipo_proveedor === filtroTipo;

    // Filtro por ciudad
    const cumpleCiudad = filtroCiudad === 'todos' || p.ciudad === filtroCiudad;

    return cumplebusqueda && cumpleEstado && cumpleTipo && cumpleCiudad;
  });

  const proveedoresOrdenados = [...proveedoresFiltrados].sort((a, b) => {
    switch (filtroOrden) {
      case 'id-mayor': return b.id_proveedor - a.id_proveedor;
      case 'id-menor': return a.id_proveedor - b.id_proveedor;
      case 'nombre-az': return (a.nombre || '').localeCompare(b.nombre || '');
      case 'nombre-za': return (b.nombre || '').localeCompare(a.nombre || '');
      case 'estado-activo': {
        const o = { ACTIVO: 1, SUSPENDIDO: 2, INACTIVO: 3 };
        return (o[a.estado] || 999) - (o[b.estado] || 999);
      }
      case 'estado-inactivo': {
        const o = { INACTIVO: 1, SUSPENDIDO: 2, ACTIVO: 3 };
        return (o[a.estado] || 999) - (o[b.estado] || 999);
      }
      default: return 0;
    }
  });

  const getEstrellas = (cal) => cal ? '★'.repeat(cal) + '☆'.repeat(5 - cal) : '☆☆☆☆☆';

  const getTipoIcon = (tipo) => ({
    PRODUCTOS: <Package size={18} />,
    SERVICIOS: <Briefcase size={18} />,
    MIXTO: <Building2 size={18} />
  }[tipo] || <Package size={18} />);

  // ─── FUNCIONES HELPER PARA LA TABLA ───────────────────────────────────────
  const obtenerColorBadgeCondiciones = (dias) => {
    if (!dias) return { bg: '#f3f4f6', color: '#6b7280', label: 'N/A' };
    const numDias = parseInt(dias);
    if (numDias <= 15) return { bg: '#dcfce7', color: '#166534', label: `${numDias}d` };
    if (numDias <= 30) return { bg: '#fef3c7', color: '#92400e', label: `${numDias}d` };
    return { bg: '#fee2e2', color: '#991b1b', label: `${numDias}d` };
  };

  const obtenerCiudades = () => {
    const ciudades = new Set(proveedores.map(p => p.ciudad).filter(Boolean));
    return Array.from(ciudades).sort();
  };

  const copiarAlPortapapeles = async (texto, tipo) => {
    try {
      await navigator.clipboard.writeText(texto);
      showNotification(`${tipo} copiado al portapapeles`, 'success');
    } catch (err) {
      showNotification('Error al copiar', 'error');
    }
  };

  const handleOpenEditModal = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setErrores({});
    setFormData({
      id_proveedor: proveedor.id_proveedor || '',
      nombre: proveedor.nombre || '',
      empresa: proveedor.empresa || '',
      email: proveedor.email || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      pais: proveedor.pais || '',
      contacto: proveedor.contacto || '',
      sitio_web: proveedor.sitio_web || '',
      rtn: proveedor.rtn || '',
      tipo_proveedor: proveedor.tipo_proveedor || 'PRODUCTOS',
      estado: proveedor.estado || 'ACTIVO',
      calificacion: proveedor.calificacion || 5,
      notas: proveedor.notas || '',
      condiciones_pago: proveedor.condiciones_pago || '',
      tiempo_entrega_promedio: proveedor.tiempo_entrega_promedio || ''
    });
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setProveedorSeleccionado(null);
    resetForm();
  };

  // ─── ESTILOS DE ERROR ─────────────────────────────────────────────────────
  const inputStyle = (campo) => ({
    borderColor: errores[campo] ? '#dc2626' : undefined,
    boxShadow: errores[campo] ? '0 0 0 1px #dc2626' : undefined
  });

  const ErrorMsg = ({ campo }) => errores[campo]
    ? <small style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errores[campo]}</small>
    : null;

  // ─── CAMPOS DE FORMULARIO (reutilizables en ambos modales) ────────────────
  const renderCamposFormulario = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Sección 1: Ficha de Identidad Legal */}
      <div className="form-section">
        <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} color="#667eea" /> Ficha de Identidad Legal
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Nombre y Empresa */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => { setFormData({ ...formData, nombre: e.target.value }); setErrores({ ...errores, nombre: '' }); }}
                placeholder="Nombre del proveedor"
                style={inputStyle('nombre')}
              />
              <ErrorMsg campo="nombre" />
            </div>
            <div className="form-group">
              <label>Empresa *</label>
              <input
                type="text"
                value={formData.empresa}
                onChange={(e) => { setFormData({ ...formData, empresa: e.target.value }); setErrores({ ...errores, empresa: '' }); }}
                placeholder="Nombre de la empresa"
                style={inputStyle('empresa')}
              />
              <ErrorMsg campo="empresa" />
            </div>
          </div>

          {/* RTN y Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>RTN *</label>
              <input
                type="text"
                value={formData.rtn}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 14);
                  setFormData({ ...formData, rtn: soloNumeros });
                  setErrores({ ...errores, rtn: '' });
                }}
                placeholder="Ej: 08011985123456"
                maxLength={14}
                inputMode="numeric"
                style={inputStyle('rtn')}
              />
              {formData.rtn.length > 0 && formData.rtn.length < 14 && (
                <small style={{ color: '#dc2626', fontSize: '12px' }}>{formData.rtn.length}/14 dígitos</small>
              )}
              {formData.rtn.length === 14 && (
                <small style={{ color: '#16a34a', fontSize: '12px' }}>✓ RTN válido</small>
              )}
              <ErrorMsg campo="rtn" />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={formData.tipo_proveedor} onChange={(e) => setFormData({ ...formData, tipo_proveedor: e.target.value })}>
                <option value="PRODUCTOS">PRODUCTOS</option>
                <option value="SERVICIOS">SERVICIOS</option>
                <option value="MIXTO">MIXTO</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Canales de Comunicación */}
      <div className="form-section">
        <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={20} color="#667eea" /> Canales de Comunicación
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email y Teléfono */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrores({ ...errores, email: '' }); }}
                placeholder="correo@ejemplo.com"
                style={inputStyle('email')}
              />
              <ErrorMsg campo="email" />
            </div>
            <div className="form-group">
              <label>Teléfono *</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => { setFormData({ ...formData, telefono: e.target.value }); setErrores({ ...errores, telefono: '' }); }}
                placeholder="+504 1234-5678"
                style={inputStyle('telefono')}
              />
              <ErrorMsg campo="telefono" />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Localización Física */}
      <div className="form-section">
        <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="#667eea" /> Localización Física
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Ciudad y País */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Ciudad *</label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => { setFormData({ ...formData, ciudad: e.target.value }); setErrores({ ...errores, ciudad: '' }); }}
                placeholder="Ciudad"
                style={inputStyle('ciudad')}
              />
              <ErrorMsg campo="ciudad" />
            </div>
            <div className="form-group">
              <label>País *</label>
              <input
                type="text"
                value={formData.pais}
                onChange={(e) => { setFormData({ ...formData, pais: e.target.value }); setErrores({ ...errores, pais: '' }); }}
                placeholder="País"
                style={inputStyle('pais')}
              />
              <ErrorMsg campo="pais" />
            </div>
          </div>

          {/* Dirección */}
          <div className="form-group">
            <label>Dirección *</label>
            <textarea
              value={formData.direccion}
              onChange={(e) => { setFormData({ ...formData, direccion: e.target.value }); setErrores({ ...errores, direccion: '' }); }}
              placeholder="Dirección completa"
              rows="3"
              style={inputStyle('direccion')}
            />
            <ErrorMsg campo="direccion" />
          </div>
        </div>
      </div>

      {/* Sección 4: Configuración Administrativa */}
      <div className="form-section">
        <h4 style={{ margin: '0 0 1rem 0', color: '#333', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={20} color="#667eea" /> Configuración Administrativa
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Estado, Condiciones de Pago, Tiempo Entrega */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Estado</label>
              <select value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value })}>
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="SUSPENDIDO">SUSPENDIDO</option>
              </select>
            </div>
            <div className="form-group">
              <label>Condiciones de Pago</label>
              <input
                type="text"
                value={formData.condiciones_pago}
                onChange={(e) => setFormData({ ...formData, condiciones_pago: e.target.value })}
                placeholder="Ej: 30 días"
              />
            </div>
            <div className="form-group">
              <label>Tiempo Entrega (días)</label>
              <input
                type="number"
                value={formData.tiempo_entrega_promedio}
                onChange={(e) => setFormData({ ...formData, tiempo_entrega_promedio: e.target.value })}
                placeholder="Días promedio"
                min="0"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Comentarios internos..."
              rows="3"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // ─── TABLA ────────────────────────────────────────────────────────────────
  const renderTablaProveedores = (titulo, lista, icon) => (
    <motion.div
      className="proveedor-categoria-sectilon"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <motion.div className="proveedor-categoria-header" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <h3 className="proveedor-subtitulo">{icon} {titulo} ({lista.length})</h3>
      </motion.div>

      {lista.length === 0 ? (
        <motion.p className="proveedor-vacio" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          No hay proveedores en esta categoría.
        </motion.p>
      ) : (
        <motion.div className="tabla-proveedores" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <motion.div className="tabla-header-proveedores" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Hash size={14} /> ID</div>
            <div>NOMBRE</div>
            <div>EMPRESA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={14} /> CONTACTO</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14} /> UBICACIÓN</div>
            <div style={{ textAlign: 'center' }}>TIPO</div>
            <div style={{ textAlign: 'center' }}>ESTADO</div>
            <div style={{ textAlign: 'center' }}>CONDICIONES</div>
            <div style={{ textAlign: 'center' }}>ENTREGA</div>
            <div style={{ textAlign: 'center' }}>ACCIONES</div>
          </motion.div>

          <div className="tabla-body-proveedores">
            {lista.map((proveedor, index) => {
              const condicionesBadge = obtenerColorBadgeCondiciones(proveedor.condiciones_pago);
              return (
                <motion.div
                  key={proveedor._id}
                  className="tabla-fila-proveedores"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 1), duration: 0.4, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                  onClick={() => handleOpenEditModal(proveedor)}
                >
                  {/* ID */}
                  <motion.div style={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.95rem', whiteSpace: 'nowrap' }} whileHover={{ scale: 1.1 }}>
                    #{proveedor.id_proveedor}
                  </motion.div>

                  {/* NOMBRE */}
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proveedor.nombre}>
                    {proveedor.nombre}
                  </div>

                  {/* EMPRESA */}
                  <div style={{ fontSize: '0.85rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proveedor.empresa}>
                    {proveedor.empresa || '-'}
                  </div>

                  {/* CONTACTO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Mail size={12} color="#667eea" style={{ minWidth: '12px' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proveedor.email}>{proveedor.email}</span>
                      <Copy size={12} color="#999" onClick={(e) => { e.stopPropagation(); copiarAlPortapapeles(proveedor.email, 'Email'); }} style={{ cursor: 'pointer', minWidth: '12px' }} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Phone size={12} color="#667eea" style={{ minWidth: '12px' }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proveedor.telefono}>{proveedor.telefono}</span>
                      <Copy size={12} color="#999" onClick={(e) => { e.stopPropagation(); copiarAlPortapapeles(proveedor.telefono, 'Teléfono'); }} style={{ cursor: 'pointer', minWidth: '12px' }} />
                    </div>
                  </div>

                  {/* UBICACIÓN */}
                  <div style={{ fontSize: '0.85rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${proveedor.ciudad}${proveedor.direccion ? ' - ' + proveedor.direccion : ''}`}>
                    {proveedor.ciudad || '-'}
                  </div>

                  {/* TIPO */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                    {getTipoIcon(proveedor.tipo_proveedor)}
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{proveedor.tipo_proveedor}</span>
                  </div>

                  {/* ESTADO */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span className={`estado-badge ${proveedor.estado.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '3px 8px' }}>{proveedor.estado}</span>
                  </div>

                  {/* CONDICIONES PAGO */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      background: condicionesBadge.bg,
                      color: condicionesBadge.color,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}>
                      {condicionesBadge.label}
                    </span>
                  </div>

                  {/* TIEMPO ENTREGA */}
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>
                    {proveedor.tiempo_entrega_promedio ? `${proveedor.tiempo_entrega_promedio}d` : '-'}
                  </div>

                  {/* ACCIONES */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center' }}>
                    {proveedor.notas && (
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setMostrarNotas(mostrarNotas === proveedor._id ? null : proveedor._id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFC107', padding: '4px', display: 'flex', alignItems: 'center' }}
                        title="Ver notas"
                      >
                        <Clock size={15} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.9, rotate: -15 }}
                      onClick={(e) => { e.stopPropagation(); handleOpenEditModal(proveedor); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2196F3', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Editar"
                    >
                      <Edit size={15} />
                    </motion.button>
                  </div>

                  {/* POPUP NOTAS */}
                  {mostrarNotas === proveedor._id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        gridColumn: '1 / -1',
                        background: '#f9fafb',
                        padding: '1rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#555',
                        borderLeft: '3px solid #FFC107',
                        marginTop: '0px'
                      }}
                    >
                      <strong>Notas:</strong> {proveedor.notas}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <>
      <div className="proveedor-container">
        {/* ENCABEZADO */}
        <motion.div className="proveedor-header" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: "spring", stiffness: 100 }}>
          <motion.div
            className="header-gradient"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "2.5rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3, background: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

            <div className="header-content" style={{ position: "relative", zIndex: 2 }}>
              <motion.h2 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
                style={{ fontSize: "2.8rem", color: "white", marginBottom: "0.5rem", fontWeight: 800, textShadow: "0 2px 10px rgba(0,0,0,0.2)", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "1rem" }}>
                <Building2 size={36} fill="white" color="white" />
                Sistema de Proveedores
                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }} style={{ marginLeft: 'auto' }}>
                  <Truck size={32} color="white" />
                </motion.div>
              </motion.h2>

              <motion.p initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
                style={{ color: "rgba(255,255,255,0.9)", fontSize: "1.2rem", marginBottom: 0, fontWeight: 500 }}>
                Gestiona y controla todos tus proveedores de manera eficiente y profesional
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
                style={{ display: "flex", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
                {[
                  { icon: <Users size={20} color="white" />, value: totalProveedores, label: 'Total Proveedores' },
                  { icon: <Award size={20} color="white" />, value: proveedoresActivos, label: 'Proveedores Activos' },
                  { icon: <Package size={20} color="white" />, value: proveedoresProductos, label: 'Proveedores Productos' },
                ].map((stat, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 300 }}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.15)", padding: "0.75rem 1.25rem", borderRadius: "12px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex", alignItems: "center" }}>{stat.icon}</div>
                    <div>
                      <div style={{ color: "white", fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                      <div style={{ color: "white", fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* BARRA DE BÚSQUEDA */}
          <motion.div className="proveedor-busqueda-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} style={{ marginTop: "2rem" }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                <Search size={18} />
              </div>
              <input type="text" className="proveedor-busqueda" placeholder="Buscar por nombre, empresa, email, teléfono, ciudad o país..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>

            <div style={{ position: 'relative' }}>
              <motion.button className="btn-ayuda" onClick={() => setMostrarMenuFiltros(!mostrarMenuFiltros)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Package size={18} /> Ordenar
              </motion.button>
              <AnimatePresence>
                {mostrarMenuFiltros && (
                  <motion.div className="filtros-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {[
                      { key: 'ninguno', label: 'Sin ordenar', icon: <Hash size={16} /> },
                      { key: 'id-mayor', label: '⬇️ ID Mayor a Menor' },
                      { key: 'id-menor', label: '⬆️ ID Menor a Mayor' },
                      { key: 'nombre-az', label: 'Nombre A-Z' },
                      { key: 'nombre-za', label: 'Nombre Z-A' },
                      { key: 'estado-activo', label: 'Activos Primero' },
                      { key: 'estado-inactivo', label: 'Inactivos Primero' },
                    ].map((opt, i) => (
                      <React.Fragment key={opt.key}>
                        {(i === 1 || i === 3 || i === 5) && <div className="filtro-separador" />}
                        <div className={`filtro-opcion ${filtroOrden === opt.key ? 'active' : ''}`} onClick={() => { setFiltroOrden(opt.key); setMostrarMenuFiltros(false); }}>
                          {opt.icon} {opt.label}
                        </div>
                      </React.Fragment>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ position: 'relative' }}>
              <motion.button className="btn-ayuda" onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <Settings size={18} /> Filtrar
              </motion.button>
              <AnimatePresence>
                {mostrarFiltrosAvanzados && (
                  <motion.div className="filtros-menu" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} style={{ width: '220px', minWidth: '220px' }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e0e0e0' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>ESTADO</label>
                      <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}>
                        <option value="todos">Todos</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="SUSPENDIDO">Suspendido</option>
                      </select>
                    </div>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e0e0e0' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>TIPO</label>
                      <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}>
                        <option value="todos">Todos</option>
                        <option value="PRODUCTOS">Productos</option>
                        <option value="SERVICIOS">Servicios</option>
                        <option value="MIXTO">Mixto</option>
                      </select>
                    </div>
                    <div style={{ padding: '0.75rem 1rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', display: 'block', marginBottom: '4px' }}>CIUDAD</label>
                      <select value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #e0e0e0', fontSize: '0.85rem' }}>
                        <option value="todos">Todas</option>
                        {obtenerCiudades().map(ciudad => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <HelpCircle size={18} /> Ayuda
            </motion.button>

            <motion.button className="btn-ayuda" onClick={() => setMostrarModalCrear(true)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Plus size={18} /> Nuevo Proveedor
            </motion.button>
          </motion.div>
        </motion.div>

        {/* TABLA */}
        {loading && proveedores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Package size={40} color="#667eea" />
            <p style={{ color: '#667eea', fontWeight: '600' }}>Cargando proveedores...</p>
          </div>
        ) : (
          <motion.div className="proveedor-categorias-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {renderTablaProveedores("Todos los Proveedores", proveedoresOrdenados, <Building2 size={20} style={{ color: '#667eea' }} />)}
          </motion.div>
        )}

        {/* MODAL CREAR */}
        <AnimatePresence>
          {mostrarModalCrear && (
            <motion.div className="modal-overlay" onClick={handleCloseModals} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} transition={{ type: "spring", damping: 25 }}>
                <h3 className="modal-title"><Plus size={20} /> Crear Nuevo Proveedor</h3>
                <form onSubmit={handleCrearProveedor} noValidate>
                  {renderCamposFormulario()}
                  <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                    <motion.button type="button" className="btn-cancelar" onClick={handleCloseModals} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <X size={16} /> Cancelar
                    </motion.button>
                    <motion.button type="submit" className="btn-guardar" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Check size={16} /> Crear Proveedor
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL EDITAR */}
        <AnimatePresence>
          {proveedorSeleccionado && (
            <motion.div className="modal-overlay" onClick={handleCloseModals} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} transition={{ type: "spring", damping: 25 }}>
                <h3 className="modal-title"><Edit size={20} /> Editar Proveedor</h3>
                <form onSubmit={handleEditarProveedor} noValidate>
                  {renderCamposFormulario()}
                  <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                    <motion.button type="button" className="btn btn-danger" onClick={prepararEliminacionProveedor} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Trash2 size={16} /> Eliminar
                    </motion.button>
                    <motion.button type="button" className="btn btn-dark" onClick={handleCloseModals} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <X size={16} /> Cancelar
                    </motion.button>
                    <motion.button type="submit" className="btn btn-guardar-donaciones" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Save size={16} /> Guardar Cambios
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONFIRM DIALOG */}
        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar el proveedor "${proveedorAEliminar?.nombre}"?`}
            onConfirm={confirmarEliminacionProveedor}
            onCancel={cancelarEliminacionProveedor}
            visible={showConfirm}
          />
        )}

        {/* NOTIFICACIONES */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
              style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, background: notification.type === 'success' ? '#4CAF50' : '#f44336', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              {notification.message}
              <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL AYUDA */}
        <AnimatePresence>
          {mostrarAyuda && (
            <div className="horarios-modal-overlay horarios-modal-show">
              <div className="horarios-modal-content">
                <div className="horarios-modal-header">
                  <h3 className="horarios-modal-title"><Truck size={24} /> Ayuda - Sistema de Proveedores</h3>
                  <button className="horarios-modal-close" onClick={() => setMostrarAyuda(false)}><X size={20} /></button>
                </div>
                <div className="horarios-modal-body">
                  <div className="horarios-help-section">
                    <h4 className="horarios-help-title">Campos obligatorios</h4>
                    <p className="horarios-help-text">Los campos marcados con * son obligatorios: Nombre, Email, Teléfono, Dirección, Ciudad y País. El RTN es opcional pero si se ingresa debe tener exactamente 14 dígitos numéricos.</p>
                  </div>
                  <div className="horarios-help-section">
                    <h4 className="horarios-help-title">Estados comerciales:</h4>
                    <div className="horarios-icons-grid">
                      <div className="horarios-icon-item"><CheckCircle size={16} className="horarios-icon-success" /><span>ACTIVOS - Relación comercial activa</span></div>
                      <div className="horarios-icon-item"><XCircle size={16} className="horarios-icon-danger" /><span>INACTIVOS - Sin actividad reciente</span></div>
                      <div className="horarios-icon-item"><Clock size={16} className="horarios-icon-warning" /><span>SUSPENDIDOS - Temporalmente suspendidos</span></div>
                    </div>
                  </div>
                </div>
                <div className="horarios-modal-footer">
                  <button className="horarios-modal-btn-close" onClick={() => setMostrarAyuda(false)}>Cerrar Ayuda</button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Proveedores;