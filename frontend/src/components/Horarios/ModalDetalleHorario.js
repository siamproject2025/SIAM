// ============================================================
// ModalDetalleHorario.jsx  — REDISEÑADO con patrón dn-*
// Diseño idéntico al modal de Bienes/Donaciones:
//   • Overlay + modal con clases dn-*
//   • Pestañas: Detalle | Alumnos
//   • Punto rojo animado en pestaña con errores
//   • AnimatePresence + spring de framer-motion
//
// Funcionalidades conservadas al 100%:
//   • Catálogo de asignaturas dinámico desde API
//   • Toggle picker ↔ digitación manual de hora
//   • Selector de grado con info completa
//   • Asignación / eliminación de alumnos
//   • Filtros de alumnos por grado y nombre
//   • Seleccionar todos / deseleccionar todos
//   • WithPermission en acciones críticas
// ============================================================
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit, Trash2, Plus, BookOpen, X, Clock,
  Save, Users, FileText, ChevronRight,
  GraduationCap, Search, CheckSquare,
} from "lucide-react";
import axios from "axios";
import { auth } from "../../components/authentication/Auth";
import WithPermission from "../Permisos/WithPermission";

// ── Días de la semana ────────────────────────────────────────
const diasSemana = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
};

// ── CSS del modal (patrón dn-* idéntico al de Bienes) ────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@600;700;800&display=swap');

  /* ── Overlay ─────────────────────────────────────────────── */
  .dn-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.55);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1050; padding: 1rem;
  }

  /* ── Modal contenedor ────────────────────────────────────── */
  .dn-modal {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,.22);
    width: 95vw; max-width: 960px;
    max-height: 92vh;
    display: flex; flex-direction: column;
    font-family: 'Nunito', sans-serif;
    overflow: hidden;
  }

  /* ── Header del modal ────────────────────────────────────── */
  .dn-modal-header {
    background: linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%);
    padding: 1rem 1.5rem;
    display: flex; justify-content: space-between; align-items: center;
    flex-shrink: 0;
  }
  .dn-modal-header h3 {
    margin: 0; font-family: 'Poppins', sans-serif;
    font-size: 1.15rem; font-weight: 800; color: #fff;
    display: flex; align-items: center; gap: 10px;
  }
  .dn-modal-close {
    background: rgba(255,255,255,.18); border: none;
    color: #fff; cursor: pointer; width: 32px; height: 32px;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    transition: background .18s;
  }
  .dn-modal-close:hover { background: rgba(255,255,255,.32); }

  /* ── Barra de pestañas ───────────────────────────────────── */
  .dn-modal-tabs {
    display: flex; gap: 4px;
    padding: 14px 20px 0;
    border-bottom: 2px solid #E0D9F5;
    background: #FAFAFF;
    flex-shrink: 0;
  }
  .dn-tab-btn {
    position: relative;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px;
    border: none; border-bottom: 3px solid transparent;
    background: transparent; border-radius: 8px 8px 0 0;
    font-family: 'Nunito', sans-serif; font-size: .86rem; font-weight: 700;
    color: #7A6FA0; cursor: pointer; transition: all .18s;
  }
  .dn-tab-btn:hover { color: #6C4FBF; background: rgba(108,79,191,.07); }
  .dn-tab-btn.active {
    color: #6C4FBF; background: #fff;
    border-bottom-color: #6C4FBF;
    box-shadow: 0 -2px 8px rgba(108,79,191,.08);
  }
  .dn-tab-error-dot {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; border-radius: 50%;
    background: #E74C3C;
    animation: pulse-dot 1.3s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%,100% { transform: scale(1); opacity:1; }
    50%      { transform: scale(1.5); opacity:.7; }
  }

  /* ── Cuerpo scrollable ───────────────────────────────────── */
  .dn-tab-content {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
  }
  .dn-tab-content::-webkit-scrollbar { width: 5px; }
  .dn-tab-content::-webkit-scrollbar-thumb { background: #C4B5E8; border-radius: 3px; }

  /* ── Secciones del formulario ────────────────────────────── */
  .dn-form-section-title {
    font-family: 'Poppins', sans-serif;
    font-size: .78rem; font-weight: 700; color: #6C4FBF;
    text-transform: uppercase; letter-spacing: .05em;
    padding-bottom: 8px; border-bottom: 2px solid #E0D9F5;
    margin-bottom: 14px; margin-top: 4px;
    display: flex; align-items: center; gap: 7px;
  }
  .dn-form-grid {
    display: grid; grid-template-columns: repeat(2,1fr); gap: 14px;
  }
  .dn-form-group {
    display: flex; flex-direction: column; gap: 5px;
  }
  .dn-form-group label {
    font-size: .75rem; font-weight: 700; color: #7A6FA0;
    text-transform: uppercase; letter-spacing: .04em;
    display: flex; align-items: center; gap: 5px;
  }
  .dn-form-group label .req { color: #E74C3C; }
  .dn-form-group.dn-full { grid-column: 1/-1; }

  /* ── Inputs / Selects ────────────────────────────────────── */
  .dn-input, .dn-select {
    padding: 9px 12px;
    border: 2px solid #E0D9F5; border-radius: 9px;
    font-family: 'Nunito', sans-serif; font-size: .88rem;
    color: #2D2250; background: #FAF9FF; outline: none;
    width: 100%; transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box;
  }
  .dn-input:focus, .dn-select:focus {
    border-color: #6C4FBF;
    box-shadow: 0 0 0 3px rgba(108,79,191,.12);
  }
  .dn-input.error, .dn-select.error { border-color: #E74C3C; background: #FFF8F8; }
  .dn-err-msg { font-size: .72rem; color: #E74C3C; font-weight: 700; }

  /* ── Info box ────────────────────────────────────────────── */
  .dn-info-box {
    background: #E8F4FD; border-left: 3px solid #2980B9;
    border-radius: 8px; padding: 8px 12px;
    font-size: .82rem; color: #0c4a6e; margin-bottom: 10px;
  }

  /* ── Días de la semana (chips) ───────────────────────────── */
  .dn-dias-grid {
    display: flex; flex-wrap: wrap; gap: 8px;
  }
  .dn-dia-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px;
    border: 2px solid #E0D9F5; background: #FAF9FF;
    font-family: 'Nunito', sans-serif; font-size: .82rem;
    font-weight: 700; color: #7A6FA0; cursor: pointer;
    transition: all .18s;
    user-select: none;
  }
  .dn-dia-chip:hover  { border-color: #6C4FBF; color: #6C4FBF; }
  .dn-dia-chip.activo { background: #6C4FBF; border-color: #6C4FBF; color: #fff; }
  .dn-dia-chip.activo:hover { background: #4B3090; border-color: #4B3090; }

  /* ── Bloque de hora ──────────────────────────────────────── */
  .dn-time-block {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .dn-time-label {
    font-size: .82rem; font-weight: 800; color: #6C4FBF;
    min-width: 40px;
  }
  .dn-time-input {
    padding: 9px 12px; border: 2px solid #E0D9F5; border-radius: 9px;
    font-family: 'Nunito', sans-serif; font-size: .9rem; color: #2D2250;
    background: #FAF9FF; outline: none; width: 130px;
    transition: border-color .2s;
  }
  .dn-time-input:focus { border-color: #6C4FBF; }
  .dn-time-toggle {
    padding: 7px 11px; background: #EDE9FF; color: #6C4FBF;
    border: 2px solid #C4B5E8; border-radius: 8px;
    cursor: pointer; font-size: .75rem; font-weight: 700;
    transition: all .18s; white-space: nowrap;
  }
  .dn-time-toggle:hover { background: #6C4FBF; color: #fff; border-color: #6C4FBF; }
  .dn-time-sep { color: #7A6FA0; font-weight: 800; font-size: 1rem; }

  /* ── Asignatura row ──────────────────────────────────────── */
  .dn-asig-row { display: flex; gap: 8px; align-items: flex-end; }

  /* ── Botones pequeños ────────────────────────────────────── */
  .dn-btn-add {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 15px; background: #6C4FBF; color: #fff;
    border: none; border-radius: 9px; cursor: pointer;
    font-family: 'Nunito', sans-serif; font-size: .84rem; font-weight: 700;
    white-space: nowrap; transition: all .18s;
  }
  .dn-btn-add:hover { background: #4B3090; transform: translateY(-1px); }
  .dn-btn-cancel-sm {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 9px 11px; background: #FDE8E8; color: #E74C3C;
    border: none; border-radius: 9px; cursor: pointer;
    font-family: 'Nunito', sans-serif; font-size: .84rem; font-weight: 700;
    transition: all .18s;
  }
  .dn-btn-cancel-sm:hover { background: #fccbcb; }

  /* ── Footer del modal ────────────────────────────────────── */
  .dn-modal-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 24px;
    border-top: 1px solid #E0D9F5;
    background: #FAFAFF;
    flex-shrink: 0; gap: 10px; flex-wrap: wrap;
  }
  .dn-modal-footer .dn-footer-right { display: flex; gap: 8px; align-items: center; }
  .dn-btn-guardar {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 22px; background: #6C4FBF; color: #fff;
    border: none; border-radius: 10px;
    font-family: 'Nunito', sans-serif; font-size: .88rem; font-weight: 800;
    cursor: pointer; transition: all .18s;
    box-shadow: 0 3px 10px rgba(108,79,191,.3);
  }
  .dn-btn-guardar:hover { background: #4B3090; transform: translateY(-1px); box-shadow: 0 5px 14px rgba(108,79,191,.4); }
  .dn-btn-eliminar {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; background: #FDE8E8; color: #C0392B;
    border: 1px solid #FCCACA; border-radius: 10px;
    font-family: 'Nunito', sans-serif; font-size: .86rem; font-weight: 700;
    cursor: pointer; transition: all .18s;
  }
  .dn-btn-eliminar:hover { background: #fccbcb; transform: translateY(-1px); }
  .dn-btn-cerrar {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; background: #E0D9F5; color: #4B3090;
    border: none; border-radius: 10px;
    font-family: 'Nunito', sans-serif; font-size: .86rem; font-weight: 700;
    cursor: pointer; transition: all .18s;
  }
  .dn-btn-cerrar:hover { background: #C4B5E8; }

  /* ── Tabla de alumnos ────────────────────────────────────── */
  .dn-alumnos-table-wrap {
    border: 1px solid #E0D9F5; border-radius: 10px; overflow: hidden;
    margin-bottom: 16px;
  }
  .dn-alumnos-table {
    width: 100%; border-collapse: collapse;
    font-size: .84rem; font-family: 'Nunito', sans-serif;
  }
  .dn-alumnos-table thead tr { background: linear-gradient(135deg,#6C4FBF,#9B59B6); }
  .dn-alumnos-table th {
    padding: 10px 12px; text-align: left; color: #fff;
    font-weight: 700; font-size: .76rem;
    text-transform: uppercase; letter-spacing: .04em; white-space: nowrap;
  }
  .dn-alumnos-table td {
    padding: 9px 12px; border-bottom: 1px solid #F0EDF8;
    color: #2D2250; vertical-align: middle;
  }
  .dn-alumnos-table tbody tr:last-child td { border-bottom: none; }
  .dn-alumnos-table tbody tr:hover { background: #FAF9FF; }
  .dn-alumnos-table tbody tr.sel-row { background: #EDE9FF; }
  .dn-alumnos-table tbody tr.sel-row:hover { background: #E0D9F5; }
  .dn-alumnos-empty { text-align: center; color: #7A6FA0; padding: 20px; font-size: .84rem; }

  /* ── Barra de filtros alumnos ─────────────────────────────── */
  .dn-alumnos-filters {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-bottom: 14px;
  }
  .dn-search-wrapper { position: relative; }
  .dn-search-icon {
    position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
    color: #7A6FA0; pointer-events: none; display: flex;
  }
  .dn-search-input {
    width: 100%; padding: 9px 12px 9px 34px;
    border: 2px solid #E0D9F5; border-radius: 9px;
    font-family: 'Nunito', sans-serif; font-size: .86rem;
    color: #2D2250; background: #FAF9FF; outline: none;
    box-sizing: border-box; transition: border-color .2s;
  }
  .dn-search-input:focus { border-color: #6C4FBF; }

  /* ── Alumnos seleccionados badge ─────────────────────────── */
  .dn-sel-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #EDE9FF; color: #6C4FBF;
    padding: 5px 12px; border-radius: 20px;
    font-size: .78rem; font-weight: 800;
  }
  .dn-btn-outline {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 14px; background: transparent;
    border: 2px solid #6C4FBF; border-radius: 9px;
    color: #6C4FBF; font-family: 'Nunito', sans-serif;
    font-size: .8rem; font-weight: 700; cursor: pointer;
    transition: all .18s;
  }
  .dn-btn-outline:hover { background: #6C4FBF; color: #fff; }
  .dn-btn-success {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; background: #27AE60; color: #fff;
    border: none; border-radius: 9px;
    font-family: 'Nunito', sans-serif; font-size: .85rem; font-weight: 700;
    cursor: pointer; transition: all .18s;
  }
  .dn-btn-success:hover:not(:disabled) { background: #1e8449; transform: translateY(-1px); }
  .dn-btn-success:disabled { opacity: .5; cursor: not-allowed; }
  .dn-btn-icon-danger {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; border-radius: 7px;
    background: #FDE8E8; color: #C0392B;
    border: none; cursor: pointer; transition: all .15s;
  }
  .dn-btn-icon-danger:hover { background: #fccbcb; transform: translateY(-1px); }

  .dn-scroll-table { max-height: 280px; overflow-y: auto; }
  .dn-scroll-table::-webkit-scrollbar { width: 4px; }
  .dn-scroll-table::-webkit-scrollbar-thumb { background: #C4B5E8; border-radius: 2px; }

  .dn-checkbox {
    width: 15px; height: 15px; accent-color: #6C4FBF; cursor: pointer;
  }

  .dn-badge-grado {
    display: inline-block; padding: 2px 9px; border-radius: 12px;
    background: #EDE9FF; color: #6C4FBF;
    font-size: .72rem; font-weight: 700;
  }

  /* ── Skeleton carga catálogo ─────────────────────────────── */
  .dn-cat-loading {
    padding: 9px 12px; border: 2px solid #E0D9F5; border-radius: 9px;
    background: #FAF9FF; color: #aaa; font-size: .86rem;
    font-family: 'Nunito', sans-serif;
  }

  @media (max-width: 640px) {
    .dn-form-grid { grid-template-columns: 1fr; }
    .dn-alumnos-filters { grid-template-columns: 1fr; }
    .dn-modal { min-width: unset; }
  }
`;

// ════════════════════════════════════════════════════════════
const ModalDetalleHorario = ({
  params,
  onGuardar,
  onEliminar,
  onCerrar,
  enviarNotificacion,
}) => {
  const API_HOST      = process.env.REACT_APP_API_URL;
  const API_GRADOS    = `${API_HOST}/api/grados`;
  const API_CATALOGOS = `${API_HOST}/api/catalogos`;

  // Normaliza ObjectId (string, {$oid:...} o objeto mongoose)
  const normId = (id) => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (id.$oid) return id.$oid;
    if (id._id) return normId(id._id);
    return String(id);
  };

  // Normalizar IDs del horario al inicializar para que los selects hagan match
  const horarioInicial = {
    ...params.horario,
    docente_id: normId(params.horario?.docente_id),
    aula_id:    normId(params.horario?.aula_id),
    alumnos:    (params.horario?.alumnos || []).map(normId),
  };

  const [horarioEdicion, setHorarioEdicion] = useState(horarioInicial);
  const [esCreacion]                         = useState(params.esCreacion);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [tabActiva, setTabActiva]            = useState(params.esDetalle ? "detalle" : "alumnos");
  const [filtroGrado, setFiltroGrado]        = useState("");
  const [filtroNombre, setFiltroNombre]      = useState("");
  const [grados, setGrados]                  = useState([]);

  // ── Catálogo dinámico de asignaturas (igual que Personal/Donaciones/Directiva) ──
  const [catAsignaturas,     setCatAsignaturas]     = useState([]);
  const [cargandoAsignaturas, setCargandoAsignaturas] = useState(true);

  // Reinicializar cuando cambia el horario
  useEffect(() => {
    if (!params.horario) return;
    setHorarioEdicion({
      ...params.horario,
      docente_id: normId(params.horario.docente_id),
      aula_id:    normId(params.horario.aula_id),
      alumnos:    (params.horario.alumnos || []).map(normId),
    });
  }, [params.horario?._id]);

  // ── Carga de catálogo de asignaturas desde API ─────────────
  useEffect(() => {
    const cargarAsignaturas = async () => {
      setCargandoAsignaturas(true);
      try {
        const res  = await fetch(`${API_CATALOGOS}/horarios/asignatura`);
        if (!res.ok) throw new Error("No se pudo cargar el catálogo");
        const data = await res.json();
        const arr  = Array.isArray(data) ? data : data.data;
        if (arr && arr.length > 0) {
          setCatAsignaturas(arr.map(item => ({
            valor:    item.valor,
            etiqueta: item.etiqueta || item.valor,
          })));
        }
      } catch (err) {
        console.error("Error cargando catálogo de asignaturas:", err);
        // Si falla la API, catálogo vacío — el select mostrará solo "Seleccionar..."
        setCatAsignaturas([]);
      } finally {
        setCargandoAsignaturas(false);
      }
    };
    cargarAsignaturas();
  }, []);

  // FIX #2: toggle hora manual / picker
  const [horaManualInicio, setHoraManualInicio] = useState(false);
  const [horaManualFin, setHoraManualFin]       = useState(false);

  // ── Obtener grados ─────────────────────────────────────
  const obtenerGrados = async () => {
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken(true);
      const res   = await axios.get(API_GRADOS, { headers: { Authorization: `Bearer ${token}` } });
      setGrados(res.data.items.map(item => ({
        _id:    item._id,
        nombre: item.grado,
        seccion: item.seccion || "",
        aula:    item.aula    || "",
        anio:    item.anio_academico || "",
      })));
    } catch {
      setGrados([
        { _id:"1", nombre:"Primer Grado",  seccion:"A", aula:"Aula 1", anio:2026 },
        { _id:"2", nombre:"Segundo Grado", seccion:"A", aula:"Aula 2", anio:2026 },
        { _id:"3", nombre:"Tercer Grado",  seccion:"A", aula:"Aula 3", anio:2026 },
        { _id:"4", nombre:"Cuarto Grado",  seccion:"A", aula:"Aula 4", anio:2026 },
        { _id:"5", nombre:"Quinto Grado",  seccion:"A", aula:"Aula 5", anio:2026 },
        { _id:"6", nombre:"Sexto Grado",   seccion:"A", aula:"Aula 6", anio:2026 },
      ]);
    }
  };

  useEffect(() => { obtenerGrados(); }, []);

  const getNombreGrado = (gradoId) => {
    const g = grados.find(x => x._id === gradoId);
    return g ? g.nombre : gradoId;
  };

  // ── Handlers ───────────────────────────────────────────
  const handleDiaChange = (dia) => {
    const diasActuales = horarioEdicion.dia || [];
    const nuevosDias   = diasActuales.includes(dia)
      ? diasActuales.filter(d => d !== dia)
      : [...diasActuales, dia];
    setHorarioEdicion({ ...horarioEdicion, dia: nuevosDias });
  };

  const handleTimeChange = (campo, value) => {
    setHorarioEdicion({ ...horarioEdicion, [campo]: value });
  };

  const handleAulaChange = (event) => {
    const nuevaAula        = event.target.value;
    const aulaSeleccionada = params.aulas.find(a => a._id === nuevaAula);
    const textoGrado       = aulaSeleccionada ? aulaSeleccionada.grado : "";
    setHorarioEdicion({ ...horarioEdicion, aula_id: nuevaAula, grado: textoGrado });
  };

  // ── Alumnos ────────────────────────────────────────────
  const gradosUnicos = [...new Set(params.alumnos.map(a => getNombreGrado(a.grado_a_matricular)))].sort();

  const alumnosFiltrados = params.alumnos.filter(alumno => {
    const coincideGrado  = filtroGrado  ? getNombreGrado(alumno.grado_a_matricular) === filtroGrado  : true;
    const coincideNombre = filtroNombre ? alumno.nombre_completo.toLowerCase().includes(filtroNombre.toLowerCase()) : true;
    return coincideGrado && coincideNombre;
  });

  const handleAlumnoSeleccion = (alumnoId) => {
    setAlumnosSeleccionados(prev =>
      prev.includes(alumnoId) ? prev.filter(id => id !== alumnoId) : [...prev, alumnoId]
    );
  };

  const handleSeleccionarTodos = () => {
    const todosIds = alumnosFiltrados.map(a => a._id);
    if (todosIds.every(id => alumnosSeleccionados.includes(id))) {
      setAlumnosSeleccionados(prev => prev.filter(id => !todosIds.includes(id)));
    } else {
      setAlumnosSeleccionados(prev => {
        const nuevos = todosIds.filter(id => !prev.includes(id));
        return [...prev, ...nuevos];
      });
    }
  };

  const handleAlumnosAgregar = () => {
    if (alumnosSeleccionados.length === 0) {
      enviarNotificacion("Seleccione al menos un alumno", "error"); return;
    }
    setHorarioEdicion(prev => {
      const nuevos = alumnosSeleccionados.filter(id => !prev.alumnos.includes(id));
      if (nuevos.length === 0) {
        enviarNotificacion("Los alumnos seleccionados ya están en la lista", "error");
        return prev;
      }
      return { ...prev, alumnos: [...prev.alumnos, ...nuevos] };
    });
    setAlumnosSeleccionados([]);
    enviarNotificacion(`${alumnosSeleccionados.length} alumno(s) agregado(s)`, "success");
  };

  const handleAlumnoEliminar = (id_alumno) => {
    setHorarioEdicion(prev => ({ ...prev, alumnos: prev.alumnos.filter(a => a !== id_alumno) }));
  };

  // ── Pestañas ───────────────────────────────────────────
  const tabs = [
    { key: "detalle", label: "Detalle",  ico: <FileText  size={14}/> },
    { key: "alumnos", label: "Alumnos",  ico: <Users     size={14}/> },
  ];

  // ── Render ─────────────────────────────────────────────
  return (
    <motion.div className="dn-overlay"
      onClick={onCerrar}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <style>{CSS}</style>

      <motion.div className="dn-modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale:0.85, y:40 }}
        animate={{ scale:1, y:0 }}
        exit={{ scale:0.85, y:40 }}
        transition={{ type:"spring", damping:22, stiffness:280 }}>

        {/* ── Header ────────────────────────────────────── */}
        <div className="dn-modal-header">
          <h3>
            <Edit size={20}/>
            {esCreacion ? "Nuevo Horario" : "Detalle del Horario"}
          </h3>
          <button className="dn-modal-close" onClick={onCerrar}><X size={17}/></button>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="dn-modal-tabs">
          {tabs.map(t => (
            <button key={t.key} type="button"
              className={`dn-tab-btn${tabActiva === t.key ? " active" : ""}`}
              onClick={() => setTabActiva(t.key)}>
              {t.ico} {t.label}
            </button>
          ))}
        </div>

        {/* ── Contenido tabs ────────────────────────────── */}
        <div style={{ flex:1, overflowY:"auto" }}>
          <AnimatePresence mode="wait">

            {/* ══ TAB: Detalle ══ */}
            {tabActiva === "detalle" && (
              <motion.div key="detalle"
                className="dn-tab-content"
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:14 }} transition={{ duration:0.22 }}>

                {/* ── Asignatura — dinámico desde catálogo API ── */}
                <div className="dn-form-section-title">
                  <BookOpen size={14}/> Asignatura
                </div>
                <div className="dn-form-group dn-full" style={{ marginBottom:16 }}>
                  <label>Asignatura <span className="req">*</span></label>
                  {cargandoAsignaturas ? (
                    <div className="dn-cat-loading">Cargando asignaturas...</div>
                  ) : (
                    <select
                      className="dn-select"
                      value={horarioEdicion.asignatura}
                      onChange={e => setHorarioEdicion({ ...horarioEdicion, asignatura: e.target.value })}
                    >
                      <option value="">Seleccionar asignatura...</option>
                      {catAsignaturas.map(a => (
                        <option key={a.valor} value={a.valor}>{a.etiqueta}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Días de la semana */}
                <div className="dn-form-section-title" style={{ marginTop:4 }}>
                  <ChevronRight size={14}/> Días de la semana
                </div>
                <div className="dn-dias-grid" style={{ marginBottom:18 }}>
                  {Object.keys(diasSemana).map(key => (
                    <div key={key}
                      className={`dn-dia-chip${(horarioEdicion.dia || []).includes(key) ? " activo" : ""}`}
                      onClick={() => handleDiaChange(key)}>
                      {diasSemana[key]}
                    </div>
                  ))}
                </div>

                {/* Horario (horas) */}
                <div className="dn-form-section-title">
                  <Clock size={14}/> Horario
                </div>
                <div style={{ marginBottom:18 }}>
                  <div className="dn-info-box" style={{ marginBottom:10, fontSize:".78rem" }}>
                    Usa el reloj o escribe directamente en formato HH:MM
                  </div>
                  <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
                    {/* Inicio */}
                    <div className="dn-time-block">
                      <span className="dn-time-label">Inicio</span>
                      <input className="dn-time-input"
                        type={horaManualInicio ? "text" : "time"}
                        value={horarioEdicion.inicio}
                        onChange={e => handleTimeChange("inicio", e.target.value)}
                        placeholder="07:00"/>
                      <button type="button" className="dn-time-toggle"
                        onClick={() => setHoraManualInicio(p => !p)}
                        title={horaManualInicio ? "Usar selector de hora" : "Escribir hora manualmente"}>
                        {horaManualInicio ? "🕐 Picker" : "✏️ Manual"}
                      </button>
                    </div>

                    <span className="dn-time-sep">→</span>

                    {/* Fin */}
                    <div className="dn-time-block">
                      <span className="dn-time-label">Fin</span>
                      <input className="dn-time-input"
                        type={horaManualFin ? "text" : "time"}
                        value={horarioEdicion.fin}
                        onChange={e => handleTimeChange("fin", e.target.value)}
                        placeholder="08:00"/>
                      <button type="button" className="dn-time-toggle"
                        onClick={() => setHoraManualFin(p => !p)}
                        title={horaManualFin ? "Usar selector de hora" : "Escribir hora manualmente"}>
                        {horaManualFin ? "🕐 Picker" : "✏️ Manual"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Docente y Grado */}
                <div className="dn-form-section-title">
                  <GraduationCap size={14}/> Asignación Académica
                </div>
                <div className="dn-form-grid">
                  {/* Docente */}
                  <div className="dn-form-group">
                    <label>Docente <span className="req">*</span></label>
                    <select className="dn-select"
                      value={horarioEdicion.docente_id}
                      onChange={e => setHorarioEdicion({ ...horarioEdicion, docente_id: e.target.value })}>
                      <option value="" disabled>Seleccione un docente</option>
                      {params.docentes
                        .filter(d => d.cargo_asignacion?.cargo === "DOCENTE")
                        .map((d, i) => (
                          <option key={i} value={normId(d._id)}>
                            {d.numero_identidad} | {d.nombres} {d.apellidos}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Grado / Aula */}
                  <div className="dn-form-group">
                    <label>Grado / Aula <span className="req">*</span></label>
                    <select className="dn-select"
                      value={horarioEdicion.aula_id}
                      onChange={handleAulaChange}>
                      <option value="" disabled>Seleccione un grado/aula</option>
                      {params.aulas.map((aula, i) => {
                        const gradoInfo = grados.find(g => g._id === normId(aula._id));
                        const seccion   = gradoInfo?.seccion || aula.seccion || "";
                        const anio      = gradoInfo?.anio    || aula.anio_academico || "";
                        const label = [
                          aula.grado,
                          seccion ? `Secc. ${seccion}` : "",
                          aula.aula ? `Aula: ${aula.aula}` : "",
                          anio     ? `(${anio})`           : "",
                        ].filter(Boolean).join(" | ");
                        return <option key={i} value={normId(aula._id)}>{label}</option>;
                      })}
                    </select>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ══ TAB: Alumnos ══ */}
            {tabActiva === "alumnos" && (
              <motion.div key="alumnos"
                className="dn-tab-content"
                initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, y:14 }} transition={{ duration:0.22 }}>

                {/* Alumnos asignados */}
                <div className="dn-form-section-title">
                  <Users size={14}/> Alumnos asignados ({horarioEdicion.alumnos.length})
                </div>
                <div className="dn-alumnos-table-wrap" style={{ marginBottom:22 }}>
                  <table className="dn-alumnos-table">
                    <thead>
                      <tr>
                        <th>Identidad</th>
                        <th>Nombre</th>
                        <th>Grado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {horarioEdicion.alumnos.map((alumno_id, key) => {
                        const alumno = params.alumnos.find(a => a._id === alumno_id);
                        if (!alumno) return null;
                        return (
                          <tr key={key}>
                            <td>{alumno.id_documento}</td>
                            <td>{alumno.nombre_completo}</td>
                            <td><span className="dn-badge-grado">{getNombreGrado(alumno.grado_a_matricular)}</span></td>
                            <td>
                              <WithPermission requiredPermissions={["ELIMINAR_HORARIOS"]}>
                                <button className="dn-btn-icon-danger"
                                  onClick={() => handleAlumnoEliminar(alumno._id)}>
                                  <Trash2 size={14}/>
                                </button>
                              </WithPermission>
                            </td>
                          </tr>
                        );
                      })}
                      {horarioEdicion.alumnos.length === 0 && (
                        <tr><td colSpan={4} className="dn-alumnos-empty">Sin alumnos asignados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Agregar alumnos */}
                <div className="dn-form-section-title">
                  <Plus size={14}/> Agregar alumnos
                </div>

                {/* Filtros */}
                <div className="dn-alumnos-filters">
                  <div className="dn-form-group">
                    <label>Filtrar por grado</label>
                    <select className="dn-select" value={filtroGrado}
                      onChange={e => setFiltroGrado(e.target.value)}>
                      <option value="">Todos los grados</option>
                      {gradosUnicos.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="dn-form-group">
                    <label>Buscar por nombre</label>
                    <div className="dn-search-wrapper">
                      <span className="dn-search-icon"><Search size={14}/></span>
                      <input className="dn-search-input" type="text"
                        placeholder="Nombre del alumno..."
                        value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)}/>
                    </div>
                  </div>
                </div>

                {/* Encabezado de selección */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:".82rem", color:"#7A6FA0", fontWeight:700 }}>
                    {alumnosFiltrados.length} alumno(s) encontrado(s)
                  </span>
                  <button className="dn-btn-outline" onClick={handleSeleccionarTodos}>
                    <CheckSquare size={13}/>
                    {alumnosFiltrados.every(a => alumnosSeleccionados.includes(a._id))
                      ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>

                {/* Tabla disponibles */}
                <div className="dn-alumnos-table-wrap dn-scroll-table" style={{ marginBottom:14 }}>
                  <table className="dn-alumnos-table">
                    <thead>
                      <tr>
                        <th style={{ width:44 }}>Sel.</th>
                        <th>Identidad</th>
                        <th>Nombre</th>
                        <th>Grado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosFiltrados.map((alumno, i) => (
                        <tr key={i}
                          className={alumnosSeleccionados.includes(alumno._id) ? "sel-row" : ""}
                          onClick={() => handleAlumnoSeleccion(alumno._id)}
                          style={{ cursor:"pointer" }}>
                          <td>
                            <input type="checkbox" className="dn-checkbox"
                              checked={alumnosSeleccionados.includes(alumno._id)}
                              onChange={() => handleAlumnoSeleccion(alumno._id)}
                              onClick={e => e.stopPropagation()}/>
                          </td>
                          <td>{alumno.id_documento}</td>
                          <td>{alumno.nombre_completo}</td>
                          <td><span className="dn-badge-grado">{getNombreGrado(alumno.grado_a_matricular)}</span></td>
                        </tr>
                      ))}
                      {alumnosFiltrados.length === 0 && (
                        <tr><td colSpan={4} className="dn-alumnos-empty">
                          No se encontraron alumnos con los filtros aplicados
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Acciones agregar */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  {alumnosSeleccionados.length > 0
                    ? <span className="dn-sel-badge"><Users size={13}/>{alumnosSeleccionados.length} seleccionado(s)</span>
                    : <span style={{ fontSize:".8rem", color:"#aaa" }}>Selecciona alumnos para agregar</span>
                  }
                  <WithPermission requiredPermissions={["CREAR_MATRICULA"]}>
                    <button className="dn-btn-success" onClick={handleAlumnosAgregar}
                      disabled={alumnosSeleccionados.length === 0}>
                      <Plus size={15}/> Agregar seleccionados
                    </button>
                  </WithPermission>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="dn-modal-footer">
          <div>
            {!esCreacion && (
              <WithPermission requiredPermissions={["ELIMINAR_HORARIOS"]}>
                <motion.button className="dn-btn-eliminar"
                  onClick={() => onEliminar(horarioEdicion._id)}
                  whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                 Eliminar
                </motion.button>
              </WithPermission>
            )}
          </div>

          <div className="dn-footer-right">
            <motion.button className="dn-btn-cerrar"
              onClick={onCerrar}
              whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
              Cerrar
            </motion.button>
            <WithPermission requiredPermissions={["ACTUALIZAR_HORARIOS"]}>
              <motion.button className="dn-btn-guardar"
                onClick={() => onGuardar(horarioEdicion, esCreacion)}
                whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                Guardar
              </motion.button>
            </WithPermission>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default ModalDetalleHorario;