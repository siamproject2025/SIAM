import '../../../styles/CreacionRol/CrearRol.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../../../components/authentication/Auth";
import { motion } from 'framer-motion';
import { 
  FaEdit, FaShieldAlt, FaSearch, FaEraser, FaPlus, FaUsersCog, 
  FaChevronDown, FaTimes, FaArrowLeft, FaUserShield, FaBook, 
  FaUserFriends, FaChartLine
} from "react-icons/fa";
import { MdDelete, MdAdminPanelSettings, MdSecurity } from "react-icons/md";
import { RiShieldUserLine, RiArrowLeftSLine } from "react-icons/ri";
import WithPermission from '../../../components/Permisos/WithPermission';

// Configuración de API
const API_HOST = process.env.REACT_APP_API_URL;
const API_ROLES = `${API_HOST}/api/roles`;

// Hook para obtener token
const useAuth = () => {
  const getToken = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      return await user.getIdToken();
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  };
  
  return { getToken };
};

function App() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedRol, setSelectedRol] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('crear');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [expandedCard, setExpandedCard] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: ''
  });

  const { getToken } = useAuth();

  // Mostrar notificación
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  // Cargar roles desde la API
  const cargarRoles = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No se pudo obtener el token de autenticación');

      const response = await fetch(API_ROLES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      showNotification('Error al cargar los roles: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  // Función para regresar a Asignar Roles
  const irAAsignarRoles = () => {
    navigate('/seguridad');
  };

  // Grupos de permisos para la visualización
  const gruposPermisos = {
    COMPRAS: ['VISUALIZAR_COMPRAS', 'CREAR_COMPRAS', 'ACTUALIZAR_COMPRAS', 'ELIMINAR_COMPRAS'],
    PROVEEDORES: ['VISUALIZAR_PROVEEDORES', 'CREAR_PROVEEDORES', 'ACTUALIZAR_PROVEEDORES', 'ELIMINAR_PROVEEDORES'],
    DONACIONES: ['VISUALIZAR_DONACIONES', 'CREAR_DONACIONES', 'ACTUALIZAR_DONACIONES', 'ELIMINAR_DONACIONES'],
    BIENES: ['VISUALIZAR_BIENES', 'CREAR_BIENES', 'ACTUALIZAR_BIENES', 'ELIMINAR_BIENES'],
    DIRECTIVA: ['VISUALIZAR_DIRECTIVA', 'CREAR_DIRECTIVA', 'ACTUALIZAR_DIRECTIVA', 'ELIMINAR_DIRECTIVA'],
    PERSONAL: ['VISUALIZAR_PERSONAL', 'CREAR_PERSONAL', 'ACTUALIZAR_PERSONAL', 'ELIMINAR_PERSONAL'],
    GESTION_DE_USUARIOS: ['VISUALIZAR_SEGURIDAD', 'CREAR_SEGURIDAD', 'ACTUALIZAR_SEGURIDAD', 'ELIMINAR_SEGURIDAD'],
    AUDITORIA: ['VISUALIZAR_AUDITORIA', 'CREAR_AUDITORIA', 'ACTUALIZAR_AUDITORIA', 'ELIMINAR_AUDITORIA'],
    BIBLIOTECA: ['VISUALIZAR_BIBLIOTECA', 'CREAR_BIBLIOTECA', 'ACTUALIZAR_BIBLIOTECA', 'ELIMINAR_BIBLIOTECA'],
    CALENDARIO: ['VISUALIZAR_CALENDARIO', 'CREAR_CALENDARIO', 'ACTUALIZAR_CALENDARIO', 'ELIMINAR_CALENDARIO'],
    ACTIVIDADES: ['VISUALIZAR_ACTIVIDADES', 'CREAR_ACTIVIDADES', 'ACTUALIZAR_ACTIVIDADES', 'ELIMINAR_ACTIVIDADES'],
    GRADOS: ['VISUALIZAR_GRADOS', 'CREAR_GRADOS', 'ACTUALIZAR_GRADOS', 'ELIMINAR_GRADOS'],
    HORARIOS: ['VISUALIZAR_HORARIOS', 'CREAR_HORARIOS', 'ACTUALIZAR_HORARIOS', 'ELIMINAR_HORARIOS'],
    MATRICULA: ['VISUALIZAR_MATRICULA', 'CREAR_MATRICULA', 'ACTUALIZAR_MATRICULA', 'ELIMINAR_MATRICULA'],
    DASHBOARD: ['VISUALIZAR_DASHBOARD'],
    ROLES: ['VISUALIZAR_ROLES','CREAR_ROLES','ACTUALIZAR_ROLES', 'ELIMINAR_ROLES'],
    SOLICITUDES: ['VISUALIZAR_SOLICITUDES','CREAR_SOLICITUDES','ACTUALIZAR_SOLICITUDES', 'ELIMINAR_SOLICITUDES']
  };

  // Función para agrupar permisos por módulo para visualización
  const agruparPermisosPorModulo = (permisos) => {
    const grupos = {};
    
    permisos.forEach(permiso => {
      const partes = permiso.split('_');
      const modulo = partes.slice(1).join('_');
      const accion = partes[0];
      
      if (!grupos[modulo]) {
        grupos[modulo] = [];
      }
      grupos[modulo].push(accion);
    });
    
    return grupos;
  };

  // Función para obtener resumen de permisos
  const obtenerResumenPermisos = (permisos) => {
    const modulos = new Set();
    permisos.forEach(permiso => {
      const partes = permiso.split('_');
      const modulo = partes.slice(1).join(' ');
      modulos.add(modulo);
    });
    return Array.from(modulos).slice(0, 3);
  };

  const handleEditarRol = (rol) => {
    setSelectedRol(rol);
    setModalMode('editar');
    setShowModal(true);
  };

  const handleEliminarRol = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este rol?')) return;
    
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No se pudo obtener el token de autenticación');

      const response = await fetch(`${API_ROLES}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      await cargarRoles();
      showNotification('Rol eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error al eliminar rol:', error);
      showNotification('Error al eliminar el rol: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarRol = async (rolData) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No se pudo obtener el token de autenticación');

      const idLimpio = rolData._id.toUpperCase().replace(/\s+/g, '_');
      const datosParaGuardar = { ...rolData, _id: idLimpio };

      let response;
      if (modalMode === 'crear') {
        response = await fetch(API_ROLES, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosParaGuardar)
        });
      } else {
        response = await fetch(`${API_ROLES}/${selectedRol._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosParaGuardar)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      await cargarRoles();
      setShowModal(false);
      setSelectedRol(null);
      showNotification(
        modalMode === 'crear' ? 'Rol creado exitosamente' : 'Rol actualizado exitosamente', 
        'success'
      );
    } catch (error) {
      console.error('Error al guardar rol:', error);
      showNotification('Error al guardar el rol: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandCard = (rolId) => {
    setExpandedCard(expandedCard === rolId ? null : rolId);
  };

  const filtrarRoles = () => {
    return roles.filter(rol => {
      if (filtros.busqueda && !rol.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const rolesFiltrados = filtrarRoles();

  return (
    <div className="rols-css-app">
      {/* Notificación */}
      {notification.show && (
        <div className={`rols-css-notification rols-css-notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="rols-css-header">
        <div className="rols-css-header-top">
          
          <div className="rols-css-header-title-container">
           
            <h1>
              <FaShieldAlt className="rols-css-header-icon" />
              Gestión de Roles y Permisos
              
            </h1>
            <RiShieldUserLine className="rols-css-header-secondary-icon" />

            <motion.button
            className="rols-css-btn-back"
            onClick={irAAsignarRoles}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Ir a Asignar Roles"
          >
            <RiArrowLeftSLine className="rols-css-back-icon" />
            <span>Asignar Roles</span>
          </motion.button>
          
          </div>
        </div>
        
        <p className="rols-css-header-subtitle">
          <MdSecurity className="rols-css-subtitle-icon" />
          Crea, edita y administra los roles y permisos del sistema
        </p>
      </div>

      <div className="rols-css-filtros-container">
        <div className="rols-css-filtros-grid">
          <div className="rols-css-filtro-item">
            <FaSearch className="rols-css-filtro-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de rol"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
            />
          </div>
        </div>

        <div className="rols-css-filtros-actions">
          <button 
            className="rols-css-btn rols-css-btn-outline" 
            onClick={() => setFiltros({busqueda: ''})}
            disabled={loading}
          >
            <FaEraser /> Limpiar Filtros
          </button>
          <WithPermission requiredPermissions={["CREAR_ROLES"]}>
          <button 
            className="rols-css-btn rols-css-btn-primary" 
            onClick={() => {
              setModalMode('crear');
              setSelectedRol(null);
              setShowModal(true);
            }}
            disabled={loading}
          >
            <FaPlus /> Nuevo Rol
          </button>
          </WithPermission>
        </div>
      </div>

      <div className="rols-css-roles-header">
        <h3>
          <FaUsersCog /> Roles del Sistema ({rolesFiltrados.length})
        </h3>
        {loading && <div className="rols-css-loading">Cargando...</div>}
      </div>

      <div className="rols-css-roles-grid">
        {rolesFiltrados.map(rol => {
          const permisosAgrupados = agruparPermisosPorModulo(rol.permisos);
          const totalPermisos = rol.permisos.length;
          const resumenModulos = obtenerResumenPermisos(rol.permisos);
          const isExpanded = expandedCard === rol._id;
          
          return (
            <div key={rol._id} className="rols-css-rol-card">
              <div className="rols-css-rol-card-header">
                <div className="rols-css-rol-info">
                  <h4>{rol.nombre}</h4>
                  <span className="rols-css-rol-id">{rol._id}</span>
                </div>
                <div className="rols-css-rol-actions">
                  <WithPermission requiredPermissions={["ACTUALIZAR_ROLES"]}>
                  <button 
                    className="rols-css-btn-icon" 
                    onClick={() => handleEditarRol(rol)}
                    disabled={loading}
                    type="button"
                    title="Editar rol"
                  >
                    <FaEdit />
                  </button>
                  </WithPermission>
                  <WithPermission requiredPermissions={["ELIMINAR_ROLES"]}>
                  <button 
                    className="rols-css-btn-icon rols-css-btn-icon-delete" 
                    onClick={() => handleEliminarRol(rol._id)}
                    disabled={loading}
                    type="button"
                    title="Eliminar rol"
                  >
                    <MdDelete />
                  </button>
                  </WithPermission>
                </div>
              </div>
              
              <p className="rols-css-rol-descripcion">{rol.descripcion || 'Sin descripción'}</p>
              
              {/* Resumen de permisos */}
              <div className="rols-css-rol-resumen" onClick={() => toggleExpandCard(rol._id)}>
                <div className="rols-css-resumen-header">
                  <span className="rols-css-resumen-titulo">
                    <FaShieldAlt /> {totalPermisos} permisos
                  </span>
                  <span className="rols-css-resumen-modulos">
                    {resumenModulos.map((mod, idx) => (
                      <span key={idx} className="rols-css-modulo-resumen">{mod}</span>
                    ))}
                    {resumenModulos.length < totalPermisos && <span className="rols-css-modulo-resumen-mas">...</span>}
                  </span>
                  <span className={`rols-css-expand-icon ${isExpanded ? 'rols-css-expanded' : ''}`}>
                    <FaChevronDown />
                  </span>
                </div>
              </div>

              {/* Permisos detallados (expandible) */}
              {isExpanded && (
                <div className="rols-css-rol-permisos-detallados">
                  <h5>Permisos detallados:</h5>
                  {Object.entries(permisosAgrupados).map(([modulo, acciones]) => (
                    <div key={modulo} className="rols-css-modulo-permisos">
                      <span className="rols-css-modulo-nombre">{modulo}</span>
                      <div className="rols-css-acciones-container">
                        {acciones.includes('VISUALIZAR') && (
                          <span className="rols-css-accion-badge rols-css-accion-ver">Ver</span>
                        )}
                        {acciones.includes('CREAR') && (
                          <span className="rols-css-accion-badge rols-css-accion-crear">Crear</span>
                        )}
                        {acciones.includes('ACTUALIZAR') && (
                          <span className="rols-css-accion-badge rols-css-accion-actualizar">Actualizar</span>
                        )}
                        {acciones.includes('ELIMINAR') && (
                          <span className="rols-css-accion-badge rols-css-accion-eliminar">Eliminar</span>
                        )}
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
          onClose={() => setShowModal(false)}
          onSave={handleGuardarRol}
          gruposPermisos={gruposPermisos}
          loading={loading}
        />
      )}
    </div>
  );
}

function ModalRol({ mode, rol, onClose, onSave, gruposPermisos, loading }) {
  const [formData, setFormData] = useState({
    _id: '',
    nombre: '',
    descripcion: '',
    permisos: []
  });

  const [idError, setIdError] = useState('');

  // Importar iconos para las categorías
  const categoriaIconos = {
    'Operativo': <FaUsersCog size={18} />,
    'Académico': <FaBook size={18} />,
    'Recursos Humanos': <FaUserFriends size={18} />,
    'Seguridad': <MdSecurity size={18} />,
    'Global/Dashboard': <FaChartLine size={18} />
  };

  // Nueva estructura de agrupación de módulos con sus respectivos permisos
  const gruposAgrupados = {
    'Operativo': {
      icon: <FaUsersCog />,
      modulos: ['DONACIONES','BIENES', 'PROVEEDORES', 'COMPRAS' ]
    },
    'Académico': {
      icon: <FaBook />,
      modulos: ['MATRICULA', 'HORARIOS', 'BIBLIOTECA', 'ACTIVIDADES', 'CALENDARIO', 'GRADOS']
    },
    'Recursos Humanos': {
      icon: <FaUserFriends />,
      modulos: ['PERSONAL', 'DIRECTIVA']
    },
    'Seguridad': {
      icon: <MdSecurity />,
      modulos: ['GESTION_DE_USUARIOS', 'AUDITORIA', 'ROLES', 'SOLICITUDES']
    },
    'Global/Dashboard': {
      icon: <FaChartLine />,
      modulos: ['DASHBOARD']
    }
  };

  useEffect(() => {
    if (rol) {
      setFormData({
        _id: rol._id || '',
        nombre: rol.nombre || '',
        descripcion: rol.descripcion || '',
        permisos: rol.permisos || []
      });
    } else {
      setFormData({
        _id: '',
        nombre: '',
        descripcion: '',
        permisos: []
      });
    }
  }, [rol]);

  const handleIdChange = (e) => {
    const valor = e.target.value;
    const valorLimpio = valor.toUpperCase().replace(/[^A-Z_]/g, '');
    setFormData({...formData, _id: valorLimpio});
    
    if (valor !== valorLimpio) {
      setIdError('Solo se permiten mayúsculas y guiones bajos');
    } else {
      setIdError('');
    }
  };

  const handleTogglePermiso = (permiso) => {
    setFormData(prev => ({
      ...prev,
      permisos: prev.permisos.includes(permiso)
        ? prev.permisos.filter(p => p !== permiso)
        : [...prev.permisos, permiso]
    }));
  };

  const handleToggleGrupo = (permisos) => {
    setFormData(prev => {
      const todosSeleccionados = permisos.every(p => prev.permisos.includes(p));
      
      return {
        ...prev,
        permisos: todosSeleccionados
          ? prev.permisos.filter(p => !permisos.includes(p))
          : [...new Set([...prev.permisos, ...permisos])]
      };
    });
  };

  const handleToggleModulo = (moduloPermisos) => {
    setFormData(prev => {
      const todosSeleccionados = moduloPermisos.every(p => prev.permisos.includes(p));
      
      return {
        ...prev,
        permisos: todosSeleccionados
          ? prev.permisos.filter(p => !moduloPermisos.includes(p))
          : [...new Set([...prev.permisos, ...moduloPermisos])]
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData._id.match(/^[A-Z_]+$/)) {
      setIdError('El ID solo puede contener mayúsculas y guiones bajos');
      return;
    }
    
    if (!formData.nombre.trim()) {
      alert('El nombre del rol es requerido');
      return;
    }
    
    onSave(formData);
  };

  const handleClose = (e) => {
    e.preventDefault();
    onClose();
  };

  // Función para obtener todos los permisos de un grupo de módulos
  const obtenerPermisosDelGrupo = (modulos) => {
    let permisos = [];
    modulos.forEach(modulo => {
      if (gruposPermisos[modulo]) {
        permisos = [...permisos, ...gruposPermisos[modulo]];
      }
    });
    return permisos;
  };

  return (
    <div className="rols-css-modal-overlay" onClick={handleClose}>
      <div className="rols-css-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="rols-css-modal-header">
          <h3>{mode === 'crear' ? 'Crear Nuevo Rol' : 'Editar Rol'}</h3>
          <button 
            className="rols-css-btn-icon" 
            onClick={handleClose}
            type="button"
            disabled={loading}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rols-css-form-group">
            <label>Nombre del rol</label>
            <input
              type="text"
              className={`rols-css-form-control ${idError ? 'rols-css-form-control-error' : ''}`}
              value={formData._id}
              onChange={handleIdChange}
              placeholder="EJEMPLO: ADMIN, COMPRAS, RRHH"
              required
              disabled={mode === 'editar' || loading}
            />
            {idError && <small className="rols-css-error-message">{idError}</small>}
            <small>Solo mayúsculas y guiones bajos (NO espacios, NO números, NO símbolos)</small>
          </div>

          <div className="rols-css-form-group">
            <label>Etiqueta</label>
            <input
              type="text"
              className="rols-css-form-control"
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              placeholder="Ej: Administrador, Gestor de Compras"
              required
              disabled={loading}
            />
          </div>

          <div className="rols-css-form-group">
            <label>Descripción</label>
            <textarea
              className="rols-css-form-control"
              value={formData.descripcion}
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              rows="2"
              placeholder="Breve descripción del rol..."
              disabled={loading}
            />
          </div>

          <div className="rols-css-form-group">
            <label>Permisos</label>
            <div className="rols-css-permisos-container">
              {Object.entries(gruposAgrupados).map(([categoria, { icon, modulos }]) => {
                const permisosDelGrupo = obtenerPermisosDelGrupo(modulos);
                const todosSeleccionados = permisosDelGrupo.length > 0 && 
                  permisosDelGrupo.every(p => formData.permisos.includes(p));
                
                return (
                  <div key={categoria} className="rols-css-categoria-permisos">
                    <div className="rols-css-categoria-header">
                      <label className="rols-css-checkbox-label-categoria">
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          onChange={() => handleToggleGrupo(permisosDelGrupo)}
                          disabled={loading}
                        />
                        <span className="rols-css-categoria-icon">{icon}</span>
                        <strong>{categoria}</strong>
                      </label>
                    </div>
                    
                    <div className="rols-css-modulos-container">
                      {modulos.map(modulo => {
                        const permisosModulo = gruposPermisos[modulo];
                        if (!permisosModulo) return null;
                        
                        const todosModuloSeleccionados = permisosModulo.every(p => 
                          formData.permisos.includes(p)
                        );
                        
                        return (
                          <div key={modulo} className="rols-css-modulo-permisos-grupo">
                            <div className="rols-css-modulo-header">
                              <label className="rols-css-checkbox-label-modulo">
                                <input
                                  type="checkbox"
                                  checked={todosModuloSeleccionados}
                                  onChange={() => handleToggleModulo(permisosModulo)}
                                  disabled={loading}
                                />
                                <span className="rols-css-modulo-titulo">{modulo}</span>
                              </label>
                            </div>
                            <div className="rols-css-permisos-grid">
                              {permisosModulo.map(permiso => {
                                const accion = permiso.split('_')[0];
                                return (
                                  <label key={permiso} className="rols-css-checkbox-label">
                                    <input
                                      type="checkbox"
                                      checked={formData.permisos.includes(permiso)}
                                      onChange={() => handleTogglePermiso(permiso)}
                                      disabled={loading}
                                    />
                                    <span className={`rols-css-permiso-accion rols-css-permiso-accion-${accion.toLowerCase()}`}>
                                      {accion}
                                    </span>
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
          </div>

          <div className="rols-css-modal-footer">
            <button 
              type="button" 
              className="rols-css-btn rols-css-btn-outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="rols-css-btn rols-css-btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (mode === 'crear' ? 'Crear Rol' : 'Guardar Cambios')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;