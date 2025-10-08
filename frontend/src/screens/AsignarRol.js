import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AsignarRol.css";
import { auth } from "../components/authentication/Auth";
import { FiTrash2, FiMail, FiUser, FiKey } from "react-icons/fi";
import UsuariosChart from '../components/UsuariosChart';

const API_URL = "http://localhost:5000/api/usuarios";

const AsignarRol = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 15;

  const rolesDisponibles = ["ADMIN", "DOCENTE", "PADRE"];

  // 🔹 Obtener usuarios desde MongoDB
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(API_URL, {
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

  // 🔹 Asignar nuevo rol
  const asignarRol = async (id, nuevoRol) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.put(`${API_URL}/${id}/rol`, { roles: [nuevoRol] }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const usuarioActualizado = usuarios.find((u) => u._id === id);
      setMensaje(
        <>
          ✅ Rol actualizado correctamente para{" "}
          <strong>{usuarioActualizado?.username || "usuario desconocido"}</strong>{" "}
          (Email: <strong>{usuarioActualizado?.email || "sin email"}</strong>)
        </>
      );

      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, roles: [nuevoRol] } : u))
      );
    } catch (error) {
      console.error("Error al asignar rol:", error);
      setMensaje(error.response?.data?.message || "❌ No se pudo actualizar el rol.");
    }
  };

  // 🔹 Eliminar usuario
  const eliminarUsuario = async (id) => {
    if (!window.confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) return;

    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });

      const usuarioEliminado = usuarios.find((u) => u._id === id);
      setMensaje(
        <span>
          🗑 Usuario <strong>{usuarioEliminado?.username}</strong> eliminado correctamente
        </span>
      );

      setUsuarios((prev) => prev.filter((u) => u._id !== id));
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMensaje("❌ No se pudo eliminar el usuario.");
    }
  };

  // 🔹 Filtrar usuarios por nombre/correo y por rol
  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideTexto =
      u.username?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      u.email?.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideRol = !filtroRol || (u.roles && u.roles.includes(filtroRol));
    return coincideTexto && coincideRol;
  });

  // 🔹 Paginación
  const indexUltimoUsuario = paginaActual * usuariosPorPagina;
  const indexPrimerUsuario = indexUltimoUsuario - usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indexPrimerUsuario, indexUltimoUsuario);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const cambiarPagina = (numPagina) => setPaginaActual(numPagina);

  if (cargando) return <p className="asignarRol-loading">Cargando usuarios...</p>;

  return (
    <>
      <div className="headerRoles">
        <h2 className="asignarRol-title">Gestión de roles</h2>
      </div>
       <div className='dashMain'><UsuariosChart></UsuariosChart></div>
       <div className="headerRoles">
        <h2 className="asignarRol-title">Asignación de roles</h2>
      </div>
      <div className="asignarRol-container">
        {mensaje && <p className="asignarRol-message">{mensaje}</p>}

        {/* 🔍 Filtros */}
        <div className="asignarRol-filtros">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={filtroTexto}
            onChange={(e) => { setFiltroTexto(e.target.value); setPaginaActual(1); }}
            className="form-control asignarRol-input"
          />
          <select
            value={filtroRol}
            onChange={(e) => { setFiltroRol(e.target.value); setPaginaActual(1); }}
            className="asignarRol-select caja"
          >
            <option value="">Todos los roles</option>
            {rolesDisponibles.map((rol) => (
              <option key={rol} value={rol}>{rol}</option>
            ))}
          </select>
        </div>

        {/* 🔹 Lista de usuarios */}
        <div className="asignarRol-list">
          {usuariosPaginados.length > 0 ? (
            usuariosPaginados.map((usuario) => (
              <div key={usuario._id} className="asignarRol-card">
                <div className="asignarRol-card-info">
                  <p className="space"><strong><FiUser className="photoUser" /> </strong> {usuario.username}</p>
                  <p className="space2"><strong><FiMail className="iconUser"/> Email:</strong> {usuario.email}</p>
                  <p className="space3"><strong><FiKey className="iconUser"/> Rol:</strong> {usuario.roles.join(", ")}</p>
                </div>
                <div className="asignarRol-card-actions">
                  <select
                    className="asignarRol-select"
                    defaultValue={usuario.roles[0] || ""}
                    onChange={(e) => asignarRol(usuario._id, e.target.value)}
                  >
                    <option value="">Seleccionar nuevo rol...</option>
                    {rolesDisponibles.map((rol) => (
                      <option key={rol} value={rol}>{rol}</option>
                    ))}
                  </select>
                </div>
                <i
                  className="asignarRol-trash fi fi-rr-trash"
                  onClick={() => eliminarUsuario(usuario._id)}
                ><FiTrash2 /></i>
              </div>
            ))
          ) : (
            <p className="asignarRol-empty">No se encontraron usuarios.</p>
          )}
        </div>

        {/* 🔹 Paginación */}
        {totalPaginas > 1 && (
          <div className="asignarRol-pagination">
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                className={`pagina-btn ${paginaActual === i + 1 ? "activo" : ""}`}
                onClick={() => cambiarPagina(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
       
      </div>
    </>
  );
};

export default AsignarRol;
