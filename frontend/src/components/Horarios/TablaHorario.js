// ============================================================
// TablaHorario.jsx (BusquedaTablaHorarios)
// MEJORAS:
// - Vista de tabla rediseñada: cards visuales por horario
//   con colores según día, badge de asignatura, avatar del
//   docente, chips de días con color por día de semana.
// - PDF corregido: el grado aparece en el encabezado de CADA
//   página cuando se descarga con "Todos los grados" —
//   se genera UNA PÁGINA POR GRADO con su nombre bien visible.
// ============================================================
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, HelpCircle, Plus, Edit, Users, Trash,
  Filter, Download, X, Clock, BookOpen, GraduationCap,
  UserRound, ChevronRight
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../styles/Models/horarios.css";
import { auth } from "../../components/authentication/Auth";
import WithPermission from "../Permisos/WithPermission";

// ── Paleta por día de semana ──────────────────────────────────
const DIA_COLORS = {
  LUN: { bg: "#EDE9FF", text: "#6C4FBF", dot: "#6C4FBF" },
  MAR: { bg: "#E8F4FD", text: "#2271B3", dot: "#2271B3" },
  MIE: { bg: "#D4F5E2", text: "#1a7a40", dot: "#27AE60" },
  JUE: { bg: "#FFF3E0", text: "#b45309", dot: "#F39C12" },
  VIE: { bg: "#FDE8E8", text: "#b02a2a", dot: "#E74C3C" },
  SAB: { bg: "#F3E8FF", text: "#7B2D8B", dot: "#9B59B6" },
};
const DIA_FULL = { LUN:"Lunes", MAR:"Martes", MIE:"Miércoles", JUE:"Jueves", VIE:"Viernes", SAB:"Sábado" };

// ── Paleta de colores para asignaturas (cíclica) ─────────────
const ASIG_COLORS = [
  ["#6C4FBF","#EDE9FF"], ["#2271B3","#E8F4FD"], ["#1a7a40","#D4F5E2"],
  ["#b45309","#FFF3E0"], ["#7B2D8B","#F3E8FF"], ["#0e6655","#D1F2EB"],
  ["#1a5276","#D6EAF8"], ["#784212","#FDEBD0"],
];
const asigColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
  return ASIG_COLORS[Math.abs(h) % ASIG_COLORS.length];
};

