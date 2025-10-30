import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Directiva.css"
import { 
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Hash,
  Search,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Check,
  Users,
  FileText,
  Award,
  Shield,
  Upload,
  Download,
  Eye,
  Building
} from 'lucide-react';

const API_URL = "http://localhost:5000/api/directiva";

const Directiva = () => {
  const [miembros, setMiembros] = useState([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [Loading, setLoading] = useState(false);
  const [filtroOrden, setFiltroOrden] = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);
  const [mostrarModalPDF, setMostrarModalPDF] = useState(false);
  const [pdfSeleccionado, setPdfSeleccionado] = useState(null);
  const [archivoSubir, setArchivoSubir] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    email: '',
    telefono: '',
    empresa: '',
    estado: 'activo',
    notas: ''
  });

  const [formPDF, setFormPDF] = useState({
    tipo_documento: 'acta',
    descripcion: ''
  });

  useEffect(() => {
    cargarMiembros();
  }, );

  const cargarMiembros = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar miembros');
      const data = await res.json();
      setMiembros(data.success ? data.data : []);
    } catch (err) {
      console.error('Error al obtener miembros:', err);
      showNotification('Error al cargar miembros de la directiva', 'error');
      setMiembros([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalMiembros = miembros.length;
  const miembrosActivos = miembros.filter(m => m.estado === "activo").length;
  const miembrosInactivos = miembros.filter(m => m.estado === "inactivo").length;
  const miembrosSuspendidos = miembros.filter(m => m.estado === "suspendido").length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      cargo: '',
      email: '',
      telefono: '',
      empresa: '',
      estado: 'activo',
      notas: ''
    });
  };

  const resetFormPDF = () => {
    setFormPDF({
      tipo_documento: 'acta',
      descripcion: ''
    });
    setArchivoSubir(null);
  };

  const handleCrearMiembro = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.nombre.trim()) {
        showNotification('El nombre es obligatorio', 'error');
        return;
      }
      if (!formData.cargo.trim()) {
        showNotification('El cargo es obligatorio', 'error');
        return;
      }
      if (!formData.email.trim()) {
        showNotification('El email es obligatorio', 'error');
        return;
      }
      if (!formData.telefono.trim()) {
        showNotification('El teléfono es obligatorio', 'error');
        return;
      }

      const datosMiembro = {
        nombre: formData.nombre.trim(),
        cargo: formData.cargo.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        empresa: formData.empresa.trim(),
        estado: formData.estado,
        notas: formData.notas.trim()
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosMiembro)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el miembro');
      }
      
      await cargarMiembros();
      setMostrarModalCrear(false);
      resetForm();
      showNotification(`Miembro "${formData.nombre}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el miembro', 'error');
    }
  };

  const handleEditarMiembro = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.nombre.trim()) {
        showNotification('El nombre es obligatorio', 'error');
        return;
      }
      if (!formData.cargo.trim()) {
        showNotification('El cargo es obligatorio', 'error');
        return;
      }
      if (!formData.email.trim()) {
        showNotification('El email es obligatorio', 'error');
        return;
      }
      if (!formData.telefono.trim()) {
        showNotification('El teléfono es obligatorio', 'error');
        return;
      }

      const datosActualizados = {
        nombre: formData.nombre.trim(),
        cargo: formData.cargo.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        empresa: formData.empresa.trim(),
        estado: formData.estado,
        notas: formData.notas.trim()
      };

      const res = await fetch(`${API_URL}/${miembroSeleccionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el miembro');
      }
      
      await cargarMiembros();
      setMiembroSeleccionado(null);
      resetForm();
      showNotification(`Miembro "${formData.nombre}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el miembro', 'error');
    }
  };

  const handleEliminarMiembro = async () => {
    const miembroAEliminar = miembros.find(m => m._id === miembroSeleccionado._id);
    if (!window.confirm(`¿Seguro que deseas eliminar al miembro "${miembroAEliminar?.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${miembroSeleccionado._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el miembro');
      }
      
      await cargarMiembros();
      setMiembroSeleccionado(null);
      resetForm();
      showNotification(`Miembro "${miembroAEliminar?.nombre}" eliminado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el miembro', 'error');
    }
  };

  const handleSubirPDF = async (e) => {
    e.preventDefault();
    
    if (!archivoSubir) {
      showNotification('Selecciona un archivo PDF', 'error');
      return;
    }

    if (!formPDF.tipo_documento) {
      showNotification('Selecciona un tipo de documento', 'error');
      return;
    }

    try {
      const formDataPDF = new FormData();
      formDataPDF.append('pdf', archivoSubir);
      formDataPDF.append('tipo_documento', formPDF.tipo_documento);
      formDataPDF.append('descripcion', formPDF.descripcion);

      const res = await fetch(`${API_URL}/${miembroSeleccionado._id}/pdf`, {
        method: 'POST',
        body: formDataPDF
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al subir el PDF');
      }

      await cargarMiembros();
      setMostrarModalPDF(false);
      resetFormPDF();
      showNotification('PDF subido exitosamente', 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al subir el PDF', 'error');
    }
  };

  const handleDescargarPDF = async (pdfId, nombreArchivo) => {
    try {
      const res = await fetch(`${API_URL}/${miembroSeleccionado._id}/pdf/${pdfId}`);
      if (!res.ok) throw new Error('Error al descargar el PDF');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotification('PDF descargado exitosamente', 'success');
    } catch (err) {
      console.error(err.message);
      showNotification('Error al descargar el PDF', 'error');
    }
  };

  const handleEliminarPDF = async (pdfId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este documento?')) return;
    
    try {
      const res = await fetch(`${API_URL}/${miembroSeleccionado._id}/pdf/${pdfId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Error al eliminar el PDF');
      
      await cargarMiembros();
      showNotification('PDF eliminado exitosamente', 'success');
    } catch (err) {
      console.error(err.message);
      showNotification('Error al eliminar el PDF', 'error');
    }
  };

  const miembrosFiltrados = miembros.filter(m => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      m.nombre?.toLowerCase().includes(terminoBusqueda) ||
      m.cargo?.toLowerCase().includes(terminoBusqueda) ||
      m.email?.toLowerCase().includes(terminoBusqueda) ||
      m.empresa?.toLowerCase().includes(terminoBusqueda) ||
      m.telefono?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const miembrosOrdenados = [...miembrosFiltrados].sort((a, b) => {
    switch(filtroOrden) {
      case 'nombre-asc':
        return (a.nombre || '').localeCompare(b.nombre || '');
      case 'nombre-desc':
        return (b.nombre || '').localeCompare(a.nombre || '');
      case 'cargo-asc':
        return (a.cargo || '').localeCompare(b.cargo || '');
      case 'cargo-desc':
        return (b.cargo || '').localeCompare(a.cargo || '');
      case 'estado-activo':
        const estadoOrden = { 'activo': 1, 'inactivo': 2, 'suspendido': 3 };
        return (estadoOrden[a.estado] || 999) - (estadoOrden[b.estado] || 999);
      case 'estado-inactivo':
        const estadoOrdenInv = { 'suspendido': 1, 'inactivo': 2, 'activo': 3 };
        return (estadoOrdenInv[a.estado] || 999) - (estadoOrdenInv[b.estado] || 999);
      default:
        return 0;
    }
  });

  const getCargoIcon = (cargo) => {
    const cargoLower = cargo?.toLowerCase() || '';
    if (cargoLower.includes('presidente')) return <Award size={18} />;
    if (cargoLower.includes('secretari')) return <FileText size={18} />;
    if (cargoLower.includes('tesorero')) return <Briefcase size={18} />;
    if (cargoLower.includes('vocal')) return <Users size={18} />;
    return <Shield size={18} />;
  };

  const handleOpenEditModal = (miembro) => {
    setMiembroSeleccionado(miembro);
    setFormData({
      nombre: miembro.nombre || '',
      cargo: miembro.cargo || '',
      email: miembro.email || '',
      telefono: miembro.telefono || '',
      empresa: miembro.empresa || '',
      estado: miembro.estado || 'activo',
      notas: miembro.notas || ''
    });
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setMiembroSeleccionado(null);
    setMostrarModalPDF(false);
    resetForm();
    resetFormPDF();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="directiva-container">
        {/* Header con estadísticas */}
        <motion.div 
          className="directiva-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Sistema de Gestión de Directiva</h2>
          <p>Administra los miembros de la directiva de manera eficiente</p>

          {/* Tarjetas de estadísticas */}
          <div className="directiva-stats">
            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Users size={24} />
              <div className="stat-info">
                <span className="stat-value">{totalMiembros}</span>
                <span className="stat-label">Total</span>
              </div>
            </motion.div>
            <motion.div 
              className="stat-card active"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Check size={24} />
              <div className="stat-info">
                <span className="stat-value">{miembrosActivos}</span>
                <span className="stat-label">Activos</span>
              </div>
            </motion.div>
            <motion.div 
              className="stat-card inactivo"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <X size={24} />
              <div className="stat-info">
                <span className="stat-value">{miembrosInactivos}</span>
                <span className="stat-label">Inactivos</span>
              </div>
            </motion.div>
            <motion.div 
              className="stat-card suspendido"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Shield size={24} />
              <div className="stat-info">
                <span className="stat-value">{miembrosSuspendidos}</span>
                <span className="stat-label">Suspendidos</span>
              </div>
            </motion.div>
          </div>

          <div className="directiva-busqueda-bar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#999' 
                }} 
              />
              <input
                type="text"
                className="directiva-busqueda"
                placeholder="Buscar por nombre, cargo, email, empresa o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ paddingLeft: '45px' }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <motion.button 
                className="btn-ayuda" 
                onClick={() => setMostrarMenuFiltros(!mostrarMenuFiltros)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Shield size={16} />
                Ordenar
              </motion.button>
              
              <AnimatePresence>
                {mostrarMenuFiltros && (
                  <motion.div 
                    className="filtros-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'ninguno' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('ninguno'); setMostrarMenuFiltros(false); }}
                    >
                      Sin orden
                    </div>
                    <div className="filtro-separador"></div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'nombre-asc' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('nombre-asc'); setMostrarMenuFiltros(false); }}
                    >
                      Nombre A-Z
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'nombre-desc' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('nombre-desc'); setMostrarMenuFiltros(false); }}
                    >
                      Nombre Z-A
                    </div>
                    <div className="filtro-separador"></div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'cargo-asc' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('cargo-asc'); setMostrarMenuFiltros(false); }}
                    >
                      Cargo A-Z
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'cargo-desc' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('cargo-desc'); setMostrarMenuFiltros(false); }}
                    >
                      Cargo Z-A
                    </div>
                    <div className="filtro-separador"></div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'estado-activo' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('estado-activo'); setMostrarMenuFiltros(false); }}
                    >
                      Estado: Activo primero
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'estado-inactivo' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('estado-inactivo'); setMostrarMenuFiltros(false); }}
                    >
                      Estado: Inactivo primero
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button 
              className="btn-ayuda" 
              onClick={() => setMostrarAyuda(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HelpCircle size={16} />
              Ayuda
            </motion.button>
            <motion.button 
              className="btn-ayuda" 
              onClick={() => {
                resetForm();
                setMostrarModalCrear(true);
              }}
              style={{ background: '#4CAF50' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              Nuevo Miembro
            </motion.button>
          </div>
        </motion.div>

        {/* TABLA con TODOS los miembros */}
        <motion.div 
          className="directiva-categoria-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div 
            className="directiva-categoria-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="directiva-subtitulo">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Users size={20} />
              </motion.div>
              Miembros de la Directiva ({miembrosOrdenados.length})
            </h3>
          </motion.div>

          {miembrosOrdenados.length === 0 ? (
            <motion.p 
              className="directiva-vacio"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              No hay miembros registrados en la directiva.
            </motion.p>
          ) : (
            <motion.div 
              className="tabla-directiva"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.div 
                className="tabla-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px 200px 150px 120px 120px 120px',
                  gap: '10px',
                  padding: '12px 20px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '8px 8px 0 0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={14} />
                  NOMBRE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Briefcase size={14} />
                  CARGO
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} />
                  CONTACTO
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building size={14} />
                  EMPRESA
                </div>
                <div style={{ textAlign: 'center' }}>ESTADO</div>
                <div style={{ textAlign: 'center' }}>DOCUMENTOS</div>
                <div style={{ textAlign: 'center' }}>ACCIONES</div>
              </motion.div>

              <div className="tabla-body">
                {miembrosOrdenados.map((miembro, index) => (
                  <motion.div
                    key={miembro._id}
                    className="tabla-fila"
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
                    onClick={() => handleOpenEditModal(miembro)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 200px 200px 150px 120px 120px 120px',
                      gap: '10px',
                      alignItems: 'center',
                      padding: '15px 20px',
                      background: 'white',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer'
                    }}
                  >
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
                        {miembro.nombre}
                      </motion.div>
                      {miembro.fecha_registro && (
                        <motion.div 
                          style={{ 
                            fontSize: '0.85rem',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                        >
                          <Calendar size={12} />
                          Desde: {formatearFecha(miembro.fecha_registro)}
                        </motion.div>
                      )}
                    </div>

                    <motion.div 
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        color: '#555'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.25 }}
                    >
                      {getCargoIcon(miembro.cargo)}
                      <span>{miembro.cargo}</span>
                    </motion.div>

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
                        {miembro.email}
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
                        {miembro.telefono}
                      </motion.div>
                    </div>

                    <motion.div 
                      style={{ 
                        fontSize: '0.9rem',
                        color: '#555',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                    >
                      <Building size={14} />
                      {miembro.empresa || '—'}
                    </motion.div>

                    <motion.div 
                      style={{ textAlign: 'center' }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className={`estado-badge ${miembro.estado?.toLowerCase()}`}>
                        {miembro.estado}
                      </span>
                    </motion.div>

                    <motion.div 
                      style={{ textAlign: 'center' }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="documentos-badge">
                        <FileText size={14} />
                        {miembro.cantidad_documentos || 0}
                      </span>
                    </motion.div>

                    <motion.div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '8px' 
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.3 }}
                    >
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(miembro);
                        }}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.85rem'
                        }}
                        whileHover={{ scale: 1.1, backgroundColor: '#5568d3' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit size={14} />
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Modal Crear Miembro */}
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
              style={{ maxWidth: '700px', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <h3 className="modal-title">
                <Plus size={20} />
                Crear Nuevo Miembro
              </h3>
              <form onSubmit={handleCrearMiembro}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Juan Carlos Pérez"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo *</label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      placeholder="Presidente"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="miembro@empresa.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="+504 9999-8888"
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
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      required
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Notas</label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({...formData, notas: e.target.value})}
                      placeholder="Notas adicionales sobre el miembro"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="modal-actions">
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
                    <Save size={16} />
                    Guardar Miembro
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Miembro */}
      <AnimatePresence>
        {miembroSeleccionado && !mostrarModalPDF && (
          <motion.div 
            className="modal-overlay" 
            onClick={handleCloseModals}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <h3 className="modal-title">
                <Edit size={20} />
                Editar Miembro
              </h3>
              
              {/* Tabs */}
              <div className="modal-tabs">
                <button className="tab-button active">
                  <Edit size={16} />
                  Información
                </button>
                <button 
                  className="tab-button"
                  onClick={() => setMostrarModalPDF(true)}
                >
                  <FileText size={16} />
                  Documentos ({miembroSeleccionado.cantidad_documentos || 0})
                </button>
              </div>

              <form onSubmit={handleEditarMiembro}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo *</label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      required
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
                    <label>Empresa</label>
                    <input
                      type="text"
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      required
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
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
                    className="btn-eliminar" 
                    onClick={handleEliminarMiembro}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </motion.button>
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
                    <Save size={16} />
                    Guardar Cambios
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal PDFs */}
      <AnimatePresence>
        {mostrarModalPDF && miembroSeleccionado && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setMostrarModalPDF(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              style={{ maxWidth: '800px', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <h3 className="modal-title">
                <FileText size={20} />
                Documentos de {miembroSeleccionado.nombre}
              </h3>

              {/* Formulario subir PDF */}
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>
                  <Upload size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Subir Nuevo Documento
                </h4>
                <form onSubmit={handleSubirPDF}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Tipo de Documento *</label>
                      <select
                        value={formPDF.tipo_documento}
                        onChange={(e) => setFormPDF({...formPDF, tipo_documento: e.target.value})}
                        required
                      >
                        <option value="acta">Acta</option>
                        <option value="contrato">Contrato</option>
                        <option value="informe">Informe</option>
                        <option value="certificado">Certificado</option>
                        <option value="nombramiento">Nombramiento</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Archivo PDF *</label>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setArchivoSubir(e.target.files[0])}
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Descripción</label>
                      <input
                        type="text"
                        value={formPDF.descripcion}
                        onChange={(e) => setFormPDF({...formPDF, descripcion: e.target.value})}
                        placeholder="Descripción breve del documento"
                      />
                    </div>
                  </div>
                  <motion.button 
                    type="submit" 
                    className="btn-guardar"
                    style={{ width: '100%', marginTop: '1rem' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload size={16} />
                    Subir Documento
                  </motion.button>
                </form>
              </div>

              {/* Lista de PDFs */}
              <div>
                <h4 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
                  Documentos Almacenados ({miembroSeleccionado.documentos_pdf?.length || 0})
                </h4>
                
                {(!miembroSeleccionado.documentos_pdf || miembroSeleccionado.documentos_pdf.length === 0) ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No hay documentos almacenados
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {miembroSeleccionado.documentos_pdf.map((pdf) => (
                      <motion.div
                        key={pdf._id}
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        whileHover={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                            {pdf.nombre_archivo}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            <span className={`tipo-doc-badge ${pdf.tipo_documento}`}>
                              {pdf.tipo_documento.toUpperCase()}
                            </span>
                            {pdf.descripcion && ` • ${pdf.descripcion}`}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                            {formatearFecha(pdf.fecha_subida)} • {(pdf.tamano_kb).toFixed(2)} KB
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <motion.button
                            onClick={() => handleDescargarPDF(pdf._id, pdf.nombre_archivo)}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Download size={16} />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEliminarPDF(pdf._id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <motion.button 
                  type="button" 
                  className="btn-cerrar" 
                  onClick={() => setMostrarModalPDF(false)}
                  style={{ width: '100%' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={16} />
                  Cerrar
                </motion.button>
              </div>
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
                <FileText size={20} />
                Guía de Uso - Sistema de Directiva
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} />
                  Búsqueda
                </h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Busca por: nombre, cargo, email, empresa o teléfono.</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} />
                  Estados
                </h4>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <li><strong>🟢 ACTIVO:</strong> Miembro activo en la directiva</li>
                  <li><strong>🔴 INACTIVO:</strong> Miembro retirado</li>
                  <li><strong>🟠 SUSPENDIDO:</strong> Miembro temporalmente suspendido</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} />
                  Tipos de Documentos
                </h4>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <li><strong>ACTA:</strong> Actas de sesiones</li>
                  <li><strong>CONTRATO:</strong> Contratos de servicios</li>
                  <li><strong>INFORME:</strong> Informes y reportes</li>
                  <li><strong>CERTIFICADO:</strong> Certificaciones</li>
                  <li><strong>NOMBRAMIENTO:</strong> Documentos de nombramiento</li>
                  <li><strong>OTRO:</strong> Otros documentos</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✨ Funciones
                </h4>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <li>Clic en fila para ver/editar detalles</li>
                  <li>Gestión completa de documentos PDF</li>
                  <li>Búsqueda en tiempo real</li>
                  <li>Ordenar por nombre, cargo o estado</li>
                  <li>Historial de cargos automático</li>
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
    </>
  );
};

export default Directiva;