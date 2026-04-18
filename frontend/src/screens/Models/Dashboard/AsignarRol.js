import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/AsignarRol.css";
import { auth } from "../../../components/authentication/Auth";
import {
  FiTrash2, FiMail, FiUser, FiKey, FiUsers, FiShield, FiAward,
  FiArrowRight, FiEdit3, FiFilter, FiX, FiChevronLeft, FiChevronRight,
  FiSearch, FiLock, FiUnlock, FiSettings, FiSave, FiCheck, FiAlertTriangle
} from "react-icons/fi";
import { RiUserSettingsLine, RiShieldUserLine } from "react-icons/ri";
import { MdAdminPanelSettings } from "react-icons/md";
import { FaUserGraduate, FaUserTie } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import UsuariosChart from '../../../components/UsuariosChart';
import Notification from "../../../components/Notification";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import WithPermission from "../../../components/Permisos/WithPermission";

const API_URL = process.env.REACT_APP_API_URL;
const API_ROLES = `${API_URL}/api/roles`;

// ─── Modal de Configuración de Bloqueo ───────────────────────────────────────
const ConfigBloqueoModal = ({ onClose, token }) => {
  const [maxIntentos, setMaxIntentos]   = useState('');
  const [minutosBloqueo, setMinutosBloqueo] = useState('');
  const [cargando, setCargando]         = useState(true);
  const [guardando, setGuardando]       = useState(false);
  const [error, setError]               = useState('');
  const [exito, setExito]               = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/config/bloqueo`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMaxIntentos(res.data.max_intentos_fallidos);
        setMinutosBloqueo(res.data.minutos_bloqueo);
      } catch {
        setError('No se pudo cargar la configuración.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [token]);

  const handleGuardar = async () => {
    const max = parseInt(maxIntentos, 10);
    const min = parseInt(minutosBloqueo, 10);
    if (!max || max < 1 || max > 20) {
      setError('Los intentos deben ser un número entre 1 y 20.');
      return;
    }
    if (!min || min < 1 || min > 1440) {
      setError('Los minutos deben ser un número entre 1 y 1440.');
      return;
    }
    setError('');
    setGuardando(true);
    try {
      await axios.put(`${API_URL}/api/config/bloqueo`,
        { max_intentos_fallidos: max, minutos_bloqueo: min },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      setExito(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <motion.div
      className="cfg-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="cfg-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {/* Header */}
        <div className="cfg-header">
          <div className="cfg-header-icon">
            <FiSettings size={22} />
          </div>
          <div>
            <h2 className="cfg-title">Configuración de Bloqueo</h2>
            <p className="cfg-subtitle">Parámetros de seguridad para accesos fallidos</p>
          </div>
          <button className="cfg-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="cfg-body">
          {cargando ? (
            <div className="cfg-loading">
              <div className="cfg-spinner" />
              <span>Cargando configuración…</span>
            </div>
          ) : (
            <>
              {/* Intentos */}
              <div className="cfg-field">
                <label className="cfg-label">
                  <FiAlertTriangle size={16} />
                  Intentos fallidos antes de bloquear
                </label>
                <div className="cfg-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="cfg-input"
                    value={maxIntentos}
                    onChange={(e) => setMaxIntentos(e.target.value)}
                  />
                  <span className="cfg-input-hint">intentos</span>
                </div>
                <p className="cfg-desc">
                  Tras este número de contraseñas incorrectas consecutivas, la cuenta quedará bloqueada automáticamente.
                </p>
              </div>

              {/* Tiempo */}
              <div className="cfg-field">
                <label className="cfg-label">
                  <FiLock size={16} />
                  Duración del bloqueo
                </label>
                <div className="cfg-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    className="cfg-input"
                    value={minutosBloqueo}
                    onChange={(e) => setMinutosBloqueo(e.target.value)}
                  />
                  <span className="cfg-input-hint">minutos</span>
                </div>
                <p className="cfg-desc">
                  Tiempo que permanecerá bloqueada la cuenta. Máximo 1440 min (24 h).
                </p>
              </div>

              {/* Resumen visual */}
              <div className="cfg-summary">
                <div className="cfg-summary-item">
                  <span className="cfg-summary-val">{maxIntentos || '—'}</span>
                  <span className="cfg-summary-lbl">intentos</span>
                </div>
                <div className="cfg-summary-sep">→</div>
                <div className="cfg-summary-item">
                  <span className="cfg-summary-val">{minutosBloqueo || '—'}</span>
                  <span className="cfg-summary-lbl">min bloqueado</span>
                </div>
              </div>

              {error && (
                <motion.p
                  className="cfg-error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FiAlertTriangle size={14} /> {error}
                </motion.p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!cargando && (
          <div className="cfg-footer">
            <button className="cfg-btn-cancel" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            <button
              className={`cfg-btn-save ${exito ? 'success' : ''}`}
              onClick={handleGuardar}
              disabled={guardando || exito}
            >
              {exito ? (
                <><FiCheck size={16} /> Guardado</>
              ) : guardando ? (
                <><div className="cfg-spinner-sm" /> Guardando…</>
              ) : (
                <> Guardar</>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Componente principal AsignarRol ─────────────────────────────────────────
const AsignarRol = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios]           = useState([]);
  const [roles, setRoles]                 = useState([]);
  const [filtroTexto, setFiltroTexto]     = useState("");
  const [filtroRol, setFiltroRol]         = useState("");
  const [mensaje, setMensaje]             = useState("");
  const [cargando, setCargando]           = useState(true);
  const [actualizarChart, setActualizarChart] = useState(false);
  const [paginaActual, setPaginaActual]   = useState(1);
  const [showFilters, setShowFilters]     = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);  // edición de rol
  const [editandoUsername, setEditandoUsername] = useState(null); // id usuario editando nombre
  const [nuevoUsername, setNuevoUsername] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tokenCache, setTokenCache]       = useState(null);
  const inputRef = useRef(null);

  const usuariosPorPagina = 10;

  // Obtener token una sola vez
  const getToken = async () => {
    if (tokenCache) return tokenCache;
    const user = auth.currentUser;
    const t = await user.getIdToken();
    setTokenCache(t);
    return t;
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const user  = auth.currentUser;
        const token = await user.getIdToken();
        setTokenCache(token);

        const [usuariosRes, rolesRes] = await Promise.all([
          axios.get(`${API_URL}/api/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(API_ROLES,                 { headers: { Authorization: `Bearer ${token}` } })
        ]);

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

  // Focus automático al editar nombre
  useEffect(() => {
    if (editandoUsername && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editandoUsername]);

  // ── Asignar rol ──
  const asignarRol = async (id, nuevoRol) => {
    try {
      const token = await getToken();
      await axios.put(
        `${API_URL}/api/usuarios/${id}/rol`,
        { roles: [nuevoRol] },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const ua = usuarios.find((u) => u._id === id);
      setMensaje(<span>✓ Rol actualizado para <strong>{ua?.username}</strong></span>);
      setUsuarios((prev) => prev.map((u) => (u._id === id ? { ...u, roles: [nuevoRol] } : u)));
      setActualizarChart((prev) => !prev);
      setUsuarioEditando(null);
    } catch (error) {
      setMensaje(<span>✗ {error.response?.data?.message || "Error al actualizar el rol"}</span>);
    }
  };

  // ── Guardar nuevo username ──
  const guardarUsername = async (id) => {
    if (!nuevoUsername.trim()) return;
    try {
      const token = await getToken();
      const res = await axios.patch(
        `${API_URL}/api/usuarios/${id}/username`,
        { username: nuevoUsername.trim() },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setMensaje(<span>✓ Nombre actualizado a <strong>{res.data.usuario.username}</strong></span>);
      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, username: res.data.usuario.username } : u))
      );
      setEditandoUsername(null);
      setNuevoUsername('');
    } catch (error) {
      setMensaje(<span>✗ {error.response?.data?.message || "Error al actualizar nombre"}</span>);
    }
  };

  // ── Eliminar usuario ──
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [showConfirm, setShowConfirm]           = useState(false);

  const handleEliminarUsuario = (usuario) => {
    setUsuarioAEliminar(usuario);
    setShowConfirm(true);
  };

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!usuarioAEliminar) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/api/usuarios/${usuarioAEliminar._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMensaje(<span>✓ Usuario <strong>{usuarioAEliminar.username}</strong> eliminado</span>);
      setUsuarios((prev) => prev.filter((u) => u._id !== usuarioAEliminar._id));
      setActualizarChart((prev) => !prev);
      setUsuarioAEliminar(null);
    } catch {
      setMensaje("✗ No se pudo eliminar el usuario");
    }
  };

  // ── Bloquear / Desbloquear ──
  const bloquearUsuario = async (usuario) => {
    try {
      const token = await getToken();
      await axios.patch(`${API_URL}/api/usuarios/${usuario._id}/bloquear`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      setMensaje(<span>✓ Usuario <strong>{usuario.username}</strong> bloqueado</span>);
      setUsuarios((prev) => prev.map((u) => (u._id === usuario._id ? { ...u, estado: 'BLOQUEADO' } : u)));
    } catch {
      setMensaje("✗ No se pudo bloquear el usuario");
    }
  };

  const desbloquearUsuario = async (usuario) => {
    try {
      const token = await getToken();
      await axios.patch(`${API_URL}/api/usuarios/${usuario._id}/desbloquear`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      setMensaje(<span>✓ Usuario <strong>{usuario.username}</strong> desbloqueado</span>);
      setUsuarios((prev) => prev.map((u) => (u._id === usuario._id ? { ...u, estado: 'ACTIVO' } : u)));
    } catch {
      setMensaje("✗ No se pudo desbloquear el usuario");
    }
  };

  // ── Filtros y paginación ──
  const usuariosFiltrados = usuarios.filter((u) => {
    const txt = u.username?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                u.email?.toLowerCase().includes(filtroTexto.toLowerCase());
    const rol = !filtroRol || (u.roles && u.roles.includes(filtroRol));
    return txt && rol;
  });

  const indexUltimo      = paginaActual * usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indexUltimo - usuariosPorPagina, indexUltimo);
  const totalPaginas      = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const getRolIcon = (rolId) => {
    switch (rolId) {
      case 'ADMIN':   return <MdAdminPanelSettings />;
      case 'DOCENTE': return <FaUserGraduate />;
      case 'PADRE':   return <FaUserTie />;
      default:        return <RiShieldUserLine />;
    }
  };

  const getRolColor = (rolId) => {
    switch (rolId) {
      case 'ADMIN':   return '#ef4444';
      case 'DOCENTE': return '#10b981';
      case 'PADRE':   return '#f59e0b';
      default:        return '#667eea';
    }
  };

  if (cargando) {
    return (
      <div className="rol-asignar-loading">
        <div className="rol-loading-spinner" />
        <p>Cargando usuarios…</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Header ── */}
      <motion.div
        className="mm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
      >
        <div className="mm-hi">
          <div className="mm-ht">
            <motion.div
              className="mm-htitle"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <motion.span
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <MdAdminPanelSettings size={34} color="white" />
              </motion.span>
              Gestión de Usuarios
            </motion.div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Botón configuración de bloqueo */}
             

              <motion.button
                className="rol-btn-gestion"
                onClick={() => navigate("/roles")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <RiShieldUserLine />
                <span>Gestión de Roles</span>
                <FiArrowRight />
              </motion.button>
            </div>
          </div>

          <motion.p className="mm-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Administra los roles y permisos de los usuarios del sistema
          </motion.p>

          <motion.div className="mm-stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {[
              { ico: <FiUsers   size={18} color="white" />, val: usuariosFiltrados.length, lbl: filtroTexto || filtroRol ? 'Filtrados' : 'Total Usuarios' },
              { ico: <FiUnlock  size={18} color="white" />, val: usuariosFiltrados.filter(u => u.estado !== 'BLOQUEADO').length, lbl: 'Activos' },
              { ico: <FiLock    size={18} color="white" />, val: usuariosFiltrados.filter(u => u.estado === 'BLOQUEADO').length, lbl: 'Bloqueados' },
              { ico: <FiShield  size={18} color="white" />, val: roles.length, lbl: 'Roles' },
            ].map((s, i) => (
              <motion.div key={i} className="mm-stat" whileHover={{ scale: 1.04, y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
                <div className="mm-stat-ico">{s.ico}</div>
                <div>
                  <div className="mm-stat-val">{s.val}</div>
                  <div className="mm-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="rol-asignar-container">

        {/* ── Búsqueda y filtros ── */}
        <div className="rol-search-section">
          <div className="rol-search-container">
            <FiSearch className="rol-search-icon" />
            <input
              type="text"
              className="rol-search-input"
              placeholder="Buscar por nombre o correo electrónico…"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
            {filtroTexto && (
              <button className="rol-clear-search" onClick={() => setFiltroTexto('')}>
                <FiX />
              </button>
              
            )}
            
          </div>
          <button className={`rol-filter-toggle ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <FiFilter /><span>Filtros</span>
          </button>
           <WithPermission requiredPermissions={["ACTUALIZAR_USUARIOS"]}>
                <button
                  style={S.btn('#6C4FBF')}
                  onClick={() => setShowConfigModal(true)}
                  
                >
                  <FiSettings size={14} />
                  <span>Config. Bloqueo</span>
                </button>
              </WithPermission>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div className="rol-filters-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="rol-filters-content">
                <label>Filtrar por rol:</label>
                <select className="rol-filter-select" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                  <option value="">Todos los roles</option>
                  {roles.map((rol) => (
                    <option key={rol._id} value={rol._id}>{rol.nombre} ({rol._id})</option>
                  ))}
                </select>
                {filtroRol && (
                  <button className="rol-clear-filter" onClick={() => setFiltroRol('')}>
                    <FiX /> Limpiar filtro
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabla ── */}
        <div className="rol-table-container">
          <table className="rol-users-table">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%)' }}>
                {['Usuario', 'Email', 'Rol Actual', 'Estado', 'Acciones'].map(col => (
                  <th key={col} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontFamily: 'Poppins, sans-serif', fontWeight: 700,
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.95)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '2px solid #E0D9F5'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuariosPaginados.length > 0 ? (
                usuariosPaginados.map((usuario) => {
                  const rolActual  = roles.find(r => r._id === usuario.roles?.[0]);
                  const isEditRol  = usuarioEditando === usuario._id;
                  const isEditNombre = editandoUsername === usuario._id;

                  return (
                    <motion.tr key={usuario._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={isEditRol ? 'editing' : ''}>

                      {/* Columna Usuario (con edición de nombre) */}
                      <td>
                        <div className="rol-user-cell">
                          <div className="rol-user-avatar-small">
                            {usuario.username?.charAt(0).toUpperCase()}
                          </div>
                          {isEditNombre ? (
                            <div className="rol-nombre-edit-wrap">
                              <input
                                    ref={inputRef}
                                    className="rol-nombre-input"
                                    value={nuevoUsername}
                                    onChange={(e) => {
                                      const limpio = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-ZÁÉÍÓÚÜÑ\s]/g, '');
                                      setNuevoUsername(limpio);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter')  guardarUsername(usuario._id);
                                      if (e.key === 'Escape') { setEditandoUsername(null); setNuevoUsername(''); }
                                    }}
                                    maxLength={60}
                                    placeholder="Nombre de usuario…"
                                  />
                              <button className="rol-nombre-btn save" onClick={() => guardarUsername(usuario._id)} title="Guardar">
                                <FiCheck size={14} />
                              </button>
                              <button className="rol-nombre-btn cancel" onClick={() => { setEditandoUsername(null); setNuevoUsername(''); }} title="Cancelar">
                                <FiX size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{usuario.username}</span>
                              <WithPermission requiredPermissions={["ACTUALIZAR_USUARIOS"]}>
                                <button
                                  className="rol-nombre-edit-btn"
                                  title="Editar nombre"
                                  onClick={() => { setEditandoUsername(usuario._id); setNuevoUsername(usuario.username || ''); }}
                                >
                                  <FiEdit3 size={13} />
                                </button>
                              </WithPermission>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>{usuario.email}</td>

                      {/* Rol actual */}
                      <td>
                        {rolActual ? (
                          <span className="rol-role-badge" style={{ background: getRolColor(rolActual._id) + '20', color: getRolColor(rolActual._id), borderColor: getRolColor(rolActual._id) }}>
                            {getRolIcon(rolActual._id)}{rolActual._id}
                          </span>
                        ) : (
                          <span className="rol-role-badge" style={{ background: '#94a3b820', color: '#94a3b8', borderColor: '#94a3b8' }}>
                            Sin rol
                          </span>
                        )}
                      </td>

                      {/* Estado */}
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

                      {/* Acciones */}
                      <td>
                        <div className="rol-table-actions">
                          {isEditRol ? (
                            <>
                              <select
                                className="rol-table-select"
                                defaultValue={usuario.roles?.[0] || ""}
                                onChange={(e) => asignarRol(usuario._id, e.target.value)}
                                autoFocus
                              >
                                <option value="">Sin rol…</option>
                                {roles.map((r) => (
                                  <option key={r._id} value={r._id}>{r.nombre} ({r._id})</option>
                                ))}
                              </select>
                              <button className="rol-table-btn cancel" onClick={() => setUsuarioEditando(null)} title="Cancelar"><FiX /></button>
                            </>
                          ) : (
                            <>
                              <WithPermission requiredPermissions={["ACTUALIZAR_USUARIOS"]}>
                                <button className="rol-table-btn edit" onClick={() => setUsuarioEditando(usuario._id)} title="Cambiar rol"><FiEdit3 /></button>
                              </WithPermission>
                              <WithPermission requiredPermissions={["ELIMINAR_USUARIOS"]}>
                                <button className="rol-table-btn delete" onClick={() => handleEliminarUsuario(usuario)} title="Eliminar usuario"><FiTrash2 /></button>
                              </WithPermission>
                              <WithPermission requiredPermissions={["ACTUALIZAR_USUARIOS"]}>
                                {usuario.estado === 'BLOQUEADO' ? (
                                  <button className="rol-table-btn" style={{ color: '#10b981' }} title="Desbloquear" onClick={() => desbloquearUsuario(usuario)}><FiUnlock /></button>
                                ) : (
                                  <button className="rol-table-btn" style={{ color: '#ef4444' }} title="Bloquear" onClick={() => bloquearUsuario(usuario)}><FiLock /></button>
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
                  <td colSpan="5" className="rol-no-results-cell">
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

        {/* ── Paginación ── */}
        {totalPaginas > 1 && (
          <div className="rol-pagination">
            <button className="rol-pagination-btn" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1}>
              <FiChevronLeft /> Anterior
            </button>
            <div className="rol-pagination-numbers">
              {Array.from({ length: totalPaginas }, (_, i) => {
                const n = i + 1;
                if (n === 1 || n === totalPaginas || (n >= paginaActual - 1 && n <= paginaActual + 1)) {
                  return <button key={i} className={`rol-page-number ${paginaActual === n ? 'active' : ''}`} onClick={() => setPaginaActual(n)}>{n}</button>;
                } else if (n === paginaActual - 2 || n === paginaActual + 2) {
                  return <span key={i} className="rol-pagination-dots">…</span>;
                }
                return null;
              })}
            </div>
            <button className="rol-pagination-btn" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}>
              Siguiente <FiChevronRight />
            </button>
          </div>
        )}

        {/* ── Gráfico ── */}
        <div className="rol-chart-section">
          <h3 className="rol-chart-title"><RiUserSettingsLine /> Distribución de Roles</h3>
          <div className="rol-chart-container">
            <UsuariosChart actualizar={actualizarChart} />
          </div>
        </div>

        {/* ── Diálogos ── */}
        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar al usuario "${usuarioAEliminar?.username}"?`}
            onConfirm={confirmarEliminacion}
            onCancel={() => { setShowConfirm(false); setUsuarioAEliminar(null); }}
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

      {/* ── Modal configuración de bloqueo ── */}
      <AnimatePresence>
        {showConfigModal && tokenCache && (
          <ConfigBloqueoModal token={tokenCache} onClose={() => setShowConfigModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
};


const S = {
  sec:   { marginBottom: 24 },
  title: { display:'flex', alignItems:'center', gap:8, fontFamily:'Poppins,sans-serif', fontSize:'.88rem', fontWeight:700, color:'#6C4FBF', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #E0D9F5' },
  grid:  { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:13 },
  full:  { gridColumn:'1/-1' },
  field: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:'.77rem', fontWeight:700, color:'#7A6FA0', textTransform:'uppercase', letterSpacing:'.04em' },
  req:   { color:'#E74C3C' },
  inp:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:e?'#FFF8F8':'#FAF9FF', outline:'none', width:'100%', transition:'border-color .2s' }),
  inpRO: { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#6C4FBF', fontWeight:700, background:'#F0ECFF', outline:'none', width:'100%' },
  sel:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%' }),
  ta:    { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%', resize:'vertical', minHeight:90 },
  errMsg:{ fontSize:'.73rem', color:'#E74C3C', fontWeight:600 },
  banner:{ display:'flex', gap:10, alignItems:'flex-start', padding:'11px 14px', borderRadius:10, marginBottom:14, fontSize:'.85rem', background:'#FDE8E8', borderLeft:'4px solid #E74C3C', color:'#7a1010' },
  info:  { display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', borderRadius:9, marginBottom:12, fontSize:'.84rem', background:'#E8F4FD', borderLeft:'4px solid #2980B9', color:'#0c4a6e' },
  foot:  { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #E0D9F5', marginTop:8 },
  btn:   (bg, col='#fff') => ({ display:'inline-flex', alignItems:'', gap:7, marginTop: '25px',padding:'15px 20px', borderRadius:10, fontSize:'.86rem', fontWeight:700, border:'none', height:'100%', cursor:'pointer', background:bg, color:col, fontFamily:'inherit', transition:'all .18s' }),
  upload:{ border:'2px dashed #C4B5E8', borderRadius:12, padding:'26px 20px', textAlign:'center', background:'#FAF9FF' },
  card:  { background:'#F4F3FB', border:'1px solid #E0D9F5', borderRadius:12, padding:'14px 16px', marginBottom:12, position:'relative' },
  cardTitle: { fontFamily:'Poppins,sans-serif', fontSize:'.82rem', fontWeight:700, color:'#6C4FBF', marginBottom:10, display:'flex', alignItems:'center', gap:6 },
  delBtn:{ position:'absolute', top:10, right:10, background:'#FDE8E8', color:'#E74C3C', border:'none', borderRadius:7, padding:'5px 8px', cursor:'pointer', fontSize:'.8rem', fontWeight:700, display:'flex', alignItems:'center', gap:4 },
};

export default AsignarRol;