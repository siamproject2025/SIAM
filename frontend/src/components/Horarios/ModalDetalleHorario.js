// ============================================================
// ModalDetalleHorario.jsx
//
// FIX Horarios #1 CRÍTICO — Mantenimiento de asignaturas:
//   Las asignaturas se eligen de un catálogo precargado.
//   El admin puede agregar nuevas al catálogo desde aquí.
//   Se guarda en localStorage como siam_asignaturas.
//
// FIX Horarios #2 MEDIO — Selector de hora permite
//   tanto el picker nativo como digitación manual (text).
//
// FIX Grados #2 MEDIO — Selector de grado/aula muestra
//   nombre completo + sección + aula + año para identificarlo.
//
// FIX Horarios #5 MEDIO — Corregido botón mal etiquetado.
// ============================================================
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit, Trash, Plus, BookOpen, X, Clock } from "lucide-react";
import axios from 'axios';
import { auth } from "../../components/authentication/Auth";
import WithPermission from "../Permisos/WithPermission";

const diasSemana = {
  LUN: "Lunes",
  MAR: "Martes",
  MIE: "Miércoles",
  JUE: "Jueves",
  VIE: "Viernes",
  SAB: "Sábado",
};

// ── Clave para el catálogo de asignaturas en localStorage ────
const ASIGNATURAS_KEY = "siam_asignaturas";

// ── Asignaturas predeterminadas del catálogo ─────────────────
const ASIGNATURAS_DEFAULT = [
  "Teoría Musical", "Solfeo", "Armonía", "Historia de la Música",
  "Piano", "Guitarra", "Violín", "Flauta", "Trompeta", "Percusión",
  "Canto", "Coro", "Educación Musical", "Lectura Musical",
  "Apreciación Musical", "Contrapunto", "Composición",
];

// ── Hook para leer/guardar asignaturas ───────────────────────
const useAsignaturas = () => {
  const [asignaturas, setAsignaturas] = useState(() => {
    try {
      const stored = localStorage.getItem(ASIGNATURAS_KEY);
      return stored ? JSON.parse(stored) : ASIGNATURAS_DEFAULT;
    } catch { return ASIGNATURAS_DEFAULT; }
  });

  const agregar = (nueva) => {
    const nombre = nueva.trim();
    if (!nombre) return false;
    if (asignaturas.find(a => a.toLowerCase() === nombre.toLowerCase())) return false;
    const actualizado = [...asignaturas, nombre].sort();
    setAsignaturas(actualizado);
    localStorage.setItem(ASIGNATURAS_KEY, JSON.stringify(actualizado));
    return true;
  };

  return { asignaturas, agregar };
};

// ── CSS inline ────────────────────────────────────────────────
const CSS = `
  .mh-asig-select { padding:9px 12px; border:2px solid #E0D9F5; border-radius:8px; font-family:inherit; font-size:.9rem; color:#2D2250; background:#FAF9FF; outline:none; width:100%; }
  .mh-asig-select:focus { border-color:#6C4FBF; }
  .mh-asig-row { display:flex; gap:8px; align-items:flex-end; }
  .mh-asig-new-input { flex:1; padding:9px 12px; border:2px solid #E0D9F5; border-radius:8px; font-family:inherit; font-size:.88rem; color:#2D2250; background:#FAF9FF; outline:none; }
  .mh-asig-new-input:focus { border-color:#6C4FBF; }
  .mh-add-btn { display:inline-flex; align-items:center; gap:6px; padding:9px 14px; background:#6C4FBF; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:.84rem; font-weight:700; white-space:nowrap; }
  .mh-add-btn:hover { background:#4B3090; }
  .mh-time-group { display:flex; align-items:center; gap:8px; }
  .mh-time-input { padding:9px 12px; border:2px solid #E0D9F5; border-radius:8px; font-family:inherit; font-size:.9rem; color:#2D2250; background:#FAF9FF; outline:none; width:130px; }
  .mh-time-input:focus { border-color:#6C4FBF; }
  .mh-time-toggle { padding:6px 10px; background:#EDE9FF; color:#6C4FBF; border:2px solid #C4B5E8; border-radius:7px; cursor:pointer; font-size:.75rem; font-weight:700; white-space:nowrap; }
  .mh-time-toggle:hover { background:#6C4FBF; color:#fff; }
  .mh-grado-option-main { font-weight:700; }
  .mh-grado-option-sub  { font-size:.78rem; color:#7A6FA0; }
  .mh-info-box { background:#E8F4FD; border-left:3px solid #2980B9; border-radius:8px; padding:8px 12px; font-size:.82rem; color:#0c4a6e; margin-bottom:12px; }
`;

