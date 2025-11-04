import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AsignarRol.css";
import { auth } from "../components/authentication/Auth";
import { FiTrash2, FiMail, FiUser, FiKey, FiUsers, FiShield, FiAward } from "react-icons/fi";
import { HiMiniMagnifyingGlassCircle } from "react-icons/hi2";
import { RiUserSettingsLine } from "react-icons/ri";
import { MdAdminPanelSettings } from "react-icons/md";
import { motion } from "framer-motion";
import UsuariosChart from "../components/UsuariosChart";

const API_URL = "http://localhost:5000/";

const AsignarRol = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizarChart, setActualizarChart] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  const usuariosPorPagina = 10;
  const rolesDisponibles = ["ADMIN", "DOCENTE", "PADRE"];

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}api/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsuarios(res.data.users);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        setMensaje("❌ Error al cargar usuarios.");
      } finally {
        setCargando(false);
      }
    };
    obtenerUsuarios();
  }, []);

  const asignarRol = async (id, nuevoRol) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.put(
        `${API_URL}api/usuarios/${id}/rol`,
        { roles: [nuevoRol] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, roles: [nuevoRol] } : u))
      );

      setActualizarChart((prev) => !prev);
    } catch (error) {
      console.error("Error al asignar rol:", error);
      alert(error.response?.data?.message || "❌ Error al cambiar rol.");
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) return;
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.delete(`${API_URL}api/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsuarios((prev) => prev.filter((u) => u._id !== id));
      setActualizarChart((prev) => !prev);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMensaje("❌ Error al eliminar usuario.");
    }
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

  // Calcular estadísticas
  const totalUsuarios = usuarios.length;
  const totalAdmins = usuarios.filter(u => u.roles && u.roles.includes("ADMIN")).length;
  const totalDocentes = usuarios.filter(u => u.roles && u.roles.includes("DOCENTE")).length;
  const totalPadres = usuarios.filter(u => u.roles && u.roles.includes("PADRE")).length;

  if (cargando) return <p className="asignarRol-loading">Cargando usuarios...</p>;

  return (
    <div className="RolHeader">
      
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
          {/* Patrón de fondo */}
          <div className="header-pattern" />

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
                <MdAdminPanelSettings className="header-main-icon" />
              </motion.div>
              Gestión de Roles y Usuarios
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="header-shield-icon"
              >
                <FiShield />
              </motion.div>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="header-subtitle"
            >
              Administra permisos y roles del sistema de manera segura
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
                  <FiUsers />
                </div>
                <div className="stat-text">
                  <div className="stat-value">{totalUsuarios}</div>
                  <div className="stat-label">Total Usuarios</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <div className="stat-icon">
                  <MdAdminPanelSettings />
                </div>
                <div className="stat-text">
                  <div className="stat-value">{totalAdmins}</div>
                  <div className="stat-label">Administradores</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <div className="stat-icon">
                  <FiAward />
                </div>
                <div className="stat-text">
                  <div className="stat-value">{totalDocentes + totalPadres}</div>
                  <div className="stat-label">Usuarios Activos</div>
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
                <FiUser />
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
                <FiKey />
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
                <FiMail />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <motion.div 
          className="filtros-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="filtro-item">
            <HiMiniMagnifyingGlassCircle className="search-icon" />
            <input
              className="inputFiltro"
              placeholder="Buscar por nombre o correo..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <select
            className="selectFiltro"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="">Todos los roles</option>
            {rolesDisponibles.map((rol) => (
              <option key={rol}>{rol}</option>
            ))}
          </select>
        </motion.div>
      </motion.div>

      {/* TABLA */}
            <motion.div
        className="tabla-container-roles"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <motion.table
          className="tablaUsuarios"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <thead>
            <tr>
              <th><FiUser /> Usuario</th>
              <th><FiMail /> Email</th>
              <th><FiKey /> Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.map((u) => (
              <motion.tr
                key={u._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.roles.join(", ")}</td>
                <td className="acciones">
                  <select
                    className="role-select"
                    defaultValue={u.roles[0] || ""}
                    onChange={(e) => asignarRol(u._id, e.target.value)}
                  >
                    <option value="">Cambiar rol…</option>
                    {rolesDisponibles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <button className="btn-delete" onClick={() => eliminarUsuario(u._id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </motion.div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="paginacion">
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i}
              className={`pagina-btn ${paginaActual === i + 1 ? "activo" : ""}`}
              onClick={() => setPaginaActual(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Gráfico de roles */}
      <div className="chart-section">
        <h3 className="chart-title">
          <RiUserSettingsLine /> Distribución de roles
        </h3>
        <UsuariosChart actualizar={actualizarChart} />
      </div>
    </div>
  );
};

export default AsignarRol;