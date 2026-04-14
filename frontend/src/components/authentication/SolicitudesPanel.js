import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ModalEditarAsignacion from "./ModalEditarAsignacion";
// Agrega estos imports al inicio de SolicitudesPanel.jsx
import { motion } from "framer-motion";
import { 
  ClipboardList, Clock, CheckCircle, XCircle, 
  ShieldOff, ShieldCheck, Pencil, RotateCcw, X, 
  Edit
} from "lucide-react";
import WithPermission from "../Permisos/WithPermission";

const API_URL = process.env.REACT_APP_API_URL;

const theme = {
  bg:          "#0f1117",
  surface:     "#ffffff",
  surfaceAlt:  "#fbfbfb",
  border:      "#2e3352",
  accent:      "#4f8ef7",
  accentHover: "#6ba3ff",
  success:     "#22c55e",
  danger:      "#ef4444",
  warning:     "#f59e0b",
  muted:       "#6b7280",
  text:        "#1e1b4b",
  textSoft:    "#6b7280",
};
const headerStyles = {
  header: {
    background:     "linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%)",
    padding:        "28px 36px 36px",
    position:       "relative",
    overflow:       "hidden",
    marginBottom:   28,
  },
  hi: {
    position:  "relative",
    zIndex:    1,
    maxWidth:  1400,
    margin:    "0 auto",
  },
  ht: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   6,
    flexWrap:       "wrap",
    gap:            "1rem",
  },
  htitle: {
    fontFamily: "'Poppins', 'DM Sans', sans-serif",
    fontSize:   "1.65rem",
    fontWeight: 800,
    color:      "#fff",
    display:    "flex",
    alignItems: "center",
    gap:        12,
  },
  sub: {
    color:       "rgba(255,255,255,0.8)",
    fontSize:    "0.9rem",
    marginBottom: 22,
    marginTop:   4,
    maxWidth:    600,
  },
  btnRefresh: {
    display:        "flex",
    alignItems:     "center",
    gap:            8,
    background:     "rgba(255,255,255,0.15)",
    border:         "1px solid rgba(255,255,255,0.3)",
    color:          "#fff",
    borderRadius:   10,
    padding:        "9px 18px",
    cursor:         "pointer",
    fontSize:       "0.87rem",
    fontWeight:     600,
    backdropFilter: "blur(6px)",
  },
  stats: {
    display:   "flex",
    gap:       14,
    flexWrap:  "wrap",
    marginTop: 0,
  },
  stat: {
    background:     "rgba(255,255,255,0.15)",
    border:         "1px solid rgba(255,255,255,0.25)",
    borderRadius:   12,
    padding:        "11px 18px",
    display:        "flex",
    alignItems:     "center",
    gap:            12,
    backdropFilter: "blur(6px)",
    minWidth:       130,
  },
  statIco: {
    width:           34,
    height:          34,
    borderRadius:    8,
    background:      "rgba(255,255,255,0.2)",
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
  },
  statVal: {
    fontSize:   "1.35rem",
    fontWeight: 800,
    color:      "#fff",
    lineHeight: 1,
  },
  statLbl: {
    fontSize:      "0.7rem",
    color:         "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop:     3,
  },
};

const badge = {
  PENDIENTE: { bg: "#f59e0b22", color: "#f59e0b", label: "Pendiente" },
  APROBADO:  { bg: "#22c55e22", color: "#22c55e", label: "Aprobado"  },
  DENEGADO:  { bg: "#ef444422", color: "#ef4444", label: "Denegado"  },
  BLOQUEADO: { bg: "#6b728022", color: "#9ca3af", label: "Bloqueado" },
};

const FILTROS = ["TODOS", "PENDIENTE", "APROBADO", "DENEGADO", "BLOQUEADO"];

