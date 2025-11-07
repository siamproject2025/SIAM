import { useEffect, useState } from "react";
import ModalDetalleHorario from "./Horarios/ModalDetalleHorario";
import CardHorario from "./Horarios/CardHorario";
import ModalAlumnosHorario from "./Horarios/ModalAlumnosHorario";
import axios from "axios";

const API_HOST = "http://localhost:5000";
const API_HORARIO = `${API_HOST}/api/horario`;
const API_ALUMNO = `${API_HOST}/api/alumno`;
const API_DOCENTE = `${API_HOST}/api/docente`;
const API_AULA = `${API_HOST}/api/aula`;

const inicializarHorario = () => {
    return {
        _id: "",
        asignatura: "",
        inicio: "",
        fin: "",
        dia: "",
        grado: "",
        docente_id: "",
        aula_id: "",
        alumnos: []
    }
};

const Horarios = () => {
    const [horarios, setHorarios] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [docentes, setDocentes] = useState([]);
    const [aulas, setAulas] = useState([]);
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
    const [mostrarModalAlumnos, setMostrarModalAlumnos] = useState(false);
    const [esModalCreacion, setEsModalCreacion] = useState(false);


    const clickCardHorarioHandler = async (id) => {
        try {
            const res = await axios.get(`${API_HORARIO}/${id}`)
            setHorarioSeleccionado(res.data);
            setEsModalCreacion(false);
            setMostrarModalDetalle(true);
        } catch (error) {
            console.error("Error al cargar el horario", error)
        }
    };

    const clickCardAlumnosHandler = async (id) => {
        const res = await axios.get(`${API_HORARIO}/${id}`)
        setHorarioSeleccionado(res.data);
        setMostrarModalAlumnos(true);
    }

    const clickCerrarModeloHandler = () => {
        setHorarioSeleccionado(null);
        setMostrarModalDetalle(false);
    };

    const clickCerrarAlumnoHandler = () => {
        setHorarioSeleccionado(null);
        setMostrarModalAlumnos(false);
    };

    const clickCrearModeloHandler = () => {
        setHorarioSeleccionado(inicializarHorario());
        setEsModalCreacion(true);
        setMostrarModalDetalle(true);
    }

    const generarCards = () => {
        return horarios.map(
            (horario, i) => <CardHorario key={i} params={{ horario, aulas }} onClick={clickCardHorarioHandler} onClickAlumnos={clickCardAlumnosHandler} />);
    }

    const clickGuardarModeloHandler = async (horario, esCreacion) => {
        const id = horario._id;
        delete horario._id;

        try {
            if (esCreacion) {
                const res = await axios.post(API_HORARIO, horario);
                await obtenerHorarios();
            }
            else {
                const res = await axios.put(`${API_HORARIO}/${id}`, horario);
                await obtenerHorarios();
            }
        } catch (error) {
            console.error("Error al cargar los datos", error);
        }

        clickCerrarModeloHandler();
        clickCerrarAlumnoHandler();
    };

    const clickEliminarModeloHandler = (id_horario) => {

    };

    const obtenerHorarios = async () => {
        try {
            const resHorario = await axios.get(API_HORARIO);
            const resAulas = await axios.get(API_AULA);
            const resAlumnos = await axios.get(API_ALUMNO);
            const resDocentes = await axios.get(API_DOCENTE);

            setHorarios(resHorario.data);
            setAulas(resAulas.data);
            setAlumnos(resAlumnos.data);
            setDocentes(resDocentes.data);
        } catch (error) {
            console.error("Error al cargar los datos", error)
        }
    };
    useEffect(() => {
        obtenerHorarios();
    }, [])
    return (
        <>
            <div className="bien-container">
                <div className="bien-header">
                    <h2>Sistema de Horarios</h2>
                    <p>Gestiona y controla los horarios</p>
                    <button className="btn-nueva-bien" onClick={clickCrearModeloHandler}>+ Nuevo Horario</button>
                </div>

            </div>
            <div className="container">
                <div className="row d-flex justify-content-between">
                    {generarCards()}
                </div>
            </div>
            {mostrarModalDetalle && (
                <ModalDetalleHorario
                    params={{ horario: horarioSeleccionado, docentes: docentes, aulas: aulas, esCreacion: esModalCreacion }}
                    onCerrar={clickCerrarModeloHandler}
                    onEliminar={clickEliminarModeloHandler}
                    onGuardar={clickGuardarModeloHandler}
                />
            )}
            {mostrarModalAlumnos && (
                <ModalAlumnosHorario
                    params={{ horario: horarioSeleccionado, alumnos: alumnos }}
                    onCerrar={clickCerrarAlumnoHandler}
                    onGuardar={clickGuardarModeloHandler}
                />
            )}
        </>
    )
}

export default Horarios;