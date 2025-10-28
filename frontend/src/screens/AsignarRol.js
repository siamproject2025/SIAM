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
      {/* 🎨 ENCABEZADO MEJORADO */}
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
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <MdAdminPanelSettings size={36} fill="white" color="white" />
              </motion.div>
              Gestión de Roles y Usuarios
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                style={{ marginLeft: 'auto' }}
              >
                <FiShield size={32} color="white" />
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
              Administra permisos y roles del sistema de manera segura
            </motion.p>

            <motion.div 
              className="header-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                display: "flex",
                gap: "2rem",
                marginTop: "1.5rem",
                flexWrap: "wrap"
              }}
            >
              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="stat-icon" style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <FiUsers size={20} color="white" />
                </div>
                <div className="stat-text" style={{ color: "white" }}>
                  <div className="stat-value" style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    {totalUsuarios}
                  </div>
                  <div className="stat-label" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    Total Usuarios
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="stat-icon" style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <MdAdminPanelSettings size={20} color="white" />
                </div>
                <div className="stat-text" style={{ color: "white" }}>
                  <div className="stat-value" style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    {totalAdmins}
                  </div>
                  <div className="stat-label" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    Administradores
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="stat-icon" style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <FiAward size={20} color="white" />
                </div>
                <div className="stat-text" style={{ color: "white" }}>
                  <div className="stat-value" style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    {totalDocentes + totalPadres}
                  </div>
                  <div className="stat-label" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    Usuarios Activos
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="floating-icons"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{
                position: "absolute",
                top: "20px",
                right: "30px",
                display: "flex",
                gap: "15px",
                zIndex: 3
              }}
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
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <FiUser size={20} color="white" />
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
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <FiKey size={20} color="white" />
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
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <FiMail size={20} color="white" />
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
          style={{ 
            marginTop: "2rem",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div className="filtro-item" style={{ 
            position: "relative", 
            flex: 1,
            minWidth: "300px"
          }}>
            <HiMiniMagnifyingGlassCircle 
              size={30} 
              style={{ 
                position: "absolute", 
                left: "12px", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "#666",
                zIndex: 2
              }} 
            />
            <input
              className="inputFiltro"
              placeholder="Buscar por nombre o correo..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              style={{
                width: "100%",
                padding: "0.8rem 1rem",
                paddingLeft: "50px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "1rem",
                transition: "all 0.3s ease"
              }}
            />
          </div>

          <select
            className="selectFiltro"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={{
              padding: "0.8rem 1rem",
              border: "2px solid #e0e0e0",
              borderRadius: "8px",
              fontSize: "1rem",
              minWidth: "200px",
              background: "white"
            }}
          >
            <option value="">Todos los roles</option>
            {rolesDisponibles.map((rol) => (
              <option key={rol}>{rol}</option>
            ))}
          </select>
        </motion.div>
      </motion.div>

      {/* 📌 TABLA (se mantiene igual) */}
      <div className="tabla-container">
        <table className="tablaUsuarios">
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
              <tr key={u._id}>
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
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button className="btn-delete" onClick={() => eliminarUsuario(u._id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usuariosPaginados.length === 0 && (
          <p className="asignarRol-empty">No se encontraron usuarios.</p>
        )}
      </div>

      {/* 🔹 Paginación */}
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

      {/* 📊 Gráfico de roles */}
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