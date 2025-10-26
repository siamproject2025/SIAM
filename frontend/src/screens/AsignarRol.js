import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AsignarRol.css";
import { auth } from "../components/authentication/Auth";
import {
  FiTrash2,
  FiMail,
  FiUser,
  FiKey,
  FiUsers,
  FiShield,
} from "react-icons/fi";
import { HiMiniMagnifyingGlassCircle } from "react-icons/hi2";
import { RiUserSettingsLine } from "react-icons/ri";
import { FaUserTie } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";
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

  const usuariosPorPagina = 15;
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

      const usuarioActualizado = usuarios.find((u) => u._id === id);
      alert(
        `✅ Rol actualizado correctamente para ${
          usuarioActualizado?.username || "usuario desconocido"
        } (${usuarioActualizado?.email || "sin email"})`
      );

      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, roles: [nuevoRol] } : u))
      );
      setActualizarChart((prev) => !prev);
    } catch (error) {
      console.error("Error al asignar rol:", error);
      alert(error.response?.data?.message || "❌ No se pudo actualizar el rol.");
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

      const usuarioEliminado = usuarios.find((u) => u._id === id);
      const nombre = usuarioEliminado?.username || "desconocido";

      setMensaje(
        <span>
          🗑 Usuario <strong>{nombre}</strong> eliminado correctamente
        </span>
      );
      setUsuarios((prev) => prev.filter((u) => u._id !== id));
      setActualizarChart((prev) => !prev);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMensaje("❌ No se pudo eliminar el usuario.");
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
  const indexPrimerUsuario = indexUltimoUsuario - usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(
    indexPrimerUsuario,
    indexUltimoUsuario
  );
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const cambiarPagina = (numPagina) => setPaginaActual(numPagina);

  if (cargando) return <p className="asignarRol-loading">Cargando usuarios...</p>;

  return (
    <div className="RolHeader">
      <div className="headerRoles fancy-header">
        <MdAdminPanelSettings className="iconHeader"size={50} />
        <h2 className="asignarRol-title">Gestión de Roles y Usuarios</h2>
      </div>

      <div className="asignarRol-container">
        <div className="asignarRol-filtros">
          <div className="filtro-item">
            <HiMiniMagnifyingGlassCircle className="iconFiltro" size={48} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={filtroTexto}
              onChange={(e) => {
                setFiltroTexto(e.target.value);
                setPaginaActual(1);
              }}
              className="asignarRol-input"
            />
          </div>
          <div className="filtro-item">
            
            <select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value);
                setPaginaActual(1);
              }}
              className="asignarRol-select caja"
            >
              <option value="">Todos los roles</option>
              {rolesDisponibles.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {mensaje && <p className="asignarRol-message">{mensaje}</p>}

        <div className="asignarRol-list">
          {usuariosPaginados.length > 0 ? (
  usuariosPaginados.map((usuario) => (
    <div key={usuario._id} className="asignarRol-card">
      {/* Información del usuario */}
      <div className="user-info">
        <span className="user-name"><FiUser /> {usuario.username}</span>
        <span className="user-email"><FiMail /> {usuario.email}</span>
        <span className="user-role"><FiKey /> {usuario.roles.join(", ")}</span>
      </div>

      {/* Acciones */}
      <div className="user-actions">
        <select
          className="role-select"
          defaultValue={usuario.roles[0] || ""}
          onChange={(e) => asignarRol(usuario._id, e.target.value)}
        >
          <option value="">Cambiar rol...</option>
          {rolesDisponibles.map((rol) => (
            <option key={rol} value={rol}>{rol}</option>
          ))}
        </select>
        <button className="btn-delete" onClick={() => eliminarUsuario(usuario._id)}>
          <FiTrash2 />
        </button>
      </div>
    </div>
  ))
) : (
  <p className="asignarRol-empty">No se encontraron usuarios.</p>
)}

        </div>

        {totalPaginas > 1 && (
          <div className="asignarRol-pagination">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                className={`pagina-btn ${
                  paginaActual === i + 1 ? "activo" : ""
                }`}
                onClick={() => cambiarPagina(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <div className="chart-section">
          <div className="headerRoles fancy-header">
            <h3 className="chart-title">
            <RiUserSettingsLine /> Distribución de roles
          </h3>
          </div>
          <UsuariosChart actualizar={actualizarChart} />
        </div>
      </div>
    </div>
  );
};

export default AsignarRol;
