import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Donaciones.css"
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
  Trash2,
  X,
  Save,
  Check,
  Heart,
  Users,
  Gift
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL+'/api/donaciones';



const Donaciones = () => {
  const [donaciones, setDonaciones] = useState([]);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id_almacen: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad_donacion: '',
    descripcion: '',
    tipo_donacion: 'Alimentos',
    observaciones: '',
    foto_donacion: null,
    foto_preview: null
  });

  const tiposDonacion = [
    'Alimentos',
    'Vestimenta',
    'Medicina',
    'Enseres',
    'Bebidas',
    'Útiles escolares',
    'Productos de higiene',
    'Otro'
  ];

  useEffect(() => {
    cargarDonaciones();
  }, []);

  const cargarDonaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar donaciones');
      const data = await res.json();
      setDonaciones(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error al obtener donaciones:', err);
      showNotification('Error al cargar las donaciones', 'error');
      setDonaciones([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalDonaciones = donaciones.length;
  const totalCantidad = donaciones.reduce((sum, d) => sum + (parseFloat(d.cantidad_donacion) || 0), 0);
  const tiposUnicos = [...new Set(donaciones.map(d => d.tipo_donacion))].length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ... (mantener todas las funciones existentes igual)
  
    const resetForm = () => {
      setFormData({
        id_almacen: '',
        fecha: new Date().toISOString().split('T')[0],
        cantidad_donacion: '',
        descripcion: '',
        tipo_donacion: 'Alimentos',
        observaciones: '',
        foto_donacion: null,
        foto_preview: null
      });
    };
  
    const handleCrearDonacion = async (e) => {
      e.preventDefault();
      
      try {
        if (!formData.id_almacen || !formData.fecha || !formData.cantidad_donacion) {
          showNotification('Por favor completa todos los campos obligatorios', 'error');
          return;
        }
  
        const datosDonacion = {
          id_almacen: parseInt(formData.id_almacen),
          fecha: formData.fecha,
          cantidad_donacion: parseFloat(formData.cantidad_donacion),
          descripcion: formData.descripcion.trim(),
          tipo_donacion: formData.tipo_donacion,
          observaciones: formData.observaciones.trim()
        };
  
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosDonacion)
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al crear la donación');
        }
        
        await cargarDonaciones();
        setMostrarModalCrear(false);
        resetForm();
        showNotification(`Donación de ${formData.tipo_donacion} registrada exitosamente`, 'success');
      } catch (err) {
        console.error('Error al crear:', err);
        showNotification(err.message || 'Error al crear la donación', 'error');
      }
    };
  
    const handleEditarDonacion = async (e) => {
      e.preventDefault();
      
      try {
        if (!formData.id_almacen || !formData.fecha || !formData.cantidad_donacion) {
          showNotification('Por favor completa todos los campos obligatorios', 'error');
          return;
        }
  
        const idAlmacen = parseInt(formData.id_almacen);
        const cantidad = parseFloat(formData.cantidad_donacion);
        
        if (isNaN(idAlmacen) || idAlmacen < 1) {
          showNotification('El ID de almacén debe ser un número válido', 'error');
          return;
        }
        
        if (isNaN(cantidad) || cantidad <= 0) {
          showNotification('La cantidad debe ser un número válido mayor a 0', 'error');
          return;
        }
  
        const datosActualizados = {
          id_almacen: idAlmacen,
          fecha: formData.fecha,
          cantidad_donacion: cantidad,
          descripcion: formData.descripcion.trim(),
          tipo_donacion: formData.tipo_donacion,
          observaciones: formData.observaciones.trim()
        };
  
        const idToUpdate = donacionSeleccionada._id || donacionSeleccionada.id_donacion;
  
        const res = await fetch(`${API_URL}/${idToUpdate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosActualizados)
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al editar la donación');
        }
        
        await cargarDonaciones();
        setDonacionSeleccionada(null);
        resetForm();
        showNotification(`Donación actualizada exitosamente`, 'success');
      } catch (err) {
        console.error('Error al editar:', err);
        showNotification(err.message || 'Error al editar la donación', 'error');
      }
    };
  
    const handleEliminarDonacion = async () => {
      try {
        const donacionAEliminar = donaciones.find(d => (d._id || d.id_donacion) === (donacionSeleccionada._id || donacionSeleccionada.id_donacion));
        const idToDelete = donacionSeleccionada._id || donacionSeleccionada.id_donacion;
        
        console.log('Eliminando donación ID:', idToDelete);
  
        const res = await fetch(`${API_URL}/${idToDelete}`, { method: 'DELETE' });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al eliminar la donación');
        }
        
        await cargarDonaciones();
        setDonacionSeleccionada(null);
        resetForm();
        showNotification(`Donación eliminada exitosamente`, 'success');
      } catch (err) {
        console.error('Error al eliminar:', err);
        showNotification(err.message || 'Error al eliminar la donación', 'error');
      }
    };
  
    const donacionesFiltradas = donaciones.filter(d => {
      const terminoBusqueda = busqueda.toLowerCase();
      return (
        d.tipo_donacion?.toLowerCase().includes(terminoBusqueda) ||
        d.descripcion?.toLowerCase().includes(terminoBusqueda) ||
        d.id_almacen?.toString().includes(terminoBusqueda) ||
        d.cantidad_donacion?.toString().includes(terminoBusqueda)
      );
    });
  
    const formatDate = (date) => {
      if (!date) return '-';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };
  
    const getTipoIcon = (tipo) => {
      const icons = {
        'Alimentos': <Apple size={18} />,
        'Vestimenta': <Shirt size={18} />,
        'Medicina': <Pill size={18} />,
        'Enseres': <Armchair size={18} />,
        'Bebidas': <Wine size={18} />,
        'Útiles escolares': <Book size={18} />,
        'Productos de higiene': <Droplet size={18} />,
        'Otro': <Package size={18} />
      };
      return icons[tipo] || <Package size={18} />;
    };
  
    const handleOpenEditModal = (donacion) => {
      setDonacionSeleccionada(donacion);
      
      let fechaFormateada = '';
      if (donacion.fecha) {
        const fecha = new Date(donacion.fecha);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        fechaFormateada = `${year}-${month}-${day}`;
      }
      
      setFormData({
        id_almacen: donacion.id_almacen?.toString() || '',
        fecha: fechaFormateada,
        cantidad_donacion: donacion.cantidad_donacion?.toString() || '',
        descripcion: donacion.descripcion || '',
        tipo_donacion: donacion.tipo_donacion || 'Alimentos',
        observaciones: donacion.observaciones || '',
        foto_donacion: null,
        foto_preview: donacion.foto_donacion || null
      });
    };
  
    const handleFotoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
          showNotification('Por favor selecciona un archivo de imagen válido', 'error');
          return;
        }
        
        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showNotification('La imagen no debe superar los 5MB', 'error');
          return;
        }
  
        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({
            ...formData,
            foto_donacion: file,
            foto_preview: reader.result
          });
        };
        reader.readAsDataURL(file);
      }
    };
  
    const eliminarFoto = () => {
      setFormData({
        ...formData,
        foto_donacion: null,
        foto_preview: null
      });
    };
  
    const handleCloseModals = () => {
      setMostrarModalCrear(false);
      setDonacionSeleccionada(null);
      resetForm();
    };

  return (
    <>
     
      <div className="bien-container">
        <motion.div 
          className="bien-header"
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
                    <div className="stat-value">{totalDonaciones}</div>
                    <div className="stat-label">Total Donaciones</div>
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
                    <div className="stat-value">{totalCantidad}</div>
                    <div className="stat-label">Cantidad Total</div>
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
                    <div className="stat-value">{tiposUnicos}</div>
                    <div className="stat-label">Tipos Diferentes</div>
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
            className="bien-busqueda-bar"
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
                className="bien-busqueda"
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
              onClick={() => setMostrarModalCrear(true)} 
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

        
{loading && donaciones.length === 0 ? (
          <motion.div 
            style={{ textAlign: 'center', padding: '3rem' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: 'inline-block', marginBottom: '1rem' }}
            >
              <Package size={40} color="#667eea" />
            </motion.div>
            <p style={{ color: '#667eea', fontWeight: '600' }}>Cargando donaciones...</p>
          </motion.div>
        ) : (
          <motion.div 
            className="bien-categorias-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="bien-categoria-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div 
                className="bien-categoria-header"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="bien-subtitulo">
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Package size={20} style={{ color: '#667eea' }} />
                  </motion.div>
                  Todas las Donaciones ({donacionesFiltradas.length})
                </h3>
              </motion.div>
          
              {donacionesFiltradas.length === 0 ? (
                <motion.p 
                  className="bien-vacio"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  No hay donaciones registradas.
                </motion.p>
              ) : (
                <motion.div 
                  className="tabla-donaciones"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.div 
                    className="tabla-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        <Hash size={14} />
                      </motion.div>
                      ID
                    </div>
                    <div>TIPO & DESCRIPCIÓN</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Warehouse size={14} />
                      ALMACÉN
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} />
                      FECHA
                    </div>
                    <div style={{ textAlign: 'center' }}>CANTIDAD</div>
                    <div style={{ textAlign: 'center' }}>ACCIONES</div>
                  </motion.div>

                  <div className="tabla-body">
                    {donacionesFiltradas.map((donacion, index) => (
                      <motion.div
                        key={donacion._id || donacion.id_donacion}
                        className="tabla-fila"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: Math.min(index * 0.05, 1),
                          duration: 0.4,
                          type: "spring",
                          stiffness: 100
                        }}
                        onClick={() => handleOpenEditModal(donacion)}
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
                          #{donacion.id_donacion || donacion._id}
                        </motion.div>

                        <div>
                          <motion.div 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              marginBottom: donacion.descripcion ? '5px' : '0'
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.2 }}
                          >
                            <motion.span 
                              style={{ display: 'flex', alignItems: 'center' }}
                              whileHover={{ rotate: 360, scale: 1.2 }}
                              transition={{ duration: 0.5 }}
                            >
                              {getTipoIcon(donacion.tipo_donacion)}
                            </motion.span>
                            <span style={{ 
                              fontWeight: '600',
                              fontSize: '1rem',
                              color: '#333'
                            }}>
                              {donacion.tipo_donacion}
                            </span>
                          </motion.div>
                          {donacion.descripcion && (
                            <motion.div 
                              style={{ 
                                fontSize: '0.85rem',
                                color: '#666',
                                marginLeft: '35px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 + 0.3 }}
                            >
                              {donacion.descripcion}
                            </motion.div>
                          )}
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span style={{ 
                            padding: '4px 12px',
                            background: '#FF9800',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            Almacén {donacion.id_almacen}
                          </span>
                        </motion.div>

                        <motion.div 
                          style={{ 
                            fontSize: '0.9rem',
                            color: '#555'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.25 }}
                        >
                          {formatDate(donacion.fecha)}
                        </motion.div>

                        <motion.div 
                          style={{ 
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: '#4CAF50',
                            fontSize: '1.2rem'
                          }}
                          whileHover={{ scale: 1.15, color: '#45a049' }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {donacion.cantidad_donacion}
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
                              handleOpenEditModal(donacion);
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
          </motion.div>
        )}

        {/* Modal Crear Donación */}
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
                  Registrar Nueva Donación
                </h3>
                <form onSubmit={handleCrearDonacion}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>ID Almacén *</label>
                        <input
                          type="number"
                          value={formData.id_almacen}
                          onChange={(e) => setFormData({...formData, id_almacen: e.target.value})}
                          placeholder="Número de almacén"
                          required
                          min="1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Fecha *</label>
                        <input
                          type="date"
                          value={formData.fecha}
                          onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Tipo de Donación *</label>
                        <select
                          value={formData.tipo_donacion}
                          onChange={(e) => setFormData({...formData, tipo_donacion: e.target.value})}
                          required
                        >
                          {tiposDonacion.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Cantidad *</label>
                        <input
                          type="number"
                          value={formData.cantidad_donacion}
                          onChange={(e) => setFormData({...formData, cantidad_donacion: e.target.value})}
                          placeholder="Cantidad recibida"
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Descripción</label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Describe la donación recibida..."
                        rows="3"
                        maxLength={1000}
                      />
                      <small style={{ color: '#666', fontSize: '0.85rem' }}>
                        {formData.descripcion.length}/1000 caracteres
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Observaciones</label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        placeholder="Observaciones adicionales..."
                        rows="2"
                        maxLength={500}
                      />
                      <small style={{ color: '#666', fontSize: '0.85rem' }}>
                        {formData.observaciones.length}/500 caracteres
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Foto de la Donación</label>
                      <div style={{ 
                        border: '2px dashed #e0e0e0', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        {formData.foto_preview ? (
                          <div>
                            <img 
                              src={formData.foto_preview} 
                              alt="Preview" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px', 
                                borderRadius: '8px',
                                marginBottom: '1rem'
                              }} 
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <motion.button
                                type="button"
                                onClick={eliminarFoto}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem'
                                }}
                              >
                                Eliminar foto
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Package size={40} color="#999" style={{ marginBottom: '0.5rem' }} />
                            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                              Haz clic para seleccionar una imagen
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFotoChange}
                              style={{ display: 'none' }}
                              id="foto-upload-crear"
                            />
                            <label 
                              htmlFor="foto-upload-crear"
                              style={{
                                display: 'inline-block',
                                padding: '0.5rem 1rem',
                                background: '#667eea',
                                color: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              Seleccionar imagen
                            </label>
                            <small style={{ display: 'block', marginTop: '0.5rem', color: '#999', fontSize: '0.85rem' }}>
                              Formatos: JPG, PNG, GIF. Máximo 5MB
                            </small>
                          </div>
                        )}
                      </div>
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
                      Registrar Donación
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Editar Donación */}
        <AnimatePresence>
          {donacionSeleccionada && (
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
                  Editar Donación
                </h3>
                <form onSubmit={handleEditarDonacion}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>ID Almacén *</label>
                      <input
                        type="number"
                        value={formData.id_almacen}
                        onChange={(e) => setFormData({...formData, id_almacen: e.target.value})}
                        required
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Fecha *</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Tipo de Donación *</label>
                      <select
                        value={formData.tipo_donacion}
                        onChange={(e) => setFormData({...formData, tipo_donacion: e.target.value})}
                        required
                      >
                        {tiposDonacion.map((tipo) => (
                          <option key={tipo} value={tipo}>
                            {tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Cantidad *</label>
                      <input
                        type="number"
                        value={formData.cantidad_donacion}
                        onChange={(e) => setFormData({...formData, cantidad_donacion: e.target.value})}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Descripción</label>
                      <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        rows="3"
                        maxLength={1000}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Observaciones</label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                        rows="2"
                        maxLength={500}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Foto de la Donación</label>
                      <div style={{ 
                        border: '2px dashed #e0e0e0', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        textAlign: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        {formData.foto_preview ? (
                          <div>
                            <img 
                              src={formData.foto_preview} 
                              alt="Preview" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px', 
                                borderRadius: '8px',
                                marginBottom: '1rem'
                              }} 
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <motion.button
                                type="button"
                                onClick={eliminarFoto}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem'
                                }}
                              >
                                Eliminar foto
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Package size={40} color="#999" style={{ marginBottom: '0.5rem' }} />
                            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                              Haz clic para seleccionar una imagen
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
                              style={{
                                display: 'inline-block',
                                padding: '0.5rem 1rem',
                                background: '#667eea',
                                color: 'white',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                              }}
                            >
                              Seleccionar imagen
                            </label>
                            <small style={{ display: 'block', marginTop: '0.5rem', color: '#999', fontSize: '0.85rem' }}>
                              Formatos: JPG, PNG, GIF. Máximo 5MB
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <motion.button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEliminarDonacion();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </motion.button>
                    <motion.button 
                      type="button" 
                      className="btn-cancelar" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCloseModals();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                      Cancelar
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      className="btn-guardar"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
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
            <motion.div 
              className="modal-overlay" 
              onClick={() => setMostrarAyuda(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content" 
                style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', paddingBottom: '80px' }} 
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                transition={{ type: "spring", damping: 25 }}
              >
                <h3 className="modal-title">
                  <Book size={20} />
                  Guía de Uso - Sistema de Donaciones
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} />
                    Búsqueda
                  </h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Busca por tipo, descripción, almacén o cantidad.</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={16} />
                    Tipos de Donación
                  </h4>
                  <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <li><strong>Alimentos:</strong> Donaciones de alimentos</li>
                    <li><strong>Vestimenta:</strong> Ropa y calzado</li>
                    <li><strong>Medicina:</strong> Medicamentos y suministros médicos</li>
                    <li><strong>Enseres:</strong> Muebles y enseres</li>
                    <li><strong>Bebidas:</strong> Bebidas y líquidos</li>
                    <li><strong>Útiles escolares:</strong> Material educativo</li>
                    <li><strong>Productos de higiene:</strong> Artículos de limpieza</li>
                    <li><strong>Otro:</strong> Otras donaciones</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✨ Funciones
                  </h4>
                  <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <li>Clic en fila para ver/editar detalles</li>
                    <li>Registro con fecha automática</li>
                    <li>Búsqueda en tiempo real</li>
                    <li>Vista de lista organizada</li>
                    <li>Iconos visuales por tipo</li>
                  </ul>
                </div>

                <div style={{ 
                  position: 'sticky', 
                  bottom: '0', 
                  left: '0', 
                  right: '0', 
                  padding: '1rem', 
                  background: 'white', 
                  borderTop: '1px solid #e0e0e0',
                  marginLeft: '-2rem',
                  marginRight: '-2rem',
                  marginBottom: '-2rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <motion.button 
                    className="btn-cerrar" 
                    onClick={() => setMostrarAyuda(false)}
                    style={{ width: '200px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={16} />
                    Entendido
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