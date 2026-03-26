import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/AsignarRol.css";
import { auth } from "../../../components/authentication/Auth";
import { 
  FiTrash2, FiMail, FiUser, FiKey, FiUsers, FiShield, FiAward, 
  FiArrowRight, FiEdit3, FiFilter, FiX, FiChevronLeft, FiChevronRight,
  FiSearch, FiLock, FiUnlock
} from "react-icons/fi";
import { HiMiniMagnifyingGlassCircle } from "react-icons/hi2";
import { RiUserSettingsLine, RiShieldUserLine } from "react-icons/ri";
import { MdAdminPanelSettings } from "react-icons/md";
import { FaUserGraduate, FaUserTie } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import UsuariosChart from '../../../components/UsuariosChart'
import Notification from "../../../components/Notification";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import WithPermission from "../../../components/Permisos/WithPermission";

const API_URL = process.env.REACT_APP_API_URL;
const API_ROLES = `${API_URL}/api/roles`;

const AsignarRol = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizarChart, setActualizarChart] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const usuariosPorPagina = 10;

  useEffect(() => {
  const obtenerDatos = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      const [usuariosRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/api/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(API_ROLES, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      
      console.log("Primer usuario:", usuariosRes.data.users[0]); // ← agrega esto
      
      setUsuarios(usuariosRes.data.users);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
      setMensaje(" Error al cargar datos.");
    } finally {
      setCargando(false);
    }
  };
  obtenerDatos();
}, []);

  const asignarRol = async (id, nuevoRol) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.put(
        `${API_URL}/api/usuarios/${id}/rol`,
        { roles: [nuevoRol] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const usuarioActualizado = usuarios.find((u) => u._id === id);
      
      setMensaje(
        <span>
          ✓ Rol actualizado para <strong>{usuarioActualizado?.username}</strong>
        </span>
      );

      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, roles: [nuevoRol] } : u))
      );
      setActualizarChart((prev) => !prev);
      setUsuarioEditando(null);
    } catch (error) {
      console.error("Error al asignar rol:", error);
      setMensaje(
        <span>
          ✗ {error.response?.data?.message || "Error al actualizar el rol"}
        </span>
      );
    }
  };

  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEliminarUsuario = (usuario) => {
    setUsuarioAEliminar(usuario);
    setShowConfirm(true);
  };

  const confirmarEliminacionUsuario = async () => {
    setShowConfirm(false);
    if (!usuarioAEliminar) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.delete(`${API_URL}/api/usuarios/${usuarioAEliminar._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMensaje(
        <span>
          ✓ Usuario <strong>{usuarioAEliminar.username}</strong> eliminado
        </span>
      );
      setUsuarios((prev) => prev.filter((u) => u._id !== usuarioAEliminar._id));
      setActualizarChart((prev) => !prev);
      setUsuarioAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMensaje("✗ No se pudo eliminar el usuario");
    }
  };

  const cancelarEliminacionUsuario = () => {
    setShowConfirm(false);
    setUsuarioAEliminar(null);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideTexto =
      u.username?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      u.email?.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideRol = !filtroRol || (u.roles && u.roles.includes(filtroRol));
    return coincideTexto && coincideRol;
  });

  const indexUltimoUsuario = paginaActual * usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(
    indexUltimoUsuario - usuariosPorPagina,
    indexUltimoUsuario
  );
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const totalUsuarios = usuarios.length;

  const irAGestionRoles = () => {
    navigate("/roles");
  };

  const getRolIcon = (rolId) => {
    switch(rolId) {
      case 'ADMIN':
        return <MdAdminPanelSettings />;
      case 'DOCENTE':
        return <FaUserGraduate />;
      case 'PADRE':
        return <FaUserTie />;
      default:
        return <RiShieldUserLine />;
    }
  };

  const getRolColor = (rolId) => {
    switch(rolId) {
      case 'ADMIN':
        return '#ef4444';
      case 'DOCENTE':
        return '#10b981';
      case 'PADRE':
        return '#f59e0b';
      default:
        return '#667eea';
    }
  };

  if (cargando) {
    return (
      <div className="rol-asignar-loading">
        <div className="rol-loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }
  
  const bloquearUsuario = async (usuario) => {
     try {
       const user = auth.currentUser;
       const token = await user.getIdToken();
       await axios.patch(`${API_URL}/api/usuarios/${usuario._id}/bloquear`, {},
         { headers: { Authorization: `Bearer ${token}` } });
       setMensaje(<span>✓ Usuario <strong>{usuario.username}</strong> bloqueado</span>);
       setUsuarios((prev) =>
  prev.map((u) => (u._id === usuario._id ? { ...u, estado: 'BLOQUEADO' } : u))
);
     } catch (error) {
       setMensaje("✗ No se pudo bloquear el usuario");
     }
   };
  
   const desbloquearUsuario = async (usuario) => {
     try {
       const user = auth.currentUser;
       const token = await user.getIdToken();
       await axios.patch(`${API_URL}/api/usuarios/${usuario._id}/desbloquear`, {},
         { headers: { Authorization: `Bearer ${token}` } });
       setMensaje(<span>✓ Usuario <strong>{usuario.username}</strong> desbloqueado</span>);
       setUsuarios((prev) =>
  prev.map((u) => (u._id === usuario._id ? { ...u, estado: 'ACTIVO' } : u))
);
     } catch (error) {
       setMensaje("✗ No se pudo desbloquear el usuario");
     }
   };

  return (
    <div className="rol-asignar-container">
      {/* Header mantenido sin iconos flotantes */}
      <motion.div 
        className="rol-asignar-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="rol-header-gradient">
          <div className="rol-header-pattern" />
          
          <div className="rol-header-content">
            <div className="rol-header-top">
              <motion.h1
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <MdAdminPanelSettings className="rol-header-icon" />
                Gestión de Usuarios
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="rol-header-badge"
                >
                  <FiShield />
                </motion.span>
              </motion.h1>

              <motion.button
                className="rol-btn-gestion"
                onClick={irAGestionRoles}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <RiShieldUserLine />
                <span>Gestión de Roles</span>
                <FiArrowRight />
              </motion.button>
            </div>
            
            <motion.p
              className="rol-header-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Administra los roles y permisos de los usuarios del sistema
            </motion.p>

            <motion.div 
              className="rol-stats-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="rol-stat-card">
                <div className="rol-stat-icon" style={{ background: '#3b82f6' }}>
                  <FiUsers />
                </div>
                <div className="rol-stat-info">
                  <span className="rol-stat-value">{totalUsuarios}</span>
                  <span className="rol-stat-label">Total Usuarios</span>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Barra de búsqueda y filtros */}
      <div className="rol-search-section">
        <div className="rol-search-container">
          <FiSearch className="rol-search-icon" />
          <input
            type="text"
            className="rol-search-input"
            placeholder="Buscar por nombre o correo electrónico..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
          {filtroTexto && (
            <button 
              className="rol-clear-search"
              onClick={() => setFiltroTexto('')}
            >
              <FiX />
            </button>
          )}
        </div>

        <button 
          className={`rol-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter />
          <span>Filtros</span>
        </button>
      </div>

      {/* Panel de filtros expandible */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="rol-filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="rol-filters-content">
              <label>Filtrar por rol:</label>
              <select
                className="rol-filter-select"
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
              >
                <option value="">Todos los roles</option>
                {roles.map((rol) => (
                  <option key={rol._id} value={rol._id}>
                    {rol.nombre} ({rol._id})
                  </option>
                ))}
              </select>
              {filtroRol && (
                <button 
                  className="rol-clear-filter"
                  onClick={() => setFiltroRol('')}
                >
                  <FiX /> Limpiar filtro
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla de usuarios */}
      <div className="rol-table-container">
        <table className="rol-users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol Actual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.length > 0 ? (
              usuariosPaginados.map((usuario) => {
                const rolActual = roles.find(r => r._id === usuario.roles[0]);
                const isEditing = usuarioEditando === usuario._id;
                
                return (
                  <motion.tr
                    key={usuario._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={isEditing ? 'editing' : ''}
                  >
                    <td>
                      <div className="rol-user-cell">
                        <div className="rol-user-avatar-small">
                          {usuario.username?.charAt(0).toUpperCase()}
                        </div>
                        <span>{usuario.username}</span>
                      </div>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      {rolActual ? (
                        <span 
                          className="rol-role-badge"
                          style={{ 
                            background: getRolColor(rolActual._id) + '20',
                            color: getRolColor(rolActual._id),
                            borderColor: getRolColor(rolActual._id)
                          }}
                        >
                          {getRolIcon(rolActual._id)}
                          {rolActual._id}
                        </span>
                      ) : (
                        <span className="rol-role-badge">
                          {usuario.roles.join(', ')}
                        </span>
                      )}
                    </td>
                     <td>
                        {usuario.estado === 'BLOQUEADO' ? (
                          <span className="rol-role-badge" style={{ background: '#ef444420', color: '#ef4444', borderColor: '#ef4444' }}>
                            <FiLock /> Bloqueado
                          </span>
                        ) : (
                          <span className="rol-role-badge" style={{ background: '#10b98120', color: '#10b981', borderColor: '#10b981' }}>
                            <FiUnlock /> Activo
                          </span>
                        )}
                      </td>
                                      
                    <td>
                      <div className="rol-table-actions">
                        {isEditing ? (
                          <>
                            <select
                              className="rol-table-select"
                              defaultValue={usuario.roles[0] || ""}
                              onChange={(e) => asignarRol(usuario._id, e.target.value)}
                              autoFocus
                            >
                              <option value="">Seleccionar rol...</option>
                              {roles.map((r) => (
                                <option key={r._id} value={r._id}>
                                  {r.nombre} ({r._id})
                                </option>
                              ))}
                            </select>
                            <button 
                              className="rol-table-btn cancel"
                              onClick={() => setUsuarioEditando(null)}
                              title="Cancelar"
                            >
                              <FiX />
                            </button>
                          </>
                        ) : (
                          <><WithPermission requiredPermissions={["ACTUALIZAR_SEGURIDAD"]}>
                            <button 
                              className="rol-table-btn edit"
                              onClick={() => setUsuarioEditando(usuario._id)}
                              title="Cambiar rol"
                            >
                              <FiEdit3 />
                            </button>
                            </WithPermission>
                            <WithPermission requiredPermissions={["ELIMINAR_SEGURIDAD"]}>
                            <button 
                              className="rol-table-btn delete"
                              onClick={() => handleEliminarUsuario(usuario)}
                              title="Eliminar usuario"
                            >
                              <FiTrash2 />
                            </button>
                            </WithPermission>
                            <WithPermission requiredPermissions={["ACTUALIZAR_SEGURIDAD"]}>
                              {usuario.estado === 'BLOQUEADO' ? (
                                <button className="rol-table-btn" style={{color:'#10b981'}} title="Desbloquear"
                                  onClick={() => desbloquearUsuario(usuario)}>
                                  <FiUnlock />
                                </button>
                              ) : (
                                <button className="rol-table-btn" style={{color:'#ef4444'}} title="Bloquear"
                                  onClick={() => bloquearUsuario(usuario)}>
                                  <FiLock />
                                </button>
                              )}
                            </WithPermission>

                          </>
                        )}
                      </div>
                    </td>
                    
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="rol-no-results-cell">
                  <div className="rol-no-results">
                    <FiUsers size={48} />
                    <h3>No se encontraron usuarios</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="rol-pagination">
          <button
            className="rol-pagination-btn"
            onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
            disabled={paginaActual === 1}
          >
            <FiChevronLeft /> Anterior
          </button>
          
          <div className="rol-pagination-numbers">
            {Array.from({ length: totalPaginas }, (_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPaginas ||
                (pageNum >= paginaActual - 1 && pageNum <= paginaActual + 1)
              ) {
                return (
                  <button
                    key={i}
                    className={`rol-page-number ${paginaActual === pageNum ? 'active' : ''}`}
                    onClick={() => setPaginaActual(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === paginaActual - 2 ||
                pageNum === paginaActual + 2
              ) {
                return <span key={i} className="rol-pagination-dots">...</span>;
              }
              return null;
            })}
          </div>

          <button
            className="rol-pagination-btn"
            onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente <FiChevronRight />
          </button>
        </div>
      )}

      {/* Gráfico de distribución */}
      <div className="rol-chart-section">
        <h3 className="rol-chart-title">
          <RiUserSettingsLine /> Distribución de Roles
        </h3>
        <div className="rol-chart-container">
          <UsuariosChart actualizar={actualizarChart} />
        </div>
      </div>

      {/* Diálogos de confirmación y notificaciones */}
      {showConfirm && (
        <ConfirmDialog
          message={`¿Seguro que deseas eliminar al usuario "${usuarioAEliminar?.username}"?`}
          onConfirm={confirmarEliminacionUsuario}
          onCancel={cancelarEliminacionUsuario}
          visible={showConfirm}
        />
      )}

      {mensaje && (
        <Notification
          message={mensaje}
          type={mensaje.props?.children?.toString().includes('✓') ? 'success' : 'error'}
          onClose={() => setMensaje(null)}
        />
      )}
    </div>
  );
};

export default AsignarRol;