import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, Trash, Plus } from "lucide-react";
import axios from 'axios';
import { auth } from "../../components/authentication/Auth";

const diasSemana = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viercoles",
  SAB: "Sábado",
};

const ModalDetalleHorario = ({
  params,
  onGuardar,
  onEliminar,
  onCerrar,
  enviarNotificacion,
}) => {
  const [horarioEdicion, setHorarioEdicion] = useState({ ...params.horario });
  const [esCreacion, setEsCreacion] = useState(params.esCreacion);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [vistaDetalle, setVistaDetalle] = useState(params.esDetalle);
  const [vistaAlumnos, setVistaAlumnos] = useState(!params.esDetalle);
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
   const [grados, setGrados] = useState([]);
  const API_HOST = process.env.REACT_APP_API_URL;
  const API_GRADOS = `${API_HOST}/api/grados`;

 const obtenerGrados = async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      };
  
      const response = await axios.get(API_GRADOS, config);
  
      // Mapear cada grado con _id y nombre
      const gradosList = response.data.items.map(item => ({
        _id: item._id,
        nombre: item.grado // Ajusta según tu API
      }));
  
      setGrados(gradosList);
  
    } catch (error) {
      console.error(" Error al cargar los grados:", error);
     
  
      // Grados por defecto en caso de error (usando _id falso para compatibilidad)
      setGrados([
        { _id: '1', nombre: 'Primer Grado' },
        { _id: '2', nombre: 'Segundo Grado' },
        { _id: '3', nombre: 'Tercer Grado' },
        { _id: '4', nombre: 'Cuarto Grado' },
        { _id: '5', nombre: 'Quinto Grado' },
        { _id: '6', nombre: 'Sexto Grado' }
      ]);
  
    } 
  };
  
  
     useEffect(() => {
      obtenerGrados();
    }, []);
  
    const getNombreGrado = (gradoId) => {
    const grado = grados.find(g => g._id === gradoId);
    return grado ? grado.nombre : gradoId; // Si no encuentra, devuelve el ID como fallback
  };

  const clickVistaDetalle = () => {
    setVistaDetalle(true);
    setVistaAlumnos(false);
  };

  const clickVistaAlumno = () => {
    setVistaDetalle(false);
    setVistaAlumnos(true);
  };

  const handleDiaChange = (dia) => {
    const diasActuales = horarioEdicion.dia || [];

    const nuevosDias = diasActuales.includes(dia)
      ? diasActuales.filter((d) => d !== dia)
      : [...diasActuales, dia];

    setHorarioEdicion({
      ...horarioEdicion,
      dia: nuevosDias,
    });
  };

  const handleDocenteChange = (event) => {
    const nuevoDocente = event.target.value;
    setHorarioEdicion({ ...horarioEdicion, docente_id: nuevoDocente });
  };

  const handleAsignaturaChange = (event) => {
    const nuevaAsignatura = event.target.value;
    setHorarioEdicion({ ...horarioEdicion, asignatura: nuevaAsignatura });
  };

  const handleInicioChange = (event) => {
    const nuevoInicio = event.target.value;
    setHorarioEdicion({ ...horarioEdicion, inicio: nuevoInicio });
  };

  const handleFinChange = (event) => {
    const nuevoFin = event.target.value;
    setHorarioEdicion({ ...horarioEdicion, fin: nuevoFin });
  };

  const handleAulaChange = (event) => {
    const nuevaAula = event.target.value;
    
    const aulaSeleccionada = params.aulas.find(aula => aula._id === nuevaAula);
    const textoGrado = aulaSeleccionada ? aulaSeleccionada.grado : "";
    
    setHorarioEdicion({ 
      ...horarioEdicion, 
      aula_id: nuevaAula,
      grado: textoGrado
    });
  };

  // Obtener grados únicos para el filtro
  const gradosUnicos = [...new Set(params.alumnos.map(alumno => getNombreGrado(alumno.grado_a_matricular)))].sort();

  // Filtrar alumnos según los criterios
  const alumnosFiltrados = params.alumnos.filter(alumno => {
    const coincideGrado = filtroGrado ? getNombreGrado(alumno.grado_a_matricular) === filtroGrado : true;
    const coincideNombre = filtroNombre ? 
      alumno.nombre_completo.toLowerCase().includes(filtroNombre.toLowerCase()) : true;
    
    return coincideGrado && coincideNombre;
  });

  // Manejar selección/deselección de alumnos
  const handleAlumnoSeleccion = (alumnoId) => {
    setAlumnosSeleccionados(prev => {
      if (prev.includes(alumnoId)) {
        return prev.filter(id => id !== alumnoId);
      } else {
        return [...prev, alumnoId];
      }
    });
  };

  // Manejar selección/deselección de todos los alumnos visibles
  const handleSeleccionarTodos = () => {
    const todosLosIdsVisibles = alumnosFiltrados.map(alumno => alumno._id);
    
    // Si ya están todos seleccionados, deseleccionar todos
    if (todosLosIdsVisibles.every(id => alumnosSeleccionados.includes(id))) {
      setAlumnosSeleccionados(prev => 
        prev.filter(id => !todosLosIdsVisibles.includes(id))
      );
    } else {
      // Seleccionar todos los que no estén ya seleccionados
      setAlumnosSeleccionados(prev => {
        const nuevosIds = todosLosIdsVisibles.filter(id => !prev.includes(id));
        return [...prev, ...nuevosIds];
      });
    }
  };

  // Agregar alumnos seleccionados
  const handleAlumnosAgregar = () => {
    if (alumnosSeleccionados.length === 0) {
      enviarNotificacion("Seleccione al menos un alumno", "error");
      return;
    }

    setHorarioEdicion((previo) => {
      // Filtrar alumnos que no estén ya en la lista
      const nuevosAlumnos = alumnosSeleccionados.filter(
        alumnoId => !previo.alumnos.includes(alumnoId)
      );

      if (nuevosAlumnos.length === 0) {
        enviarNotificacion("Los alumnos seleccionados ya están en la lista", "error");
        return previo;
      }

      return {
        ...previo,
        alumnos: [...previo.alumnos, ...nuevosAlumnos],
      };
    });

    // Limpiar selección después de agregar
    setAlumnosSeleccionados([]);
    enviarNotificacion(`${alumnosSeleccionados.length} alumno(s) agregado(s)`, "success");
  };

  const handleAlumnoEliminar = (id_alumno) => {
    setHorarioEdicion((previo) => ({
      ...previo,
      alumnos: previo.alumnos.filter((alumno) => alumno !== id_alumno),
    }));
  };

  return (
    <motion.div
      className="modal-overlay-donaciones"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => onCerrar()}
    >
      <motion.div
        className="modal-content-donaciones"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 20 }}
        style={{
          width: "95vw",
          maxWidth: "950px",
          minWidth: "900px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h3 className="modal-title">
          <Edit size={24} />
          Detalle del Horario
        </h3>

        <ul className="nav nav-tabs justify-content-center">
          <li className="nav-item">
            <a
              href="#"
              className={`nav-link ${vistaDetalle ? "active" : ""}`}
              onClick={clickVistaDetalle}
            >
              Detalle
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              className={`nav-link ${vistaAlumnos ? "active" : ""}`}
              onClick={clickVistaAlumno}
            >
              Alumnos
            </a>
          </li>
        </ul>
        <div className="tab-content">
          <AnimatePresence mode="wait">
            {vistaDetalle && (
              <motion.div
                key="detalle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mt-3"
              >
                {/* ... (el contenido de detalle se mantiene igual) */}
                <div className="form-group">
                  <label className="form-label">Asignatura</label>
                  <input
                    className="form-control"
                    placeholder="Escriba una asignatura..."
                    type="text"
                    value={horarioEdicion.asignatura}
                    onChange={handleAsignaturaChange}
                  />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Días de la semana</label>
                </div>
                <div className="mb-1">
                  {Object.keys(diasSemana).map((key, i) => {
                    return (
                      <div className="form-check form-check-inline" key={i}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={horarioEdicion.dia.includes(key)}
                          onChange={() => handleDiaChange(key)}
                        />
                        <label className="form-check-label">
                          {diasSemana[key]}
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="form-group">
                  <label className="form-label">Horario</label>
                  <div className="input-group">
                    <span className="input-group-text fw-bold">Inicio</span>
                    <input
                      className="form-control"
                      placeholder="00:00"
                      type="time"
                      value={horarioEdicion.inicio}
                      onChange={handleInicioChange}
                    />
                    <span className="input-group-text fw-bold">Final</span>
                    <input
                      className="form-control"
                      placeholder="00:00"
                      type="time"
                      value={horarioEdicion.fin}
                      onChange={handleFinChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Docente</label>
                  <select
                    className="form-select"
                    aria-label=""
                    value={horarioEdicion.docente_id}
                    onChange={handleDocenteChange}
                  >
                    <option value="" disabled>
                      Seleccione un docente
                    </option>
                    {params.docentes.map((docente, i) => (
                      <option key={i} value={docente._id}>
                        {docente.numero_identidad} | {docente.nombres +" "+ docente.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Grado/Aula</label>
                  <select
                    className="form-select"
                    aria-label=""
                    value={horarioEdicion.aula_id}
                    onChange={handleAulaChange}
                  >
                    <option value="" disabled>
                      Seleccione un grado/aula
                    </option>
                    {params.aulas.map((aula, i) => (
                      <option key={i} value={aula._id}>
                        {aula.grado} | {aula.aula}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
            {vistaAlumnos && (
              <motion.div
                key="alumnos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mt-3"
              >
                <h4>Alumnos asignados</h4>
                <table className="table table-striped table-hover table-bordered mb-5">
                  <thead>
                    <tr>
                      <th scope="col">Identidad</th>
                      <th scope="col">Nombre</th>
                      <th scope="col">Grado</th>
                      <th scope="col">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarioEdicion.alumnos.map((alumno_id, key) => {
                      const alumno = params.alumnos.find(a => a._id === alumno_id);
                      if (!alumno) return null;
                      
                      return (
                        <tr key={key}>
                          <td>{alumno.id_documento}</td>
                          <td>{alumno.nombre_completo}</td>
                          <td>{getNombreGrado(alumno.grado_a_matricular)}</td>

                          <td>
                            <button
                              className="btn btn-danger btn-sm text-sm"
                              onClick={() => handleAlumnoEliminar(alumno._id)}
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <h4>Agregar alumnos</h4>
                
                {/* Filtros */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Filtrar por grado</label>
                    <select
                      className="form-select"
                      value={filtroGrado}
                      onChange={(e) => setFiltroGrado(e.target.value)}
                    >
                      <option value="">Todos los grados</option>
                      {gradosUnicos.map((grado, i) => (
                        <option key={i} value={grado}>
                          {grado}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Filtrar por nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por nombre..."
                      value={filtroNombre}
                      onChange={(e) => setFiltroNombre(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista de alumnos para agregar */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6>Seleccionar alumnos ({alumnosFiltrados.length} encontrados)</h6>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleSeleccionarTodos}
                    >
                      {alumnosFiltrados.every(alumno => alumnosSeleccionados.includes(alumno._id)) 
                        ? "Deseleccionar todos" 
                        : "Seleccionar todos"}
                    </button>
                  </div>
                  
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th width="50px">Sel.</th>
                          <th>Identidad</th>
                          <th>Nombre</th>
                          <th>Grado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnosFiltrados.map((alumno, i) => (
                          <tr key={i} className={alumnosSeleccionados.includes(alumno._id) ? "table-active" : ""}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={alumnosSeleccionados.includes(alumno._id)}
                                onChange={() => handleAlumnoSeleccion(alumno._id)}
                              />
                            </td>
                            <td>{alumno.id_documento}</td>
                            <td>{alumno.nombre_completo}</td>
                            <td>{getNombreGrado(alumno.grado_a_matricular)}</td>
                          </tr>
                        ))}
                        {alumnosFiltrados.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">
                              No se encontraron alumnos con los filtros aplicados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botón para agregar seleccionados */}
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">
                    {alumnosSeleccionados.length} alumno(s) seleccionado(s)
                  </span>
                  <button
                    className="btn btn-success"
                    onClick={handleAlumnosAgregar}
                    disabled={alumnosSeleccionados.length === 0}
                  >
                    <Plus size={16} className="me-1" />
                    Agregar seleccionados
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="modal-actions-donaciones justify-content-between">
          <motion.button
            className="btn-guardar-donaciones"
            onClick={() => onGuardar(horarioEdicion, esCreacion)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Guardar
          </motion.button>
          {!esCreacion && (
            <motion.button
              className="btn btn-danger"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEliminar(horarioEdicion._id)}
            >
              Eliminar
            </motion.button>
          )}
          <motion.button
            type="button"
            className="btn btn-dark"
            onClick={() => onCerrar()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cerrar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalDetalleHorario;