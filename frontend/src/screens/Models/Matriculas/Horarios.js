// ============================================================
// Horarios.jsx
// CAMBIOS:
// - Header rediseñado con patrón mm-header (igual a Bienes/
//   Gestión de Estudiantes): gradiente, stats animados,
//   submódulo descriptivo.
// - Stats: Total horarios | Clases hoy | Horas/semana | Grados
// - Modal usa el nuevo ModalDetalleHorario rediseñado (dn-*)
// - Tab "Horario Por Grado": sección visual conservada
// - Filtro de alumnos por grado conservado
// ============================================================
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ModalDetalleHorario from "../../../components/Horarios/ModalDetalleHorario";
import BusquedaTablaHorarios from "../../../components/Horarios/TablaHorario";
import CalendarioHorarios from "../../../components/Horarios/CalendarioHorarios";
import useUserRole from "../../../components/hooks/useUserRole";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Table2, Book, Download,
  GraduationCap, Users, BookOpen, Clock,
  Plus,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";

const API_HOST    = process.env.REACT_APP_API_URL;
const API_HORARIO = `${API_HOST}/api/horario`;
const API_ALUMNO  = `${API_HOST}/api/matriculas`;
const API_DOCENTE = `${API_HOST}/api/personal`;
const API_AULA    = `${API_HOST}/api/grados`;

const inicializarHorario = () => ({
  _id:"", asignatura:"", inicio:"", fin:"",
  dia:[], grado:"", docente_id:"", aula_id:"", alumnos:[],
});

// ── Paleta para leyenda de asignaturas ──────────────────────
const PALETA = [
  "#6C4FBF","#2271B3","#27AE60","#E67E22","#E74C3C",
  "#8E44AD","#16A085","#2C3E50","#D35400","#1ABC9C",
];
const colorAsig = (nombre = "") => {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = ((h << 5) - h) + nombre.charCodeAt(i);
  return PALETA[Math.abs(h) % PALETA.length];
};

