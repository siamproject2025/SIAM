// src/pages/Horarios.jsx
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ModalDetalleHorario from "../../components/Horarios/ModalDetalleHorario";
import BusquedaTablaHorarios from "../../components/Horarios/TablaHorario";
import CalendarioHorarios from "../../components/Horarios/CalendarioHorarios";
import useUserRole from "../../components/hooks/useUserRole";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Apple, Book, Calendar, Table2, X, FileText, Image } from "lucide-react";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { auth } from "../../components/authentication/Auth";

const API_HOST = process.env.REACT_APP_API_URL;
const API_HORARIO = `${API_HOST}/api/horario`;
const API_ALUMNO = `${API_HOST}/api/matriculas`;
const API_DOCENTE = `${API_HOST}/api/personal`;
const API_AULA = `${API_HOST}/api/aula`;

const inicializarHorario = () => ({
  _id: "",
  asignatura: "",
  inicio: "",
  fin: "",
  dia: [],
  grado: "",
  docente_id: "",
  aula_id: "",
  alumnos: [],
});

const Horarios = () => {
  const { userRole, cargando } = useUserRole();
  const calendarioRef = useRef(null);

  const CAN_EDIT = userRole === "ADMIN" || userRole === "DOCENTE";
  const CAN_VIEW = userRole === "ADMIN" || userRole === "DOCENTE" || userRole === "PADRE";
  const CAN_SEE_ALL_TABS = userRole === "ADMIN" || userRole === "DOCENTE" || userRole === "PADRE";

  const [horarios, setHorarios] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [esModalCreacion, setEsModalCreacion] = useState(false);
  const [esModalDetalle, setEsModalDetalle] = useState(true);
  const [horariosContent, setHorariosContent] = useState(true);
  const [calendarioContent, setCalendarioContent] = useState(false);
  const [gradosContent, setGradosContent] = useState(false);
  const [notification, setNotification] = useState(null);
  const [gradoSeleccionado, setGradoSeleccionado] = useState("");
  const [mostrarSelectorFormato, setMostrarSelectorFormato] = useState(false);

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ------------------------------ FUNCIONES CON TOKEN ------------------------------
  const obtenerHorarios = useCallback(async () => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resHorario, resAulas, resAlumnos, resDocentes] = await Promise.all([
        axios.get(API_HORARIO, config),
        axios.get(API_AULA, config),
        axios.get(API_ALUMNO, config),
        axios.get(API_DOCENTE, config),
      ]);

      setHorarios(resHorario.data);console.log("ayudaaaaaaa",resHorario.data)
      setAulas(resAulas.data);
      setAlumnos(resAlumnos.data.data);
      setDocentes(resDocentes.data);
    } catch (error) {
      console.error("❌ Error al cargar los datos:", error);
      showNotification("💥 Error al cargar datos.", "error");
    }
  }, [showNotification]);

  const clickDetalleHorarioHandler = async (id) => {
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const res = await axios.get(`${API_HORARIO}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHorarioSeleccionado(res.data);
      setEsModalCreacion(false);
      setEsModalDetalle(true);
      setMostrarModalDetalle(true);
    } catch (error) {
      const { type, message } = error.response?.data || {};
      showNotification(`Error al obtener horario: ${message || error.message}`, "error");
    }
  };

  const clickCerrarModeloHandler = () => {
    setHorarioSeleccionado(null);
    setMostrarModalDetalle(false);
  };

  const clickCrearModeloHandler = () => {
    if (!CAN_EDIT) return showNotification("❌ Permiso denegado para crear horarios.", "error");
    setHorarioSeleccionado(inicializarHorario());
    setEsModalCreacion(true);
    setEsModalDetalle(true);
    setMostrarModalDetalle(true);
  };

  const clickGuardarModeloHandler = async (horario, esCreacion) => {
    if (!CAN_EDIT) return showNotification("❌ Permiso denegado para guardar cambios.", "error");
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      if (esCreacion) {
        const { _id, ...horarioSinId } = horario;
        await axios.post(API_HORARIO, horarioSinId, { headers });
        showNotification("✅ Horario creado con éxito.", "success");
      } else {
        if (!horario._id) throw new Error("ID no encontrado para actualizar.");
        await axios.put(`${API_HORARIO}/${horario._id}`, horario, { headers });
        showNotification("✅ Horario actualizado con éxito.", "success");
      }

      await obtenerHorarios();
      clickCerrarModeloHandler();
    } catch (error) {
      const { type, message } = error.response?.data || {};
      showNotification(`Error al guardar: ${message || error.message}`, "error");
    }
  };

  const clickEliminarModeloHandler = async (id_horario) => {
    if (!CAN_EDIT) return showNotification("❌ Permiso denegado para eliminar horarios.", "error");
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      await axios.delete(`${API_HORARIO}/${id_horario}`, { headers: { Authorization: `Bearer ${token}` } });
      showNotification("✅ Horario eliminado exitosamente", "success");
      await obtenerHorarios();
    } catch (error) {
      const { type, message } = error.response?.data || {};
      showNotification(`Error al eliminar: ${message || error.message}`, "error");
    }
    clickCerrarModeloHandler();
  };

  // ------------------------------ FILTRADO POR GRADO ------------------------------
  const horariosVisibles = useMemo(() => (CAN_VIEW ? horarios : []), [horarios, CAN_VIEW]);

  const gradosUnicos = useMemo(() => {
    if (!horariosVisibles || horariosVisibles.length === 0) return [];
    const gradosConValores = horariosVisibles.map(h => h.grado).filter(g => g && g !== "");
    return [...new Set(gradosConValores)].sort();
  }, [horariosVisibles]);

  useEffect(() => {
    if (gradosUnicos.length > 0 && !gradoSeleccionado) setGradoSeleccionado(gradosUnicos[0]);
  }, [gradosUnicos, gradoSeleccionado]);

  const horariosFiltradosPorGrado = useMemo(() => {
    if (!gradoSeleccionado) return [];
    return horariosVisibles.filter(h => h.grado === gradoSeleccionado);
  }, [horariosVisibles, gradoSeleccionado]);

  // ------------------------------ PESTAÑAS ------------------------------
  const clickHorariosContent = () => {
    if (!CAN_SEE_ALL_TABS) return;
    setHorariosContent(true);
    setCalendarioContent(false);
    setGradosContent(false);
  };
  const clickCalendarioContent = () => {
    setHorariosContent(false);
    setCalendarioContent(true);
    setGradosContent(false);
  };
  const clickGradosContent = () => {
    if (!CAN_VIEW) return showNotification("❌ Permiso denegado.", "error");
    setHorariosContent(false);
    setCalendarioContent(false);
    setGradosContent(true);
  };

  // ------------------------------ DESCARGA ------------------------------
  const descargarHorarioHandler = async (formato) => {
    if (!calendarioRef.current) return showNotification("⚠️ El contenido del horario no está listo para descargar.", "warning");
    setMostrarSelectorFormato(false);
    showNotification(`⏳ Generando archivo en formato ${formato.toUpperCase()}...`, "info");
    const nombreBase = `Horario_${gradoSeleccionado || 'General'}_${new Date().toLocaleDateString()}`;

    try {
      const canvas = await html2canvas(calendarioRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      if (formato === 'png') {
        canvas.toBlob(blob => saveAs(blob, `${nombreBase}.png`), 'image/png');
        showNotification("✅ Horario PNG descargado con éxito.", "success");
      } else if (formato === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
        pdf.save(`${nombreBase}.pdf`);
        showNotification("✅ Horario PDF descargado con éxito.", "success");
      }
    } catch (error) {
      console.error(error);
      showNotification("💥 Error al descargar el horario.", "error");
    }
  };

  useEffect(() => { if (!cargando) obtenerHorarios(); }, [cargando, obtenerHorarios]);

  if (cargando || (!CAN_VIEW && !cargando)) return (
    <div className="text-center p-5">
      {cargando ? "Cargando datos y verificando permisos..." :
        <div className="alert alert-danger">❌ No tienes permiso para ver esta sección.</div>}
    </div>
  );

  // ------------------------------ RENDER ------------------------------
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

        {/* Navegación de pestañas */}
        <motion.ul className="nav nav-tabs justify-content-center"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.6 }}>
          {CAN_SEE_ALL_TABS && <li className="nav-item">
            <a href="#" className={`nav-link ${horariosContent ? "active" : ""}`} onClick={clickHorariosContent}><Table2 /> Horarios</a>
          </li>}
          {CAN_VIEW && <li className="nav-item">
            <a href="#" className={`nav-link ${gradosContent ? "active" : ""}`} onClick={clickGradosContent}><Book /> Horario Por Grado</a>
          </li>}
        </motion.ul>

        <div className="tab-content">
          <AnimatePresence>
            {horariosContent && <BusquedaTablaHorarios
              horarios={horariosVisibles}
              aulas={aulas}
              onDetalleHorario={clickDetalleHorarioHandler}
              onDetalleAlumnos={() => showNotification("Función de alumnos no implementada en esta vista.", "info")}
              onCrearHorario={clickCrearModeloHandler}
              onEliminarHorario={clickEliminarModeloHandler}
              canEdit={CAN_EDIT}
            />}
            {calendarioContent && <CalendarioHorarios horarios={horariosVisibles} onDetalleHorario={clickDetalleHorarioHandler} />}
            {gradosContent && CAN_VIEW && <motion.div key="horarios-por-grado-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }} className="mt-3">
              {gradosUnicos.length === 0 ? <div className="text-center p-5 border rounded bg-light"><p className="lead text-muted">No hay horarios disponibles con grado asignado.</p></div> :
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="h4 text-primary">Horario Detallado por Grado: <span className="ms-2 fw-bold text-dark">{gradoSeleccionado}</span></h3>
                    <div className="d-flex align-items-center">
                      {gradosUnicos.length > 1 && <div className="d-flex align-items-center me-3">
                        <label htmlFor="selectorGrado" className="form-label me-2 mb-0 fw-bold">Seleccionar Grado:</label>
                        <select id="selectorGrado" className="form-select w-auto" value={gradoSeleccionado} onChange={e => setGradoSeleccionado(e.target.value)}>
                          {gradosUnicos.map(grado => <option key={grado} value={grado}>{grado}</option>)}
                        </select>
                      </div>}
                      <button className="btn btn-secondary d-flex align-items-center" onClick={() => setMostrarSelectorFormato(true)}>
                        <Apple size={18} className="me-2" /> Descargar
                      </button>
                    </div>
                  </div>
                  <div ref={calendarioRef} style={{ width: '100%' }}>
                    <CalendarioHorarios horarios={horariosFiltradosPorGrado} onDetalleHorario={clickDetalleHorarioHandler} />
                  </div>
                </div>
              }
            </motion.div>}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal Detalle/Edición de Horario */}
      <AnimatePresence>
        {mostrarModalDetalle && <ModalDetalleHorario
          params={{ horario: horarioSeleccionado, docentes, aulas, esCreacion: esModalCreacion, alumnos, esDetalle: esModalDetalle }}
          onCerrar={clickCerrarModeloHandler}
          onEliminar={clickEliminarModeloHandler}
          onGuardar={CAN_EDIT ? clickGuardarModeloHandler : () => showNotification("❌ Permiso denegado para guardar cambios.", "error")}
          canEdit={CAN_EDIT}
          enviarNotificacion={showNotification}
        />}
      </AnimatePresence>

      {/* Selector de formato */}
      <AnimatePresence>
        {mostrarSelectorFormato && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setMostrarSelectorFormato(false)}>
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-white p-4 rounded shadow-lg" style={{ width: '300px' }} onClick={e => e.stopPropagation()}>
            <h5 className="mb-4 d-flex justify-content-between">Seleccionar Formato<button className="btn-close" onClick={() => setMostrarSelectorFormato(false)}></button></h5>
            <div className="d-grid gap-2">
              <button className="btn btn-primary d-flex align-items-center justify-content-center" onClick={() => descargarHorarioHandler('png')}>
                <Image size={18} className="me-2" /> Descargar como PNG (Imagen)
              </button>
              <button className="btn btn-info d-flex align-items-center justify-content-center text-white" onClick={() => descargarHorarioHandler('pdf')}>
                <FileText size={18} className="me-2" /> Descargar como PDF (Documento)
              </button>
            </div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>

      {/* Notificaciones */}
      <AnimatePresence>
        {notification && <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} style={{ position: "fixed", top: "20px", right: "20px", zIndex: 10000, background: notification.type === "success" ? "#4CAF50" : notification.type === "warning" ? "#ffc107" : notification.type === "info" ? "#17a2b8" : "#f44336", color: "white", padding: "1rem 1.5rem", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "10px" }}>
          {notification.message}
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}>
            <X size={18} />
          </button>
        </motion.div>}
      </AnimatePresence>
    </>
  );
};

export default Horarios;