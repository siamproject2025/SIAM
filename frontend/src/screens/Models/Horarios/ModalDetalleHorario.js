import { useState } from "react"



const diasSemana = {
    LUN: "Lunes",
    MAR: "Martes",
    MIE: "Miércoles",
    JUE: "Jueves",
    VIE: "Viernes",
    SAB: "Sábado"
}

const ModalDetalleHorario = ({ params, onGuardar, onEliminar, onCerrar }) => {
    const [horarioEdicion, setHorarioEdicion] = useState({ ...params.horario });
    const [esCreacion, setEsCreacion] = useState(params.esCreacion);

    const handleDiaChange = (event) => {
        const nuevoDia = event.target.value;
        setHorarioEdicion({ ...horarioEdicion, dia: nuevoDia });
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
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">Detalle del Horario</h3>

                <div className="form-group">
                    <label className="form-label">Asignatura</label>
                    <input className="form-control" placeholder="Escriba una asignatura..." type="text" value={horarioEdicion.asignatura} onChange={handleAsignaturaChange} />
                </div>
                <div className="form-group">
                    <label className="form-label">Día de la semana</label>
                    <select className="form-select" aria-label="" value={horarioEdicion.dia} onChange={handleDiaChange}>
                        <option value="" disabled>Seleccione un día de la semana</option>
                        {Object.keys(diasSemana).map((key, i) => (
                            <option key={i} value={key}>{diasSemana[key]}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Horario</label>
                    <div className="input-group">
                        {/* TODO: usar un timePicker */}
                        <span className="input-group-text fw-bold">Inicio</span>
                        <input className="form-control" placeholder="00:00" type="text" value={horarioEdicion.inicio} onChange={handleInicioChange} />
                        <span className="input-group-text fw-bold">Final</span>
                        <input className="form-control" placeholder="00:00" type="text" value={horarioEdicion.fin} onChange={handleFinChange}/>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Grado</label>
                    <input className="form-control" placeholder="Escriba el grado..." type="text" value={horarioEdicion.grado} onChange={handleGradoChange}/>
                </div>
                <div className="form-group">
                    <label className="form-label">Docente</label>
                    <select className="form-select" aria-label="" value={horarioEdicion.docente_id} onChange={handleDocenteChange}>
                        <option value="" disabled>Seleccione un docente</option>
                        {params.docentes.map((docente, i) => (
                            <option key={i} value={docente._id}>{docente.identidad} | {docente.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Aula</label>
                    <select className="form-select" aria-label="" value={horarioEdicion.aula_id} onChange={handleAulaChange}>
                        <option value="" disabled>Seleccione un aula</option>
                        {params.aulas.map((aula, i) => (
                            <option key={i} value={aula._id}>{aula.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="modal-actions">
                    <button className="btn-guardar" onClick={() => onGuardar(horarioEdicion, esCreacion)}>Guardar</button>
                    {!esCreacion && (<button className="btn-eliminar" onClick={() => onEliminar(horarioEdicion._id)}>Eliminar</button>)}
                    <button className="btn-cerrar" onClick={() => onCerrar()}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalDetalleHorario;