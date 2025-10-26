import { useState } from "react";

const ModalAlumnosHorario = ({ params, onGuardar, onCerrar }) => {
    const [horarioEdicion, setHorarioEdicion] = useState({ ...params.horario });
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");

    const handleAlumnoChange = (event) => {
        const nuevoAlumno = event.target.value;
        setAlumnoSeleccionado(nuevoAlumno);
    }

    const handleAlumnoAgregar = () => {
        if (!alumnoSeleccionado) return; // Validar que no esté vacío

        setHorarioEdicion(previo => {
            // Verificar si el alumno ya existe en la lista
            const yaExiste = previo.alumnos.some(alumno =>
                alumno._id === alumnoSeleccionado._id
            );

            if (yaExiste) {
                console.log('El alumno ya está en la lista');
                return previo; // No hacer cambios
            }

            return {
                ...previo,
                alumnos: [...previo.alumnos, alumnoSeleccionado]
            };
        });

        setAlumnoSeleccionado("");
    };

    const handleAlumnoEliminar = (id_alumno) => {
        setHorarioEdicion(previo => ({ ...previo, alumnos: previo.alumnos.filter(alumno => alumno !== id_alumno) }))
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">Alumnos de {horarioEdicion.asignatura} de {horarioEdicion.grado}</h3>
                <h4>Alumnos asignados</h4>
                <table className="table table-striped table-hover table-bordered mb-5">
                    <thead>
                        <th scope="col">Identidad</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Acción</th>
                    </thead>
                    <tbody>
                        {horarioEdicion.alumnos.map((alumno_id, key) => {
                            const alumno = params.alumnos.filter((a) => a._id == alumno_id)[0];
                            return (
                                <tr key={key}>
                                    <td>{alumno.identidad}</td>
                                    <td>{alumno.nombre}</td>
                                    <td className="justify-content-between">
                                        <a className="btn btn-danger btn-sm text-sm" onClick={() => handleAlumnoEliminar(alumno._id)}>Eliminar</a>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <h4>Agregar alumnos</h4>
                <div className="form-group">
                    <div className="input-group">
                        <select className="form-select" aria-label="" value={alumnoSeleccionado} onChange={handleAlumnoChange}>
                            <option value="" disabled>Seleccione un alumno</option>
                            {params.alumnos.map((alumno, i) => (
                                <option key={i} value={alumno._id}>{alumno.identidad} | {alumno.nombre}</option>
                            ))}
                        </select>
                        <button className="btn btn-success" onClick={handleAlumnoAgregar}><i className="fa fa-plus"></i> Agregar</button>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-guardar" onClick={() => onGuardar(horarioEdicion, false)}>Guardar</button>
                    <button className="btn-cerrar" onClick={() => onCerrar()}>Cerrar</button>
                </div>
            </div>
        </div>
    )
}

export default ModalAlumnosHorario;