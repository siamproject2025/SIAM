import React, { useState, useEffect } from "react";
import axios from "axios";

const FormularioActividad = ({ onActividadCreada }) => {
  const [formulario, setFormulario] = useState({
    nombre: "",
    fecha: "",
    lugar: "",
    descripcion: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);

  // Cargar actividades para el listado
  const cargarActividades = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/actividades");
      setActividades(res.data);
    } catch (error) {
      console.error("Error al cargar actividades:", error);
    }
  };

  useEffect(() => {
    cargarActividades();
  }, []);

  // Manejar selección de actividad para editar
  const handleSeleccionar = (actividad) => {
    setActividadSeleccionada(actividad);
    setFormulario({
      nombre: actividad.nombre,
      fecha: actividad.fecha.slice(0, 16), // Formato datetime-local compatible (yyyy-MM-ddTHH:mm)
      lugar: actividad.lugar,
      descripcion: actividad.descripcion,
    });
    setMensaje("");
  };

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  // Crear o actualizar actividad
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      if (actividadSeleccionada) {
        // Actualizar
        const response = await axios.put(
          `http://localhost:5000/api/actividades/${actividadSeleccionada._id}`,
          formulario
        );
        if (response.status === 200) {
          setMensaje("✅ Actividad actualizada");
          setActividadSeleccionada(null);
          setFormulario({
            nombre: "",
            fecha: "",
            lugar: "",
            descripcion: "",
          });
          cargarActividades();
          onActividadCreada();
        }
      } else {
        // Crear
        const response = await axios.post(
          "http://localhost:5000/api/actividades",
          formulario
        );
        if (response.status === 201) {
          setMensaje("✅ Actividad registrada");
          setFormulario({
            nombre: "",
            fecha: "",
            lugar: "",
            descripcion: "",
          });
          cargarActividades();
          onActividadCreada();
        }
      }
    } catch (error) {
      console.error("Error al guardar actividad:", error);
      setMensaje(
        error.response?.data?.mensaje || "❌ Error desconocido al guardar actividad"
      );
    }
  };

  // Eliminar actividad
  const handleEliminar = async () => {
    if (!actividadSeleccionada) return;
    if (!window.confirm("¿Seguro que deseas eliminar esta actividad?")) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/actividades/${actividadSeleccionada._id}`
      );
      if (response.status === 200) {
        setMensaje("✅ Actividad eliminada");
        setActividadSeleccionada(null);
        setFormulario({
          nombre: "",
          fecha: "",
          lugar: "",
          descripcion: "",
        });
        cargarActividades();
        onActividadCreada();
      }
    } catch (error) {
      console.error("Error al eliminar actividad:", error);
      setMensaje(
        error.response?.data?.mensaje || "❌ Error desconocido al eliminar actividad"
      );
    }
  };

  // Fecha mínima para datetime-local (yyyy-MM-ddTHH:mm)
  const fechaMinima = new Date().toISOString().slice(0, 16);

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2>{actividadSeleccionada ? "Editar Actividad" : "Registrar Actividad"}</h2>
      {mensaje && <p>{mensaje}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={formulario.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Fecha y Hora:</label>
          <input
            type="datetime-local"
            name="fecha"
            value={formulario.fecha}
            min={fechaMinima}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Lugar:</label>
          <input
            type="text"
            name="lugar"
            value={formulario.lugar}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Descripción:</label>
          <textarea
            name="descripcion"
            value={formulario.descripcion}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">{actividadSeleccionada ? "Actualizar" : "Registrar"}</button>
        {actividadSeleccionada && (
          <button
            type="button"
            onClick={handleEliminar}
            style={{ marginLeft: "1rem", backgroundColor: "red", color: "white" }}
          >
            Eliminar
          </button>
        )}
        {actividadSeleccionada && (
          <button
            type="button"
            onClick={() => {
              setActividadSeleccionada(null);
              setFormulario({
                nombre: "",
                fecha: "",
                lugar: "",
                descripcion: "",
              });
              setMensaje("");
            }}
            style={{ marginLeft: "1rem" }}
          >
            Cancelar
          </button>
        )}
      </form>

      <h3>Actividades Registradas</h3>
      <ul style={{ maxHeight: "300px", overflowY: "auto", padding: 0, listStyle: "none" }}>
        {actividades.map((act) => (
          <li
            key={act._id}
            style={{
              cursor: "pointer",
              fontWeight: actividadSeleccionada?._id === act._id ? "bold" : "normal",
              marginBottom: "1rem",
              border: "1px solid #ccc",
              padding: "0.5rem",
              borderRadius: "5px",
              backgroundColor: actividadSeleccionada?._id === act._id ? "#eef" : "white",
            }}
            onClick={() => handleSeleccionar(act)}
          >
            <strong>{act.nombre}</strong> - {new Date(act.fecha).toLocaleString()}
            <br />
            <em>{act.descripcion}</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FormularioActividad;
