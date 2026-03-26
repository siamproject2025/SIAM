import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Donaciones.css"
import { auth } from "..//../components/authentication/Auth";
import { 
  Heart, ShoppingCart, Music, PlusCircle, Home, Music2, BookOpen, Video,
  Camera, Apple, Shirt, Pill, Armchair, Wine, Book, Droplet, Package,
  Search, HelpCircle, Plus, Warehouse, Calendar, Hash, Edit, Trash2, Users,
  X, Eye, Save, ImagePlus, Upload, AlertCircle, CheckCircle, Gift,
} from 'lucide-react';

import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';

const API_URL = process.env.REACT_APP_API_URL + '/api/donaciones';

const Donaciones = () => {
  const [donaciones, setDonaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [notification, setNotification] = useState(null);

  // ─── Estados de cambios y confirmaciones (FUERA de los modales) ───────────
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

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
    cargarDonaciones();
    const interval = setInterval(cargarDonaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (formData.foto_preview && formData.foto_preview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.foto_preview);
      }
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar donaciones');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setDonaciones(result.data);
      } else if (Array.isArray(result)) {
        setDonaciones(result);
      } else {
        setDonaciones([]);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al cargar las donaciones', 'error');
      setDonaciones([]);
    }
  };

  const totalDonaciones = donaciones.length;
  const totalCantidad = donaciones.reduce((sum, d) => sum + (parseFloat(d.cantidad_donacion) || 0), 0);
  const tiposUnicos = [...new Set(donaciones.map(d => d.tipo_donacion))].length;

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ message: mensaje, type: tipo });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Solo marca cambios cuando el usuario escribe (no en carga inicial) ───
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('La imagen no debe superar 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Solo se permiten imágenes', 'error');
        return;
      }
      if (formData.foto_preview && formData.foto_preview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.foto_preview);
      }
      setFormData(prev => ({
        ...prev,
        imagen: file,
        foto_preview: URL.createObjectURL(file)
      }));
      setHasUnsavedChanges(true);
    }
  };

  const eliminarFoto = () => {
    if (formData.foto_preview && formData.foto_preview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    setFormData(prev => ({ ...prev, imagen: null, foto_preview: null }));
    setHasUnsavedChanges(true);
  };

  // ─── Cerrar modales con verificación ──────────────────────────────────────
  const handleCloseModals = () => {
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
    } else {
      closeModals();
    }
  };

  const closeModals = () => {
    setMostrarModal(false);
    setMostrarModalEditar(false);
    setDonacionSeleccionada(null);
    setHasUnsavedChanges(false);
    setShowConfirmClose(false);
    setShowConfirm(false);
    if (formData.foto_preview && formData.foto_preview.startsWith('blob:')) {
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

  // ─── Abrir modal nueva donación ───────────────────────────────────────────
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
    setHasUnsavedChanges(false); // ← limpia antes de abrir
    setMostrarModal(true);
  };

  // ─── Abrir modal editar ───────────────────────────────────────────────────
  const handleFilaClick = (donacion) => {
    setDonacionSeleccionada(donacion);
    // Cargar datos SIN disparar hasUnsavedChanges
    setFormData({
      tipo_donacion: donacion.tipo_donacion || '',
      cantidad_donacion: donacion.cantidad_donacion || '',
      descripcion: donacion.descripcion || '',
      observaciones: donacion.observaciones || '',
      id_almacen: donacion.id_almacen || '',
      fecha: donacion.fecha
        ? new Date(donacion.fecha).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      imagen: null,
      foto_preview: donacion.imagen ? `data:image/png;base64,${donacion.imagen}` : null
    });
    setHasUnsavedChanges(false); // ← limpia al cargar datos iniciales
    setMostrarModalEditar(true);
  };

  // ─── Guardar nueva donación ───────────────────────────────────────────────
  const handleSubmitNueva = async (e) => {
    e.preventDefault();

    if (!formData.tipo_donacion || !formData.cantidad_donacion || !formData.id_almacen ||
      !formData.descripcion.trim() || !formData.observaciones.trim()) {
      mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    if (formData.descripcion.length > 500) {
      mostrarNotificacion('La descripción no puede superar 500 caracteres', 'error');
      return;
    }
    if (formData.observaciones.length > 1000) {
      mostrarNotificacion('Las observaciones no pueden superar 1000 caracteres', 'error');
      return;
    }
    const fechaSeleccionada = new Date(formData.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada > hoy) {
      mostrarNotificacion('La fecha no puede ser futura', 'error');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) { mostrarNotificacion('No estás autenticado.', 'error'); return; }
      const token = await user.getIdToken();

      const formDataToSend = new FormData();
      formDataToSend.append('tipo_donacion', formData.tipo_donacion);
      formDataToSend.append('cantidad_donacion', formData.cantidad_donacion);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('observaciones', formData.observaciones || '');
      formDataToSend.append('id_almacen', formData.id_almacen);
      formDataToSend.append('fecha', new Date().toISOString());
      if (formData.imagen) formDataToSend.append('imagen', formData.imagen);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formDataToSend,
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || `Error ${response.status}`);

      setHasUnsavedChanges(false); // ← limpiar antes de cerrar para no disparar confirmación
      mostrarNotificacion('¡Donación registrada exitosamente!', 'success');
      closeModals();
      await cargarDonaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message || 'Error al guardar la donación', 'error');
    }
  };

  // ─── Guardar edición ──────────────────────────────────────────────────────
  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!donacionSeleccionada) return;

    if (!formData.tipo_donacion || !formData.cantidad_donacion || !formData.id_almacen ||
      !formData.descripcion.trim() || !formData.observaciones.trim()) {
      mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    if (formData.descripcion.length > 500) {
      mostrarNotificacion('La descripción no puede superar 500 caracteres', 'error');
      return;
    }
    if (formData.observaciones.length > 1000) {
      mostrarNotificacion('Las observaciones no pueden superar 1000 caracteres', 'error');
      return;
    }
    const fechaSeleccionada = new Date(formData.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada > hoy) {
      mostrarNotificacion('La fecha no puede ser futura', 'error');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) { mostrarNotificacion('No estás autenticado.', 'error'); return; }
      const token = await user.getIdToken();

      const formDataToSend = new FormData();
      formDataToSend.append('tipo_donacion', formData.tipo_donacion);
      formDataToSend.append('cantidad_donacion', formData.cantidad_donacion);
      formDataToSend.append('descripcion', formData.descripcion || '');
      formDataToSend.append('observaciones', formData.observaciones || '');
      formDataToSend.append('id_almacen', formData.id_almacen);
      formDataToSend.append('fecha', formData.fecha || new Date().toISOString());
      if (formData.imagen) formDataToSend.append('imagen', formData.imagen);

      const response = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, {
        method: 'PUT',
        body: formDataToSend,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar donación');
      }

      setHasUnsavedChanges(false); // ← limpiar antes de cerrar
      mostrarNotificacion('¡Donación actualizada exitosamente!', 'success');
      closeModals();
      await cargarDonaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message || 'Error al actualizar la donación', 'error');
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────
  const prepararEliminacionDonacion = () => {
    if (!donacionSeleccionada) return;
    setShowConfirm(true);
  };

  const confirmarEliminacionDonacion = async () => {
    setShowConfirm(false);
    if (!donacionSeleccionada) return;

    try {
      const user = auth.currentUser;
      if (!user) { mostrarNotificacion('No estás autenticado.', 'error'); return; }
      const token = await user.getIdToken();

      const response = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar donación');
      }

      setHasUnsavedChanges(false);
      mostrarNotificacion('Donación eliminada exitosamente', 'success');
      closeModals();
      await cargarDonaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message || 'Error al eliminar la donación', 'error');
    }
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
    const colores = { 1: '#FF6B6B', 2: '#4ECDC4', 12: '#45B7D1', 23: '#FFA07A', 40: '#98D8C8' };
    return colores[id_almacen] || '#95A5A6';
  };

  const getNombreAlmacen = (id_almacen) => {
    const nombres = { 1: 'Almacén 1', 2: 'Almacén 2', 3: 'Almacén 3', 4: 'Almacén 4', 5: 'Almacén 5' };
    return nombres[id_almacen] || `Almacén ${id_almacen}`;
  };

  const donacionesFiltradas = Array.isArray(donaciones) ? donaciones.filter(donacion => {
    const searchLower = busqueda.toLowerCase();
    return (
      donacion.tipo_donacion?.toLowerCase().includes(searchLower) ||
      donacion.descripcion?.toLowerCase().includes(searchLower) ||
      getNombreAlmacen(donacion.id_almacen).toLowerCase().includes(searchLower)
    );
  }) : [];

  // ─── Campos del formulario (reutilizables) ────────────────────────────────
  const renderCamposFormulario = () => (
    <div className="form-grid">
      <div className="form-group">
        <label>Tipo de Donación <span>*</span></label>
        <select name="tipo_donacion" value={formData.tipo_donacion} onChange={handleInputChange} required>
          <option value="">Seleccionar tipo</option>
          <option value="Alimentos">Alimentos</option>
          <option value="Instrumentos musicales">Instrumentos Musicales</option>
          <option value="Medicina">Medicina</option>
          <option value="Enseres">Enseres</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Vestimenta">Vestimenta</option>
          <option value="Accesorios musicales">Accesorios Musicales</option>
          <option value="Útiles escolares">Útiles Escolares</option>
          <option value="Material Audiovisual">Material Audiovisual</option>
          <option value="Material didactico">Material Didáctico</option>
          <option value="Productos de higiene">Productos de Higiene</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <div className="form-group">
        <label>Cantidad <span>*</span></label>
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
        <label>Descripción <span>*</span></label>
        <textarea
          name="descripcion"
          value={formData.descripcion}
          onChange={handleInputChange}
          placeholder="Describe la donación..."
          maxLength="500"
          required
        />
      </div>

      <div className="form-group form-grid-full">
        <label>Observaciones <span>*</span></label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleInputChange}
          placeholder="Notas adicionales..."
          maxLength="1000"
          required
        />
      </div>

      <div className="form-group">
        <label>Almacén <span>*</span></label>
        <select name="id_almacen" value={formData.id_almacen} onChange={handleInputChange} required>
          <option value="">Seleccionar almacén</option>
          <option value="1">Almacén 1</option>
          <option value="2">Almacén 2</option>
          <option value="3">Almacén 3</option>
          <option value="4">Almacén 4</option>
          <option value="5">Almacén 5</option>
        </select>
      </div>

      <div className="form-group">
        <label>Fecha <span>*</span></label>
        <input
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group form-grid-full">
        <label><ImagePlus size={16} /> Foto de la Donación</label>
        <div className={`foto-upload-area ${formData.foto_preview ? 'has-image' : ''}`}>
          {formData.foto_preview ? (
            <div>
              <img src={formData.foto_preview} alt="Preview" className="foto-preview" />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <input
                  type="file"
                  accept=".jpg,.jpeg"
                  onChange={handleFotoChange}
                  style={{ display: 'none' }}
                  id="foto-upload-replace"
                />
                <label htmlFor="foto-upload-replace" className="btn-upload-label">
                  <Upload size={16} /> Cambiar foto
                </label>
                <button
                  type="button"
                  onClick={eliminarFoto}
                  className="btn btn-danger"
                  style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                >
                  Eliminar foto
                </button>
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
                accept=".jpg,.jpeg"
                onChange={handleFotoChange}
                style={{ display: 'none' }}
                id="foto-upload-nueva"
              />
              <label htmlFor="foto-upload-nueva" className="btn-upload-label">
                <ImagePlus size={18} /> Seleccionar imagen
              </label>
              <small style={{ display: 'block', marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                Formatos: JPG, JPEG
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="donacion-container">
        {/* ENCABEZADO */}
        <motion.div
          className="donacion-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        >
          <motion.div className="header-gradient" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6 }}>
            <div className="header-content">
              <motion.h2 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}>
                  <Heart size={36} fill="white" color="white" />
                </motion.div>
                Sistema de Donaciones
                <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }} style={{ marginLeft: 'auto' }}>
                  <Gift size={32} color="white" />
                </motion.div>
              </motion.h2>

              <motion.p initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
                Gestiona y controla todas las donaciones recibidas con amor y eficiencia
              </motion.p>

              <motion.div className="header-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                {[
                  { icon: <Package size={20} color="white" />, value: totalDonaciones, label: 'Total Donaciones' },
                  { icon: <Users size={20} color="white" />, value: totalCantidad, label: 'Cantidad Total' },
                  { icon: <Hash size={20} color="white" />, value: tiposUnicos, label: 'Tipos Diferentes' },
                ].map((stat, i) => (
                  <motion.div key={i} className="stat-item" whileHover={{ scale: 1.05, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                    <div className="stat-icon">{stat.icon}</div>
                    <div className="stat-text">
                      <div className="stat-value" style={{ color: "white" }}>{stat.value}</div>
                      <div className="stat-label" style={{ color: "white" }}>{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div className="floating-icons" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
                {[
                  { icon: <Shirt size={20} color="white" />, duration: 4 },
                  { icon: <Apple size={20} color="white" />, duration: 3.5, delay: 0.5 },
                  { icon: <Book size={20} color="white" />, duration: 4.2, delay: 1 },
                ].map((item, i) => (
                  <motion.div key={i} className="floating-icon"
                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: item.duration, repeat: Infinity, ease: "easeInOut", delay: item.delay || 0 }}>
                    {item.icon}
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* BARRA DE BÚSQUEDA */}
          <motion.div className="donacion-busqueda-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} style={{ marginTop: '2rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                className="donacion-busqueda"
                placeholder="Buscar por tipo, descripción o almacén..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <motion.button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <HelpCircle size={18} /> Ayuda
            </motion.button>
            <motion.button className="btn-ayuda" onClick={handleNuevaDonacion} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Plus size={18} /> Nueva Donación
            </motion.button>
          </motion.div>
        </motion.div>

        {/* TABLA */}
        <div className="donacion-categorias-container">
          {donacionesFiltradas.length === 0 ? (
            <motion.div className="donacion-categorias-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Package size={60} color="#ccc" style={{ marginBottom: '1rem' }} />
              <p>No se encontraron donaciones</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="donacion-categoria-header">
                <h3 className="donacion-subtitulo">
                  <Package size={24} />
                  <span>Todas las Donaciones ({donacionesFiltradas.length})</span>
                </h3>
              </div>

              <motion.div className="tabla-donaciones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <div className="tabla-header-donaciones">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Hash size={14} /> ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Package size={14} /> TIPO & DESCRIPCIÓN</div>
                  <div style={{ display: 'flex', alignItems: 'left', gap: '5px' }}><Warehouse size={14} /> ALMACÉN</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> FECHA</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Hash size={14} /> CANTIDAD</div>
                  <div style={{ textAlign: 'center' }}><Edit size={14} style={{ display: 'inline' }} /></div>
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
                        <div style={{ fontWeight: '700', color: '#667eea', fontSize: '0.9rem' }}>
                          #{donacion.id_donacion || idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                            {getIconoTipo(donacion.tipo_donacion)}
                            {donacion.tipo_donacion}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                            {donacion.descripcion || 'Sin descripción'}
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <span className="badge-almacen" style={{ background: getColorAlmacen(donacion.id_almacen), color: 'white', textAlign: "center" }}>
                            {getNombreAlmacen(donacion.id_almacen)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#555', textAlign: "center" }}>
                          {new Date(donacion.fecha).toLocaleDateString('es-ES')}
                        </div>
                        <div className="badge-cantidad">{donacion.cantidad_donacion}</div>
                        <div style={{ textAlign: 'center' }}>
                          <motion.div whileHover={{ scale: 1.2, rotate: 15 }} style={{ display: 'inline-block' }}>
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

        {/* MODAL NUEVA DONACIÓN */}
        <AnimatePresence>
          {mostrarModal && (
            <motion.div className="modal-overlay-donaciones" onClick={handleCloseModals} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="modal-content-donaciones"
                style={{ minWidth: '520px', maxWidth: '550px' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title"><Plus size={24} /> Nueva Donación</h3>
                <form onSubmit={handleSubmitNueva} noValidate>
                  {renderCamposFormulario()}
                  <div className="modal-actions-donaciones">
                    <motion.button type="button" className="btn-cancelar-donaciones" onClick={handleCloseModals} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <X size={16} /> Cancelar
                    </motion.button>
                    <motion.button type="submit" className="btn-guardar-donaciones" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Save size={16} /> Guardar Donación
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL EDITAR DONACIÓN */}
        <AnimatePresence>
          {mostrarModalEditar && donacionSeleccionada && (
            <motion.div className="modal-overlay-donaciones" onClick={handleCloseModals} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="modal-content-donaciones"
                style={{ minWidth: '520px', maxWidth: '550px' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title"><Edit size={24} /> Editar Donación</h3>

                {/* Indicador de cambios sin guardar */}
                {hasUnsavedChanges && (
                  <div style={{
                    background: '#fff8e1', border: '1px solid #ffc107', borderRadius: '8px',
                    padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.9rem',
                    color: '#856404', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    ⚠️ Tienes cambios sin guardar
                  </div>
                )}

                <form onSubmit={handleSubmitEditar} noValidate>
                  {renderCamposFormulario()}
                  <div className="modal-actions-donaciones">
                    <motion.button type="button" className="btn btn-danger" onClick={prepararEliminacionDonacion} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      Eliminar
                    </motion.button>
                    <motion.button type="button" className="btn-cancelar-donaciones" onClick={handleCloseModals} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      Cancelar
                    </motion.button>
                    <motion.button type="submit" className="btn-guardar-donaciones" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      Guardar Cambios
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CONFIRM DIALOGS FUERA DE LOS MODALES ─────────────────────────── */}
        {/* Confirmar eliminación — muestra tipo y cantidad */}
        {showConfirm && donacionSeleccionada && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar la donación de "${donacionSeleccionada.tipo_donacion}" con cantidad ${donacionSeleccionada.cantidad_donacion}?`}
            onConfirm={confirmarEliminacionDonacion}
            onCancel={() => setShowConfirm(false)}
            visible={showConfirm}
          />
        )}

        {/* Confirmar cierre con cambios sin guardar */}
        {showConfirmClose && (
          <ConfirmDialog
            message="Tienes cambios sin guardar. ¿Seguro que deseas cerrar sin guardar?"
            onConfirm={closeModals}
            onCancel={() => setShowConfirmClose(false)}
            visible={showConfirmClose}
          />
        )}

        {/* NOTIFICACIONES */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className={`notification ${notification.type}`}
              initial={{ opacity: 0, y: -50, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -50, x: 100 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {notification.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <span>{notification.message}</span>
              <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
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
                  <h3 className="horarios-modal-title"><Heart size={24} /> Ayuda - Sistema de Donaciones</h3>
                  <button className="horarios-modal-close" onClick={() => setMostrarAyuda(false)}><X size={20} /></button>
                </div>
                <div className="horarios-modal-body">
                  <div className="horarios-help-section">
                    <h4 className="horarios-help-title">¿Cómo funciona el sistema de donaciones?</h4>
                    <p className="horarios-help-text">El módulo de donaciones te permite gestionar todas las donaciones recibidas, clasificándolas por tipo, almacén y estado para un control eficiente del inventario.</p>
                  </div>
                  <div className="horarios-help-section">
                    <h4 className="horarios-help-title">Tipos de donación:</h4>
                    <div className="horarios-icons-grid">
                      <div className="horarios-icon-item"><ShoppingCart size={16} className="horarios-icon-primary" /><span>Alimentos - Productos alimenticios</span></div>
                      <div className="horarios-icon-item"><Music size={16} className="horarios-icon-info" /><span>Instrumentos musicales</span></div>
                      <div className="horarios-icon-item"><PlusCircle size={16} className="horarios-icon-success" /><span>Medicina - Productos médicos</span></div>
                      <div className="horarios-icon-item"><Home size={16} className="horarios-icon-warning" /><span>Enseres - Artículos para el hogar</span></div>
                      <div className="horarios-icon-item"><Droplet size={16} className="horarios-icon-info" /><span>Productos de higiene</span></div>
                      <div className="horarios-icon-item"><Package size={16} className="horarios-icon-new" /><span>Otro - Otras categorías</span></div>
                    </div>
                  </div>
                  <div className="horarios-help-section">
                    <h4 className="horarios-help-title">Consejos de uso:</h4>
                    <div className="horarios-tips">
                      <div className="horarios-tip"><span className="horarios-tip-badge"></span><span>Usa la búsqueda para encontrar donaciones rápidamente</span></div>
                      <div className="horarios-tip"><span className="horarios-tip-badge"></span><span>Haz clic en cualquier fila para editar los detalles</span></div>
                      <div className="horarios-tip"><span className="horarios-tip-badge"></span><span>Los datos se sincronizan automáticamente cada 30 segundos</span></div>
                      <div className="horarios-tip"><span className="horarios-tip-badge"></span><span>Adjunta fotos de las donaciones para mejor identificación (JPG, máx 5MB)</span></div>
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

export default Donaciones;