// ── Iniciales para el avatar del docente ─────────────────────
const iniciales = (nombre = "") => {
  const p = nombre.trim().split(" ").filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── CSS inline ────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

  .ht-wrap { font-family:'Nunito',sans-serif; }

  /* ── Toolbar ── */
  .ht-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding:16px 0 12px; }
  .ht-search-box {
    flex:1; min-width:240px; display:flex; align-items:center; gap:10px;
    background:#fff; border:2px solid #E0D9F5; border-radius:12px;
    padding:10px 16px; transition:border-color .2s, box-shadow .2s;
  }
  .ht-search-box:focus-within { border-color:#6C4FBF; box-shadow:0 0 0 3px rgba(108,79,191,.1); }
  .ht-search-box input { border:none; outline:none; flex:1; font-size:.9rem; font-family:inherit; color:#2D2250; background:transparent; }
  .ht-search-box input::placeholder { color:#7A6FA0; }
  .ht-select {
    padding:10px 14px; background:#fff; border:2px solid #E0D9F5;
    border-radius:12px; font-family:inherit; font-size:.87rem;
    color:#2D2250; cursor:pointer; outline:none; min-width:160px;
    transition:border-color .2s;
  }
  .ht-select:focus { border-color:#6C4FBF; }
  .ht-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 18px; border-radius:12px; font-size:.87rem;
    font-weight:700; border:none; cursor:pointer;
    font-family:inherit; transition:all .18s; white-space:nowrap;
  }
  .ht-btn-primary { background:linear-gradient(135deg,#6C4FBF,#9B59B6); color:#fff; }
  .ht-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(108,79,191,.35); }
  .ht-btn-green { background:linear-gradient(135deg,#27AE60,#1e8449); color:#fff; }
  .ht-btn-green:hover { transform:translateY(-1px); box-shadow:0 6px 16px rgba(39,174,96,.3); }
  .ht-btn-ghost { background:#F4F3FB; color:#6C4FBF; border:2px solid #E0D9F5; }
  .ht-btn-ghost:hover { background:#EDE9FF; border-color:#6C4FBF; }

  /* ── Info row ── */
  .ht-info-row { display:flex; justify-content:space-between; align-items:center;
    padding:8px 0 14px; font-size:.83rem; color:#7A6FA0; }

  /* ── Cards grid ── */
  .ht-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:16px; padding-bottom:24px; }

  /* ── Horario Card ── */
  .ht-card {
    background:#fff; border-radius:16px; border:1px solid #E0D9F5;
    box-shadow:0 2px 12px rgba(108,79,191,.06);
    overflow:hidden; transition:all .22s; cursor:default;
    display:flex; flex-direction:column;
  }
  .ht-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(108,79,191,.14); border-color:#C4B5E8; }

  /* Card accent bar (top border colored by first day) */
  .ht-card-accent { height:4px; width:100%; }

  .ht-card-body { padding:16px 18px 14px; flex:1; display:flex; flex-direction:column; gap:10px; }

  /* Asignatura pill + horario */
  .ht-card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
  .ht-asig-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 12px; border-radius:20px; font-size:.82rem; font-weight:700;
  }
  .ht-time-chip {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 10px; border-radius:8px; font-size:.8rem;
    font-weight:700; background:#F4F3FB; color:#6C4FBF;
    border:1px solid #E0D9F5; white-space:nowrap;
  }

  /* Grado row */
  .ht-card-grado {
    display:flex; align-items:center; gap:7px;
    font-size:.84rem; color:#2D2250; font-weight:600;
  }
  .ht-card-grado svg { color:#7A6FA0; flex-shrink:0; }

  /* Docente row */
  .ht-card-docente { display:flex; align-items:center; gap:10px; }
  .ht-avatar {
    width:32px; height:32px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:.75rem; flex-shrink:0;
    background:linear-gradient(135deg,#6C4FBF,#9B59B6); color:#fff;
  }
  .ht-docente-name { font-size:.84rem; color:#2D2250; font-weight:600; }
  .ht-docente-role { font-size:.74rem; color:#7A6FA0; }

  /* Días chips */
  .ht-dias { display:flex; flex-wrap:wrap; gap:5px; margin-top:2px; }
  .ht-dia-chip {
    padding:3px 9px; border-radius:20px; font-size:.73rem;
    font-weight:700; letter-spacing:.02em;
  }

  /* Card footer / actions */
  .ht-card-footer {
    display:flex; gap:0; border-top:1px solid #F0EBF8;
    background:#FAFAFE;
  }
  .ht-action-btn {
    flex:1; display:flex; align-items:center; justify-content:center; gap:5px;
    padding:10px 6px; border:none; background:transparent; cursor:pointer;
    font-size:.78rem; font-weight:700; color:#7A6FA0;
    transition:all .15s; font-family:inherit;
  }
  .ht-action-btn:hover { background:#F0EBFF; color:#6C4FBF; }
  .ht-action-btn.edit:hover { color:#6C4FBF; background:#EDE9FF; }
  .ht-action-btn.alumnos:hover { color:#27AE60; background:#D4F5E2; }
  .ht-action-btn.del:hover { color:#E74C3C; background:#FDE8E8; }
  .ht-action-sep { width:1px; background:#E0D9F5; }

  /* ── Empty state ── */
  .ht-empty { text-align:center; padding:60px 20px; color:#7A6FA0; }
  .ht-empty-icon { opacity:.2; margin-bottom:14px; }
  .ht-empty h4 { font-size:1rem; font-weight:700; color:#2D2250; margin-bottom:6px; }

  /* ── Help modal ── */
  .ht-help-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.45);
    z-index:10001; display:flex; align-items:center; justify-content:center;
    backdrop-filter:blur(3px);
  }
  .ht-help-box {
    background:#fff; border-radius:18px; width:480px; max-width:95vw;
    max-height:85vh; overflow-y:auto;
    box-shadow:0 20px 60px rgba(0,0,0,.2);
  }
  .ht-help-header {
    background:linear-gradient(135deg,#6C4FBF,#9B59B6);
    padding:18px 24px; border-radius:18px 18px 0 0;
    display:flex; justify-content:space-between; align-items:center;
  }
  .ht-help-header h3 { color:#fff; font-size:1rem; font-weight:800; margin:0; display:flex; align-items:center; gap:8px; }
  .ht-help-close { background:rgba(255,255,255,.2); border:none; border-radius:8px; color:#fff; cursor:pointer; padding:6px; display:flex; }
  .ht-help-close:hover { background:rgba(255,255,255,.35); }
  .ht-help-body { padding:20px 24px; }
  .ht-help-section { margin-bottom:18px; }
  .ht-help-section h4 { font-size:.88rem; font-weight:800; color:#6C4FBF; margin-bottom:8px; }
  .ht-help-section p, .ht-help-section li { font-size:.84rem; color:#555; line-height:1.6; }
  .ht-help-section ul { padding-left:18px; }
  .ht-help-footer { padding:14px 24px; border-top:1px solid #E0D9F5; display:flex; justify-content:flex-end; }

  @media(max-width:700px) {
    .ht-grid { grid-template-columns:1fr; }
    .ht-toolbar { gap:8px; }
  }
`;

// ============================================================
const BusquedaTablaHorarios = ({
  horarios,
  aulas,
  onDetalleHorario,
  onDetalleAlumnos,
  onCrearHorario,
  onEliminarHorario,
}) => {
  const [filtros, setFiltros]           = useState({ busqueda:"", grado:"", aula:"" });
  const [personal, setPersonal]         = useState([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => { cargarPersonal(); }, []);

  const cargarPersonal = async () => {
    try {
      setLoadingPersonal(true);
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res = await fetch(process.env.REACT_APP_API_URL + "/api/personal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPersonal(Array.isArray(data) ? data : []);
    } catch { setPersonal([]); }
    finally   { setLoadingPersonal(false); }
  };

  const normId = (id) => {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  const gradosUnicos = useMemo(() => (
    [...new Set(horarios.map(h => h.grado).filter(Boolean))].sort()
  ), [horarios]);

  const aulasUnicas = useMemo(() => (
    aulas.map(a => ({ id: normId(a._id), nombre: a.grado }))
         .sort((a,b) => a.nombre.localeCompare(b.nombre))
  ), [aulas]);

  const nombreDocente = (docenteId) => {
    if (!docenteId) return "Sin docente asignado";
    const doc = personal.find(p => normId(p._id) === normId(docenteId));
    return doc ? `${doc.nombres} ${doc.apellidos}` : "Docente no encontrado";
  };

  const horariosFiltrados = useMemo(() => (
    horarios.filter(h => {
      const nd      = nombreDocente(h.docente_id);
      const aulaObj = aulas.find(a => normId(a._id) === normId(h.aula_id));
      const bus     = filtros.busqueda.toLowerCase();

      const coincBus = !bus ||
        h.asignatura?.toLowerCase().includes(bus) ||
        h.grado?.toLowerCase().includes(bus) ||
        aulaObj?.nombre?.toLowerCase().includes(bus) ||
        nd.toLowerCase().includes(bus);

      const coincGrado = !filtros.grado || h.grado === filtros.grado;
      const coincAula  = !filtros.aula  || normId(h.aula_id) === filtros.aula;
      return coincBus && coincGrado && coincAula;
    })
  ), [horarios, filtros, aulas, personal]);

  // ── PDF — una página por grado, grado visible en cada hoja ──
  const descargarPDF = () => {
    const doc    = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const logoUrl = "/Logo1.png";
    const anio    = new Date().getFullYear();

    // Agrupar horarios por grado
    const horariosPorGrado = {};
    horariosFiltrados.forEach(h => {
      const grado = h.grado || "Sin grado";
      if (!horariosPorGrado[grado]) horariosPorGrado[grado] = [];
      horariosPorGrado[grado].push(h);
    });

    const gradosList = Object.keys(horariosPorGrado).sort();
    const diasOrden  = ["LUN","MAR","MIE","JUE","VIE","SAB"];
    const diasNames  = { LUN:"Lunes", MAR:"Martes", MIE:"Miércoles", JUE:"Jueves", VIE:"Viernes", SAB:"Sábado" };

    gradosList.forEach((grado, gi) => {
      if (gi > 0) doc.addPage();

      const horariosGrado = horariosPorGrado[grado];

      // ── Encabezado ─────────────────────────────────────────
      try { doc.addImage(logoUrl,"PNG",10,8,22,22); } catch(e){}

      doc.setFont("helvetica","bold");
      doc.setFontSize(13);
      doc.setTextColor(108,79,191);
      doc.text("Escuela Experimental de Niños para la Música", pageW/2, 15, { align:"center" });

      doc.setFontSize(10);
      doc.setTextColor(80,80,80);
      doc.setFont("helvetica","normal");
      doc.text("Horario Académico", pageW/2, 21, { align:"center" });

      // ── Banner con el nombre del GRADO — bien visible ───────
      doc.setFillColor(108,79,191);
      doc.roundedRect(10, 25, pageW-20, 12, 3, 3, "F");
      doc.setFont("helvetica","bold");
      doc.setFontSize(13);
      doc.setTextColor(255,255,255);
      doc.text(`Grado: ${grado}   |   Año Académico: ${anio}`, pageW/2, 33, { align:"center" });

      doc.setDrawColor(200,190,230);
      doc.setLineWidth(0.3);
      doc.line(10, 39, pageW-10, 39);

      doc.setFont("helvetica","normal");
      doc.setFontSize(8);
      doc.setTextColor(120);
      const fecha = new Date().toLocaleDateString("es-ES",{year:"numeric",month:"long",day:"numeric"});
      doc.text(`Generado: ${fecha}  |  ${horariosGrado.length} clases`, 10, 44);

      // ── Recopilar franjas horarias del grado ───────────────
      const franjasSet = new Set();
      horariosGrado.forEach(h => {
        if (h.inicio && h.fin) franjasSet.add(`${h.inicio}|${h.fin}`);
      });
      const franjas = [...franjasSet].sort((a,b) => a.localeCompare(b));

      if (franjas.length === 0) {
        doc.setFont("helvetica","normal");
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Sin horarios registrados para este grado.", pageW/2, 60, { align:"center" });
        return;
      }

      // ── Tabla grilla calendario ────────────────────────────
      const head = [["Horario", ...diasOrden.map(d => diasNames[d])]];

      const body = franjas.map(franja => {
        const [inicio, fin] = franja.split("|");
        const row = [`${inicio}\n${fin}`];

        diasOrden.forEach(dia => {
          const clases = horariosGrado.filter(h =>
            (h.dia||[]).includes(dia) && h.inicio===inicio && h.fin===fin
          );
          if (clases.length === 0) {
            row.push("");
          } else {
            row.push(clases.map(h => {
              const nd     = nombreDocente(h.docente_id);
              const partes = nd.split(" ").filter(Boolean);
              const corto  = partes.length > 1 ? `${partes[0]} ${partes[partes.length-1]}` : nd;
              return `${h.asignatura}\n${corto}`;
            }).join("\n──\n"));
          }
        });

        return row;
      });

      autoTable(doc, {
        startY: 48,
        head,
        body,
        theme: "grid",
        styles: {
          fontSize:    7.5,
          cellPadding: 3,
          valign:      "middle",
          halign:      "center",
          lineColor:   [210,200,235],
          lineWidth:   0.3,
          textColor:   [50,50,50],
          overflow:    "linebreak",
          minCellHeight: 14,
          font:        "helvetica",
        },
        headStyles: {
          fillColor:   [108,79,191],
          textColor:   255,
          fontStyle:   "bold",
          fontSize:    8.5,
          halign:      "center",
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth:24, fontStyle:"bold", fillColor:[240,236,255], textColor:[80,50,160] },
          1: { cellWidth:34 },
          2: { cellWidth:34 },
          3: { cellWidth:34 },
          4: { cellWidth:34 },
          5: { cellWidth:34 },
          6: { cellWidth:34 },
        },
        alternateRowStyles: { fillColor:[248,245,255] },
        margin: { left:10, right:10 },

        // ── Encabezado en páginas extras del mismo grado ──────
        didDrawPage: (data) => {
          const pgNum = doc.internal.getCurrentPageInfo().pageNumber;
          // Si es una página de continuación dentro del mismo grado
          if (data.pageNumber > 1) {
            try { doc.addImage(logoUrl,"PNG",10,6,18,18); } catch(e){}
            doc.setFont("helvetica","bold");
            doc.setFontSize(10); doc.setTextColor(108,79,191);
            doc.text("Escuela Experimental de Niños para la Música", pageW/2, 12, {align:"center"});

            // Banner grado en continuación
            doc.setFillColor(108,79,191);
            doc.roundedRect(10, 16, pageW-20, 9, 2, 2, "F");
            doc.setFontSize(9); doc.setTextColor(255,255,255);
            doc.text(`Grado: ${grado}  |  Año: ${anio}  (continuación)`, pageW/2, 22, {align:"center"});
            doc.setLineWidth(0.3); doc.setDrawColor(200,190,230);
            doc.line(10,27,pageW-10,27);
          }

          // Footer con nombre del grado en TODAS las páginas
          doc.setFont("helvetica","normal");
          doc.setFontSize(7.5); doc.setTextColor(140);
          doc.text(
            `Grado: ${grado}  |  S.I.A.M. — Escuela Experimental de Niños para la Música`,
            pageW/2, pageH-6, { align:"center" }
          );
          doc.setFontSize(7.5);
          doc.text(`Pág. ${data.pageNumber}`, pageW-12, pageH-6);
        },
      });
    });

    // Nombre del archivo con el grado si hay filtro
    const gradoSlug = filtros.grado
      ? filtros.grado.replace(/\s+/g,"_").toLowerCase()
      : "todos_los_grados";
    doc.save(`horario_${gradoSlug}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const setFiltro = (k, v) => setFiltros(p => ({ ...p, [k]: v }));
  const limpiar   = () => setFiltros({ busqueda:"", grado:"", aula:"" });
  const hayFiltro = filtros.busqueda || filtros.grado || filtros.aula;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="ht-wrap">
      <style>{CSS}</style>

      {/* Toolbar */}
      <div className="ht-toolbar">
        <div className="ht-search-box">
          <Search size={16} color="#7A6FA0"/>
          <input
            placeholder="Buscar por asignatura, aula, grado o docente..."
            value={filtros.busqueda}
            onChange={e => setFiltro("busqueda", e.target.value)}
          />
          {filtros.busqueda && (
            <button style={{border:"none",background:"none",cursor:"pointer",color:"#7A6FA0",lineHeight:1}}
              onClick={() => setFiltro("busqueda","")}>×</button>
          )}
        </div>

        <select className="ht-select" value={filtros.grado} onChange={e => setFiltro("grado",e.target.value)}>
          <option value="">Todos los grados</option>
          {gradosUnicos.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select className="ht-select" value={filtros.aula} onChange={e => setFiltro("aula",e.target.value)}>
          <option value="">Todas las aulas</option>
          {aulasUnicas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>

        {hayFiltro && (
          <button className="ht-btn ht-btn-ghost" onClick={limpiar}>
            <Filter size={15}/> Limpiar
          </button>
        )}

        {horariosFiltrados.length > 0 && (
          <motion.button className="ht-btn ht-btn-green" onClick={descargarPDF}
            whileHover={{scale:1.04}} whileTap={{scale:.96}}>
            <Download size={15}/> PDF por Grado
          </motion.button>
        )}

        <motion.button className="ht-btn ht-btn-ghost" onClick={() => setMostrarAyuda(true)}
          whileHover={{scale:1.04}} whileTap={{scale:.96}}>
          <HelpCircle size={15}/> Ayuda
        </motion.button>

        <motion.button className="ht-btn ht-btn-primary" onClick={onCrearHorario}
          whileHover={{scale:1.04,y:-1}} whileTap={{scale:.96}}>
          <Plus size={15}/> Nuevo Horario
        </motion.button>
      </div>

      {/* Info row */}
      <div className="ht-info-row">
        <span>
          Mostrando <strong>{horariosFiltrados.length}</strong> de {horarios.length} horarios
          {filtros.grado  && <> · <strong>{filtros.grado}</strong></>}
        </span>
        {horariosFiltrados.length > 0 && (
          <button onClick={descargarPDF}
            style={{background:"none",border:"none",cursor:"pointer",color:"#6C4FBF",fontWeight:700,fontSize:".82rem",display:"flex",alignItems:"center",gap:5}}>
            <Download size={13}/> Descargar PDF por Grado
          </button>
        )}
      </div>

      {/* Cards grid */}
      {horariosFiltrados.length === 0 ? (
        <div className="ht-empty">
          <div className="ht-empty-icon"><BookOpen size={52}/></div>
          <h4>No se encontraron horarios</h4>
          <p>Intenta cambiar los filtros o registra un nuevo horario.</p>
        </div>
      ) : (
        <motion.div className="ht-grid"
          initial="hidden" animate="visible"
          variants={{ hidden:{}, visible:{ transition:{ staggerChildren:.06 } } }}>

          {horariosFiltrados.map((horario, i) => {
            const aulaObj  = aulas.find(a => normId(a._id) === normId(horario.aula_id));
            const aulaLabel = aulaObj ? `${aulaObj.grado} · Aula ${aulaObj.aula}` : "Sin aula";
            const nd        = nombreDocente(horario.docente_id);
            const dias      = horario.dia || [];
            const primerDia = dias[0] || "LUN";
            const accentColor = DIA_COLORS[primerDia]?.dot || "#6C4FBF";
            const [asigText, asigBg] = asigColor(horario.asignatura);

            return (
              <motion.div key={horario._id || i} className="ht-card"
                variants={{ hidden:{opacity:0,y:16}, visible:{opacity:1,y:0} }}
                transition={{ type:"spring", stiffness:300, damping:24 }}>

                {/* Accent bar */}
                <div className="ht-card-accent"
                  style={{ background:`linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }}/>

                <div className="ht-card-body">

                  {/* Top: asignatura + horario */}
                  <div className="ht-card-top">
                    <span className="ht-asig-pill"
                      style={{ background:asigBg, color:asigText }}>
                      <BookOpen size={12}/> {horario.asignatura || "Sin asignatura"}
                    </span>
                    <span className="ht-time-chip">
                      <Clock size={11}/> {horario.inicio} – {horario.fin}
                    </span>
                  </div>

                  {/* Grado */}
                  <div className="ht-card-grado">
                    <GraduationCap size={14}/>
                    <span>{aulaLabel}</span>
                  </div>

                  {/* Docente */}
                  <div className="ht-card-docente">
                    <div className="ht-avatar">{iniciales(nd)}</div>
                    <div>
                      <div className="ht-docente-name">{nd}</div>
                      <div className="ht-docente-role">Docente</div>
                    </div>
                  </div>

                  {/* Chips de días */}
                  <div className="ht-dias">
                    {dias.length > 0 ? dias.map(dia => (
                      <span key={dia} className="ht-dia-chip"
                        style={{
                          background: DIA_COLORS[dia]?.bg  || "#F0EBF8",
                          color:      DIA_COLORS[dia]?.text || "#6C4FBF",
                        }}>
                        {DIA_FULL[dia] || dia}
                      </span>
                    )) : (
                      <span style={{fontSize:".78rem",color:"#7A6FA0"}}>Sin días asignados</span>
                    )}
                  </div>
                </div>

                {/* Footer acciones */}
                <div className="ht-card-footer">
                  <WithPermission requiredPermissions={["ACTUALIZAR_HORARIOS"]}>
                    <button className="ht-action-btn edit" onClick={() => onDetalleHorario(horario._id)}>
                      <Edit size={14}/> Editar
                    </button>
                  </WithPermission>
                  <div className="ht-action-sep"/>
                  <button className="ht-action-btn alumnos" onClick={() => onDetalleAlumnos(horario._id)}>
                    <Users size={14}/> Alumnos
                  </button>
                  <div className="ht-action-sep"/>
                  <WithPermission requiredPermissions={["ELIMINAR_HORARIOS"]}>
                    <button className="ht-action-btn del" onClick={() => onEliminarHorario(horario._id)}>
                      <Trash size={14}/> Eliminar
                    </button>
                  </WithPermission>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modal de ayuda */}
      <AnimatePresence>
        {mostrarAyuda && (
          <motion.div className="ht-help-overlay"
            initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setMostrarAyuda(false)}>
            <motion.div className="ht-help-box"
              initial={{scale:.9,y:20}} animate={{scale:1,y:0}} exit={{scale:.9,y:20}}
              onClick={e => e.stopPropagation()}>
              <div className="ht-help-header">
                <h3><HelpCircle size={18}/> Ayuda — Gestión de Horarios</h3>
                <button className="ht-help-close" onClick={() => setMostrarAyuda(false)}>
                  <X size={16}/>
                </button>
              </div>
              <div className="ht-help-body">
                <div className="ht-help-section">
                  <h4>¿Cómo funciona el módulo?</h4>
                  <p>Gestiona clases programadas asignando docentes, aulas y franjas horarias por asignatura del catálogo.</p>
                </div>
                <div className="ht-help-section">
                  <h4>Funcionalidades principales</h4>
                  <ul>
                    <li><strong>Catálogo de asignaturas:</strong> Selecciona del catálogo o agrega nuevas materias.</li>
                    <li><strong>Horario manual/picker:</strong> Escribe la hora directamente o usa el selector.</li>
                    <li><strong>PDF por Grado:</strong> Se genera una página por cada grado con su nombre visible en encabezado y pie de página.</li>
                    <li><strong>Colores por día:</strong> Cada día de la semana tiene un color distintivo en las tarjetas.</li>
                  </ul>
                </div>
                <div className="ht-help-section">
                  <h4>Acciones en cada tarjeta</h4>
                  <ul>
                    <li><strong>Editar:</strong> Modifica asignatura, horario, docente o aula.</li>
                    <li><strong>Alumnos:</strong> Gestiona los alumnos inscritos en ese horario.</li>
                    <li><strong>Eliminar:</strong> Borra el horario permanentemente.</li>
                  </ul>
                </div>
              </div>
              <div className="ht-help-footer">
                <button className="ht-btn ht-btn-primary" onClick={() => setMostrarAyuda(false)}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusquedaTablaHorarios;