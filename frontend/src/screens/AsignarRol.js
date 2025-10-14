import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AsignarRol.css";
import { auth } from "../components/authentication/Auth";
import { FiTrash2, FiMail, FiUser, FiKey } from "react-icons/fi";
import UsuariosChart from '../components/UsuariosChart';
import { HiMiniMagnifyingGlassCircle } from "react-icons/hi2";

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

  // 🔹 Obtener usuarios desde MongoDB
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

  // 🔹 Asignar nuevo rol
  const asignarRol = async (id, nuevoRol) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.put(`${API_URL}api/usuarios/${id}/rol`, { roles: [nuevoRol] }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const usuarioActualizado = usuarios.find((u) => u._id === id);
      alert(
      `✅ Rol actualizado correctamente para ${usuarioActualizado?.username || "usuario desconocido"} ` +
      `(Email: ${usuarioActualizado?.email || "sin email"})`
    );

      setUsuarios((prev) =>
        prev.map((u) => (u._id === id ? { ...u, roles: [nuevoRol] } : u))
      );
       // 🔹 Forzar actualización del chart
      setActualizarChart((prev) => !prev);
    } catch (error) {
      console.error("Error al asignar rol:", error);
      alert(error.response?.data?.message || "❌ No se pudo actualizar el rol.");
    }
  };



  // Función para eliminar un usuario
  const eliminarUsuario = async (id) => {
    // Confirmación
    if (!window.confirm("⚠️ ¿Seguro que deseas eliminar este usuario?")) return;

    try {
      // Obtener token del usuario actual
      const user = auth.currentUser;
      const token = await user.getIdToken();

      // Petición DELETE a la API
      await axios.delete(`${API_URL}api/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
 
      // Buscar el usuario eliminado para el mensaje
      const usuarioEliminado = usuarios.find((u) => u._id === id);
      const nombre = usuarioEliminado?.username || "desconocido";
      console.log("AYUDAA",usuarios.find((u) => u._id === id));
      // Mostrar mensaje de éxito
      setMensaje(
        <span>🗑 Usuario <strong>{nombre}</strong> eliminado correctamente</span>
      );

      // Actualizar lista de usuarios en frontend
      setUsuarios((prev) => prev.filter((u) => u._id !== id));
       // 🔹 Forzar actualización del chart
      setActualizarChart((prev) => !prev);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);

      // Mensaje de error
      if (error.response && error.response.data?.message) {
        setMensaje(`❌ ${error.response.data.message}`);
      } else {
        setMensaje("❌ No se pudo eliminar el usuario.");
      }
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
    <div className="RolHeader">
      <div className="headerRoles">
        <h2 className="asignarRol-title">Gestión de roles y usuarios</h2>
      </div>
       <div className='dashMain'><UsuariosChart  actualizar={actualizarChart}/></div>
       <div className="headerRoles">
        <h2 className="asignarRol-title">Asignación de roles</h2>
      </div>
      <div className="asignarRol-container">        <HiMiniMagnifyingGlassCircle size={50} color={"#3b3b3bff"} />
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
    </div>
  );
};

export default AsignarRol;
