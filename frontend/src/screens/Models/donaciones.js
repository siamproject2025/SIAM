import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Donaciones.css"
import { auth } from "..//../components/authentication/Auth";
import { 
  Apple,
  Shirt,
  Pill,
  Armchair,
  Wine,
  Book,
  Droplet,
  Package,
  Search,
  HelpCircle,
  Plus,
  Warehouse,
  Calendar,
  Hash,
  Edit,
  Trash2, Users,
  X,
  Save,
  Check,
  ImagePlus,
  Upload,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Heart,
  Gift,
  HandHeart
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL+'/api/donaciones';

// Estilos CSS integrados mejorados


const Donaciones = () => {
  const [donaciones, setDonaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    tipo_donacion: '',
    cantidad_donacion: '',
    descripcion: '',
    observaciones: '',
    id_almacen: '',
    fecha: new Date().toISOString().split('T')[0],
    imagen: null,
    foto_preview: null
  });

  useEffect(() => {
  cargarDonaciones(); // Carga inicial
  const interval = setInterval(cargarDonaciones, 30000); // Cada 30s
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    return () => {
      if (formData.foto_preview) URL.revokeObjectURL(formData.foto_preview);
    };
  }, [formData.foto_preview]);


  const cargarDonaciones = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      mostrarNotificacion('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}` // ✅ Token agregado
      }
    });

    if (!response.ok) throw new Error('Error al cargar donaciones');

    const result = await response.json();

    // El backend devuelve { success: true, data: [...] }
    if (result.success && Array.isArray(result.data)) {
      setDonaciones(result.data);
    } else if (Array.isArray(result)) {
      // Por si acaso el backend devuelve directamente el array
      setDonaciones(result);
    } else {
      console.error('Formato de respuesta inesperado:', result);
      setDonaciones([]);
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('Error al cargar las donaciones', 'error');
    setDonaciones([]);
  }
};

  // Calcular estadísticas
  const totalDonaciones = donaciones.length;
  const totalCantidad = donaciones.reduce((sum, d) => sum + (parseFloat(d.cantidad_donacion) || 0), 0);
  const tiposUnicos = [...new Set(donaciones.map(d => d.tipo_donacion))].length;

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ message: mensaje, type: tipo });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('La imagen no debe superar 5MB', 'error');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Solo se permiten imágenes', 'error');
        return;
      }

      setFormData(prev => ({
        ...prev,
        imagen: file,
        foto_preview: URL.createObjectURL(file)
      }));
    }
  };

  const eliminarFoto = () => {
    if (formData.foto_preview) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    setFormData(prev => ({
      ...prev,
      imagen: null,
      foto_preview: null
    }));
  };

  const handleSubmitNueva = async (e) => {
    e.preventDefault();
    
    // Validaciones mejoradas
    if (!formData.tipo_donacion || !formData.cantidad_donacion || !formData.id_almacen) {
      mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        mostrarNotificacion('No estás autenticado. Por favor inicia sesión.', 'error');
        return;
      }
      const token = await user.getIdToken();

      const formDataToSend = new FormData();
      formDataToSend.append('tipo_donacion', formData.tipo_donacion);
      formDataToSend.append('cantidad_donacion', formData.cantidad_donacion);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('observaciones', formData.observaciones || '');
      formDataToSend.append('id_almacen', formData.id_almacen);
      formDataToSend.append('fecha', new Date().toISOString());

      if (formData.imagen) {
        formDataToSend.append('imagen', formData.imagen);
      }

      console.log('Enviando datos:', {
        tipo_donacion: formData.tipo_donacion,
        cantidad_donacion: formData.cantidad_donacion,
        id_almacen: formData.id_almacen
      });

      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}` // ✅ Token agregado
        }
      });

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}: ${response.statusText}`);
      }

      mostrarNotificacion('¡Donación registrada exitosamente!', 'success');
      handleCloseModals();
      await cargarDonaciones();

    } catch (error) {
      console.error('Error completo:', error);
      mostrarNotificacion(error.message || 'Error al guardar la donación', 'error');
    }
  };