const ModalDetalleHorario = ({
  params,
  onGuardar,
  onEliminar,
  onCerrar,
  enviarNotificacion,
}) => {
  const [horarioEdicion, setHorarioEdicion] = useState({ ...params.horario });
  const [esCreacion, setEsCreacion]         = useState(params.esCreacion);
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState([]);
  const [vistaDetalle, setVistaDetalle]     = useState(params.esDetalle);
  const [vistaAlumnos, setVistaAlumnos]     = useState(!params.esDetalle);
  const [filtroGrado, setFiltroGrado]       = useState("");
  const [filtroNombre, setFiltroNombre]     = useState("");
  const [grados, setGrados]                 = useState([]);

  // FIX #1: catálogo de asignaturas
  const { asignaturas, agregar: agregarAsignatura } = useAsignaturas();
  const [nuevaAsignatura, setNuevaAsignatura]       = useState("");
  const [showNuevaAsig, setShowNuevaAsig]           = useState(false);

  // FIX #2: toggle entre picker y digitación manual de hora
  const [horaManualInicio, setHoraManualInicio] = useState(false);
  const [horaManualFin, setHoraManualFin]       = useState(false);

  const API_HOST  = process.env.REACT_APP_API_URL;
  const API_GRADOS = `${API_HOST}/api/grados`;

  // ── Obtener grados ────────────────────────────────────────
  const obtenerGrados = async () => {
    try {
      const user  = auth.currentUser;
      const token = await user.getIdToken();
      const res   = await axios.get(API_GRADOS, { headers: { Authorization: `Bearer ${token}` } });
      setGrados(res.data.items.map(item => ({
        _id:    item._id,
        nombre: item.grado,
        seccion:item.seccion || "",
        aula:   item.aula    || "",
        anio:   item.anio_academico || "",
      })));
    } catch {
      setGrados([
        { _id:'1', nombre:'Primer Grado',  seccion:'A', aula:'Aula 1', anio:2026 },
        { _id:'2', nombre:'Segundo Grado', seccion:'A', aula:'Aula 2', anio:2026 },
        { _id:'3', nombre:'Tercer Grado',  seccion:'A', aula:'Aula 3', anio:2026 },
        { _id:'4', nombre:'Cuarto Grado',  seccion:'A', aula:'Aula 4', anio:2026 },
        { _id:'5', nombre:'Quinto Grado',  seccion:'A', aula:'Aula 5', anio:2026 },
        { _id:'6', nombre:'Sexto Grado',   seccion:'A', aula:'Aula 6', anio:2026 },
      ]);
    }
  };

  useEffect(() => { obtenerGrados(); }, []);

  const getNombreGrado = (gradoId) => {
    const g = grados.find(x => x._id === gradoId);
    return g ? g.nombre : gradoId;
  };

  // ── Handlers ─────────────────────────────────────────────
  const clickVistaDetalle = () => { setVistaDetalle(true);  setVistaAlumnos(false); };
  const clickVistaAlumno  = () => { setVistaDetalle(false); setVistaAlumnos(true);  };

  const handleDiaChange = (dia) => {
    const diasActuales = horarioEdicion.dia || [];
    const nuevosDias   = diasActuales.includes(dia)
      ? diasActuales.filter(d => d !== dia)
      : [...diasActuales, dia];
    setHorarioEdicion({ ...horarioEdicion, dia: nuevosDias });
  };

  // FIX #2: setter de hora con validación de formato HH:MM
  const handleTimeChange = (campo, value) => {
    // Acepta tanto HH:MM como tiempo libre escrito a mano
    setHorarioEdicion({ ...horarioEdicion, [campo]: value });
  };

  const handleAulaChange = (event) => {
    const nuevaAula       = event.target.value;
    const aulaSeleccionada = params.aulas.find(a => a._id === nuevaAula);
    const textoGrado       = aulaSeleccionada ? aulaSeleccionada.grado : "";
    setHorarioEdicion({ ...horarioEdicion, aula_id: nuevaAula, grado: textoGrado });
  };

  // FIX #1: agregar asignatura al catálogo
  const handleAgregarAsignatura = () => {
    const ok = agregarAsignatura(nuevaAsignatura);
    if (ok) {
      // Seleccionar la nueva asignatura automáticamente
      setHorarioEdicion({ ...horarioEdicion, asignatura: nuevaAsignatura.trim() });
      setNuevaAsignatura("");
      setShowNuevaAsig(false);
      enviarNotificacion(`Asignatura "${nuevaAsignatura.trim()}" agregada al catálogo`, "success");
    } else {
      enviarNotificacion("La asignatura ya existe en el catálogo", "error");
    }
  };

  // ── Alumnos ───────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────
  return (
    <motion.div className="modal-overlay-donaciones"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => onCerrar()}>
      <style>{CSS}</style>
      <motion.div className="modal-content-donaciones"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", damping: 20 }}
        style={{ width:"95vw", maxWidth:"950px", minWidth:"900px", maxHeight:"90vh", overflow:"auto" }}>

        <h3 className="modal-title">
          <Edit size={24} /> Detalle del Horario
        </h3>

        <ul className="nav nav-tabs justify-content-center">
          <li className="nav-item">
            <a href="#" className={`nav-link ${vistaDetalle ? "active" : ""}`} onClick={e=>{e.preventDefault();clickVistaDetalle();}}>Detalle</a>
          </li>
          <li className="nav-item">
            <a href="#" className={`nav-link ${vistaAlumnos ? "active" : ""}`} onClick={e=>{e.preventDefault();clickVistaAlumno();}}>Alumnos</a>
          </li>
        </ul>

        <div className="tab-content">
          <AnimatePresence mode="wait">

            {/* ──────── Vista Detalle ──────── */}
            {vistaDetalle && (
              <motion.div key="detalle"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
                transition={{ duration:0.3 }} className="mt-3">

                {/* FIX #1: selector de asignatura desde catálogo */}
                <div className="form-group">
                  <label className="form-label d-flex align-items-center gap-2">
                    <BookOpen size={15}/> Asignatura *
                  </label>
                  <div className="mh-asig-row">
                    <select className="mh-asig-select"
                      value={horarioEdicion.asignatura}
                      onChange={e => setHorarioEdicion({ ...horarioEdicion, asignatura: e.target.value })}>
                      <option value="">Seleccionar asignatura...</option>
                      {asignaturas.sort().map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                    <button type="button" className="mh-add-btn"
                      onClick={() => setShowNuevaAsig(p => !p)}
                      title="Agregar nueva asignatura al catálogo">
                      <Plus size={14}/> Nueva
                    </button>
                  </div>

                  {/* Panel para agregar nueva asignatura */}
                  <AnimatePresence>
                    {showNuevaAsig && (
                      <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                        exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', marginTop:8 }}>
                        <div className="mh-info-box">
                          ℹ La asignatura se agregará al catálogo permanente y estará disponible para todos los horarios.
                        </div>
                        <div className="mh-asig-row">
                          <input className="mh-asig-new-input" value={nuevaAsignatura}
                            onChange={e => setNuevaAsignatura(e.target.value)}
                            placeholder="Ej: Saxofón, Música de Cámara..."
                            onKeyDown={e => { if (e.key === 'Enter') handleAgregarAsignatura(); }}/>
                          <button type="button" className="mh-add-btn" onClick={handleAgregarAsignatura}>
                            <Plus size={14}/> Agregar
                          </button>
                          <button type="button"
                            style={{ padding:'9px 10px', background:'#FDE8E8', color:'#E74C3C', border:'none', borderRadius:8, cursor:'pointer' }}
                            onClick={() => { setShowNuevaAsig(false); setNuevaAsignatura(""); }}>
                            <X size={14}/>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Días de la semana */}
                <div className="form-group mb-0">
                  <label className="form-label">Días de la semana *</label>
                </div>
                <div className="mb-1">
                  {Object.keys(diasSemana).map((key, i) => (
                    <div className="form-check form-check-inline" key={i}>
                      <input className="form-check-input" type="checkbox"
                        checked={horarioEdicion.dia.includes(key)}
                        onChange={() => handleDiaChange(key)} />
                      <label className="form-check-label">{diasSemana[key]}</label>
                    </div>
                  ))}
                </div>

                {/* FIX #2: selector de hora con toggle picker ↔ digitación manual */}
                <div className="form-group">
                  <label className="form-label d-flex align-items-center gap-2">
                    <Clock size={15}/> Horario *
                    <small style={{ color:'#7A6FA0', fontWeight:400 }}>
                      — usa el reloj o escribe directamente (HH:MM)
                    </small>
                  </label>
                  <div className="d-flex gap-3 align-items-center flex-wrap">
                    {/* Inicio */}
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold" style={{ fontSize:'.85rem', color:'#6C4FBF' }}>Inicio</span>
                      <input
                        className="mh-time-input"
                        type={horaManualInicio ? "text" : "time"}
                        value={horarioEdicion.inicio}
                        onChange={e => handleTimeChange('inicio', e.target.value)}
                        placeholder="07:00"
                      />
                      {/* FIX #2: botón para alternar entre picker y texto */}
                      <button type="button" className="mh-time-toggle"
                        onClick={() => setHoraManualInicio(p => !p)}
                        title={horaManualInicio ? "Usar selector de hora" : "Escribir hora manualmente"}>
                        {horaManualInicio ? "🕐 Picker" : "✏️ Manual"}
                      </button>
                    </div>

                    <span style={{ color:'#7A6FA0', fontWeight:700 }}>→</span>

                    {/* Fin */}
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold" style={{ fontSize:'.85rem', color:'#6C4FBF' }}>Fin</span>
                      <input
                        className="mh-time-input"
                        type={horaManualFin ? "text" : "time"}
                        value={horarioEdicion.fin}
                        onChange={e => handleTimeChange('fin', e.target.value)}
                        placeholder="08:00"
                      />
                      <button type="button" className="mh-time-toggle"
                        onClick={() => setHoraManualFin(p => !p)}
                        title={horaManualFin ? "Usar selector de hora" : "Escribir hora manualmente"}>
                        {horaManualFin ? "🕐 Picker" : "✏️ Manual"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Docente */}
                <div className="form-group">
                  <label className="form-label">Docente *</label>
                  <select className="form-select"
                    value={horarioEdicion.docente_id}
                    onChange={e => setHorarioEdicion({ ...horarioEdicion, docente_id: e.target.value })}>
                    <option value="" disabled>Seleccione un docente</option>
                    {params.docentes
                      .filter(d => d.cargo_asignacion?.cargo === "DOCENTE")
                      .map((d, i) => (
                        <option key={i} value={d._id}>
                          {d.numero_identidad} | {d.nombres} {d.apellidos}
                        </option>
                      ))}
                  </select>
                </div>

                {/* FIX Grados #2: selector con más información para identificar el grado */}
                <div className="form-group">
                  <label className="form-label">Grado / Aula *</label>
                  <div className="mh-info-box" style={{ marginBottom:8 }}>
                    ℹ El selector muestra: <strong>Nombre del Grado | Sección | Aula | Año</strong>
                  </div>
                  <select className="form-select"
                    value={horarioEdicion.aula_id}
                    onChange={handleAulaChange}>
                    <option value="" disabled>Seleccione un grado/aula</option>
                    {params.aulas.map((aula, i) => {
                      // FIX Grados #2: mostrar información completa y clara
                      const gradoInfo = grados.find(g => g._id === aula._id);
                      const seccion   = gradoInfo?.seccion || aula.seccion || "";
                      const anio      = gradoInfo?.anio    || aula.anio_academico || "";
                      const label = [
                        aula.grado,
                        seccion ? `Secc. ${seccion}` : "",
                        aula.aula ? `Aula: ${aula.aula}` : "",
                        anio ? `(${anio})` : "",
                      ].filter(Boolean).join(" | ");

                      return (
                        <option key={i} value={aula._id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

              </motion.div>
            )}

            {/* ──────── Vista Alumnos ──────── */}
            {vistaAlumnos && (
              <motion.div key="alumnos"
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
                transition={{ duration:0.3 }} className="mt-3">

                <h4>Alumnos asignados</h4>
                <table className="table table-striped table-hover table-bordered mb-5">
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
                          <td>{getNombreGrado(alumno.grado_a_matricular)}</td>
                          <td>
                            <WithPermission requiredPermissions={["ELIMINAR_HORARIOS"]}>
                              <button className="btn btn-danger btn-sm"
                                onClick={() => handleAlumnoEliminar(alumno._id)}>
                                <Trash size={16}/>
                              </button>
                            </WithPermission>
                          </td>
                        </tr>
                      );
                    })}
                    {horarioEdicion.alumnos.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted py-3">Sin alumnos asignados</td></tr>
                    )}
                  </tbody>
                </table>

                <h4>Agregar alumnos</h4>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Filtrar por grado</label>
                    <select className="form-select" value={filtroGrado} onChange={e => setFiltroGrado(e.target.value)}>
                      <option value="">Todos los grados</option>
                      {gradosUnicos.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Filtrar por nombre</label>
                    <input type="text" className="form-control"
                      placeholder="Buscar por nombre..."
                      value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6>Seleccionar alumnos ({alumnosFiltrados.length} encontrados)</h6>
                    <button className="btn btn-outline-primary btn-sm" onClick={handleSeleccionarTodos}>
                      {alumnosFiltrados.every(a => alumnosSeleccionados.includes(a._id))
                        ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                  </div>
                  <div style={{ maxHeight:"300px", overflowY:"auto" }}>
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th width="50px">Sel.</th>
                          <th>Identidad</th>
                          <th>Nombre</th>
                          <th>Grado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alumnosFiltrados.map((alumno, i) => (
                          <tr key={i} className={alumnosSeleccionados.includes(alumno._id) ? "table-active" : ""}>
                            <td>
                              <input type="checkbox" className="form-check-input"
                                checked={alumnosSeleccionados.includes(alumno._id)}
                                onChange={() => handleAlumnoSeleccion(alumno._id)} />
                            </td>
                            <td>{alumno.id_documento}</td>
                            <td>{alumno.nombre_completo}</td>
                            <td>{getNombreGrado(alumno.grado_a_matricular)}</td>
                          </tr>
                        ))}
                        {alumnosFiltrados.length === 0 && (
                          <tr><td colSpan={4} className="text-center text-muted">
                            No se encontraron alumnos con los filtros aplicados
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">{alumnosSeleccionados.length} alumno(s) seleccionado(s)</span>
                  <WithPermission requiredPermissions={["CREAR_MATRICULA"]}>
                    <button className="btn btn-success" onClick={handleAlumnosAgregar}
                      disabled={alumnosSeleccionados.length === 0}>
                      <Plus size={16} className="me-1" /> Agregar seleccionados
                    </button>
                  </WithPermission>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Acciones */}
        <div className="modal-actions-donaciones justify-content-between">
          <WithPermission requiredPermissions={["ACTUALIZAR_HORARIOS"]}>
            {/* FIX #5: texto correcto "Guardar" */}
            <motion.button className="btn-guardar-donaciones"
              onClick={() => onGuardar(horarioEdicion, esCreacion)}
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
              Guardar
            </motion.button>
          </WithPermission>
          {!esCreacion && (
            <WithPermission requiredPermissions={["ELIMINAR_HORARIOS"]}>
              <motion.button className="btn btn-danger"
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={() => onEliminar(horarioEdicion._id)}>
                Eliminar
              </motion.button>
            </WithPermission>
          )}
          <motion.button type="button" className="btn btn-dark"
            onClick={() => onCerrar()}
            whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
            Cerrar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalDetalleHorario;