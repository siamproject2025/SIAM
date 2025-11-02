import { useEffect, useState } from "react";
import ModalDetalleHorario from "../../components/Horarios/ModalDetalleHorario";
import ModalAlumnosHorario from "../../components/Horarios/ModalAlumnosHorario";
import BusquedaTablaHorarios from "../../components/Horarios/TablaHorario";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Book, Calendar, Table2 } from "lucide-react";
import CalendarioHorarios from "../../components/Horarios/CalendarioHorarios";

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
    alumnos: [],
  };
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
  const [horariosContent, setHorariosContent] = useState(true);
  const [calendarioContent, setCalendarioContent] = useState(false);

  const clickHorariosContent = async () => {
    setHorariosContent(true);
    setCalendarioContent(false);
  };
  const clickCalendarioContent = async () => {
    setHorariosContent(false);
    setCalendarioContent(true);
  };

  const clickDetalleHorarioHandler = async (id) => {
    try {
      const res = await axios.get(`${API_HORARIO}/${id}`);
      setHorarioSeleccionado(res.data);
      setEsModalCreacion(false);
      setMostrarModalDetalle(true);
    } catch (error) {
      console.error("Error al cargar el horario", error);
    }
  };

  const clickDetalleAlumnosHandler = async (id) => {
    const res = await axios.get(`${API_HORARIO}/${id}`);
    setHorarioSeleccionado(res.data);
    setMostrarModalAlumnos(true);
  };

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
  };

  const clickGuardarModeloHandler = async (horario, esCreacion) => {
    const id = horario._id;
    delete horario._id;

    try {
      if (esCreacion) {
        const res = await axios.post(API_HORARIO, horario);
        await obtenerHorarios();
      } else {
        const res = await axios.put(`${API_HORARIO}/${id}`, horario);
        await obtenerHorarios();
      }
    } catch (error) {
      console.error("Error al cargar los datos", error);
    }

    clickCerrarModeloHandler();
    clickCerrarAlumnoHandler();
  };

  const clickEliminarModeloHandler = async (id_horario) => {
    try {
      const res = await axios.delete(`${API_HORARIO}/${id_horario}`);
      await obtenerHorarios();
    } catch (error) {
      console.error("Error al eliminar el horario", error);
    }

    clickCerrarModeloHandler();
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
      console.error("Error al cargar los datos", error);
    }
  };

  useEffect(() => {
    obtenerHorarios();
  }, []);

  return (
    <>
      <div className="donacion-container">
        <motion.div
          className="donacion-header"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        >
          <motion.div
            className="header-gradient"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="header-content">
              <motion.h2
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.3,
                  }}
                >
                  <Calendar size={36} fill="white" color="white" />
                </motion.div>
                Gestión de Horarios
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  style={{ marginLeft: "auto" }}
                >
                  <Calendar size={32} color="white" />
                </motion.div>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Gestiona y controla los horarios y distribución de las aulas.
              </motion.p>

              <motion.div
                className="floating-icons"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.div
                  className="floating-icon"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Calendar size={20} color="white" />
                </motion.div>
                <motion.div
                  className="floating-icon"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, -8, 8, 0],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <Apple size={20} color="white" />
                </motion.div>
                <motion.div
                  className="floating-icon"
                  animate={{
                    y: [0, -12, 0],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                >
                  <Book size={20} color="white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="nav nav-tabs justify-content-center"
        >
          <li className="nav-item">
            <a
              href="#"
              className={`nav-link ${horariosContent ? "active" : ""}`}
              onClick={clickHorariosContent}
            >
              <Table2 /> Horarios
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              className={`nav-link ${calendarioContent ? "active" : ""}`}
              onClick={clickCalendarioContent}
            >
              <Calendar /> Calendario
            </a>
          </li>
        </motion.ul>
        <div className="tab-content">
          <AnimatePresence>
            {horariosContent && (
              <BusquedaTablaHorarios
                horarios={horarios}
                aulas={aulas}
                onDetalleHorario={clickDetalleHorarioHandler}
                onDetalleAlumnos={clickDetalleAlumnosHandler}
                onCrearHorario={clickCrearModeloHandler}
                onEliminarHorario={clickEliminarModeloHandler}
              />
            )}
            {calendarioContent && (
              <CalendarioHorarios
                horarios={horarios}
                onDetalleHorario={clickDetalleHorarioHandler}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {mostrarModalDetalle && (
          <ModalDetalleHorario
            params={{
              horario: horarioSeleccionado,
              docentes: docentes,
              aulas: aulas,
              esCreacion: esModalCreacion,
            }}
            onCerrar={clickCerrarModeloHandler}
            onEliminar={clickEliminarModeloHandler}
            onGuardar={clickGuardarModeloHandler}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {mostrarModalAlumnos && (
          <ModalAlumnosHorario
            params={{ horario: horarioSeleccionado, alumnos: alumnos }}
            onCerrar={clickCerrarAlumnoHandler}
            onGuardar={clickGuardarModeloHandler}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Horarios;