const handleSubmitEditar = async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!donacionSeleccionada) return;

  if (!formData.tipo_donacion || !formData.cantidad_donacion || !formData.id_almacen) {
    mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      mostrarNotificacion('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    const formDataToSend = new FormData();
    formDataToSend.append('tipo_donacion', formData.tipo_donacion);
    formDataToSend.append('cantidad_donacion', formData.cantidad_donacion);
    formDataToSend.append('descripcion', formData.descripcion || '');
    formDataToSend.append('observaciones', formData.observaciones || '');
    formDataToSend.append('id_almacen', formData.id_almacen);
    formDataToSend.append('fecha', formData.fecha || new Date().toISOString());

    if (formData.imagen) {
      formDataToSend.append('imagen', formData.imagen);
    }

    const response = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, {
      method: 'PUT',
      body: formDataToSend,
      headers: {
        Authorization: `Bearer ${token}` // ✅ Token agregado
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al actualizar donación');
    }

    mostrarNotificacion('¡Donación actualizada exitosamente!', 'success');
    handleCloseModals();
    await cargarDonaciones();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message || 'Error al actualizar la donación', 'error');
  }
};


const handleEliminarDonacion = async () => {
  if (!donacionSeleccionada) return;

  if (!window.confirm('¿Estás seguro de que deseas eliminar esta donación?')) return;

  try {
    const user = auth.currentUser;
    if (!user) {
      mostrarNotificacion('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    const response = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, {
      method: 'DELETE',
      headers: {

        Authorization: `Bearer ${token}` // ✅ Token agregado
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar donación');
    }

    mostrarNotificacion('Donación eliminada exitosamente', 'success');
    handleCloseModals();
    await cargarDonaciones();
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion(error.message || 'Error al eliminar la donación', 'error');
  }
};


  const handleCloseModals = () => {
    setMostrarModal(false);
    setMostrarModalEditar(false);
    setDonacionSeleccionada(null);
    
    // Limpiar preview
    if (formData.foto_preview) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    
    setFormData({
      tipo_donacion: '',
      cantidad_donacion: '',
      descripcion: '',
      observaciones: '',
      id_almacen: '',
      fecha: new Date().toISOString().split('T')[0],
      imagen: null,
      foto_preview: null
    });
  };

  const handleFilaClick = (donacion) => {
    setDonacionSeleccionada(donacion);
    
    // Cargar datos en el formulario con los nombres correctos
    setFormData({
      tipo_donacion: donacion.tipo_donacion || '',
      cantidad_donacion: donacion.cantidad_donacion || '',
      descripcion: donacion.descripcion || '',
      observaciones: donacion.observaciones || '',
      id_almacen: donacion.id_almacen || '',
      fecha: donacion.fecha ? new Date(donacion.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      imagen: null,
      foto_preview: donacion.imagen ? `data:image/png;base64,${donacion.imagen}` : null

    });
    
    setMostrarModalEditar(true);
  };

  const handleNuevaDonacion = () => {
    setFormData({
      tipo_donacion: '',
      cantidad_donacion: '',
      descripcion: '',
      observaciones: '',
      id_almacen: '',
      fecha: new Date().toISOString().split('T')[0],
      imagen: null,
      foto_preview: null
    });
    setMostrarModal(true);
  };

  const getIconoTipo = (tipo_donacion) => {
    const iconos = {
      'Alimentos': <Apple size={20} />,
      'Vestimenta': <Shirt size={20} />,
      'Medicina': <Pill size={20} />,
      'Enseres': <Armchair size={20} />,
      'Bebidas': <Wine size={20} />,
      'Útiles escolares': <Book size={20} />,
      'Productos de higiene': <Droplet size={20} />,
      'Otro': <Package size={20} />
    };
    return iconos[tipo_donacion] || <Package size={20} />;
  };

  const getColorAlmacen = (id_almacen) => {
    const colores = {
      1: '#FF6B6B',
      2: '#4ECDC4',
      12: '#45B7D1',
      23: '#FFA07A',
      40: '#98D8C8'
    };
    return colores[id_almacen] || '#95A5A6';
  };

  const getNombreAlmacen = (id_almacen) => {
    const nombres = {
      1: 'Almacén 1',
      2: 'Almacén 2',
      3: 'Almacén 3',
      4: 'Almacén 4',
      5: 'Almacén 5'
    };
    return nombres[id_almacen] || `Almacén ${id_almacen}`;
  };

  const donacionesFiltradas = Array.isArray(donaciones) ? donaciones.filter(donacion => {
    const searchLower = busqueda.toLowerCase();
    const almacenNombre = getNombreAlmacen(donacion.id_almacen);
    return (
      donacion.tipo_donacion?.toLowerCase().includes(searchLower) ||
      donacion.descripcion?.toLowerCase().includes(searchLower) ||
      almacenNombre.toLowerCase().includes(searchLower) ||
      donacion.cantidad_donacion?.toString().includes(searchLower)
    );
  }) : [];

  return (
    <>
      
      <div className="donacion-container">
         <motion.div 
          className="donacion-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        >
          <motion.div
            className="header-gradient"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="header-content">
              <motion.h2
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  <Heart size={36} fill="white" color="white" />
                </motion.div>
                Sistema de Donaciones
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  style={{ marginLeft: 'auto' }}
                >
                  <Gift size={32} color="white" />
                </motion.div>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Gestiona y controla todas las donaciones recibidas con amor y eficiencia
              </motion.p>

              <motion.div 
                className="header-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="stat-icon">
                    <Package size={20} color="white" />
                  </div>
                  <div className="stat-text">
                    <div className="stat-value" style={{color:"white"}}>{totalDonaciones}</div>
                    <div className="stat-label" style={{color:"white"}}>Total Donaciones</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  <div className="stat-icon">
                    <Users size={20} color="white" />
                  </div>
                  <div className="stat-text">
                    <div className="stat-value" style={{color:"white"}}>{totalCantidad}</div>
                    <div className="stat-label" style={{color:"white"}}>Cantidad Total</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                  <div className="stat-icon">
                    <Hash size={20} color="white" />
                  </div>
                  <div className="stat-text">
                    <div className="stat-value" style={{color:"white"}}>{tiposUnicos}</div>
                    <div className="stat-label" style={{color:"white"}}>Tipos Diferentes</div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="floating-icons"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
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
                >
                  <Shirt size={20} color="white" />
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
                >
                  <Apple size={20} color="white" />
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
                >
                  <Book size={20} color="white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="donacion-busqueda-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ marginTop: '2rem' }}
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
                className="donacion-busqueda"
                placeholder="Buscar por tipo, descripción, almacén o cantidad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <motion.button 
              className="btn-ayuda" 
              onClick={() => setMostrarAyuda(true)} 
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
              onClick={() => setMostrarModal(true)} 
              title="Registrar nueva donación"
              whileHover={{ 
                scale: 1.08, 
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plus size={18} />
              </motion.div>
              Nueva Donación
            </motion.button>
          </motion.div>
        </motion.div>


        <div className="donacion-categorias-container">
          {donacionesFiltradas.length === 0 ? (
            <motion.div 
               className="donacion-categorias-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
            >
              <Package size={60} color="#ccc" style={{ marginBottom: '1rem' }} />
              <p>No se encontraron donaciones</p>
            </motion.div>
          ) : (
            <motion.div 
              
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="donacion-categoria-header">
                <h3 className="donacion-subtitulo">
                  <Package size={24} />
                  <span>Todas las Donaciones ({donacionesFiltradas.length})</span>
                </h3>
              </div>

              <motion.div 
                className="tabla-donaciones"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="tabla-header-donaciones">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Hash size={14} />
                    ID
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Package size={14} />
                    TIPO & DESCRIPCIÓN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Warehouse size={14} />
                    ALMACÉN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    FECHA
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Hash size={14} />
                    CANTIDAD
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Edit size={14} style={{ display: 'inline' }} />
                  </div>
                </div>

                <div className="tabla-body-donaciones">
                  <AnimatePresence>
                    {donacionesFiltradas.map((donacion, idx) => (
                      <motion.div
                        key={donacion._id || donacion.id_donacion}
                        className="tabla-fila-donaciones"
                        onClick={() => handleFilaClick(donacion)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div style={{ 
                          fontWeight: '700', 
                          color: '#667eea',
                          fontSize: '0.9rem'
                        }}>
                          #{donacion.id_donacion || idx + 1}
                        </div>
                        
                        <div>
                          <div style={{ 
                            fontWeight: '600', 
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.95rem'
                          }}>
                            {getIconoTipo(donacion.tipo_donacion)}
                            {donacion.tipo_donacion}
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            {donacion.descripcion || 'Sin descripción'}
                          </div>
                        </div>

                        <div>
                          <span 
                            className="badge-almacen"
                            style={{ 
                              background: getColorAlmacen(donacion.id_almacen),
                              color: 'white'
                            }}
                          >
                            {getNombreAlmacen(donacion.id_almacen)}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#555' }}>
                          {new Date(donacion.fecha).toLocaleDateString('es-ES')}
                        </div>

                        <div className="badge-cantidad">
                          {donacion.cantidad_donacion}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            style={{ display: 'inline-block' }}
                          >
                            <Edit size={18} color="#667eea" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Modal Nueva Donación */}
        <AnimatePresence>
          {mostrarModal && (
            <motion.div 
              className="modal-overlay-donaciones" 
              onClick={handleCloseModals}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content-donaciones" 
                style={{ minWidth: '520px', maxWidth: '550px' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title">
                  <Plus size={24} />
                  Nueva Donación
                </h3>
                
                <form onSubmit={handleSubmitNueva}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Tipo de Donación <span>*</span>
                      </label>
                      <select 
                        name="tipo_donacion" 
                        value={formData.tipo_donacion} 
                        onChange={handleInputChange}
                        required
                      >
                         <option value="">Seleccionar tipo</option>
                        <option value="Alimentos">Alimentos</option>
                        <option value="Instrumentos musicales">Instrumentos Musicales</option>
                        <option value="Medicina">Medicina</option>
                        <option value="Enseres">Enseres</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Vestimenta">Vestimenta</option>
                        <option value="Accesorios musicales">Accesorios Musicales </option>
                        <option value="Útiles escolares">Utiles Escolares</option>
                        <option value="Material Audiovisual">Mateial Audiovisual</option>
                        <option value="Material didactico">Material Didactico</option>
                        <option value="Productos de higiene">Productos de Higiene</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Cantidad <span>*</span>
                      </label>
                      <input 
                        type="number" 
                        name="cantidad_donacion" 
                        value={formData.cantidad_donacion} 
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Ingrese la cantidad"
                        required
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Descripción</label>
                      <textarea 
                        name="descripcion" 
                        value={formData.descripcion} 
                        onChange={handleInputChange}
                        placeholder="Describe la donación..."
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Observaciones</label>
                      <textarea 
                        name="observaciones" 
                        value={formData.observaciones} 
                        onChange={handleInputChange}
                        placeholder="Notas adicionales..."
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Almacén <span>*</span>
                      </label>
                      <select 
                        name="id_almacen" 
                        value={formData.id_almacen} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar almacén</option>
                        <option value="1">Almacén 1</option>
                        <option value="2">Almacén 2</option>
                        <option value="3">Almacén 3</option>
                        <option value="4">Almacén 4</option>
                        <option value="5">Almacén 5</option>
                      </select>
                    </div>

                    <div className="form-group form-grid-full">
                      <label>
                        <ImagePlus size={16} />
                        Foto de la Donación
                      </label>
                      <div className={`foto-upload-area ${formData.foto_preview ? 'has-image' : ''}`}>
                        {formData.foto_preview ? (
                          <div>
                            <img 
                              src={formData.foto_preview} 
                              alt="Preview" 
                              className="foto-preview"
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <motion.button
                                type="button"
                                onClick={eliminarFoto}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-danger"
                              >
                                <Trash2 size={16} />
                                Eliminar foto
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload size={40} color="#667eea" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1rem' }}>
                              Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFotoChange}
                              style={{ display: 'none' }}
                              id="foto-upload-nueva"
                            />
                            <label htmlFor="foto-upload-nueva" className="btn-upload-label">
                              <ImagePlus size={18} />
                              Seleccionar imagen
                            </label>
                            <small style={{ display: 'block', marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                              Formatos: JPG, PNG, GIF. Máximo 5MB
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions-donaciones">
                    <motion.button 
                      type="button" 
                      className="btn-cancelar-donaciones" 
                      onClick={handleCloseModals}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                      Cancelar
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      className="btn-guardar-donaciones"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save size={16} />
                      Guardar Donación
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Editar Donación */}
        <AnimatePresence>
          {mostrarModalEditar && donacionSeleccionada && (
            <motion.div 
              className="modal-overlay-donaciones" 
              onClick={handleCloseModals}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content-donaciones" 
                style={{ minWidth: '520px', maxWidth: '550px' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title">
                  <Edit size={24} />
                  Editar Donación
                </h3>
                
                <form onSubmit={handleSubmitEditar}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Tipo de Donación <span>*</span>
                      </label>
                      <select 
                        name="tipo_donacion" 
                        value={formData.tipo_donacion} 
                        onChange={handleInputChange}
                        required
                      >
                         <option value="">Seleccionar tipo</option>
                        <option value="Alimentos">Alimentos</option>
                        <option value="Instrumentos musicales">Instrumentos Musicales</option>
                        <option value="Medicina">Medicina</option>
                        <option value="Enseres">Enseres</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Vestimenta">Vestimenta</option>
                        <option value="Accesorios musicales">Accesorios Musicales </option>
                        <option value="Útiles escolares">Utiles Escolares</option>
                        <option value="Material Audiovisual">Mateial Audiovisual</option>
                        <option value="Material didactico">Material Didactico</option>
                        <option value="Productos de higiene">Productos de Higiene</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Cantidad <span>*</span>
                      </label>
                      <input 
                        type="number" 
                        name="cantidad_donacion" 
                        value={formData.cantidad_donacion} 
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Descripción</label>
                      <textarea 
                        name="descripcion" 
                        value={formData.descripcion} 
                        onChange={handleInputChange}
                        placeholder="Describe la donación..."
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Observaciones</label>
                      <textarea 
                        name="observaciones" 
                        value={formData.observaciones} 
                        onChange={handleInputChange}
                        placeholder="Notas adicionales..."
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Almacén <span>*</span>
                      </label>
                      <select 
                        name="id_almacen" 
                        value={formData.id_almacen} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar almacén</option>
                        <option value="1">Almacén 1</option>
                        <option value="2">Almacén 2</option>
                        <option value="3">Almacén 3</option>
                        <option value="4">Almacén 4</option>
                        <option value="5">Almacén 5</option>
                      </select>
                    </div>

                    <div className="form-group form-grid-full">
                      <label>
                        <ImagePlus size={16} />
                        Foto de la Donación
                      </label>
                      <div className={`foto-upload-area ${formData.foto_preview ? 'has-image' : ''}`}>
                        {formData.foto_preview ? (
                          <div>
                            <img 
                              src={formData.foto_preview} 
                              alt="Preview" 
                              className="foto-preview"
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <motion.button
                                type="button"
                                onClick={eliminarFoto}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn btn-danger"
                              >
                                <Trash2 size={16} />
                                Eliminar foto
                              </motion.button>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFotoChange}
                                style={{ display: 'none' }}
                                id="foto-upload-editar-replace"
                              />
                              <label 
                                htmlFor="foto-upload-editar-replace"
                                className="btn-upload-label"
                              >
                                <Upload size={16} />
                                Cambiar foto
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload size={40} color="#667eea" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#666', marginBottom: '1rem' }}>
                              Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFotoChange}
                              style={{ display: 'none' }}
                              id="foto-upload-editar"
                            />
                            <label 
                              htmlFor="foto-upload-editar"
                              className="btn-upload-label"
                            >
                              <ImagePlus size={18} />
                              Seleccionar imagen
                            </label>
                            <small style={{ display: 'block', marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                              Formatos: JPG, PNG, GIF. Máximo 5MB
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions-donaciones">
                    <motion.button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleEliminarDonacion}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </motion.button>
                    <motion.button 
                      type="button" 
                      className="btn-cancelar-donaciones" 
                      onClick={handleCloseModals}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                      Cancelar
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      className="btn-guardar-donaciones"
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
              className={`notification ${notification.type}`}
              initial={{ opacity: 0, y: -50, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -50, x: 100 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {notification.type === 'success' ? (
                <CheckCircle size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Ayuda Mejorado */}
        <AnimatePresence>
          {mostrarAyuda && (
            <motion.div 
              className="modal-overlay-donaciones" 
              onClick={() => setMostrarAyuda(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content-donaciones" 
                style={{ maxWidth: '580px', maxHeight: '85vh' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, rotateX: 90 }}
                animate={{ scale: 1, rotateX: 0 }}
                exit={{ scale: 0.8, rotateX: 90 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title">
                  <Sparkles size={24} />
                  Guía de Uso - Sistema de Donaciones
                </h3>
                
                <div className="help-section">
                  <h4>
                    <Search size={18} />
                    Búsqueda Inteligente
                  </h4>
                  <p>Utiliza la barra de búsqueda para filtrar donaciones por tipo, descripción, almacén o cantidad. Los resultados se actualizan en tiempo real.</p>
                </div>

                <div className="help-section">
                  <h4>
                    <Package size={18} />
                    Tipos de Donación Disponibles
                  </h4>
                  <ul>
                    <li><strong>Alimentos:</strong> </li>
                    <li><strong>Instrumentos musicales:</strong> </li>
                    <li><strong>Medicina:</strong> </li>
                    <li><strong>Enseres:</strong> </li>
                    <li><strong>Accesiorios Musuicales:</strong> </li>
                    <li><strong>Útiles escolares:</strong> </li>
                    <li><strong>Productos de higiene:</strong> </li>
                    <li><strong>Material Audiovisual:</strong> </li>
                    <li><strong>Material didactico:</strong> </li>
                    <li><strong>Otro:</strong> </li>
                  </ul>
                </div>

                <div className="help-section">
                  <h4>
                    <Sparkles size={18} />
                    Funciones Principales
                  </h4>
                  <ul>
                    <li><strong>Agregar:</strong> Clic en "Nueva Donación" para registrar</li>
                    <li><strong>Editar:</strong> Clic en cualquier fila para ver/editar detalles</li>
                    <li><strong>Eliminar:</strong> Dentro del modal de edición</li>
                    <li><strong>Fotos:</strong> Adjunta imágenes de hasta 5MB</li>
                    <li><strong>Auto-guardado:</strong> La fecha se registra automáticamente</li>
                    <li><strong>Sincronización:</strong> Los datos se actualizan cada 30 segundos</li>
                  </ul>
                </div>

                <div className="help-section">
                  <h4>
                    <Warehouse size={18} />
                    Almacenes Disponibles
                  </h4>
                  <p>Selecciona el almacén donde se almacenará la donación. Cada almacén tiene un color distintivo para fácil identificación visual.</p>
                </div>

                <div style={{ 
                  position: 'sticky',
                  bottom: '0', 
                  left: '0', 
                  right: '0', 
                  
                  background: 'white', 
                  borderTop: '2px solid #f0f0f0',
                  
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <motion.button 
                    className="btn-cerrar-donaciones" 
                    onClick={() => setMostrarAyuda(false)}
                    style={{ minWidth: '200px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={18} />
                    ¡Entendido!
                  </motion.button>
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