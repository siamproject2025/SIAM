import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, Trash, Plus } from "lucide-react";

const diasSemana = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
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
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");
  const [vistaDetalle, setVistaDetalle] = useState(params.esDetalle);
  const [vistaAlumnos, setVistaAlumnos] = useState(!params.esDetalle);

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
      ? diasActuales.filter((d) => d !== dia) // Remover el día si ya está seleccionado
      : [...diasActuales, dia]; // Agregar el día si no está seleccionado

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
  const handleGradoChange = (event) => {
    const nuevoGrado = event.target.value;
    setHorarioEdicion({ ...horarioEdicion, grado: nuevoGrado });
  };

  const handleAulaChange = (event) => {
    const nuevaAula = event.target.value;
    setHorarioEdicion({ ...horarioEdicion, aula_id: nuevaAula });
  };

  const handleAlumnoChange = (event) => {
    const nuevoAlumno = event.target.value;
    setAlumnoSeleccionado(nuevoAlumno);
  };

  const handleAlumnoAgregar = () => {
  if (!alumnoSeleccionado) return;

  setHorarioEdicion((previo) => {
    // Validar si ya existe el alumno por su ID
    const yaExiste = previo.alumnos.includes(alumnoSeleccionado);

    if (yaExiste) {
      enviarNotificacion("El alumno ya está en la lista", "error");
      return previo;
    }

    return {
      ...previo,
      alumnos: [...previo.alumnos, alumnoSeleccionado],
    };
  });

  setAlumnoSeleccionado("");
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
                      <div class="form-check form-check-inline">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          checked={horarioEdicion.dia.includes(key)}
                          onChange={() => handleDiaChange(key)}
                        ></input>
                        <label
                          key={i}
                          class="form-check-label"
                          for="inlineCheckbox1"
                        >
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
                  <label className="form-label">Grado</label>
                  <input
                    className="form-control"
                    placeholder="Escriba el grado..."
                    type="text"
                    value={horarioEdicion.grado}
                    onChange={handleGradoChange}
                  />
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
                  <label className="form-label">Aula</label>
                  <select
                    className="form-select"
                    aria-label=""
                    value={horarioEdicion.aula_id}
                    onChange={handleAulaChange}
                  >
                    <option value="" disabled>
                      Seleccione un aula
                    </option>
                    {params.aulas.map((aula, i) => (
                      <option key={i} value={aula._id}>
                        {aula.nombre}
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
                    <th scope="col">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horarioEdicion.alumnos.map((alumno_id, key) => {
                      const alumno = params.alumnos.filter(
                        (a) => a._id == alumno_id
                      )[0];
                      return (
                        <tr key={key}>
                          <td>{alumno.id_documento}</td>
                          <td>{alumno.nombre_completo}</td>
                          <td className="justify-content-between">
                            <a
                              className="btn btn-danger btn-sm text-sm"
                              onClick={() => handleAlumnoEliminar(alumno._id)}
                            >
                              <Trash />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <h4>Agregar alumnos</h4>
                <div className="form-group">
                  <div className="input-group">
                    <select
                      className="form-select"
                      aria-label=""
                      value={alumnoSeleccionado}
                      onChange={handleAlumnoChange}
                    >
                      <option value="" disabled>
                        Seleccione un alumno
                      </option>
                      {params.alumnos.map((alumno, i) => (
                        
                        <option key={i} value={alumno._id}>
                          {alumno.id_documento} | {alumno.nombre_completo}
                          
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-success"
                      onClick={handleAlumnoAgregar}
                    >
                      <Plus />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="modal-actions-donaciones justify-content-between">
          <motion.button
            className="btn-guardar"
            onClick={() => onGuardar(horarioEdicion, esCreacion)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Guardar
          </motion.button>
          {!esCreacion && (
            <motion.button
              className="btn-eliminar-personal"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEliminar(horarioEdicion._id)}
            >
              Eliminar
            </motion.button>
          )}
          <motion.button
            type="button"
            className="btn-cerrar"
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
