import { useState } from "react";
import { motion } from "framer-motion";
import { Edit } from "lucide-react";

const diasSemana = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
};

const ModalDetalleHorario = ({ params, onGuardar, onEliminar, onCerrar }) => {
  const [horarioEdicion, setHorarioEdicion] = useState({ ...params.horario });
  const [esCreacion, setEsCreacion] = useState(params.esCreacion);

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
      >
        <h3 className="modal-title">
          <Edit size={24} />
          Detalle del Horario
        </h3>

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
                <label key={i} class="form-check-label" for="inlineCheckbox1">
                  {diasSemana[key]}
                </label>
              </div>
            );
          })}
        </div>
        <div className="form-group">
          <label className="form-label">Horario</label>
          <div className="input-group">
            {/* TODO: usar un timePicker */}
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
                {docente.identidad} | {docente.nombre}
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
