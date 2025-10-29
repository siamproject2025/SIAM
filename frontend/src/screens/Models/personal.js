import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Personal.css"
import { 
  User,
  Mail,
  Phone,
  MapPin,
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
  Clock,
  DollarSign,
  FileText,
  Award,
  Building2,
  Shield
} from 'lucide-react';

const API_URL = "http://localhost:5000/api/personal";

const Personal = () => {
  const [personal, setPersonal] = useState([]);
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroOrden, setFiltroOrden] = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    nombres: '',
    apellidos: '',
    numero_identidad: '',
    tipo_contrato: 'TIEMPO_COMPLETO',
    estado: 'ACTIVO',
    telefono: '',
    direccion_correo: '',
    cargo: '',
    horario_preferido: 'MATUTINO',
    fecha_asignacion: new Date().toISOString().split('T')[0],
    area_trabajo: '',
    especialidades: '',
    salario: '',
    fecha_ingreso: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    cargarPersonal();
  }, []);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Error al cargar personal');
      const data = await res.json();
      setPersonal(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener el personal:', err);
      showNotification('Error al cargar el personal', 'error');
      setPersonal([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const totalPersonal = personal.length;
  const personalActivo = personal.filter(p => p.estado === "ACTIVO").length;
  const personalVacaciones = personal.filter(p => p.estado === "VACACIONES").length;
  const personalLicencia = personal.filter(p => p.estado === "LICENCIA").length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombres: '',
      apellidos: '',
      numero_identidad: '',
      tipo_contrato: 'TIEMPO_COMPLETO',
      estado: 'ACTIVO',
      telefono: '',
      direccion_correo: '',
      cargo: '',
      horario_preferido: 'MATUTINO',
      fecha_asignacion: new Date().toISOString().split('T')[0],
      area_trabajo: '',
      especialidades: '',
      salario: '',
      fecha_ingreso: new Date().toISOString().split('T')[0]
    });
  };

  const handleCrearPersonal = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.codigo.trim()) {
        showNotification('El código es obligatorio', 'error');
        return;
      }
      if (!formData.nombres.trim()) {
        showNotification('Los nombres son obligatorios', 'error');
        return;
      }
      if (!formData.apellidos.trim()) {
        showNotification('Los apellidos son obligatorios', 'error');
        return;
      }
      if (!formData.numero_identidad.trim()) {
        showNotification('El número de identidad es obligatorio', 'error');
        return;
      }
      if (!formData.telefono.trim()) {
        showNotification('El teléfono es obligatorio', 'error');
        return;
      }
      if (!formData.direccion_correo.trim()) {
        showNotification('El correo electrónico es obligatorio', 'error');
        return;
      }
      if (!formData.cargo.trim()) {
        showNotification('El cargo es obligatorio', 'error');
        return;
      }

      const datosPersonal = {
        codigo: formData.codigo.trim(),
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        numero_identidad: formData.numero_identidad.trim(),
        tipo_contrato: formData.tipo_contrato,
        estado: formData.estado,
        telefono: formData.telefono.trim(),
        direccion_correo: formData.direccion_correo.trim().toLowerCase(),
        cargo_asignacion: {
          cargo: formData.cargo.trim(),
          horario_preferido: formData.horario_preferido,
          fecha_asignacion: formData.fecha_asignacion
        },
        area_trabajo: formData.area_trabajo.trim(),
        especialidades: formData.especialidades ? 
          formData.especialidades.split(',').map(e => e.trim()).filter(e => e) : [],
        salario: formData.salario ? parseFloat(formData.salario) : undefined,
        fecha_ingreso: formData.fecha_ingreso
      };

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPersonal)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el empleado');
      }
      
      await cargarPersonal();
      setMostrarModalCrear(false);
      resetForm();
      showNotification(`Empleado "${formData.nombres} ${formData.apellidos}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el empleado', 'error');
    }
  };

  const handleEditarPersonal = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.codigo.trim()) {
        showNotification('El código es obligatorio', 'error');
        return;
      }
      if (!formData.nombres.trim()) {
        showNotification('Los nombres son obligatorios', 'error');
        return;
      }
      if (!formData.apellidos.trim()) {
        showNotification('Los apellidos son obligatorios', 'error');
        return;
      }
      if (!formData.numero_identidad.trim()) {
        showNotification('El número de identidad es obligatorio', 'error');
        return;
      }
      if (!formData.telefono.trim()) {
        showNotification('El teléfono es obligatorio', 'error');
        return;
      }
      if (!formData.direccion_correo.trim()) {
        showNotification('El correo electrónico es obligatorio', 'error');
        return;
      }
      if (!formData.cargo.trim()) {
        showNotification('El cargo es obligatorio', 'error');
        return;
      }

      const datosActualizados = {
        codigo: formData.codigo.trim(),
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        numero_identidad: formData.numero_identidad.trim(),
        tipo_contrato: formData.tipo_contrato,
        estado: formData.estado,
        telefono: formData.telefono.trim(),
        direccion_correo: formData.direccion_correo.trim().toLowerCase(),
        cargo_asignacion: {
          cargo: formData.cargo.trim(),
          horario_preferido: formData.horario_preferido,
          fecha_asignacion: formData.fecha_asignacion
        },
        area_trabajo: formData.area_trabajo.trim(),
        especialidades: formData.especialidades ? 
          formData.especialidades.split(',').map(e => e.trim()).filter(e => e) : [],
        salario: formData.salario ? parseFloat(formData.salario) : undefined,
        fecha_ingreso: formData.fecha_ingreso
      };

      const res = await fetch(`${API_URL}/${personalSeleccionado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el empleado');
      }
      
      await cargarPersonal();
      setPersonalSeleccionado(null);
      resetForm();
      showNotification(`Empleado "${formData.nombres} ${formData.apellidos}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el empleado', 'error');
    }
  };

  const handleEliminarPersonal = async () => {
    const personalAEliminar = personal.find(p => p._id === personalSeleccionado._id);
    if (!window.confirm(`¿Seguro que deseas eliminar al empleado "${personalAEliminar?.nombres} ${personalAEliminar?.apellidos}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${personalSeleccionado._id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el empleado');
      }
      
      await cargarPersonal();
      setPersonalSeleccionado(null);
      resetForm();
      showNotification(`Empleado "${personalAEliminar?.nombres} ${personalAEliminar?.apellidos}" eliminado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el empleado', 'error');
    }
  };

  const personalFiltrado = personal.filter(p => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      p.codigo?.toLowerCase().includes(terminoBusqueda) ||
      p.nombres?.toLowerCase().includes(terminoBusqueda) ||
      p.apellidos?.toLowerCase().includes(terminoBusqueda) ||
      p.numero_identidad?.toLowerCase().includes(terminoBusqueda) ||
      p.cargo_asignacion?.cargo?.toLowerCase().includes(terminoBusqueda) ||
      p.area_trabajo?.toLowerCase().includes(terminoBusqueda) ||
      p.direccion_correo?.toLowerCase().includes(terminoBusqueda)
    );
  });

  const personalOrdenado = [...personalFiltrado].sort((a, b) => {
    switch(filtroOrden) {
      case 'nombre-asc':
        return (a.nombres || '').localeCompare(b.nombres || '');
      case 'nombre-desc':
        return (b.nombres || '').localeCompare(a.nombres || '');
      case 'salario-asc':
        return (a.salario || 0) - (b.salario || 0);
      case 'salario-desc':
        return (b.salario || 0) - (a.salario || 0);
      case 'estado-activo':
        const estadoOrden = { 'ACTIVO': 1, 'VACACIONES': 2, 'LICENCIA': 3, 'INACTIVO': 4 };
        return (estadoOrden[a.estado] || 999) - (estadoOrden[b.estado] || 999);
      case 'estado-inactivo':
        const estadoOrdenInv = { 'INACTIVO': 1, 'LICENCIA': 2, 'VACACIONES': 3, 'ACTIVO': 4 };
        return (estadoOrdenInv[a.estado] || 999) - (estadoOrdenInv[b.estado] || 999);
      default:
        return 0;
    }
  });

  const getTipoIcon = (tipo) => {
    const icons = {
      'TIEMPO_COMPLETO': <Briefcase size={18} />,
      'MEDIO_TIEMPO': <Clock size={18} />,
      'TEMPORAL': <Calendar size={18} />,
      'HONORARIOS': <DollarSign size={18} />,
      'PRACTICANTE': <Award size={18} />
    };
    return icons[tipo] || <Briefcase size={18} />;
  };

  const handleOpenEditModal = (empleado) => {
    setPersonalSeleccionado(empleado);
    setFormData({
      codigo: empleado.codigo || '',
      nombres: empleado.nombres || '',
      apellidos: empleado.apellidos || '',
      numero_identidad: empleado.numero_identidad || '',
      tipo_contrato: empleado.tipo_contrato || 'TIEMPO_COMPLETO',
      estado: empleado.estado || 'ACTIVO',
      telefono: empleado.telefono || '',
      direccion_correo: empleado.direccion_correo || '',
      cargo: empleado.cargo_asignacion?.cargo || '',
      horario_preferido: empleado.cargo_asignacion?.horario_preferido || 'MATUTINO',
      fecha_asignacion: empleado.cargo_asignacion?.fecha_asignacion ? 
        new Date(empleado.cargo_asignacion.fecha_asignacion).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0],
      area_trabajo: empleado.area_trabajo || '',
      especialidades: empleado.especialidades?.join(', ') || '',
      salario: empleado.salario || '',
      fecha_ingreso: empleado.fecha_ingreso ? 
        new Date(empleado.fecha_ingreso).toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]
    });
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setPersonalSeleccionado(null);
    resetForm();
  };

  const formatearSalario = (salario) => {
    if (!salario) return '—';
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL'
    }).format(salario);
  };

  return (
    <>
      <div className="personal-container">
        {/* Header con estadísticas */}
        <motion.div 
          className="personal-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Sistema de Gestión de Personal</h2>
          <p>Administra tu equipo de trabajo de manera eficiente</p>

          {/* Tarjetas de estadísticas */}
          <div className="personal-stats">
            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Users size={24} />
              <div className="stat-info">
                <span className="stat-value">{totalPersonal}</span>
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
                <span className="stat-value">{personalActivo}</span>
                <span className="stat-label">Activos</span>
              </div>
            </motion.div>
            <motion.div 
              className="stat-card vacaciones"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Calendar size={24} />
              <div className="stat-info">
                <span className="stat-value">{personalVacaciones}</span>
                <span className="stat-label">Vacaciones</span>
              </div>
            </motion.div>
            <motion.div 
              className="stat-card licencia"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FileText size={24} />
              <div className="stat-info">
                <span className="stat-value">{personalLicencia}</span>
                <span className="stat-label">Licencia</span>
              </div>
            </motion.div>
          </div>

          <div className="personal-busqueda-bar">
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
                className="personal-busqueda"
                placeholder="Buscar por código, nombre, identidad, cargo, área o email..."
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
                      className={`filtro-opcion ${filtroOrden === 'salario-asc' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('salario-asc'); setMostrarMenuFiltros(false); }}
                    >
                      Salario menor-mayor
                    </div>
                    <div 
                      className={`filtro-opcion ${filtroOrden === 'salario-desc' ? 'active' : ''}`}
                      onClick={() => { setFiltroOrden('salario-desc'); setMostrarMenuFiltros(false); }}
                    >
                      Salario mayor-menor
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
              Nuevo Empleado
            </motion.button>
          </div>
        </motion.div>

        {/* UNA SOLA TABLA con TODO el personal */}
        <motion.div 
          className="personal-categoria-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.div 
            className="personal-categoria-header"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="personal-subtitulo">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Users size={20} />
              </motion.div>
              Personal ({personalOrdenado.length})
            </h3>
          </motion.div>

          {personalOrdenado.length === 0 ? (
            <motion.p 
              className="personal-vacio"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              No hay empleados registrados.
            </motion.p>
          ) : (
            <motion.div 
              className="tabla-personal"
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
                  gridTemplateColumns: '100px 1fr 200px 180px 150px 120px 100px 120px',
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
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Hash size={14} />
                  </motion.div>
                  CÓDIGO
                </div>
                <div>NOMBRE & APELLIDO</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Mail size={14} />
                  CONTACTO
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Briefcase size={14} />
                  CARGO
                </div>
                <div style={{ textAlign: 'center' }}>TIPO</div>
                <div style={{ textAlign: 'center' }}>SALARIO</div>
                <div style={{ textAlign: 'center' }}>ESTADO</div>
                <div style={{ textAlign: 'center' }}>ACCIONES</div>
              </motion.div>

              <div className="tabla-body">
                {personalOrdenado.map((empleado, index) => (
                  <motion.div
                    key={empleado._id}
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
                    onClick={() => handleOpenEditModal(empleado)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 200px 180px 150px 120px 100px 120px',
                      gap: '10px',
                      alignItems: 'center',
                      padding: '15px 20px',
                      background: 'white',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer'
                    }}
                  >
                    <motion.div 
                      style={{ 
                        fontWeight: 'bold', 
                        color: '#667eea',
                        fontSize: '0.95rem'
                      }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {empleado.codigo}
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
                        {empleado.nombres} {empleado.apellidos}
                      </motion.div>
                      {empleado.numero_identidad && (
                        <motion.div 
                          style={{ 
                            fontSize: '0.85rem',
                            color: '#666'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                        >
                          ID: {empleado.numero_identidad}
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
                        {empleado.direccion_correo}
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
                        {empleado.telefono}
                      </motion.div>
                    </div>

                    <motion.div 
                      style={{ fontSize: '0.9rem', color: '#555' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 + 0.25 }}
                    >
                      {empleado.cargo_asignacion?.cargo || '—'}
                      {empleado.area_trabajo && (
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '2px' }}>
                          {empleado.area_trabajo}
                        </div>
                      )}
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
                      {getTipoIcon(empleado.tipo_contrato)}
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        {empleado.tipo_contrato?.replace(/_/g, ' ')}
                      </span>
                    </motion.div>

                    <motion.div 
                      style={{ 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        color: '#4CAF50'
                      }}
                      whileHover={{ scale: 1.1, color: '#45a049' }}
                    >
                      {formatearSalario(empleado.salario)}
                    </motion.div>

                    <motion.div 
                      style={{ textAlign: 'center' }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className={`estado-badge ${empleado.estado?.toLowerCase()}`}>
                        {empleado.estado}
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
                          handleOpenEditModal(empleado);
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

      {/* Modal Crear Empleado */}
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
              style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <h3 className="modal-title">
                <Plus size={20} />
                Crear Nuevo Empleado
              </h3>
              <form onSubmit={handleCrearPersonal}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Código *</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      placeholder="EMP-001"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Identidad *</label>
                    <input
                      type="text"
                      value={formData.numero_identidad}
                      onChange={(e) => setFormData({...formData, numero_identidad: e.target.value})}
                      placeholder="0801-1990-12345"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombres *</label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                      placeholder="Juan Carlos"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Apellidos *</label>
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                      placeholder="Pérez López"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono *</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      placeholder="9876-5432"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.direccion_correo}
                      onChange={(e) => setFormData({...formData, direccion_correo: e.target.value})}
                      placeholder="empleado@empresa.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo *</label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      placeholder="Desarrollador Senior"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Área de Trabajo</label>
                    <input
                      type="text"
                      value={formData.area_trabajo}
                      onChange={(e) => setFormData({...formData, area_trabajo: e.target.value})}
                      placeholder="Tecnología"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tipo de Contrato *</label>
                    <select
                      value={formData.tipo_contrato}
                      onChange={(e) => setFormData({...formData, tipo_contrato: e.target.value})}
                      required
                    >
                      <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                      <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                      <option value="TEMPORAL">Temporal</option>
                      <option value="HONORARIOS">Honorarios</option>
                      <option value="PRACTICANTE">Practicante</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Horario Preferido</label>
                    <select
                      value={formData.horario_preferido}
                      onChange={(e) => setFormData({...formData, horario_preferido: e.target.value})}
                    >
                      <option value="MATUTINO">Matutino</option>
                      <option value="VESPERTINO">Vespertino</option>
                      <option value="NOCTURNO">Nocturno</option>
                      <option value="ROTATIVO">Rotativo</option>
                      <option value="FLEXIBLE">Flexible</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      required
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="VACACIONES">Vacaciones</option>
                      <option value="LICENCIA">Licencia</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salario</label>
                    <input
                      type="number"
                      value={formData.salario}
                      onChange={(e) => setFormData({...formData, salario: e.target.value})}
                      placeholder="15000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Asignación *</label>
                    <input
                      type="date"
                      value={formData.fecha_asignacion}
                      onChange={(e) => setFormData({...formData, fecha_asignacion: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Especialidades (separadas por comas)</label>
                    <input
                      type="text"
                      value={formData.especialidades}
                      onChange={(e) => setFormData({...formData, especialidades: e.target.value})}
                      placeholder="React, Node.js, MongoDB"
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
                    Guardar Empleado
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Empleado */}
      <AnimatePresence>
        {personalSeleccionado && (
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
                Editar Empleado
              </h3>
              <form onSubmit={handleEditarPersonal}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Código *</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Identidad *</label>
                    <input
                      type="text"
                      value={formData.numero_identidad}
                      onChange={(e) => setFormData({...formData, numero_identidad: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombres *</label>
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Apellidos *</label>
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
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
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.direccion_correo}
                      onChange={(e) => setFormData({...formData, direccion_correo: e.target.value})}
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
                    <label>Área de Trabajo</label>
                    <input
                      type="text"
                      value={formData.area_trabajo}
                      onChange={(e) => setFormData({...formData, area_trabajo: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tipo de Contrato *</label>
                    <select
                      value={formData.tipo_contrato}
                      onChange={(e) => setFormData({...formData, tipo_contrato: e.target.value})}
                      required
                    >
                      <option value="TIEMPO_COMPLETO">Tiempo Completo</option>
                      <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                      <option value="TEMPORAL">Temporal</option>
                      <option value="HONORARIOS">Honorarios</option>
                      <option value="PRACTICANTE">Practicante</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Horario Preferido</label>
                    <select
                      value={formData.horario_preferido}
                      onChange={(e) => setFormData({...formData, horario_preferido: e.target.value})}
                    >
                      <option value="MATUTINO">Matutino</option>
                      <option value="VESPERTINO">Vespertino</option>
                      <option value="NOCTURNO">Nocturno</option>
                      <option value="ROTATIVO">Rotativo</option>
                      <option value="FLEXIBLE">Flexible</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      required
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="VACACIONES">Vacaciones</option>
                      <option value="LICENCIA">Licencia</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salario</label>
                    <input
                      type="number"
                      value={formData.salario}
                      onChange={(e) => setFormData({...formData, salario: e.target.value})}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={formData.fecha_ingreso}
                      onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Asignación *</label>
                    <input
                      type="date"
                      value={formData.fecha_asignacion}
                      onChange={(e) => setFormData({...formData, fecha_asignacion: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Especialidades (separadas por comas)</label>
                    <input
                      type="text"
                      value={formData.especialidades}
                      onChange={(e) => setFormData({...formData, especialidades: e.target.value})}
                      placeholder="React, Node.js, MongoDB"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <motion.button 
                    type="button" 
                    className="btn-eliminar" 
                    onClick={handleEliminarPersonal}
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
                Guía de Uso - Sistema de Personal
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} />
                  Búsqueda
                </h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Busca por: código, nombre, identidad, cargo, área o email.</p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} />
                  Estados
                </h4>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <li><strong>🟢 ACTIVO:</strong> Personal trabajando normalmente</li>
                  <li><strong>🟡 VACACIONES:</strong> Personal en vacaciones</li>
                  <li><strong>🟠 LICENCIA:</strong> Personal con licencia</li>
                  <li><strong>🔴 INACTIVO:</strong> Personal retirado</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={16} />
                  Tipos de Contrato
                </h4>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <li><strong>TIEMPO COMPLETO:</strong> 40 horas semanales</li>
                  <li><strong>MEDIO TIEMPO:</strong> 20 horas semanales</li>
                  <li><strong>TEMPORAL:</strong> Tiempo definido</li>
                  <li><strong>HONORARIOS:</strong> Servicios profesionales</li>
                  <li><strong>PRACTICANTE:</strong> En formación</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✨ Funciones
                </h4>
                <ul style={{ marginLeft: '1rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <li>Clic en fila para ver/editar detalles</li>
                  <li>Búsqueda en tiempo real</li>
                  <li>Ordenar por nombre y salario</li>
                  <li>Vista organizada por estado</li>
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

export default Personal;