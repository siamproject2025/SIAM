import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../../styles/Proveedores.css"
import { auth } from "../../../components/authentication/Auth";
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';
import { loadingController } from "../../../api/loadingController";
import { 
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Search,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  X,Clock,
  Save,
  Check,
  Package,
  Briefcase,
  Users, Truck,          // Para Proveedores
  CheckCircle,    // Para Activos
  XCircle,        // Para Inactivos
  Settings,       // Para Servicios
  Boxes,          // Para Mixto
  Star,           // Para Calificación
  Eye,  
  Award
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL+"/api/proveedores";

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

    const res = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

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


  // Calcular estadísticas
  const totalProveedores = proveedores.length;
  const proveedoresActivos = proveedores.filter(p => p.estado === "ACTIVO").length;
  const proveedoresProductos = proveedores.filter(p => p.tipo_proveedor === "PRODUCTOS").length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setFormData({
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
  };

  const generarIdProveedor = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const shortId = timestamp.slice(-3) + random;
    return parseInt(shortId);
  };

const handleCrearProveedor = async (e) => {
  e.preventDefault();
  
  try {
    if (!formData.nombre.trim()) {
      showNotification('El nombre del proveedor es obligatorio', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showNotification('El email del proveedor es obligatorio', 'error');
      return;
    }
    if (!formData.telefono) {
      showNotification('El teléfono del proveedor es obligatorio', 'error');
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const datosProveedor = {
      ...formData,
      id_proveedor: generarIdProveedor(),
      calificacion: parseInt(formData.calificacion) || 5,
      tiempo_entrega_promedio: formData.tiempo_entrega_promedio ? 
        parseInt(formData.tiempo_entrega_promedio) : undefined
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` //  Token agregado
      },
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

const handleEditarProveedor = async (e) => {
  e.preventDefault();

  try {
    if (!formData.nombre.trim()) {
      showNotification('El nombre del proveedor es obligatorio', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showNotification('El email del proveedor es obligatorio', 'error');
      return;
    }
    if (!formData.telefono) {
      showNotification('El teléfono del proveedor es obligatorio', 'error');
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const datosActualizados = {
      ...formData,
      calificacion: parseInt(formData.calificacion) || 5,
      tiempo_entrega_promedio: formData.tiempo_entrega_promedio ? 
        parseInt(formData.tiempo_entrega_promedio) : undefined
    };

    const res = await fetch(`${API_URL}/${proveedorSeleccionado._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` //  Token agregado
      },
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

const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
const [showConfirm, setShowConfirm] = useState(false);


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
      headers: {
        Authorization: `Bearer ${token}`
      }
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
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(terminoBusqueda) ||
      p.empresa?.toLowerCase().includes(terminoBusqueda) ||
      p.email?.toLowerCase().includes(terminoBusqueda) ||
      p.telefono?.toString().includes(terminoBusqueda) ||
      p.ciudad?.toLowerCase().includes(terminoBusqueda) ||
      p.pais?.toLowerCase().includes(terminoBusqueda) ||
      p.contacto?.toLowerCase().includes(terminoBusqueda)
    );
  });

  // Aplicar ordenamiento
  const proveedoresOrdenados = [...proveedoresFiltrados].sort((a, b) => {
    switch(filtroOrden) {
      case 'id-mayor':
        return b.id_proveedor - a.id_proveedor;
      case 'id-menor':
        return a.id_proveedor - b.id_proveedor;
      case 'nombre-az':
        return (a.nombre || '').localeCompare(b.nombre || '');
      case 'nombre-za':
        return (b.nombre || '').localeCompare(a.nombre || '');
      case 'estado-activo':
        const estadoOrden = { 'ACTIVO': 1, 'SUSPENDIDO': 2, 'INACTIVO': 3 };
        return (estadoOrden[a.estado] || 999) - (estadoOrden[b.estado] || 999);
      case 'estado-inactivo':
        const estadoOrdenInv = { 'INACTIVO': 1, 'SUSPENDIDO': 2, 'ACTIVO': 3 };
        return (estadoOrdenInv[a.estado] || 999) - (estadoOrdenInv[b.estado] || 999);
      default:
        return 0;
    }
  });

  const getEstrellas = (calificacion) => {
    if (!calificacion) return '';
    return ''.repeat(calificacion) + ''.repeat(5 - calificacion);
  };

  const getTipoIcon = (tipo) => {
    const icons = {
      'PRODUCTOS': <Package size={18} />,
      'SERVICIOS': <Briefcase size={18} />,
      'MIXTO': <Building2 size={18} />
    };
    return icons[tipo] || <Package size={18} />;
  };

  const handleOpenEditModal = (proveedor) => {
    setProveedorSeleccionado(proveedor);
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

  const renderTablaProveedores = (titulo, lista, icon) => (
    <motion.div 
      className="proveedor-categoria-sectilon"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <motion.div 
        className="proveedor-categoria-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="proveedor-subtitulo">
          <motion.div
            
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {icon}
          </motion.div>
          {titulo} ({lista.length})
        </h3>
      </motion.div>

      {lista.length === 0 ? (
        <motion.p 
          className="proveedor-vacio"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          No hay proveedores en esta categoría.
        </motion.p>
      ) : (
        <motion.div 
          className="tabla-proveedores"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <motion.div 
            className="tabla-header-proveedores"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <motion.div
              
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Hash size={14} />
              </motion.div>
              ID
            </div>
            <div>NOMBRE & EMPRESA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mail size={14} />
              CONTACTO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={14} />
              UBICACIÓN
            </div>
            <div style={{ textAlign: 'center' }}>TIPO</div>
            <div style={{ textAlign: 'center' }}>ESTADO</div>
            <div style={{ textAlign: 'center' }}>CALIFICACIÓN</div>
            <div style={{ textAlign: 'center' }}>ACCIONES</div>
          </motion.div>

          <div className="tabla-body-proveedores">
            {lista.map((proveedor, index) => (
              <motion.div
                key={proveedor._id}
                className="tabla-fila-proveedores"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: Math.min(index * 0.05, 1),
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
                onClick={() => handleOpenEditModal(proveedor)}
              >
                <motion.div 
                  style={{ 
                    fontWeight: 'bold', 
                    color: '#FF9800',
                    fontSize: '0.95rem'
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  #{proveedor.id_proveedor}
                </motion.div>

                <div>
                  <motion.div 
                    style={{ 
                      fontWeight: '600',
                      fontSize: '1rem',
                      color: '#333',
                      marginBottom: '3px'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                  >
                    {proveedor.nombre}
                  </motion.div>
                  {proveedor.empresa && (
                    <motion.div 
                      style={{ 
                        fontSize: '0.85rem',
                        color: '#666'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                    >
                      {proveedor.empresa}
                    </motion.div>
                  )}
                </div>

                <div>
                  <motion.div 
                    style={{ 
                      fontSize: '0.85rem',
                      color: '#555',
                      marginBottom: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    whileHover={{ x: 5 }}
                  >
                    <Mail size={14} />
                    {proveedor.email}
                  </motion.div>
                  <motion.div 
                    style={{ 
                      fontSize: '0.85rem',
                      color: '#555',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    whileHover={{ x: 5 }}
                  >
                    <Phone size={14} />
                    {proveedor.telefono}
                  </motion.div>
                </div>

                <motion.div 
                  style={{ fontSize: '0.9rem', color: '#555' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.25 }}
                >
                  {proveedor.ciudad && proveedor.pais ? 
                    `${proveedor.ciudad}, ${proveedor.pais}` : 
                    (proveedor.ciudad || proveedor.pais || '-')
                  }
                </motion.div>

                <motion.div 
                  style={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {getTipoIcon(proveedor.tipo_proveedor)}
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    {proveedor.tipo_proveedor}
                  </span>
                </motion.div>

                <motion.div
                  style={{ display: 'flex', justifyContent: 'center' }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={`estado-badge ${proveedor.estado.toLowerCase()}`}>
                    {proveedor.estado}
                  </span>
                </motion.div>

                <motion.div 
                  style={{ 
                    textAlign: 'center',
                    fontSize: '1rem'
                  }} 
                  className="estrellas"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {getEstrellas(proveedor.calificacion)}
                </motion.div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <motion.button
                    whileHover={{ 
                      scale: 1.2,
                      rotate: 15,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.9, rotate: -15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(proveedor);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#2196F3',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Editar"
                  >
                    <Edit size={18} />
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
      <div className="proveedor-container">
        {/*  ENCABEZADO MEJORADO */}
        <motion.div 
          className="proveedor-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        >
          <motion.div
            className="header-gradient"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "2.5rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Patrón de fondo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              opacity: 0.3
            }} />

            <div className="header-content" style={{ position: "relative", zIndex: 2 }}>
              <motion.h2
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                  fontSize: "2.8rem",
                  color: "white",
                  marginBottom: "0.5rem",
                  fontWeight: 800,
                  textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  letterSpacing: "-0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}
              >
                <motion.div
                  
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  <Building2 size={36} fill="white" color="white" />
                </motion.div>
                Sistema de Proveedores
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  style={{ marginLeft: 'auto' }}
                >
                  <Truck size={32} color="white" />
                </motion.div>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "1.2rem",
                  marginBottom: 0,
                  fontWeight: 500,
                  textShadow: "0 1px 5px rgba(0,0,0,0.1)"
                }}
              >
                Gestiona y controla todos tus proveedores de manera eficiente y profesional
              </motion.p>

              <motion.div 
                className="header-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                  display: "flex",
                  gap: "2rem",
                  marginTop: "1.5rem",
                  flexWrap: "wrap"
                }}
              >
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "rgba(255, 255, 255, 0.15)",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "12px",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <div className="stat-icon" style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Users size={20} color="white" />
                  </div>
                  <div className="stat-text" style={{ color: "white" }}>
                    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                      {totalProveedores}
                    </div>
                    <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      Total Proveedores
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "rgba(255, 255, 255, 0.15)",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "12px",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <div className="stat-icon" style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Award size={20} color="white" />
                  </div>
                  <div className="stat-text" style={{ color:"white",color: "white" }}>
                    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                      {proveedoresActivos}
                    </div>
                    <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      Proveedores Activos
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    background: "rgba(255, 255, 255, 0.15)",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "12px",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)"
                  }}
                >
                  <div className="stat-icon" style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "0.5rem",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Package size={20} color="white" />
                  </div>
                  <div className="stat-text" style={{ color:"white",color: "white" }}>
                    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                      {proveedoresProductos}
                    </div>
                    <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                      Proveedores Productos
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="floating-icons"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "30px",
                  display: "flex",
                  gap: "15px",
                  zIndex: 3
                }}
              >
                <motion.div 
                  className="floating-icon"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "12px",
                    borderRadius: "50%",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <Package size={20} color="white" />
                </motion.div>
                <motion.div 
                  className="floating-icon"
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, -8, 8, 0]
                  }}
                  transition={{ 
                    duration: 3.5, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "12px",
                    borderRadius: "50%",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <Briefcase size={20} color="white" />
                </motion.div>
                <motion.div 
                  className="floating-icon"
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 4.2, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    padding: "12px",
                    borderRadius: "50%",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <Star size={20} color="white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <motion.div 
            className="proveedor-busqueda-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ marginTop: "2rem" }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
              >
                <Search size={18} />
              </motion.div>
              <input
                type="text"
                className="proveedor-busqueda"
                placeholder="Buscar por nombre, empresa, email, teléfono, ciudad o país..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <motion.button 
                className="btn-ayuda" 
                onClick={() => setMostrarMenuFiltros(!mostrarMenuFiltros)} 
                title="Filtros de ordenamiento"
                whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                 
                  transition={{ duration: 0.3 }}
                >
                  <Package size={18} />
                </motion.div>
                Filtros
              </motion.button>
              
              <AnimatePresence>
                {mostrarMenuFiltros && (
                  <motion.div 
                    className="filtros-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'ninguno' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('ninguno');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                      <Hash size={16} />
                      Sin ordenar
                    </div>
                    <div className="filtro-separador"></div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'id-mayor' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('id-mayor');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                      ⬇️ ID Mayor a Menor
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'id-menor' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('id-menor');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                      ⬆️ ID Menor a Mayor
                    </div>
                    <div className="filtro-separador"></div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'nombre-az' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('nombre-az');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                       Nombre A-Z
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'nombre-za' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('nombre-za');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                       Nombre Z-A
                    </div>
                    <div className="filtro-separador"></div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'estado-activo' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('estado-activo');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                       Activos Primero
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'estado-inactivo' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('estado-inactivo');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                       Inactivos Primero
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.button 
              className="btn-ayuda" 
              onClick={() => {console.log("Click en Nuevo Proveedor"); setMostrarAyuda(true)}} 
              title="Ver ayuda"
              whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <HelpCircle size={18} />
              </motion.div>
              Ayuda
            </motion.button>
            
            <motion.button 
              className="btn-ayuda" 
              onClick={() => setMostrarModalCrear(true)} 
              title="Crear nuevo proveedor"
              whileHover={{ 
                scale: 1.08, 
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
              
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plus size={18} />
              </motion.div>
              Nuevo Proveedor
            </motion.button>
          </motion.div>
        </motion.div>

        {/* El resto del código se mantiene exactamente igual */}
        {loading && proveedores.length === 0 ? (
                <motion.div 
                  style={{ textAlign: 'center', padding: '3rem' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                >
                  <motion.div
                   
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ display: 'inline-block', marginBottom: '1rem' }}
                  >
                    <Package size={40} color="#667eea" />
                  </motion.div>
                  <p style={{ color: '#667eea', fontWeight: '600' }}>Cargando proveedores...</p>
                </motion.div>
              ) : (
                <motion.div 
                  className="proveedor-categorias-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {renderTablaProveedores("Todos los Proveedores", proveedoresOrdenados, <Building2 size={20} style={{ color: '#667eea' }} />)}
                </motion.div>
              )}
      
              {/* Modal Crear Proveedor */}
              <AnimatePresence>
                {mostrarModalCrear && (
                  <motion.div 
                    className="modal-overlay" 
                    onClick={handleCloseModals}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div 
                      className="modal-content" 
                      style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} 
                      onClick={(e) => e.stopPropagation()}
                      initial={{ scale: 0.9, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 50 }}
                      transition={{ type: "spring", damping: 25 }}
                    >
                      <h3 className="modal-title">
                        <Plus size={20} />
                        Crear Nuevo Proveedor
                      </h3>
                      <form onSubmit={handleCrearProveedor}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label>Nombre *</label>
                              <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                placeholder="Nombre del proveedor"
                                required
                              />
                            </div>
      
                            <div className="form-group">
                              <label>Empresa</label>
                              <input
                                type="text"
                                value={formData.empresa}
                                onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                                placeholder="Nombre de la empresa"
                              />
                            </div>
                          </div>
      
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label>Email *</label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="correo@ejemplo.com"
                                required
                              />
                            </div>
      
                            <div className="form-group">
                              <label>Teléfono *</label>
                              <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                placeholder="+504 1234-5678"
                                required
                              />
                            </div>
                          </div>
      
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label>Persona de Contacto</label>
                              <input
                                type="text"
                                value={formData.contacto}
                                onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                                placeholder="Nombre del contacto"
                              />
                            </div>
      
                            <div className="form-group">
                              <label>RTN</label>
                              <input
                                type="text"
                                value={formData.rtn}
                                onChange={(e) => setFormData({...formData, rtn: e.target.value})}
                                placeholder="RTN del proveedor"
                              />
                            </div>
                          </div>
      
                          <div className="form-group">
                            <label>Dirección</label>
                            <input
                              type="text"
                              value={formData.direccion}
                              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                              placeholder="Dirección completa"
                            />
                          </div>
      
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label>Ciudad</label>
                              <input
                                type="text"
                                value={formData.ciudad}
                                onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                                placeholder="Ciudad"
                              />
                            </div>
      
                            <div className="form-group">
                              <label>País</label>
                              <input
                                type="text"
                                value={formData.pais}
                                onChange={(e) => setFormData({...formData, pais: e.target.value})}
                                placeholder="País"
                              />
                            </div>
                          </div>
      
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label>Tipo</label>
                              <select
                                value={formData.tipo_proveedor}
                                onChange={(e) => setFormData({...formData, tipo_proveedor: e.target.value})}
                              >
                                <option value="PRODUCTOS">PRODUCTOS</option>
                                <option value="SERVICIOS">SERVICIOS</option>
                                <option value="MIXTO">MIXTO</option>
                              </select>
                            </div>
      
                            <div className="form-group">
                              <label>Estado</label>
                              <select
                                value={formData.estado}
                                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                              >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="INACTIVO">INACTIVO</option>
                                <option value="SUSPENDIDO">SUSPENDIDO</option>
                              </select>
                            </div>
      
                            <div className="form-group">
                              <label>Calificación</label>
                              <select
                                value={formData.calificacion}
                                onChange={(e) => setFormData({...formData, calificacion: parseInt(e.target.value)})}
                              >
                                <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                                <option value="4">⭐⭐⭐⭐ (4)</option>
                                <option value="3">⭐⭐⭐ (3)</option>
                                <option value="2">⭐⭐ (2)</option>
                                <option value="1">⭐ (1)</option>
                              </select>
                            </div>
                          </div>
      
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                              <label>Condiciones de Pago</label>
                              <input
                                type="text"
                                value={formData.condiciones_pago}
                                onChange={(e) => setFormData({...formData, condiciones_pago: e.target.value})}
                                placeholder="Ej: 30 días"
                              />
                            </div>
      
                            <div className="form-group">
                              <label>Tiempo Entrega (días)</label>
                              <input
                                type="number"
                                value={formData.tiempo_entrega_promedio}
                                onChange={(e) => setFormData({...formData, tiempo_entrega_promedio: e.target.value})}
                                placeholder="Días promedio"
                                min="0"
                              />
                            </div>
                          </div>
      
                          <div className="form-group">
                            <label>Sitio Web</label>
                            <input
                              type="url"
                              value={formData.sitio_web}
                              onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                              placeholder="https://www.ejemplo.com"
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Notas</label>
                            <textarea
                              value={formData.notas}
                              onChange={(e) => setFormData({...formData, notas: e.target.value})}
                              placeholder="Notas adicionales..."
                              rows="3"
                            />
                          </div>
                        </div>
      
                        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                          <motion.button 
                            type="button" 
                            className="btn-cancelar" 
                            onClick={handleCloseModals}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X size={16} />
                            Cancelar
                          </motion.button>
                          <motion.button 
                            type="submit" 
                            className="btn-guardar"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Check size={16} />
                            Crear Proveedor
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
      
              {/* Modal Editar Proveedor */}
              <AnimatePresence>
                {proveedorSeleccionado && (
                  <motion.div 
                    className="modal-overlay" 
                    onClick={handleCloseModals}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div 
                      className="modal-content" 
                      style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} 
                      onClick={(e) => e.stopPropagation()}
                      initial={{ scale: 0.9, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 50 }}
                      transition={{ type: "spring", damping: 25 }}
                    >
                      <h3 className="modal-title">
                        <Edit size={20} />
                        Editar Proveedor
                      </h3>
                      <form onSubmit={handleEditarProveedor}>
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Nombre *</label>
                            <input
                              type="text"
                              value={formData.nombre}
                              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                              required
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Empresa</label>
                            <input
                              type="text"
                              value={formData.empresa}
                              onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Email *</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              required
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Teléfono *</label>
                            <input
                              type="tel"
                              value={formData.telefono}
                              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                              required
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Contacto</label>
                            <input
                              type="text"
                              value={formData.contacto}
                              onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group">
                            <label>RTN</label>
                            <input
                              type="text"
                              value={formData.rtn}
                              onChange={(e) => setFormData({...formData, rtn: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group full-width">
                            <label>Dirección</label>
                            <input
                              type="text"
                              value={formData.direccion}
                              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Ciudad</label>
                            <input
                              type="text"
                              value={formData.ciudad}
                              onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group">
                            <label>País</label>
                            <input
                              type="text"
                              value={formData.pais}
                              onChange={(e) => setFormData({...formData, pais: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Tipo</label>
                            <select
                              value={formData.tipo_proveedor}
                              onChange={(e) => setFormData({...formData, tipo_proveedor: e.target.value})}
                            >
                              <option value="PRODUCTOS">PRODUCTOS</option>
                              <option value="SERVICIOS">SERVICIOS</option>
                              <option value="MIXTO">MIXTO</option>
                            </select>
                          </div>
      
                          <div className="form-group">
                            <label>Estado</label>
                            <select
                              value={formData.estado}
                              onChange={(e) => setFormData({...formData, estado: e.target.value})}
                            >
                              <option value="ACTIVO">ACTIVO</option>
                              <option value="INACTIVO">INACTIVO</option>
                              <option value="SUSPENDIDO">SUSPENDIDO</option>
                            </select>
                          </div>
      
                          <div className="form-group">
                            <label>Calificación</label>
                            <select
                              value={formData.calificacion}
                              onChange={(e) => setFormData({...formData, calificacion: parseInt(e.target.value)})}
                            >
                              <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                              <option value="4">⭐⭐⭐⭐ (4)</option>
                              <option value="3">⭐⭐⭐ (3)</option>
                              <option value="2">⭐⭐ (2)</option>
                              <option value="1">⭐ (1)</option>
                            </select>
                          </div>
      
                          <div className="form-group">
                            <label>Condiciones de Pago</label>
                            <input
                              type="text"
                              value={formData.condiciones_pago}
                              onChange={(e) => setFormData({...formData, condiciones_pago: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group">
                            <label>Tiempo Entrega (días)</label>
                            <input
                              type="number"
                              value={formData.tiempo_entrega_promedio}
                              onChange={(e) => setFormData({...formData, tiempo_entrega_promedio: e.target.value})}
                              min="0"
                            />
                          </div>
      
                          <div className="form-group full-width">
                            <label>Sitio Web</label>
                            <input
                              type="url"
                              value={formData.sitio_web}
                              onChange={(e) => setFormData({...formData, sitio_web: e.target.value})}
                            />
                          </div>
      
                          <div className="form-group full-width">
                            <label>Notas</label>
                            <textarea
                              value={formData.notas}
                              onChange={(e) => setFormData({...formData, notas: e.target.value})}
                              rows="3"
                            />
                          </div>
                        </div>
      
                        <div className="modal-actions">
                         <motion.button 
  type="button" 
  className="btn btn-danger" 
  onClick={prepararEliminacionProveedor}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <Trash2 size={16} />
  Eliminar
</motion.button>
{showConfirm && (
  <ConfirmDialog
    message={`¿Seguro que deseas eliminar el proveedor "${proveedorAEliminar?.nombre}"?`}
    onConfirm={confirmarEliminacionProveedor}
    onCancel={cancelarEliminacionProveedor}
    visible={showConfirm}
  />
)}


                          <motion.button 
                            type="button" 
                            className="btn btn-dark" 
                            onClick={handleCloseModals}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <X size={16} />
                            Cancelar
                          </motion.button>
                          <motion.button 
                            type="submit" 
                            className="btn btn-guardar-donaciones"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Save size={16} />
                            Guardar Cambios
                          </motion.button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
      
              {/* Notificaciones */}
              <AnimatePresence>
                {notification && (
                  <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    style={{
                      position: 'fixed',
                      top: '20px',
                      right: '20px',
                      zIndex: 10000,
                      background: notification.type === 'success' ? '#4CAF50' : '#f44336',
                      color: 'white',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    {notification.message}
                    <button
                      onClick={() => setNotification(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
      
              {/* Modal Ayuda */}
              <AnimatePresence>
                {mostrarAyuda && (
                  <div className="horarios-modal-overlay horarios-modal-show">
                    <div className="horarios-modal-content">
                      <div className="horarios-modal-header">
                        <h3 className="horarios-modal-title">
                          <Truck size={24} />
                          Ayuda - Sistema de Proveedores
                        </h3>
                        <button 
                          className="horarios-modal-close"
                          onClick={() => setMostrarAyuda(false)}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="horarios-modal-body">
                        <div className="horarios-help-section">
                          <h4 className="horarios-help-title">¿Cómo funciona el sistema de proveedores?</h4>
                          <p className="horarios-help-text">
                            El módulo de proveedores te permite gestionar todas las relaciones comerciales, 
                            controlando la información de contacto, categorías y calificaciones de cada proveedor.
                          </p>
                        </div>

                        <div className="horarios-help-section">
                          <h4 className="horarios-help-title">Funcionalidades principales:</h4>
                          <ul className="horarios-help-list">
                            <li className="horarios-help-item">
                              <strong>Búsqueda y filtros:</strong> Encuentra proveedores por nombre, empresa, email, teléfono o ubicación
                            </li>
                            <li className="horarios-help-item">
                              <strong>Gestión de contactos:</strong> Crea, edita y actualiza información de proveedores
                            </li>
                            <li className="horarios-help-item">
                              <strong>Estados comerciales:</strong> Controla el estado (Activo, Inactivo, Suspendido) de cada proveedor
                            </li>
                            <li className="horarios-help-item">
                              <strong>Tipos de proveedor:</strong> Clasifica por Productos, Servicios o Mixto
                            </li>
                            <li className="horarios-help-item">
                              <strong>Sistema de calificación:</strong> Evalúa proveedores con sistema de 1-5 estrellas
                            </li>
                          </ul>
                        </div>

                        <div className="horarios-help-section">
                          <h4 className="horarios-help-title">Estados comerciales:</h4>
                          <div className="horarios-icons-grid">
                            <div className="horarios-icon-item">
                              <CheckCircle size={16} className="horarios-icon-success" />
                              <span>ACTIVOS - Relación comercial activa</span>
                            </div>
                            <div className="horarios-icon-item">
                              <XCircle size={16} className="horarios-icon-danger" />
                              <span>INACTIVOS - Sin actividad reciente</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Clock size={16} className="horarios-icon-warning" />
                              <span>SUSPENDIDOS - Temporalmente suspendidos</span>
                            </div>
                          </div>
                        </div>

                        <div className="horarios-help-section">
                          <h4 className="horarios-help-title">Tipos de proveedor:</h4>
                          <div className="horarios-icons-grid">
                            <div className="horarios-icon-item">
                              <Package size={16} className="horarios-icon-primary" />
                              <span>PRODUCTOS - Proveedores de productos físicos</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Settings size={16} className="horarios-icon-info" />
                              <span>SERVICIOS - Proveedores de servicios</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Boxes size={16} className="horarios-icon-success" />
                              <span>MIXTO - Productos y servicios</span>
                            </div>
                          </div>
                        </div>

                        <div className="horarios-help-section">
                          <h4 className="horarios-help-title">Iconos y acciones:</h4>
                          <div className="horarios-icons-grid">
                            <div className="horarios-icon-item">
                              <Plus size={16} className="horarios-icon-new" />
                              <span>Nuevo Proveedor - Registrar nuevo contacto</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Edit size={16} className="horarios-icon-primary" />
                              <span>Editar - Modificar información del proveedor</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Eye size={16} className="horarios-icon-info" />
                              <span>Ver detalles - Información completa</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Star size={16} className="horarios-icon-warning" />
                              <span>Calificación - Sistema de 1-5 estrellas</span>
                            </div>
                            <div className="horarios-icon-item">
                              <Trash2 size={16} className="horarios-icon-danger" />
                              <span>Eliminar - Remover proveedor del sistema</span>
                            </div>
                          </div>
                        </div>

                        <div className="horarios-help-section">
                          <h4 className="horarios-help-title">Consejos de uso:</h4>
                          <div className="horarios-tips">
                            <div className="horarios-tip">
                              <span className="horarios-tip-badge"></span>
                              <span>Usa la búsqueda para encontrar proveedores rápidamente por cualquier campo</span>
                            </div>
                            <div className="horarios-tip">
                              <span className="horarios-tip-badge"></span>
                              <span>Haz clic en cualquier fila para ver y editar los detalles del proveedor</span>
                            </div>
                            <div className="horarios-tip">
                              <span className="horarios-tip-badge">⭐</span>
                              <span>Utiliza el sistema de calificación para evaluar el desempeño de los proveedores</span>
                            </div>
                            <div className="horarios-tip">
                              <span className="horarios-tip-badge"></span>
                              <span>Organiza la vista por estado comercial para mejor control</span>
                            </div>
                            <div className="horarios-tip">
                              <span className="horarios-tip-badge"></span>
                              <span>Mantén actualizada la información de contacto de cada proveedor</span>
                            </div>
                            <div className="horarios-tip">
                              <span className="horarios-tip-badge">️</span>
                              <span>Clasifica correctamente el tipo de proveedor para mejor organización</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="horarios-modal-footer">
                        <button 
                          className="horarios-modal-btn-close"
                          onClick={() => setMostrarAyuda(false)}
                        >
                          Cerrar Ayuda
                        </button>
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
      
      
      