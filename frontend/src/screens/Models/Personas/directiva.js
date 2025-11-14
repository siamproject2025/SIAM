import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "../../../styles/Directiva.css";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";

import { 
  Users,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Hash,
  Search,
  HelpCircle,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Check,
  Award,
  Building,
  UserCheck,
  Clock,
  Shield,
  Download
} from 'lucide-react';

import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const API_URL = process.env.REACT_APP_API_URL+"/api/directiva";

const Directiva = () => {
  const [miembros, setMiembros] = useState([]);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtroOrden, setFiltroOrden] = useState('ninguno');
  const [mostrarMenuFiltros, setMostrarMenuFiltros] = useState(false);
  const [tabActivo, setTabActivo] = useState('info');
  
  // NUEVO ESTADO PARA EL MODAL DE DOCUMENTOS
  const [mostrarModalDocumentos, setMostrarModalDocumentos] = useState(false);
  const [documentoEditando, setDocumentoEditando] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    cargo: '',
    email: '',
    telefono: '',
    empresa: '',
    estado: 'activo',
    fecha_registro: new Date().toISOString().split('T')[0],
    notas: ''
  });

  const [documentoData, setDocumentoData] = useState({
    nombre_archivo: '',
    tipo_documento: 'acta',
    descripcion: '',
    archivo: null
  });

  // NUEVO ESTADO PARA DOCUMENTOS EN MODAL APARTE
  const [documentoModalData, setDocumentoModalData] = useState({
    nombre_archivo: '',
    tipo_documento: 'acta',
    descripcion: '',
    numero_sesion: '',
    archivo: null
  });

  const [historialData, setHistorialData] = useState({
    cargo: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  useEffect(() => {
    cargarMiembros();
  }, []);

const cargarMiembros = async () => {
  try {
    setLoading(true);
    loadingController.start();
    // Obtener token del usuario autenticado
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    // Hacer la petición con el token en Authorization
    const res = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Error al cargar miembros');

    const data = await res.json();
    setMiembros(Array.isArray(data.data) ? data.data : []);
  } catch (err) {
    console.error('Error al obtener los miembros:', err);
    showNotification('Error al cargar los miembros de la directiva', 'error');
    setMiembros([]);
  } finally {
    setLoading(false);
    loadingController.stop()
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
      fecha_registro: new Date().toISOString().split('T')[0],
      notas: ''
    });
  };

  // NUEVA FUNCIÓN PARA RESETEAR FORMULARIO DE DOCUMENTOS MODAL
  const resetDocumentoModalForm = () => {
    setDocumentoModalData({
      nombre_archivo: '',
      tipo_documento: 'acta',
      descripcion: '',
      numero_sesion: '',
      archivo: null
    });
    setDocumentoEditando(null);
  };

  const handleCrearMiembro = async (e) => {
  e.preventDefault();
  
  try {
    if (!formData.nombre.trim()) {
      showNotification('El nombre del miembro es obligatorio', 'error');
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
    if (!formData.telefono) {
      showNotification('El teléfono es obligatorio', 'error');
      return;
    }

    const datosMiembro = {
      ...formData,
      fecha_registro: new Date(formData.fecha_registro)
    };

    //  Obtener token del usuario autenticado
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }

    const token = await user.getIdToken();

    //  Enviar solicitud al backend con el token
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, //  Token agregado
      },
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
    loadingController.start();
    if (!formData.nombre.trim()) {
      showNotification('El nombre del miembro es obligatorio', 'error');
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
    if (!formData.telefono) {
      showNotification('El teléfono es obligatorio', 'error');
      return;
    }

    const datosActualizados = {
      ...formData,
      fecha_registro: new Date(formData.fecha_registro)
    };

    // Obtener token del usuario autenticado
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    // Enviar la solicitud con el token en headers
    const res = await fetch(`${API_URL}/${miembroSeleccionado._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
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
  }finally {
      loadingController.stop(); //  detiene el loader
    }
};


// Eliminar miembro

const [showConfirm, setShowConfirm] = useState(false);
const [miembroAEliminar, setMiembroAEliminar] = useState(null);

const prepararEliminacionMiembro = () => {
  if (!miembroSeleccionado) return;

  const miembro = miembros.find(m => m._id === miembroSeleccionado._id);
  if (!miembro) return;

  setMiembroAEliminar(miembro);
  setShowConfirm(true);
};

const confirmarEliminacionMiembro = async () => {
  setShowConfirm(false);
  if (!miembroAEliminar) return;

  try {
    loadingController.start();
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}/${miembroAEliminar._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al eliminar el miembro');
    }

    await cargarMiembros();
    setMiembroSeleccionado(null);
    resetForm();
    showNotification(`Miembro "${miembroAEliminar.nombre}" eliminado exitosamente`, 'success');
    setMiembroAEliminar(null);
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al eliminar el miembro', 'error');
  }finally {
      loadingController.stop(); //  detiene el loader
    }
};

const cancelarEliminacionMiembro = () => {
  setShowConfirm(false);
  setMiembroAEliminar(null);
};



// NUEVAS FUNCIONES PARA EL MODAL DE DOCUMENTOS CON MANEJO DE PDF
const handleAgregarDocumentoModal = async (e) => {
  e.preventDefault();
  if (!documentoModalData.nombre_archivo || !documentoModalData.tipo_documento) {
    showNotification('Nombre y tipo de documento son obligatorios', 'error');
    return;
  }

  try {
    loadingController.start();
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('nombre_archivo', documentoModalData.nombre_archivo);
    formData.append('tipo_documento', documentoModalData.tipo_documento);
    formData.append('descripcion', documentoModalData.descripcion || '');
    formData.append('numero_sesion', documentoModalData.numero_sesion || '');
    
    // AGREGAR CAMPOS REQUERIDOS TEMPORALES
    formData.append('driveFileId', 'temp_id_' + Date.now()); // ID temporal
    formData.append('driveViewLink', 'https://drive.google.com/file/d/temp/view'); // Enlace temporal
    formData.append('driveDownloadLink', 'https://drive.google.com/uc?export=download&id=temp'); // Enlace temporal
    formData.append('tamano_kb', '0'); // Tamaño temporal
    formData.append('nombre_archivo_original', documentoModalData.nombre_archivo);
    
    if (documentoModalData.archivo) {
      formData.append('archivo_pdf', documentoModalData.archivo);
    }

    const res = await fetch(`${API_URL}/${miembroSeleccionado._id}/documentos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al agregar documento');
    }

    showNotification('Documento agregado exitosamente', 'success');
    resetDocumentoModalForm();
    cargarMiembros();
    handleCloseModals();
  } catch (err) {
    console.error('Error detallado:', err);
    showNotification(err.message || 'Error al agregar documento', 'error');
  }finally {
      loadingController.stop(); //  detiene el loader
    }
};

const handleEditarDocumentoModal = async (e) => {
  e.preventDefault();
  if (!documentoModalData.nombre_archivo || !documentoModalData.tipo_documento) {
    showNotification('Nombre y tipo de documento son obligatorios', 'error');
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    // Crear FormData para la actualización
    const formData = new FormData();
    formData.append('documentoId', documentoEditando._id);
    formData.append('nombre_archivo', documentoModalData.nombre_archivo);
    formData.append('tipo_documento', documentoModalData.tipo_documento);
    formData.append('descripcion', documentoModalData.descripcion || '');
    formData.append('numero_sesion', documentoModalData.numero_sesion || '');
    
    if (documentoModalData.archivo) {
      formData.append('archivo_pdf', documentoModalData.archivo);
    }

    const res = await fetch(`${API_URL}/${miembroSeleccionado._id}/documentos/${documentoEditando._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al editar documento');
    }

    showNotification('Documento actualizado exitosamente', 'success');
    resetDocumentoModalForm();
    cargarMiembros();
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al editar documento', 'error');
  }
};

const handleEliminarDocumentoModal = async (documentoId) => {
  try {
    loadingController.start();
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}/${miembroSeleccionado._id}/documentos/${documentoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al eliminar documento');
    }

    showNotification('Documento eliminado exitosamente', 'success');
    cargarMiembros();
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al eliminar documento', 'error');
  }finally {
      loadingController.stop(); //  detiene el loader
    }
};

// FUNCIÓN PARA DESCARGAR DOCUMENTOS
const handleDescargarDocumento = async (documento) => {
  try {
    // Usar el enlace directo de descarga de Google Drive
    if (documento.driveDownloadLink) {
      // Abrir en nueva pestaña para descargar
      window.open(documento.driveDownloadLink, '_blank');
      showNotification('Descargando documento...', 'success');
    } else if (documento.driveViewLink) {
      // Si no hay enlace de descarga directa, abrir el visor
      window.open(documento.driveViewLink, '_blank');
      showNotification('Abriendo documento en Google Drive...', 'success');
    } else {
      showNotification('No se puede acceder al documento', 'error');
    }
  } catch (err) {
    console.error(err.message);
    showNotification('Error al descargar documento', 'error');
  }
};

const handleVerDocumento = async (documento) => {
  try {
    if (documento.driveViewLink) {
      window.open(documento.driveViewLink, '_blank');
      showNotification('Abriendo documento en Google Drive...', 'success');
    } else {
      showNotification('No se puede acceder al documento', 'error');
    }
  } catch (err) {
    console.error(err.message);
    showNotification('Error al abrir documento', 'error');
  }
};

  const handleOpenEditarDocumentoModal = (documento) => {
    setDocumentoEditando(documento);
    setDocumentoModalData({
      nombre_archivo: documento.nombre_archivo || '',
      tipo_documento: documento.tipo_documento || 'acta',
      descripcion: documento.descripcion || '',
      numero_sesion: documento.numero_sesion || '',
      archivo: null
    });
  };

  const handleAgregarHistorial = async (e) => {
  e.preventDefault();
  if (!historialData.cargo || !historialData.fecha_inicio) {
    showNotification('Cargo y fecha de inicio son obligatorios', 'error');
    return;
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      showNotification('No estás autenticado. Por favor inicia sesión.', 'error');
      return;
    }
    const token = await user.getIdToken();

    const miembroActual = miembros.find(m => m._id === miembroSeleccionado._id);
    const historialActualizado = [
      ...(miembroActual.historial_cargos || []),
      {
        ...historialData,
        fecha_inicio: new Date(historialData.fecha_inicio),
        fecha_fin: historialData.fecha_fin ? new Date(historialData.fecha_fin) : null
      }
    ];

    const res = await fetch(`${API_URL}/${miembroSeleccionado._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` //  Token agregado
      },
      body: JSON.stringify({
        historial_cargos: historialActualizado
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al agregar historial');
    }

    showNotification('Historial agregado exitosamente', 'success');
    setHistorialData({
      cargo: '',
      fecha_inicio: '',
      fecha_fin: ''
    });
    cargarMiembros();
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al agregar historial', 'error');
  }
};


  const miembrosFiltrados = miembros.filter(m => {
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      m.nombre?.toLowerCase().includes(terminoBusqueda) ||
      m.cargo?.toLowerCase().includes(terminoBusqueda) ||
      m.email?.toLowerCase().includes(terminoBusqueda) ||
      m.telefono?.toString().includes(terminoBusqueda) ||
      m.empresa?.toLowerCase().includes(terminoBusqueda)
    );
  });

  // Aplicar ordenamiento
  const miembrosOrdenados = [...miembrosFiltrados].sort((a, b) => {
    switch(filtroOrden) {
      case 'nombre-az':
        return (a.nombre || '').localeCompare(b.nombre || '');
      case 'nombre-za':
        return (b.nombre || '').localeCompare(a.nombre || '');
      case 'cargo-az':
        return (a.cargo || '').localeCompare(b.cargo || '');
      case 'estado-activo':
        const estadoOrden = { 'activo': 1, 'suspendido': 2, 'inactivo': 3 };
        return (estadoOrden[a.estado] || 999) - (estadoOrden[b.estado] || 999);
      case 'estado-inactivo':
        const estadoOrdenInv = { 'inactivo': 1, 'suspendido': 2, 'activo': 3 };
        return (estadoOrdenInv[a.estado] || 999) - (estadoOrdenInv[b.estado] || 999);
      default:
        return 0;
    }
  });

  const getTipoDocBadge = (tipo) => {
    const clases = {
      'acta': 'acta',
      'contrato': 'contrato',
      'informe': 'informe',
      'certificado': 'certificado',
      'nombramiento': 'nombramiento',
      'otro': 'otro'
    };
    return `tipo-doc-badge ${clases[tipo] || 'otro'}`;
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
      fecha_registro: miembro.fecha_registro ? new Date(miembro.fecha_registro).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notas: miembro.notas || ''
    });
    setTabActivo('info');
  };

  // NUEVA FUNCIÓN PARA ABRIR MODAL DE DOCUMENTOS
  const handleOpenDocumentosModal = (miembro) => {
    setMiembroSeleccionado(miembro);
    setMostrarModalDocumentos(true);
    resetDocumentoModalForm();
  };

  const handleCloseModals = () => {
    setMostrarModalCrear(false);
    setMiembroSeleccionado(null);
    resetForm();
    setTabActivo('info');
  };

  // NUEVA FUNCIÓN PARA CERRAR MODAL DE DOCUMENTOS
  const handleCloseDocumentosModal = () => {
    setMostrarModalDocumentos(false);
    setMiembroSeleccionado(null);
    resetDocumentoModalForm();
  };

  const renderTablaMiembros = (titulo, lista, icon) => (
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
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {icon}
          </motion.div>
          {titulo} ({lista.length})
        </h3>
      </motion.div>

      {lista.length === 0 ? (
        <motion.p 
          className="directiva-vacio"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          No hay miembros en esta categoría.
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
              gridTemplateColumns: '1.8fr 1.8fr 1.8fr 1.5fr 1.5fr 1.5fr 80px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <UserCheck size={14} />
              MIEMBRO
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
            <div style={{ textAlign: 'center' }}>DOCUMENTOS</div>
            <div style={{ textAlign: 'center' }}>ESTADO</div>
            <div style={{ textAlign: 'center' }}>ACCIONES</div>
          </motion.div>

          <div className="tabla-body">
            {lista.map((miembro, index) => (
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
                  gridTemplateColumns: '1.8fr 1.8fr 1.8fr 1.5fr 1.5fr 1.5fr 80px'
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
                  <motion.div 
                    style={{ 
                      fontSize: '0.85rem',
                      color: '#666'
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.3 }}
                  >
                    {miembro.email}
                  </motion.div>
                </div>

                <motion.div 
                  style={{ 
                    fontWeight: '600',
                    color: '#667eea',
                    fontSize: '0.9rem'
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {miembro.cargo}
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
                  style={{ fontSize: '0.9rem', color: '#555' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.25 }}
                >
                  {miembro.empresa || '-'}
                </motion.div>

                <motion.div 
                  style={{ textAlign: 'center' }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {miembro.documentos_pdf && miembro.documentos_pdf.length > 0 ? (
                    <span className="documentos-badge">
                      <FileText size={14} />
                      {miembro.documentos_pdf.length}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Sin docs</span>
                  )}
                </motion.div>

                <motion.div
                  style={{ display: 'flex', justifyContent: 'center' }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={`estado-badge ${miembro.estado.toLowerCase()}`}>
                    {miembro.estado}
                  </span>
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
                      handleOpenEditModal(miembro);
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
                  
                  {/* NUEVO BOTÓN PARA MODAL DE DOCUMENTOS */}
                  <motion.button
                    whileHover={{ 
                      scale: 1.2,
                      rotate: 15,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.9, rotate: -15 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDocumentosModal(miembro);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#10B981',
                      padding: '5px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Gestionar Documentos"
                  >
                    <FileText size={18} />
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
      <div className="directiva-container">
        {/* ENCABEZADO MEJORADO */}
        <motion.div 
          className="directiva-header"
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
                  <Users size={36} fill="white" color="white" />
                </motion.div>
                Gestión de Directiva
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  style={{ marginLeft: 'auto' }}
                >
                  <Award size={32} color="white" />
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
                Administra y gestiona los miembros de la directiva de manera eficiente
              </motion.p>

              <motion.div 
                className="directiva-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.div 
                  className="stat-card"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="stat-icon">
                    <Users size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{totalMiembros}</div>
                    <div className="stat-label">Total Miembros</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card active"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  <div className="stat-icon">
                    <UserCheck size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{miembrosActivos}</div>
                    <div className="stat-label">Miembros Activos</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card inactivo"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                  <div className="stat-icon">
                    <Clock size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{miembrosInactivos}</div>
                    <div className="stat-label">Miembros Inactivos</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-card suspendido"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
                >
                  <div className="stat-icon">
                    <Shield size={24} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{miembrosSuspendidos}</div>
                    <div className="stat-label">Miembros Suspendidos</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* BARRA DE BÚSQUEDA Y FILTROS */}
          <motion.div 
            className="directiva-busqueda-bar"
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
                className="directiva-busqueda"
                placeholder="Buscar por nombre, cargo, email, teléfono o empresa..."
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
                  <Briefcase size={18} />
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
                      className={`filtro-opcion ${filtroOrden === 'cargo-az' ? 'active' : ''}`}
                      onClick={() => {
                        setFiltroOrden('cargo-az');
                        setMostrarMenuFiltros(false);
                      }}
                    >
                       Cargo A-Z
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
              title="Crear nuevo miembro"
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
              Nuevo Miembro
            </motion.button>
          </motion.div>
        </motion.div>

        {/* CONTENIDO PRINCIPAL */}
        {loading && miembros.length === 0 ? (
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
              <Users size={40} color="#667eea" />
            </motion.div>
            <p style={{ color: '#667eea', fontWeight: '600' }}>Cargando miembros...</p>
          </motion.div>
        ) : (
          <motion.div 
            className="directiva-categorias-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {renderTablaMiembros("Todos los Miembros", miembrosOrdenados, <Users size={20} style={{ color: '#667eea' }} />)}
          </motion.div>
        )}
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
              style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }} 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <h3 className="modal-title">
                <Plus size={20} />
                Agregar Nuevo Miembro
              </h3>
              <form onSubmit={handleCrearMiembro}>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Nombre completo del miembro"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Cargo *</label>
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      placeholder="Cargo en la directiva"
                      required
                    />
                  </div>

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

                  <div className="form-group">
                    <label>Empresa</label>
                    <input
                      type="text"
                      value={formData.empresa}
                      onChange={(e) => setFormData({...formData, empresa: e.target.value})}
                      placeholder="Empresa que representa"
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha de Registro</label>
                    <input
                      type="date"
                      value={formData.fecha_registro}
                      onChange={(e) => setFormData({...formData, fecha_registro: e.target.value})}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Notas</label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({...formData, notas: e.target.value})}
                      placeholder="Notas adicionales..."
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
                    <Check size={16} />
                    Crear Miembro
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Editar Miembro */}
      <AnimatePresence>
        {miembroSeleccionado && !mostrarModalDocumentos && (
          <motion.div 
            className="modal-overlay" 
            onClick={handleCloseModals}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <h3 className="modal-title">
                <Edit size={20} />
                Editar Miembro: {miembroSeleccionado.nombre}
              </h3>

              {/* Tabs */}
              <div className="modal-tabs">
                <button 
                  className={`tab-button ${tabActivo === 'info' ? 'active' : ''}`}
                  onClick={() => setTabActivo('info')}
                >
                  <UserCheck size={16} />
                  Información General
                </button>
                <button 
                  className={`tab-button ${tabActivo === 'documentos' ? 'active' : ''}`}
                  onClick={() => setTabActivo('documentos')}
                >
                  <FileText size={16} />
                  Documentos
                </button>
                
              </div>

              {tabActivo === 'info' && (
                <form onSubmit={handleEditarMiembro}>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Nombre Completo *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group full-width">
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
                      <label>Estado</label>
                      <select
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="suspendido">Suspendido</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Fecha de Registro</label>
                      <input
                        type="date"
                        value={formData.fecha_registro}
                        onChange={(e) => setFormData({...formData, fecha_registro: e.target.value})}
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
  onClick={prepararEliminacionMiembro}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <Trash2 size={16} />
  Eliminar
</motion.button>
{showConfirm && (
  <ConfirmDialog
    message={`¿Seguro que deseas eliminar al miembro "${miembroAEliminar?.nombre}"?`}
    onConfirm={confirmarEliminacionMiembro}
    onCancel={cancelarEliminacionMiembro}
    visible={showConfirm}
  />
)}


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
              )}
              {tabActivo === 'documentos' && (
  <div>
    <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Documentos del Miembro</h4>
    
    {miembroSeleccionado.documentos_pdf && miembroSeleccionado.documentos_pdf.length > 0 ? (
      <div style={{ marginBottom: '2rem' }}>
        {miembroSeleccionado.documentos_pdf.map((doc, index) => (
          <div key={index} style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '0.5rem',
            background: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span className={getTipoDocBadge(doc.tipo_documento)}>
                  {doc.tipo_documento}
                </span>
                <strong style={{ marginLeft: '0.5rem' }}>{doc.nombre_archivo}</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {new Date(doc.fecha_subida).toLocaleDateString()} • {doc.tamano_kb} KB
              </div>
              {doc.descripcion && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                  {doc.descripcion}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleVerDocumento(doc)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#3B82F6',
                  padding: '4px'
                }}
                title="Ver documento"
              >
                <FileText size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDescargarDocumento(doc)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#10B981',
                  padding: '4px'
                }}
                title="Descargar documento"
              >
                <Download size={16} />
              </motion.button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
        No hay documentos registrados
      </p>
    )}

    <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Agregar Nuevo Documento</h4>
    <form onSubmit={handleAgregarDocumentoModal}>
      <div className="form-grid">
        <div className="form-group">
          <label>Nombre del Archivo *</label>
          <input
            type="text"
            value={documentoModalData.nombre_archivo}
            onChange={(e) => setDocumentoModalData({...documentoModalData, nombre_archivo: e.target.value})} 
            placeholder="Nombre del documento"
            required
          />
        </div>

        <div className="form-group">
          <label>Tipo de Documento *</label>
          <select
            value={documentoModalData.tipo_documento} 
            onChange={(e) => setDocumentoModalData({...documentoModalData, tipo_documento: e.target.value})} 
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

        <div className="form-group full-width">
          <label>Descripción</label>
          <textarea
            value={documentoModalData.descripcion} 
            onChange={(e) => setDocumentoModalData({...documentoModalData, descripcion: e.target.value})}
            placeholder="Descripción del documento..."
            rows="2"
          />
        </div>

        <div className="form-group full-width">
          <label>Archivo PDF</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setDocumentoModalData({...documentoModalData, archivo: e.target.files[0]})} 
          />
        </div>
      </div>

      <div className="modal-actions">
        <motion.button 
          type="submit" 
          className="btn-guardar"
         
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={16} />
          Agregar Documento
        </motion.button>
      </div>
    </form>
  </div>
)}
              
              {tabActivo === 'historial' && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Historial de Cargos</h4>
                  
                  {miembroSeleccionado.historial_cargos && miembroSeleccionado.historial_cargos.length > 0 ? (
                    <div style={{ marginBottom: '2rem' }}>
                      {miembroSeleccionado.historial_cargos.map((historial, index) => (
                        <div key={index} style={{
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          background: '#f9fafb'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong>{historial.cargo}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                              {new Date(historial.fecha_inicio).toLocaleDateString()} - 
                              {historial.fecha_fin ? new Date(historial.fecha_fin).toLocaleDateString() : 'Actual'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                      No hay historial de cargos registrado
                    </p>
                  )}

                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Agregar al Historial</h4>
                  <form onSubmit={handleAgregarHistorial}>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Cargo *</label>
                        <input
                          type="text"
                          value={historialData.cargo}
                          onChange={(e) => setHistorialData({...historialData, cargo: e.target.value})}
                          placeholder="Nombre del cargo"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Fecha de Inicio *</label>
                        <input
                          type="date"
                          value={historialData.fecha_inicio}
                          onChange={(e) => setHistorialData({...historialData, fecha_inicio: e.target.value})}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Fecha de Fin</label>
                        <input
                          type="date"
                          value={historialData.fecha_fin}
                          onChange={(e) => setHistorialData({...historialData, fecha_fin: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="modal-actions">
                      <motion.button 
                        type="submit" 
                        className="btn-guardar"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus size={16} />
                        Agregar al Historial
                      </motion.button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

  
     {/* NUEVO MODAL PARA GESTIÓN DE DOCUMENTOS */}
<AnimatePresence>
  {mostrarModalDocumentos && miembroSeleccionado && (
    <motion.div className="modal-overlay" onClick={handleCloseDocumentosModal}>
      <motion.div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}>
        <h3 className="modal-title">
          <FileText size={20} />
          Gestión de Documentos - {miembroSeleccionado.nombre}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Lista de Documentos Existentes */}
          <div>
            <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Documentos Existentes</h4>
            
            {miembroSeleccionado.documentos_pdf && miembroSeleccionado.documentos_pdf.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {miembroSeleccionado.documentos_pdf.map((doc, index) => (
                  <motion.div 
                    key={doc._id || index}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      background: '#f9fafb',
                      position: 'relative'
                    }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span className={getTipoDocBadge(doc.tipo_documento)}>
                            {doc.tipo_documento}
                          </span>
                          <strong style={{ marginLeft: '0.5rem', fontSize: '1rem' }}>
                            {doc.nombre_archivo}
                          </strong>
                        </div>
                        {doc.numero_sesion && (
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            <strong>Sesión:</strong> {doc.numero_sesion}
                          </div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          {new Date(doc.fecha_subida).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      {/* AQUÍ VA EL FRAGMENTO DE LOS BOTONES */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleVerDocumento(doc)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#3B82F6',
                            padding: '4px'
                          }}
                          title="Ver documento en Google Drive"
                        >
                          <FileText size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDescargarDocumento(doc)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#10B981',
                            padding: '4px'
                          }}
                          title="Descargar documento"
                        >
                          <Download size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenEditarDocumentoModal(doc)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#F59E0B',
                            padding: '4px'
                          }}
                          title="Editar documento"
                        >
                          <Edit size={16} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEliminarDocumentoModal(doc._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444',
                            padding: '4px'
                          }}
                          title="Eliminar documento"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                      {/* FIN DEL FRAGMENTO */}
                      
                    </div>
                    {doc.descripcion && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.4' }}>
                        {doc.descripcion}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                No hay documentos registrados
              </p>
            )}
          </div>

          {/* Formulario para Agregar/Editar Documentos */}
          <div>
            {/* ... formulario permanece igual ... */}
          </div>
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
          <div className="horarios-modal-overlay horarios-modal-show">
            <div className="horarios-modal-content">
              <div className="horarios-modal-header">
                <h3 className="horarios-modal-title">
                  <HelpCircle size={24} />
                  Ayuda - Gestión de Directiva
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
                  <h4 className="horarios-help-title">¿Cómo funciona el sistema de directiva?</h4>
                  <p className="horarios-help-text">
                    El módulo de directiva te permite gestionar los miembros de la directiva, 
                    asignando cargos, contactos y documentación relevante para cada miembro.
                  </p>
                </div>

                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Funcionalidades principales:</h4>
                  <ul className="horarios-help-list">
                    <li className="horarios-help-item">
                      <strong>Búsqueda y filtros:</strong> Encuentra miembros por nombre, cargo, email, teléfono o empresa
                    </li>
                    <li className="horarios-help-item">
                      <strong>Gestión de miembros:</strong> Crea, edita y elimina miembros de la directiva
                    </li>
                    <li className="horarios-help-item">
                      <strong>Estados de miembros:</strong> Controla el estado (Activo, Inactivo, Suspendido) de cada miembro
                    </li>
                    <li className="horarios-help-item">
                      <strong>Gestión de documentos:</strong> Adjunta documentos PDF como actas, contratos, informes, etc.
                    </li>
                    <li className="horarios-help-item">
                      <strong>Historial de cargos:</strong> Registra el historial de cargos que ha ocupado cada miembro
                    </li>
                  </ul>
                </div>

                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Estados de miembros:</h4>
                  <div className="horarios-icons-grid">
                    <div className="horarios-icon-item">
                      <UserCheck size={16} className="horarios-icon-success" />
                      <span>Activo - Miembro activo en funciones</span>
                    </div>
                    <div className="horarios-icon-item">
                      <Clock size={16} className="horarios-icon-warning" />
                      <span>Inactivo - Miembro inactivo temporalmente</span>
                    </div>
                    <div className="horarios-icon-item">
                      <Shield size={16} className="horarios-icon-danger" />
                      <span>Suspendido - Miembro suspendido de funciones</span>
                    </div>
                  </div>
                </div>

                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Tipos de documentos:</h4>
                  <div className="horarios-icons-grid">
                    <div className="horarios-icon-item">
                      <FileText size={16} className="horarios-icon-primary" />
                      <span>Actas - Documentos oficiales de reuniones</span>
                    </div>
                    <div className="horarios-icon-item">
                      <FileText size={16} className="horarios-icon-info" />
                      <span>Contratos - Acuerdos y contratos firmados</span>
                    </div>
                    <div className="horarios-icon-item">
                      <FileText size={16} className="horarios-icon-success" />
                      <span>Informes - Reportes y evaluaciones</span>
                    </div>
                    <div className="horarios-icon-item">
                      <FileText size={16} className="horarios-icon-warning" />
                      <span>Certificados - Certificaciones y acreditaciones</span>
                    </div>
                    <div className="horarios-icon-item">
                      <FileText size={16} className="horarios-icon-new" />
                      <span>Nombramientos - Documentos de designación</span>
                    </div>
                  </div>
                </div>

                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Iconos y acciones:</h4>
                  <div className="horarios-icons-grid">
                    <div className="horarios-icon-item">
                      <Edit size={16} className="horarios-icon-primary" />
                      <span>Editar información del miembro</span>
                    </div>
                    <div className="horarios-icon-item">
                      <FileText size={16} className="horarios-icon-success" />
                      <span>Gestionar documentos del miembro</span>
                    </div>
                    <div className="horarios-icon-item">
                      <Trash2 size={16} className="horarios-icon-danger" />
                      <span>Eliminar miembro</span>
                    </div>
                    <div className="horarios-icon-item">
                      <Download size={16} className="horarios-icon-info" />
                      <span>Descargar documento</span>
                    </div>
                    <div className="horarios-icon-item">
                      <Plus size={16} className="horarios-icon-new" />
                      <span>Nuevo miembro</span>
                    </div>
                  </div>
                </div>

                <div className="horarios-help-section">
                  <h4 className="horarios-help-title">Consejos de uso:</h4>
                  <div className="horarios-tips">
                    <div className="horarios-tip">
                      <span className="horarios-tip-badge"></span>
                      <span>Usa la búsqueda para encontrar miembros rápidamente por cualquier campo</span>
                    </div>
                    <div className="horarios-tip">
                      <span className="horarios-tip-badge"></span>
                      <span>Gestiona los documentos desde el icono de "FileText" en cada miembro</span>
                    </div>
                    <div className="horarios-tip">
                      <span className="horarios-tip-badge"></span>
                      <span>Revisa las estadísticas en el encabezado para un resumen rápido del estado de la directiva</span>
                    </div>
                    <div className="horarios-tip">
                      <span className="horarios-tip-badge"></span>
                      <span>Actualiza regularmente los estados de los miembros según su situación actual</span>
                    </div>
                    <div className="horarios-tip">
                      <span className="horarios-tip-badge"></span>
                      <span>Guarda documentos importantes como actas y contratos para mantener un registro histórico</span>
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
    </>
  );
};

export default Directiva;