// ── CSS ─────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');

  /* ══ HEADER ══════════════════════════════════════════════ */
  .mm-header {
    background: linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%);
    padding: 28px 36px 36px;
    position: relative;
    overflow: hidden;
  }
  .mm-header::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }
  .mm-hi {
    position: relative; z-index: 1;
    max-width: 1400px; margin: 0 auto;
  }
  .mm-ht {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 6px;
    flex-wrap: wrap; gap: 1rem;
  }
  .mm-htitle {
    font-family: 'Poppins', sans-serif;
    font-size: 1.65rem; font-weight: 800; color: #fff;
    display: flex; align-items: center; gap: 12px;
  }
  .mm-htitle span {
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mm-sub {
    color: rgba(255,255,255,.8); font-size: .9rem;
    margin-bottom: 22px; max-width: 600px;
    font-family: 'Nunito', sans-serif;
  }
  .mm-stats {
    display: flex; gap: 14px; flex-wrap: wrap; margin-top: 0;
  }
  .mm-stat {
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.25);
    border-radius: 12px; padding: 11px 18px;
    display: flex; align-items: center; gap: 12px;
    backdrop-filter: blur(6px);
    min-width: 130px; cursor: default;
    transition: all .2s ease;
  }
  .mm-stat:hover {
    background: rgba(255,255,255,.22);
    border-color: rgba(255,255,255,.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,.1);
  }
  .mm-stat-ico {
    width: 34px; height: 34px; border-radius: 8px;
    background: rgba(255,255,255,.2);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .mm-stat-val {
    font-size: 1.35rem; font-weight: 800;
    color: #fff; line-height: 1;
    font-family: 'Poppins', sans-serif;
  }
  .mm-stat-lbl {
    font-size: .7rem; color: rgba(255,255,255,.75);
    text-transform: uppercase; letter-spacing: .05em;
    font-family: 'Nunito', sans-serif;
  }

  /* ══ TAB "Horario Por Grado" ════════════════════════════ */
  .hpg-wrap { font-family:'Nunito',sans-serif; }
  .hpg-header {
    background: linear-gradient(135deg,#6C4FBF 0%,#9B59B6 100%);
    border-radius: 14px; padding: 18px 24px; margin-bottom: 20px;
    display: flex; justify-content:space-between; align-items:center;
    flex-wrap: wrap; gap: 12px;
  }
  .hpg-title {
    font-family:'Poppins',sans-serif; font-size:1.2rem; font-weight:800;
    color:#fff; display:flex; align-items:center; gap:10px; margin:0;
  }
  .hpg-title span { opacity:.8; font-size:.9rem; font-weight:600; }
  .hpg-controls { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .hpg-select {
    padding:9px 14px; background:rgba(255,255,255,.18);
    border:1px solid rgba(255,255,255,.35); border-radius:10px;
    color:#fff; font-family:inherit; font-size:.88rem; font-weight:700;
    cursor:pointer; outline:none; min-width:160px;
  }
  .hpg-select option { background:#4B3090; color:#fff; }
  .hpg-dl-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; background:rgba(255,255,255,.2);
    border:1px solid rgba(255,255,255,.4); border-radius:10px;
    color:#fff; font-family:inherit; font-size:.87rem; font-weight:700;
    cursor:pointer; transition:all .18s;
  }
  .hpg-dl-btn:hover { background:rgba(255,255,255,.32); transform:translateY(-1px); }
  .hpg-legend {
    display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;
    padding:12px 16px; background:#fff; border-radius:12px;
    border:1px solid #E0D9F5;
  }
  .hpg-legend-item {
    display:flex; align-items:center; gap:6px;
    font-size:.78rem; font-weight:700; color:#2D2250;
  }
  .hpg-legend-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .hpg-legend-title {
    font-size:.72rem; color:#7A6FA0; font-weight:700;
    text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px;
  }
  .hpg-stats { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
  .hpg-stat-card {
    background:#fff; border-radius:12px; border:1px solid #E0D9F5;
    padding:12px 18px; display:flex; align-items:center; gap:10px;
    flex:1; min-width:140px;
  }
  .hpg-stat-icon {
    width:36px; height:36px; border-radius:10px;
    display:flex; align-items:center; justify-content:center;
  }
  .hpg-stat-val { font-size:1.3rem; font-weight:800; color:#2D2250; line-height:1; }
  .hpg-stat-lbl { font-size:.72rem; color:#7A6FA0; text-transform:uppercase; letter-spacing:.04em; }
  .hpg-empty { text-align:center; padding:60px 20px; color:#7A6FA0; }
  .hpg-empty h4 { font-size:1rem; font-weight:700; color:#2D2250; margin-bottom:6px; }
`;

// ════════════════════════════════════════════════════════════
const Horarios = () => {
  const calendarioRef = useRef(null);

  const [horarios, setHorarios]   = useState([]);
  const [alumnos, setAlumnos]     = useState([]);
  const [docentes, setDocentes]   = useState([]);
  const [aulas, setAulas]         = useState([]);

  const [horarioSeleccionado, setHorarioSeleccionado]   = useState(null);
  const [mostrarModalDetalle, setMostrarModalDetalle]   = useState(false);
  const [esModalCreacion, setEsModalCreacion]           = useState(false);
  const [esModalDetalle, setEsModalDetalle]             = useState(true);

  const [horariosContent, setHorariosContent]   = useState(true);
  const [gradosContent, setGradosContent]       = useState(false);
  const [notification, setNotification]         = useState(null);
  const [gradoSeleccionado, setGradoSeleccionado] = useState("");
  const [descargandoPDF, setDescargandoPDF]     = useState(false);

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // ── Fetch ────────────────────────────────────────────────
  const obtenerHorarios = useCallback(async () => {
    try {
      loadingController.start();
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resHorario, resAulas, resAlumnos, resDocentes] = await Promise.all([
        axios.get(API_HORARIO, config),
        axios.get(API_AULA, config),
        axios.get(API_ALUMNO, config),
        axios.get(API_DOCENTE, config),
      ]);

      setHorarios(resHorario.data);
      setAulas(resAulas.data.items);
      setAlumnos(resAlumnos.data.data);
      setDocentes(resDocentes.data);
    } catch (err) {
      console.error(err);
      showNotification("Error al cargar datos.", "error");
    } finally {
      loadingController.stop();
    }
  }, [showNotification]);

  useEffect(() => { obtenerHorarios(); }, [obtenerHorarios]);

  // ── Stats para el header ─────────────────────────────────
  const hoy = new Date().toLocaleDateString("es-ES",{ weekday:"short" }).toUpperCase().slice(0,3);
  const diasMap = { LUN:"lu", MAR:"ma", MIE:"mi", JUE:"ju", VIE:"vi", SAB:"sa" };
  const hoyKey  = Object.entries(diasMap).find(([,v]) => hoy.toLowerCase().startsWith(v))?.[0] || "";

  const totalHorarios   = horarios.length;
  const clasesHoy       = horarios.filter(h => (h.dia || []).includes(hoyKey)).length;
  const gradosConHorario= [...new Set(horarios.map(h => h.grado).filter(Boolean))].length;
  const totalHorasSemanales = horarios.reduce((acc, h) => {
    if (!h.inicio || !h.fin) return acc;
    const [hi, mi] = h.inicio.split(":").map(Number);
    const [hf, mf] = h.fin.split(":").map(Number);
    const mins = (hf * 60 + mf) - (hi * 60 + mi);
    return acc + (mins > 0 ? mins / 60 : 0);
  }, 0);

  // ── Modales ──────────────────────────────────────────────
  const clickDetalleAlumnosHandler = async (id) => {
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await axios.get(`${API_HORARIO}/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      setHorarioSeleccionado(res.data);
      setMostrarModalDetalle(true);
      setEsModalDetalle(false);
    } catch (err) { console.error(err); }
  };

  const clickDetalleHorarioHandler = async (id) => {
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await axios.get(`${API_HORARIO}/${id}`, { headers:{ Authorization:`Bearer ${token}` } });
      setHorarioSeleccionado(res.data);
      setEsModalCreacion(false);
      setEsModalDetalle(true);
      setMostrarModalDetalle(true);
    } catch (err) {
      showNotification(`Error al obtener horario: ${err.message}`, "error");
    }
  };

  const clickCerrarModeloHandler = () => { setHorarioSeleccionado(null); setMostrarModalDetalle(false); };
  const clickCrearModeloHandler   = () => {
    setHorarioSeleccionado(inicializarHorario());
    setEsModalCreacion(true); setEsModalDetalle(true);
    setMostrarModalDetalle(true);
  };

  const clickGuardarModeloHandler = async (horario, esCreacion) => {
    try {
      loadingController.start();
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const headers = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };
      if (esCreacion) {
        const { _id, ...sin } = horario;
        await axios.post(API_HORARIO, sin, { headers });
        showNotification("Horario creado con éxito.", "success");
      } else {
        await axios.put(`${API_HORARIO}/${horario._id}`, horario, { headers });
        showNotification("Horario actualizado con éxito.", "success");
      }
      await obtenerHorarios();
      clickCerrarModeloHandler();
    } catch (err) {
      // Extraer mensaje del backend (400, 409, etc.) o usar el genérico
      const msg = err.response?.data?.message || err.message;
      showNotification(msg, "error");
    } finally { loadingController.stop(); }
  };

  const clickEliminarModeloHandler = async (id_horario) => {
    try {
      loadingController.start();
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      await axios.delete(`${API_HORARIO}/${id_horario}`, { headers:{ Authorization:`Bearer ${token}` } });
      showNotification("Horario eliminado exitosamente", "success");
      await obtenerHorarios();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showNotification(msg, "error");
    } finally { loadingController.stop(); }
    clickCerrarModeloHandler();
  };

  // ── Filtrado "Horario Por Grado" ─────────────────────────
  const horariosVisibles = useMemo(() => horarios, [horarios]);

  const gradosUnicos = useMemo(() => {
    const gs = horariosVisibles.map(h => h.grado).filter(g => g && g !== "");
    return [...new Set(gs)].sort();
  }, [horariosVisibles]);

  useEffect(() => {
    if (gradosUnicos.length > 0 && !gradoSeleccionado)
      setGradoSeleccionado(gradosUnicos[0]);
  }, [gradosUnicos, gradoSeleccionado]);

  const horariosFiltradosPorGrado = useMemo(() => (
    horariosVisibles.filter(h => h.grado === gradoSeleccionado)
  ), [horariosVisibles, gradoSeleccionado]);

  // ── Alumnos filtrados por grado del horario seleccionado ─
  const alumnosFiltradosPorGrado = useMemo(() => {
    if (!horarioSeleccionado) return alumnos;
    const aulaId = horarioSeleccionado.aula_id;
    if (!aulaId) return alumnos;
    const filtrados = alumnos.filter(a => {
      const gradoAlumno = a.grado_a_matricular;
      if (!gradoAlumno) return false;
      return String(gradoAlumno) === String(aulaId) ||
             (gradoAlumno?.$oid && gradoAlumno.$oid === String(aulaId)) ||
             (aulaId?.$oid && String(gradoAlumno) === aulaId.$oid);
    });
    return filtrados.length > 0 ? filtrados : alumnos;
  }, [horarioSeleccionado, alumnos]);

  // ── Asignaturas y stats del grado ────────────────────────
  const asignaturasDelGrado = useMemo(() => (
    [...new Set(horariosFiltradosPorGrado.map(h => h.asignatura).filter(Boolean))]
  ), [horariosFiltradosPorGrado]);

  const totalClasesGrado = horariosFiltradosPorGrado.length;
  const totalHorasGrado  = horariosFiltradosPorGrado.reduce((acc, h) => {
    if (!h.inicio || !h.fin) return acc;
    const [hi, mi] = h.inicio.split(":").map(Number);
    const [hf, mf] = h.fin.split(":").map(Number);
    const mins = (hf * 60 + mf) - (hi * 60 + mi);
    return acc + (mins > 0 ? mins / 60 : 0);
  }, 0);

  // ── Descarga PDF ─────────────────────────────────────────
  const descargarPDFGrado = async () => {
    if (!calendarioRef.current) { showNotification("El calendario no está listo.", "warning"); return; }
    setDescargandoPDF(true);
    showNotification("Generando PDF del horario...", "info");
    try {
      const canvas  = await html2canvas(calendarioRef.current, {
        scale:2.5, useCORS:true, backgroundColor:"#ffffff", logging:false,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const doc     = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
      const pageW   = doc.internal.pageSize.getWidth();
      const pageH   = doc.internal.pageSize.getHeight();
      try { doc.addImage("/Logo1.png","PNG",10,8,20,20); } catch(e){}
      doc.setFont("helvetica","bold");
      doc.setFontSize(13); doc.setTextColor(108,79,191);
      doc.text("Escuela Experimental de Niños para la Música", pageW/2, 14, {align:"center"});
      doc.setFillColor(108,79,191);
      doc.roundedRect(10,18,pageW-20,12,3,3,"F");
      doc.setFontSize(12); doc.setTextColor(255,255,255);
      doc.text(`Horario del Grado: ${gradoSeleccionado}   |   Año Académico: ${new Date().getFullYear()}`, pageW/2, 26, {align:"center"});
      doc.setLineWidth(0.3); doc.setDrawColor(200,190,230);
      doc.line(10,32,pageW-10,32);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(120);
      const fecha = new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"});
      doc.text(`Generado: ${fecha}  |  ${totalClasesGrado} clases  |  ${totalHorasGrado.toFixed(1)} horas semanales`, 10, 37);
      const imgH   = (canvas.height * (pageW-20)) / canvas.width;
      const startY = 40;
      const drawH  = Math.min(imgH, pageH - startY - 14);
      doc.addImage(imgData,"JPEG",10,startY,pageW-20,drawH);
      doc.setFontSize(7.5); doc.setTextColor(140);
      doc.text(`Grado: ${gradoSeleccionado}  |  S.I.A.M. — Escuela Experimental de Niños para la Música`, pageW/2, pageH-6, {align:"center"});
      const slug = gradoSeleccionado.replace(/\s+/g,"_").toLowerCase();
      doc.save(`horario_${slug}_${new Date().toISOString().split("T")[0]}.pdf`);
      showNotification("PDF descargado exitosamente.", "success");
    } catch (err) {
      console.error(err);
      showNotification("Error al generar el PDF.", "error");
    } finally { setDescargandoPDF(false); }
  };

  // ── Pestañas ─────────────────────────────────────────────
  const clickHorariosContent = () => { setHorariosContent(true);  setGradosContent(false); };
  const clickGradosContent   = () => { setHorariosContent(false); setGradosContent(true);  };

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      <div className="donacion-container">

        {/* ══ HEADER ══════════════════════════════════════ */}
        <motion.div
          className="mm-header"
          initial={{ opacity:0, y:-20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, type:"spring", stiffness:120 }}>
          <div className="mm-hi">
            <div className="mm-ht">
              <motion.div
                className="mm-htitle"
                initial={{ opacity:0, x:-30 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.15 }}>
                <motion.span
                  initial={{ rotate:-180, scale:0 }}
                  animate={{ rotate:0, scale:1 }}
                  transition={{ type:"spring", stiffness:200, delay:0.2 }}>
                  <Calendar size={34} color="white" fill="white"/>
                </motion.span>
                Gestión de Horarios
              </motion.div>
            </div>

            <motion.p className="mm-sub"
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
              Gestiona y controla los horarios y distribución de las aulas.
            </motion.p>

            {/* Stats animados */}
            <motion.div className="mm-stats"
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.35 }}>
              {[
                { ico:<Calendar  size={18} color="white"/>, val:totalHorarios,                    lbl:"Total Horarios" },
                { ico:<Clock     size={18} color="white"/>, val:clasesHoy,                        lbl:"Clases hoy" },
                { ico:<BookOpen  size={18} color="white"/>, val:`${totalHorasSemanales.toFixed(1)}h`, lbl:"Horas / semana" },
                { ico:<GraduationCap size={18} color="white"/>, val:gradosConHorario,             lbl:"Grados activos" },
              ].map((s, i) => (
                <motion.div key={i} className="mm-stat"
                  whileHover={{ scale:1.04, y:-2 }}
                  transition={{ type:"spring", stiffness:300 }}>
                  <div className="mm-stat-ico">{s.ico}</div>
                  <div>
                    <div className="mm-stat-val">{s.val}</div>
                    <div className="mm-stat-lbl">{s.lbl}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* ══ TABS ════════════════════════════════════════ */}
        <motion.ul className="nav nav-tabs justify-content-center"
          initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
          transition={{ delay:0.1, duration:0.6 }}>
          <li className="nav-item">
            <a href="#" className={`nav-link ${horariosContent?"active":""}`}
              onClick={e=>{e.preventDefault();clickHorariosContent();}}>
              <Table2/> Horarios
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className={`nav-link ${gradosContent?"active":""}`}
              onClick={e=>{e.preventDefault();clickGradosContent();}}>
              <Book/> Horario Por Grado
            </a>
          </li>
        </motion.ul>

        <div className="tab-content">
          <AnimatePresence>

            {/* ── Tab: lista de horarios ────────────────── */}
            {horariosContent && (
              <BusquedaTablaHorarios
                horarios={horariosVisibles}
                aulas={aulas}
                docentes={docentes}
                onDetalleHorario={clickDetalleHorarioHandler}
                onDetalleAlumnos={clickDetalleAlumnosHandler}
                onCrearHorario={clickCrearModeloHandler}
                onEliminarHorario={clickEliminarModeloHandler}
              />
            )}

            {/* ── Tab: calendario por grado ─────────────── */}
            {gradosContent && (
              <motion.div key="horarios-por-grado"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:20 }} transition={{ duration:0.3 }}
                className="mt-3 hpg-wrap">

                {gradosUnicos.length === 0 ? (
                  <div className="hpg-empty">
                    <GraduationCap size={52} style={{ opacity:.2, marginBottom:14 }}/>
                    <h4>No hay horarios con grado asignado</h4>
                    <p>Registra horarios y asigna un grado para verlos aquí.</p>
                  </div>
                ) : (
                  <>
                    <div className="hpg-header">
                      <h2 className="hpg-title">
                        <GraduationCap size={22}/>
                        Horario Detallado
                        <span>→</span>
                        <strong style={{ color:"#fff", fontWeight:800 }}>{gradoSeleccionado}</strong>
                      </h2>
                      <div className="hpg-controls">
                        {gradosUnicos.length > 1 && (
                          <select className="hpg-select" value={gradoSeleccionado}
                            onChange={e => setGradoSeleccionado(e.target.value)}>
                            {gradosUnicos.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        )}
                        <button className="hpg-dl-btn" onClick={descargarPDFGrado}
                          disabled={descargandoPDF}>
                          <Download size={15}/>
                          {descargandoPDF ? "Generando..." : "Descargar PDF"}
                        </button>
                      </div>
                    </div>

                    <div className="hpg-stats">
                      <div className="hpg-stat-card">
                        <div className="hpg-stat-icon" style={{ background:"#EDE9FF" }}>
                          <BookOpen size={18} color="#6C4FBF"/>
                        </div>
                        <div>
                          <div className="hpg-stat-val">{totalClasesGrado}</div>
                          <div className="hpg-stat-lbl">Clases</div>
                        </div>
                      </div>
                      <div className="hpg-stat-card">
                        <div className="hpg-stat-icon" style={{ background:"#D4F5E2" }}>
                          <Calendar size={18} color="#27AE60"/>
                        </div>
                        <div>
                          <div className="hpg-stat-val">{totalHorasGrado.toFixed(1)}h</div>
                          <div className="hpg-stat-lbl">Horas/semana</div>
                        </div>
                      </div>
                      <div className="hpg-stat-card">
                        <div className="hpg-stat-icon" style={{ background:"#E8F4FD" }}>
                          <Users size={18} color="#2271B3"/>
                        </div>
                        <div>
                          <div className="hpg-stat-val">{asignaturasDelGrado.length}</div>
                          <div className="hpg-stat-lbl">Asignaturas</div>
                        </div>
                      </div>
                    </div>

                    {asignaturasDelGrado.length > 0 && (
                      <div className="hpg-legend">
                        <div className="w-100 hpg-legend-title">Asignaturas del grado:</div>
                        {asignaturasDelGrado.map(asig => (
                          <div key={asig} className="hpg-legend-item">
                            <div className="hpg-legend-dot" style={{ background: colorAsig(asig) }}/>
                            {asig}
                          </div>
                        ))}
                      </div>
                    )}

                    <div ref={calendarioRef}>
                      <CalendarioHorarios
                        horarios={horariosFiltradosPorGrado}
                        onDetalleHorario={clickDetalleHorarioHandler}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══ Modal Detalle/Edición ════════════════════════ */}
      <AnimatePresence>
        {mostrarModalDetalle && (
          <ModalDetalleHorario
            params={{
              horario:    horarioSeleccionado,
              docentes,
              aulas,
              esCreacion: esModalCreacion,
              alumnos:    alumnosFiltradosPorGrado,
              esDetalle:  esModalDetalle,
            }}
            onCerrar={clickCerrarModeloHandler}
            onEliminar={clickEliminarModeloHandler}
            onGuardar={clickGuardarModeloHandler}
            enviarNotificacion={showNotification}
          />
        )}
      </AnimatePresence>

      {/* ══ Notificaciones ══════════════════════════════ */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity:0, y:-50 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-50 }}
            style={{
              position:"fixed", top:"20px", right:"20px", zIndex:10000,
              background: notification.type==="success"?"#4CAF50":
                          notification.type==="warning"?"#ffc107":
                          notification.type==="info"?"#17a2b8":"#f44336",
              color:"white", padding:"1rem 1.5rem", borderRadius:"12px",
              boxShadow:"0 4px 20px rgba(0,0,0,.15)",
              display:"flex", alignItems:"center", gap:"10px",
              fontFamily:"'Nunito',sans-serif", fontWeight:700,
            }}>
            {notification.message}
            <button onClick={() => setNotification(null)}
              style={{ background:"none", border:"none", color:"white", cursor:"pointer", padding:"2px", display:"flex" }}>
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Horarios;