// ── Modal de Asignación al APROBAR ────────────────────────────────────────────
const ModalAsignacion = ({ solicitud, onConfirmar, onCancelar, procesando }) => {
  const [roles,           setRoles]           = useState([]);
  const [grados,          setGrados]          = useState([]);
  const [alumnos,         setAlumnos]         = useState([]);
  const [rolSelec,        setRolSelec]        = useState("");
  const [gradoSelec,      setGradoSelec]      = useState("");
  const [alumnoSelec,     setAlumnoSelec]     = useState("");
  const [cargando,        setCargando]        = useState(true);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [error,           setError]           = useState("");

  const obtenerToken = async () => {
    const { auth } = await import("../authentication/Auth");
    return auth.currentUser?.getIdToken(true);
  };

  // ── Cargar roles y grados ─────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      setError("");
      try {
        const token   = await obtenerToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [resRoles, resGrados] = await Promise.all([
          axios.get(`${API_URL}/api/roles`,  { headers }),
          axios.get(`${API_URL}/api/grados`, { headers }),
        ]);
        setRoles(resRoles.data || []);
        const listaGrados =
          Array.isArray(resGrados.data)    ? resGrados.data :
          resGrados.data?.grados           ? resGrados.data.grados :
          resGrados.data?.data             ? resGrados.data.data :
          resGrados.data?.items            ? resGrados.data.items : [];
        setGrados(listaGrados.filter(g => g.estado === "Activo"));
      } catch (e) {
        console.error("Error cargando datos:", e);
        setError("Error al cargar roles/grados.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // ── Cargar alumnos: todos al montar, filtrados al cambiar grado ───────────
  useEffect(() => {
    const cargar = async () => {
      setCargandoAlumnos(true);
      try {
        const token = await obtenerToken();
        const url = gradoSelec
          ? `${API_URL}/api/matriculas?grado_a_matricular=${gradoSelec}`
          : `${API_URL}/api/matriculas`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const lista =
          res.data?.data       ||
          res.data?.matriculas ||
          res.data?.items      ||
          (Array.isArray(res.data) ? res.data : []);
        setAlumnos(lista);
      } catch (e) {
        console.error("Error cargando alumnos:", e);
        setAlumnos([]);
      } finally {
        setCargandoAlumnos(false);
      }
    };
    cargar();
  }, [gradoSelec]); // se ejecuta al montar Y al cambiar grado

  const handleConfirmar = () => {
    if (!rolSelec) { setError("El rol es obligatorio."); return; }
    onConfirmar({ rol: rolSelec, alumno_id: alumnoSelec || null });
  };

  return (
    <div style={mA.overlay} onClick={onCancelar}>
      <div style={mA.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={mA.header}>
          <div style={mA.headerInner}>
            <div style={mA.headerIcon}>
              <CheckCircle size={22} color="white" />
            </div>
            <div>
              <h2 style={mA.titulo}>Aprobar solicitud</h2>
              <p style={mA.subtitulo}>Asigna un rol y alumno al nuevo usuario</p>
            </div>
          </div>
          <button style={mA.closeBtn} onClick={onCancelar}>
            <X size={18} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={mA.body}>

          {/* Info solicitante */}
          <div style={mA.infoBox}>
            <div style={mA.infoRow}>
              <span style={mA.infoLabel}>Solicitante</span>
              <span style={mA.infoValue}>{solicitud.nombre_solicitante}</span>
            </div>
            <div style={mA.infoDivider} />
            <div style={mA.infoRow}>
              <span style={mA.infoLabel}>Correo</span>
              <span style={mA.infoValue}>{solicitud.email}</span>
            </div>
          </div>

          {cargando ? (
            <div style={mA.cargandoBox}><Spinner dark /> Cargando datos...</div>
          ) : (
            <>
              {/* Rol */}
              <div style={mA.campo}>
                <label style={mA.label}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Rol <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  style={mA.select}
                  value={rolSelec}
                  onChange={e => setRolSelec(e.target.value)}
                >
                  <option value="">-- Seleccionar rol --</option>
                  {roles.map(r => (
                    <option key={r._id} value={r._id}>{r._id}</option>
                  ))}
                </select>
              </div>

              {/* Grado filtro */}
              <div style={mA.campo}>
                <label style={mA.label}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                  Filtrar por grado <span style={mA.opcional}>(opcional)</span>
                </label>
                <select
                  style={mA.select}
                  value={gradoSelec}
                  onChange={e => { setGradoSelec(e.target.value); setAlumnoSelec(""); }}
                >
                  <option value="">-- Todos los grados --</option>
                  {grados.map(g => (
                    <option key={g._id} value={g._id}>{g.grado} — Aula {g.aula}</option>
                  ))}
                </select>
              </div>

              {/* Alumno */}
              <div style={mA.campo}>
                <label style={mA.label}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Alumno <span style={mA.opcional}>(opcional)</span>
                </label>
                {cargandoAlumnos ? (
                  <div style={mA.cargandoBox}><Spinner dark /> Cargando alumnos...</div>
                ) : (
                  <select
                    style={mA.select}
                    value={alumnoSelec}
                    onChange={e => setAlumnoSelec(e.target.value)}
                  >
                    <option value="">-- Sin asignar alumno --</option>
                    {alumnos.map(a => (
                      <option key={a._id} value={a._id}>{a.nombre_completo}</option>
                    ))}
                  </select>
                )}
                {!gradoSelec && (
                  <p style={mA.hint}>Selecciona un grado para filtrar alumnos más fácilmente.</p>
                )}
              </div>

              {error && (
                <div style={mA.errorBox}>
                  <X size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={mA.footer}>
          <button style={mA.btnCancelar} onClick={onCancelar} disabled={procesando}>
            Cancelar
          </button>
          <button
            style={{
              ...mA.btnAprobar,
              opacity: (!rolSelec || procesando || cargando) ? 0.6 : 1,
              cursor:  (!rolSelec || procesando || cargando) ? "not-allowed" : "pointer",
            }}
            disabled={!rolSelec || procesando || cargando}
            onClick={handleConfirmar}
          >
            {procesando ? <><Spinner /> Aprobando...</> : <><CheckIcon /> Aprobar y asignar</>}
          </button>
        </div>

      </div>
    </div>
  );
};
// ── Panel principal ───────────────────────────────────────────────────────────
const SolicitudesPanel = () => {
  const [solicitudes,          setSolicitudes]          = useState([]);
  const [usuariosMap,          setUsuariosMap]          = useState({}); // { email: usuario }
  const [matriculasMap,        setMatriculasMap]        = useState({}); // { alumno_id: nombre_completo }
  const [gradosAlumnosMap,     setGradosAlumnosMap]     = useState({}); // { alumno_id: "Grado — Aula X" }
  const [filtro,               setFiltro]               = useState("TODOS");
  const [busqueda,             setBusqueda]             = useState("");
  const [cargando,             setCargando]             = useState(true);
  const [procesando,           setProcesando]           = useState(null);
  const [detalle,              setDetalle]              = useState(null);
  const [solicitudParaAprobar, setSolicitudParaAprobar] = useState(null);
  const [usuarioParaEditar,    setUsuarioParaEditar]    = useState(null);

  const obtenerToken = async () => {
    const { auth } = await import("../authentication/Auth");
    return auth.currentUser?.getIdToken(true);
  };

  const toast = (icon, text) =>
    Swal.fire({ icon, text, timer: 2500, showConfirmButton: false, position: "top", toast: true });

  const confirmar = (titulo, texto, icono = "question") =>
    Swal.fire({
      title: titulo, text: texto, icon: icono,
      showCancelButton: true,
      confirmButtonColor: theme.accent, cancelButtonColor: theme.danger,
      confirmButtonText: "Sí, continuar", cancelButtonText: "Cancelar",
      background: theme.surface, color: theme.text,
    });

  // ── Helpers de resolución en memoria ─────────────────────────────────────
  const getAlumnoId = (email) => {
    const u = usuariosMap[email];
    if (!u?.alumno) return null;
    return typeof u.alumno === "object" ? (u.alumno.$oid || u.alumno._id) : u.alumno;
  };

  const resolverAlumno = useCallback((email) => {
    const id = getAlumnoId(email);
    return id ? (matriculasMap[id] || "—") : "—";
  }, [usuariosMap, matriculasMap]);

  const resolverGrado = useCallback((email) => {
    const id = getAlumnoId(email);
    return id ? (gradosAlumnosMap[id] || "—") : "—";
  }, [usuariosMap, gradosAlumnosMap]);

  const resolverRol = useCallback((email) => {
    return usuariosMap[email]?.roles?.[0] || "—";
  }, [usuariosMap]);

  // ── Fetch en paralelo: solicitudes + usuarios + matrículas + grados ───────
  const fetchSolicitudes = useCallback(async () => {
    setCargando(true);
    try {
      const query = filtro !== "TODOS" ? `?estado=${filtro}` : "";
      const token = await obtenerToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [resSolicitudes, resUsuarios, resMatriculas, resGrados] = await Promise.all([
        axios.get(`${API_URL}/api/solicitudes${query}`, { headers }),
        axios.get(`${API_URL}/api/usuarios`,            { headers }),
        axios.get(`${API_URL}/api/matriculas`,          { headers }),
        axios.get(`${API_URL}/api/grados`,              { headers }),
      ]);

      // Map usuarios por email
      const uMap = {};
      (resUsuarios.data.users || []).forEach(u => { uMap[u.email] = u; });

      // Map grados por _id → "Nombre — Aula X"
      const gradosLista =
        Array.isArray(resGrados.data)  ? resGrados.data :
        resGrados.data?.grados         ? resGrados.data.grados :
        resGrados.data?.data           ? resGrados.data.data :
        resGrados.data?.items          ? resGrados.data.items : [];

      const gradosPorId = {};
      gradosLista.forEach(g => { gradosPorId[g._id] = `${g.grado} — Aula ${g.aula}`; });

      // Maps de matrículas
      const listaMatriculas =
        resMatriculas.data?.data       ||
        resMatriculas.data?.matriculas ||
        resMatriculas.data?.items      ||
        (Array.isArray(resMatriculas.data) ? resMatriculas.data : []);

      const mMap = {}; // alumno_id → nombre_completo
      const gMap = {}; // alumno_id → "grado — aula"

      listaMatriculas.forEach(m => {
        mMap[m._id] = m.nombre_completo;
        const gradoId =
          typeof m.grado_a_matricular === "object"
            ? (m.grado_a_matricular?._id || m.grado_a_matricular?.$oid)
            : m.grado_a_matricular;
        gMap[m._id] = gradosPorId[gradoId] || "—";
      });

      setSolicitudes(resSolicitudes.data.solicitudes || []);
      setUsuariosMap(uMap);
      setMatriculasMap(mMap);
      setGradosAlumnosMap(gMap);

    } catch (err) {
      console.error(err);
      toast("error", "Error al cargar solicitudes");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  // ── Acciones ──────────────────────────────────────────────────────────────
  const iniciarAprobacion = (solicitud) => { setDetalle(null); setSolicitudParaAprobar(solicitud); };

  const confirmarAprobacion = async ({ rol, alumno_id }) => {
    if (!solicitudParaAprobar) return;
    const id = solicitudParaAprobar._id;
    setProcesando(id);
    try {
      const token = await obtenerToken();
      await axios.patch(`${API_URL}/api/solicitudes/${id}/resolver`, { accion: "APROBADO", rol, alumno_id }, { headers: { Authorization: `Bearer ${token}` } });
      toast("success", "Solicitud aprobada y usuario configurado correctamente.");
      setSolicitudParaAprobar(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al aprobar");
    } finally { setProcesando(null); }
  };

  const denegar = async (id) => {
    const { isConfirmed } = await confirmar("¿Denegar solicitud?", "Se notificará al solicitante.");
    if (!isConfirmed) return;
    setProcesando(id);
    try {
      const token = await obtenerToken();
      await axios.patch(`${API_URL}/api/solicitudes/${id}/resolver`, { accion: "DENEGADO" }, { headers: { Authorization: `Bearer ${token}` } });
      toast("success", "Solicitud denegada.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al denegar");
    } finally { setProcesando(null); }
  };

  const bloquearUsuario = async (solicitud) => {
    const { isConfirmed } = await confirmar("¿Bloquear este acceso?", `Se desactivará la cuenta de ${solicitud.email}.`, "warning");
    if (!isConfirmed) return;
    setProcesando(solicitud._id);
    try {
      const token   = await obtenerToken();
      const usuario = usuariosMap[solicitud.email];
      if (!usuario) { toast("error", "Usuario no encontrado."); return; }
      await axios.patch(`${API_URL}/api/usuarios/${usuario._id}/bloquear`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast("success", "Usuario bloqueado correctamente.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al bloquear");
    } finally { setProcesando(null); }
  };

  const desbloquearUsuario = async (solicitud) => {
    const { isConfirmed } = await confirmar("¿Desbloquear este usuario?", `Se reactivará la cuenta de ${solicitud.email}.`);
    if (!isConfirmed) return;
    setProcesando(solicitud._id);
    try {
      const token   = await obtenerToken();
      const usuario = usuariosMap[solicitud.email];
      if (!usuario) { toast("error", "Usuario no encontrado."); return; }
      await axios.patch(`${API_URL}/api/usuarios/${usuario._id}/desbloquear`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast("success", "Usuario desbloqueado correctamente.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al desbloquear");
    } finally { setProcesando(null); }
  };

  const reabrirSolicitud = async (id) => {
    const { isConfirmed } = await confirmar("¿Reabrir esta solicitud?", "Volverá a estado Pendiente.");
    if (!isConfirmed) return;
    setProcesando(id);
    try {
      const token = await obtenerToken();
      await axios.patch(`${API_URL}/api/solicitudes/${id}/reabrir`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast("success", "Solicitud reabierta correctamente.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al reabrir");
    } finally { setProcesando(null); }
  };

  // Usa usuariosMap en memoria — sin llamada extra a la API
  const abrirEdicionAsignacion = (solicitud) => {
    const usuario = usuariosMap[solicitud.email];
    if (!usuario) { toast("error", "Usuario no encontrado."); return; }
    setDetalle(null);
    setUsuarioParaEditar(usuario);
  };

  // ── Filtrado local ────────────────────────────────────────────────────────
  const datos = solicitudes.filter(s => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      s.nombre_solicitante?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)              ||
      resolverAlumno(s.email).toLowerCase().includes(q) ||
      resolverRol(s.email).toLowerCase().includes(q)
    );
  });

  const conteo = FILTROS.reduce((acc, f) => {
    acc[f] = f === "TODOS" ? solicitudes.length : solicitudes.filter(s => s.estado === f).length;
    return acc;
  }, {});

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
            <motion.div className="mm-header"
            style={headerStyles.header}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
          >
            <div style={headerStyles.hi}>
              <div style={headerStyles.ht}>
                <motion.div
                  style={headerStyles.htitle}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <motion.span
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ClipboardList size={34} color="white" />
                  </motion.span>
                  Solicitudes de Acceso
                </motion.div>

                <motion.button
                  style={headerStyles.btnRefresh}
                  onClick={fetchSolicitudes}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <RefreshIcon /> Actualizar
                </motion.button>
              </div>

              <motion.p
                style={headerStyles.sub}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Gestiona las solicitudes de acceso de nuevos usuarios al sistema
              </motion.p>

              <motion.div
                style={headerStyles.stats}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {[
                  { ico: <ClipboardList size={18} color="white" />, val: solicitudes.length,                                          lbl: "Total"     },
                  { ico: <Clock         size={18} color="white" />, val: solicitudes.filter(s => s.estado === "PENDIENTE").length,    lbl: "Pendientes" },
                  { ico: <CheckCircle   size={18} color="white" />, val: solicitudes.filter(s => s.estado === "APROBADO").length,     lbl: "Aprobadas"  },
                  { ico: <XCircle       size={18} color="white" />, val: solicitudes.filter(s => s.estado === "DENEGADO").length,     lbl: "Denegadas"  },
                  { ico: <ShieldOff     size={18} color="white" />, val: solicitudes.filter(s => s.estado === "BLOQUEADO").length,    lbl: "Bloqueadas" },
                ].map((st, i) => (
                  <motion.div
                    key={i}
                    style={headerStyles.stat}
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div style={headerStyles.statIco}>{st.ico}</div>
                    <div>
                      <div style={headerStyles.statVal}>{st.val}</div>
                      <div style={headerStyles.statLbl}>{st.lbl}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
    <div style={styles.root}>
      <div style={styles.toolbar}>
        <div style={styles.filtros}>
          {FILTROS.map(f => (
            <button key={f} style={{ ...styles.filtroBtn, ...(filtro === f ? styles.filtroBtnActivo : {}) }} onClick={() => setFiltro(f)}>
              {f === "TODOS" ? "Todos" : badge[f]?.label}
              <span style={{ ...styles.badge, background: f === "TODOS" ? theme.accentHover + "33" : badge[f]?.bg, color: f === "TODOS" ? theme.accentHover : badge[f]?.color }}>
                {conteo[f] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <input style={styles.buscador} placeholder="Buscar por nombre, correo, alumno, rol..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      <div style={styles.tableWrap}>
        {cargando ? (
          <div style={styles.empty}><Spinner /> Cargando solicitudes...</div>
        ) : datos.length === 0 ? (
          <div style={styles.empty}>No hay solicitudes {filtro !== "TODOS" ? `con estado ${badge[filtro]?.label}` : ""}.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {["Solicitante", "Correo", "Alumno (actual)", "Grado (actual)", "Rol (actual)", "Estado", "Fecha", "Acciones"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((s, i) => (
                <tr
                  key={s._id}
                  style={{ ...styles.tr, background: i % 2 === 0 ? theme.surface : theme.surfaceAlt }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? theme.surface : theme.surfaceAlt}
                >
                  <td style={styles.td}>
                    <button style={styles.linkBtn} onClick={() => setDetalle(s)}>{s.nombre_solicitante}</button>
                  </td>
                  <td style={{ ...styles.td, color: theme.textSoft, fontSize: "0.82rem" }}>{s.email}</td>
                  {/* ✅ Alumno real desde usuarios + matrículas */}
                  <td style={styles.td}>{resolverAlumno(s.email)}</td>
                  {/* ✅ Grado real del alumno */}
                  <td style={{ ...styles.td, color: theme.textSoft }}>{resolverGrado(s.email)}</td>
                  {/* ✅ Rol real del usuario */}
                  <td style={{ ...styles.td, color: theme.textSoft }}>{resolverRol(s.email)}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.estadoBadge, background: badge[s.estado]?.bg, color: badge[s.estado]?.color }}>
                      {badge[s.estado]?.label}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: theme.textSoft, fontSize: "0.8rem" }}>
                    {new Date(s.fecha_solicitud).toLocaleDateString("es-HN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.acciones}>
                      {s.estado === "PENDIENTE" && (<>
                        <ActionBtn color={theme.success} disabled={procesando === s._id} onClick={() => iniciarAprobacion(s)} title="Aprobar y asignar"><CheckIcon /></ActionBtn>
                        <ActionBtn color={theme.danger}  disabled={procesando === s._id} onClick={() => denegar(s._id)}       title="Denegar"><XIcon /></ActionBtn>
                      </>)}
                      {s.estado === "APROBADO" && (<>
                       <WithPermission requiredPermissions={["ACTUALIZAR_SOLICITUDES"]}>
                        <button  className="bienes-btn-icon edit"     disabled={procesando === s._id} onClick={() => abrirEdicionAsignacion(s)} title="Editar asignación"><Edit size={15}/></button>
                        </WithPermission>
                        <WithPermission requiredPermissions={["ACTUALIZAR_SOLICITUDES"]}>
                        <ActionBtn color={theme.warning} disabled={procesando === s._id} onClick={() => bloquearUsuario(s)}        title="Bloquear usuario"><LockIcon /></ActionBtn>
                        </WithPermission>
                      </>)}
                      {s.estado === "BLOQUEADO" && (
                         <WithPermission requiredPermissions={["ACTUALIZAR_SOLICITUDES"]}>
                        <ActionBtn color={theme.success} disabled={procesando === s._id} onClick={() => desbloquearUsuario(s)} title="Desbloquear usuario"><UnlockIcon /></ActionBtn>
                        </WithPermission>
                      )}
                      {s.estado === "DENEGADO" && (
                        <ActionBtn color={theme.accent} disabled={procesando === s._id} onClick={() => reabrirSolicitud(s._id)} title="Reabrir solicitud"><ReabrirIcon /></ActionBtn>
                      )}
                       <WithPermission requiredPermissions={["ACTUALIZAR_SOLICITUDES"]}>
                        <ActionBtn color={theme.accent} onClick={() => setDetalle(s)} title="Ver detalle"><EyeIcon /></ActionBtn>
                        </WithPermission>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {/* Modal detalle */}
{detalle && (
  <div style={styles.overlay} onClick={() => setDetalle(null)}>
    <div style={modalDetalle.modal} onClick={e => e.stopPropagation()}>

      {/* Header con gradiente */}
      <div style={modalDetalle.header}>
        <div style={modalDetalle.headerInner}>
          <div style={modalDetalle.headerIcon}>
            <ClipboardList size={22} color="white" />
          </div>
          <div>
            <h2 style={modalDetalle.titulo}>Detalle de solicitud</h2>
            <p style={modalDetalle.subtitulo}>Información completa del solicitante</p>
          </div>
        </div>
        <button style={modalDetalle.closeBtn} onClick={() => setDetalle(null)}>
          <X size={18} color="rgba(255,255,255,0.8)" />
        </button>
      </div>

      {/* Body */}
      <div style={modalDetalle.body}>
        <div style={modalDetalle.grid}>
          <Field label="Solicitante"     value={detalle.nombre_solicitante} />
          <Field label="Correo"          value={detalle.email} />
          <Field label="Alumno"          value={detalle.nombre_alumno} />
          <Field label="Grado"           value={detalle.grado} />
          <Field label="Estado"          value={
            <span style={{ ...styles.estadoBadge, background: badge[detalle.estado]?.bg, color: badge[detalle.estado]?.color }}>
              {badge[detalle.estado]?.label}
            </span>
          } />
          <Field label="Fecha solicitud" value={new Date(detalle.fecha_solicitud).toLocaleString("es-HN")} />
          {detalle.fecha_resolucion && <Field label="Fecha resolución" value={new Date(detalle.fecha_resolucion).toLocaleString("es-HN")} />}
          {detalle.resuelto_por      && <Field label="Resuelto por"    value={detalle.resuelto_por} />}
        </div>
      </div>

      {/* Footer — botones a la derecha según estado */}
      <div style={modalDetalle.footer}>
        {/* Cancelar siempre a la izquierda */}
        <button style={modalDetalle.btnCancelar} onClick={() => setDetalle(null)}>
          <X size={15} /> Cerrar
        </button>

        {/* Acciones según estado */}
        <div style={{ display: "flex", gap: 10 }}>
          {detalle.estado === "PENDIENTE" && (
            <>
              <button
                style={{ ...modalDetalle.btnAccion, background: "#ef4444" }}
                disabled={procesando === detalle._id}
                onClick={() => denegar(detalle._id)}
              >
                <XCircle size={15} /> Denegar
              </button>
              <button
                style={{ ...modalDetalle.btnAccion, background: "linear-gradient(135deg,#6C4FBF,#9B59B6)" }}
                disabled={procesando === detalle._id}
                onClick={() => iniciarAprobacion(detalle)}
              >
                <CheckCircle size={15} /> Aprobar y asignar
              </button>
            </>
          )}
          {detalle.estado === "APROBADO" && (
            <>
              <button
                style={{ ...modalDetalle.btnAccion, background: "#f59e0b" }}
                disabled={procesando === detalle._id}
                onClick={() => bloquearUsuario(detalle)}
              >
                <ShieldOff size={15} /> Bloquear
              </button>
              <button
                style={{ ...modalDetalle.btnAccion, background: "linear-gradient(135deg,#6C4FBF,#9B59B6)" }}
                onClick={() => abrirEdicionAsignacion(detalle)}
              >
                <Pencil size={15} /> Editar asignación
              </button>
            </>
          )}
          {detalle.estado === "BLOQUEADO" && (
            <button
              style={{ ...modalDetalle.btnAccion, background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
              disabled={procesando === detalle._id}
              onClick={() => desbloquearUsuario(detalle)}
            >
              <ShieldCheck size={15} /> Desbloquear
            </button>
          )}
          {detalle.estado === "DENEGADO" && (
            <button
              style={{ ...modalDetalle.btnAccion, background: "linear-gradient(135deg,#6C4FBF,#9B59B6)" }}
              disabled={procesando === detalle._id}
              onClick={() => reabrirSolicitud(detalle._id)}
            >
              <RotateCcw size={15} /> Reabrir solicitud
            </button>
          )}
        </div>
      </div>

    </div>
  </div>
)}

      {solicitudParaAprobar && (
        <ModalAsignacion
          solicitud={solicitudParaAprobar}
          onConfirmar={confirmarAprobacion}
          onCancelar={() => setSolicitudParaAprobar(null)}
          procesando={procesando === solicitudParaAprobar._id}
        />
      )}

      {usuarioParaEditar && (
        <ModalEditarAsignacion
          usuario={usuarioParaEditar}
          onGuardado={() => {
            setUsuarioParaEditar(null);
            toast("success", "Asignación actualizada correctamente.");
            fetchSolicitudes();
          }}
          onCancelar={() => setUsuarioParaEditar(null)}
        />
      )}
    </div>
    </div>
  );
};

// ── Sub-componentes ───────────────────────────────────────────────────────────
const ActionBtn = ({ color, onClick, disabled, title, children }) => (
  <button
    style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "5px 8px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, display: "flex", alignItems: "center", transition: "all 0.15s" }}
    onClick={onClick} disabled={disabled} title={title}
    onMouseEnter={e => !disabled && (e.currentTarget.style.background = color + "44")}
    onMouseLeave={e => !disabled && (e.currentTarget.style.background = color + "22")}
  >{children}</button>
);

const Field = ({ label, value }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: "0.73rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
    <div style={{ color: "#1e1b4b", fontWeight: 500 }}>{value}</div>
  </div>
);

const CheckIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const XIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const LockIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const UnlockIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>;
const EyeIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EditIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const RefreshIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
const ReabrirIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.96" /></svg>;
const Spinner     = ({ dark }) => (
  <span style={{ display: "inline-block", width: 13, height: 13, border: `2px solid ${dark ? "#c4b5fd44" : "#ffffff44"}`, borderTop: `2px solid ${dark ? "#6366f1" : "#fff"}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", marginRight: 5 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>
);

const styles = {
  root:            { minHeight: "100vh", background: "#ffffff", color: "#0f1117", fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: "0px 28px", boxSizing: "border-box" },
  header:          { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 0, flexWrap: "wrap", gap: 12 },
  titulo:          { fontSize: "1.7rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em", color: "#1e1b4b" },
  subtitulo:       { color: "#6b7280", marginTop: 4, fontSize: "0.9rem" },
  btnRefresh:      { display: "flex", alignItems: "center", background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#1e1b4b", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: "0.87rem", fontWeight: 500 },
  toolbar:         { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  filtros:         { display: "flex", gap: 8, flexWrap: "wrap" },
  filtroBtn:       { display: "flex", alignItems: "center", gap: 6, background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#6b7280", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 },
  filtroBtnActivo: { background: "#ede9fe", border: "1px solid #c4b5fd", color: "#5b21b6" },
  badge:           { borderRadius: 20, padding: "1px 8px", fontSize: "0.75rem", fontWeight: 700 },
  buscador:        { background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#1e1b4b", borderRadius: 8, padding: "9px 14px", fontSize: "0.87rem", width: 260, outline: "none" },
  tableWrap:       { background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 12, overflow: "hidden" },
  table:           { width: "100%", borderCollapse: "collapse" },
  thead:           { background: "linear-gradient(135deg,#6C4FBF,#9B59B6)" },
  th:              { padding: "13px 16px", textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #ddd6fe" },
  tr:              { transition: "background 0.12s" },
  td:              { padding: "12px 16px", fontSize: "0.875rem", borderBottom: "1px solid #ede9fe", color: "#1e1b4b" },
  estadoBadge:     { borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, display: "inline-block" },
  acciones:        { display: "flex", gap: 6, alignItems: "center" },
  linkBtn:         { background: "none", border: "none", color: "#6366f1", cursor: "pointer", padding: 0, fontWeight: 600, fontSize: "0.875rem", textDecoration: "underline", textUnderlineOffset: 2 },
  empty:           { padding: "48px 24px", textAlign: "center", color: "#a78bfa", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  overlay:         { position: "fixed", inset: 0, background: "rgba(9,13,235,0.12)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" },
  modal:           { background: "#ffffff", border: "1px solid #ddd6fe", borderRadius: 14, padding: "28px 32px", width: 500, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(99,102,241,0.15)" },
  modalHeader:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  modalTitulo:     { fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#1e1b4b" },
  modalClose:      { background: "none", border: "none", color: "#a78bfa", fontSize: "1.2rem", cursor: "pointer", padding: "2px 6px", borderRadius: 6 },
  modalGrid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" },
  modalActions:    { display: "flex", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid #ddd6fe", flexWrap: "wrap" },
  btnModal:        { display: "flex", alignItems: "center", gap: 8, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" },
};

const asigStyles = {
  infoBox:  { background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: "8px 24px" },
  infoItem: { fontSize: "0.87rem", color: "#1e1b4b" },
  campo:    { marginBottom: 18 },
  label:    { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#5b21b6", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 },
  opcional: { fontWeight: 400, color: "#9ca3af", textTransform: "none", fontSize: "0.75rem" },
  select:   { width: "100%", background: "#faf5ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "9px 12px", fontSize: "0.875rem", color: "#1e1b4b", outline: "none", cursor: "pointer" },
  hint:     { margin: "6px 0 0", fontSize: "0.78rem", color: "#9ca3af" },
  cargando: { display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: "0.85rem", padding: "8px 0" },
};

const modalDetalle = {
  modal:       { background:"#ffffff", borderRadius:16, width:520, maxWidth:"95vw", maxHeight:"88vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(108,79,191,0.2)" },
  header:      { background:"linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%)", padding:"22px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 },
  headerInner: { display:"flex", alignItems:"center", gap:14 },
  headerIcon:  { width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  titulo:      { fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 },
  subtitulo:   { fontSize:"0.78rem", color:"rgba(255,255,255,0.75)", margin:"3px 0 0" },
  closeBtn:    { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },
  body:        { padding:"24px 28px", overflowY:"auto", flex:1 },
  grid:        { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px" },
  footer:      { display:"flex", justifyContent:"space-between", alignItems:"center", gap:10, padding:"16px 28px", borderTop:"1px solid #ede9fe", background:"#fafafa", flexShrink:0, flexWrap:"wrap" },
  btnCancelar: { display:"flex", alignItems:"center", gap:7, background:"#E0D9F5", color:"#6C4FBF", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:"0.875rem", cursor:"pointer" },
  btnAccion:   { display:"flex", alignItems:"center", gap:7, color:"#fff", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:"0.875rem", cursor:"pointer" },
};

const mA = {
  overlay:     { position:"fixed", inset:0, background:"rgba(15,10,40,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, backdropFilter:"blur(4px)" },
  modal:       { background:"#ffffff", borderRadius:16, width:540, maxWidth:"95vw", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(108,79,191,0.2)" },

  // Header verde para distinguir "aprobar" de "editar" (morado)
  header:      { background:"linear-gradient(135deg, #059669 0%, #10b981 100%)", padding:"22px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 },
  headerInner: { display:"flex", alignItems:"center", gap:14 },
  headerIcon:  { width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  titulo:      { fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 },
  subtitulo:   { fontSize:"0.78rem", color:"rgba(255,255,255,0.75)", margin:"3px 0 0" },
  closeBtn:    { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" },

  // Body
  body:        { padding:"24px 28px", overflowY:"auto", flex:1 },
  infoBox:     { background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"14px 18px", marginBottom:22 },
  infoRow:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0" },
  infoDivider: { height:1, background:"#bbf7d0", margin:"4px 0" },
  infoLabel:   { fontSize:"0.78rem", color:"#059669", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" },
  infoValue:   { fontSize:"0.875rem", color:"#1e1b4b", fontWeight:500 },

  // Campos — idénticos a ModalEditarAsignacion
  campo:       { marginBottom:18 },
  label:       { display:"flex", alignItems:"center", fontSize:"0.78rem", fontWeight:600, color:"#5b21b6", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7 },
  opcional:    { fontWeight:400, color:"#9ca3af", textTransform:"none", fontSize:"0.75rem", marginLeft:5 },
  select:      { width:"100%", background:"#faf5ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"9px 12px", fontSize:"0.875rem", color:"#1e1b4b", outline:"none", cursor:"pointer", boxSizing:"border-box" },
  hint:        { margin:"6px 0 0", fontSize:"0.75rem", color:"#9ca3af" },
  cargandoBox: { display:"flex", alignItems:"center", gap:8, color:"#7c3aed", fontSize:"0.85rem", padding:"10px 12px", background:"#faf5ff", borderRadius:8 },
  errorBox:    { display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:8, padding:"10px 14px", fontSize:"0.85rem", marginTop:4 },

  // Footer
  footer:      { display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 28px", borderTop:"1px solid #bbf7d0", background:"#fafafa", flexShrink:0 },
  btnCancelar: { display:"flex", alignItems:"center", gap:7, background:"#E0D9F5", color:"#6C4FBF", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:"0.875rem", cursor:"pointer" },
  btnAprobar:  { display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg, #059669, #10b981)", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontWeight:600, fontSize:"0.875rem", transition:"opacity 0.15s" },
};
export default SolicitudesPanel;