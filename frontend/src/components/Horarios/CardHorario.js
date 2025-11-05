import { useState } from "react"

const CardHorario = ({ params, onClick, onClickAlumnos }) => {
    const { horario, aulas } = params;

    return (
        <div className="card col-sm-12 col-md-3 m-1">
            <div className="card-body">
                <h5 className="card-title">{horario.asignatura}</h5>
                <h6 className="card-subtitle mb-2 text-body-secondary">{aulas.filter((aula) => aula._id == horario.aula_id)[0].nombre}</h6>
                <p className="card-text mb-0 text-start">
                    <strong>Día: </strong>
                    <span>{horario.dia}</span>
                </p>
                <p className="card-text mb-0 text-start">
                    <strong>Horario: </strong>
                    <span>{horario.inicio} - {horario.fin}</span>
                </p>
                <p className="card-text mb-0 text-start">
                    <strong>Grado: </strong>
                    <span>{horario.grado}</span>
                </p>
                <a className="btn btn-outline-primary btn-sm m-1" onClick={() => onClick(horario._id)}>Detalle</a>
                <a className="btn btn-outline-success btn-sm m-1" onClick={() => onClickAlumnos(horario._id)}>Alumnos</a>
            </div>
        </div>
    )
}

export default CardHorario;