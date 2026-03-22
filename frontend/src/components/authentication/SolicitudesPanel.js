import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API_URL;

const theme = {
  bg:          "#0f1117",
  surface:     "#1a1d27",
  surfaceAlt:  "#22263a",
  border:      "#2e3352",
  accent:      "#4f8ef7",
  accentHover: "#6ba3ff",
  success:     "#22c55e",
  danger:      "#ef4444",
  warning:     "#f59e0b",
  muted:       "#6b7280",
  text:        "#e8eaf0",
  textSoft:    "#9ca3af",
};

const badge = {
  PENDIENTE: { bg: "#f59e0b22", color: "#f59e0b", label: "Pendiente" },
  APROBADO:  { bg: "#22c55e22", color: "#22c55e", label: "Aprobado"  },
  DENEGADO:  { bg: "#ef444422", color: "#ef4444", label: "Denegado"  },
  BLOQUEADO: { bg: "#6b728022", color: "#9ca3af", label: "Bloqueado" },
};

const FILTROS = ["TODOS", "PENDIENTE", "APROBADO", "DENEGADO", "BLOQUEADO"];

const SolicitudesPanel = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtro, setFiltro]           = useState("TODOS");
  const [busqueda, setBusqueda]       = useState("");
  const [cargando, setCargando]       = useState(true);
  const [procesando, setProcesando]   = useState(null);
  const [detalle, setDetalle]         = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSolicitudes = useCallback(async () => {
    setCargando(true);
    try {
      const query = filtro !== "TODOS" ? `?estado=${filtro}` : "";
      const token = await obtenerToken();
      const res   = await axios.get(`${API_URL}/api/solicitudes${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolicitudes(res.data.solicitudes || []);
    } catch (err) {
      console.error(err);
      toast("error", "Error al cargar solicitudes");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => { fetchSolicitudes(); }, [fetchSolicitudes]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const obtenerToken = async () => {
    const { auth } = await import("../authentication/Auth");
    return auth.currentUser?.getIdToken();
  };

  const toast = (icon, text) =>
    Swal.fire({ icon, text, timer: 2500, showConfirmButton: false, position: "top", toast: true });

  const confirmar = (titulo, texto, icono = "question") =>
    Swal.fire({
      title:              titulo,
      text:               texto,
      icon:               icono,
      showCancelButton:   true,
      confirmButtonColor: theme.accent,
      cancelButtonColor:  theme.danger,
      confirmButtonText:  "Sí, continuar",
      cancelButtonText:   "Cancelar",
      background:         theme.surface,
      color:              theme.text,
    });

  // ── Acciones ──────────────────────────────────────────────────────────────
  const resolver = async (id, accion) => {
    const txt = accion === "APROBADO"
      ? "Se creará la cuenta del usuario en Firebase."
      : "Se notificará al solicitante.";
    const { isConfirmed } = await confirmar(
      `¿${accion === "APROBADO" ? "Aprobar" : "Denegar"} solicitud?`, txt
    );
    if (!isConfirmed) return;

    setProcesando(id);
    try {
      const token = await obtenerToken();
      await axios.patch(
        `${API_URL}/api/solicitudes/${id}/resolver`,
        { accion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast("success", `Solicitud ${accion.toLowerCase()} correctamente.`);
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al procesar");
    } finally {
      setProcesando(null);
    }
  };

  const bloquearUsuario = async (solicitud) => {
    const { isConfirmed } = await confirmar(
      "¿Bloquear este acceso?",
      `Se desactivará la cuenta de ${solicitud.email}.`,
      "warning"
    );
    if (!isConfirmed) return;

    setProcesando(solicitud._id);
    try {
      const token    = await obtenerToken();
      const resUsers = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usuario = resUsers.data.users?.find(u => u.email === solicitud.email);
      if (!usuario) {
        toast("error", "Usuario no encontrado en el sistema.");
        return;
      }
      await axios.patch(
        `${API_URL}/api/usuarios/${usuario._id}/bloquear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast("success", "Usuario bloqueado correctamente.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al bloquear");
    } finally {
      setProcesando(null);
    }
  };

  // ── ✅ Desbloquear usuario ─────────────────────────────────────────────────
  const desbloquearUsuario = async (solicitud) => {
    const { isConfirmed } = await confirmar(
      "¿Desbloquear este usuario?",
      `Se reactivará la cuenta de ${solicitud.email}.`,
      "question"
    );
    if (!isConfirmed) return;

    setProcesando(solicitud._id);
    try {
      const token    = await obtenerToken();
      const resUsers = await axios.get(`${API_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usuario = resUsers.data.users?.find(u => u.email === solicitud.email);
      if (!usuario) {
        toast("error", "Usuario no encontrado en el sistema.");
        return;
      }
      await axios.patch(
        `${API_URL}/api/usuarios/${usuario._id}/desbloquear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast("success", "Usuario desbloqueado correctamente.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al desbloquear");
    } finally {
      setProcesando(null);
    }
  };

  // ── Reabrir solicitud denegada ────────────────────────────────────────────
  const reabrirSolicitud = async (id) => {
    const { isConfirmed } = await confirmar(
      "¿Reabrir esta solicitud?",
      "La solicitud volverá a estado Pendiente para ser revisada nuevamente.",
      "question"
    );
    if (!isConfirmed) return;

    setProcesando(id);
    try {
      const token = await obtenerToken();
      await axios.patch(
        `${API_URL}/api/solicitudes/${id}/reabrir`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast("success", "Solicitud reabierta correctamente.");
      setDetalle(null);
      fetchSolicitudes();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al reabrir");
    } finally {
      setProcesando(null);
    }
  };

  // ── Filtrado local ────────────────────────────────────────────────────────
  const datos = solicitudes.filter(s => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      s.nombre_solicitante?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.nombre_alumno?.toLowerCase().includes(q) ||
      s.grado?.toLowerCase().includes(q)
    );
  });

  const conteo = FILTROS.reduce((acc, f) => {
    acc[f] = f === "TODOS"
      ? solicitudes.length
      : solicitudes.filter(s => s.estado === f).length;
    return acc;
  }, {});

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Solicitudes de Acceso</h1>
          <p style={styles.subtitulo}>Gestiona las solicitudes de nuevos usuarios</p>
        </div>
        <button style={styles.btnRefresh} onClick={fetchSolicitudes} title="Actualizar">
          <RefreshIcon /> Actualizar
        </button>
      </div>

      {/* Filtros + búsqueda */}
      <div style={styles.toolbar}>
        <div style={styles.filtros}>
          {FILTROS.map(f => (
            <button
              key={f}
              style={{ ...styles.filtroBtn, ...(filtro === f ? styles.filtroBtnActivo : {}) }}
              onClick={() => setFiltro(f)}
            >
              {f === "TODOS" ? "Todos" : badge[f]?.label}
              <span style={{
                ...styles.badge,
                background: f === "TODOS" ? theme.accentHover + "33" : badge[f]?.bg,
                color:      f === "TODOS" ? theme.accentHover       : badge[f]?.color,
              }}>
                {conteo[f] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <input
          style={styles.buscador}
          placeholder="Buscar por nombre, correo, grado..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div style={styles.tableWrap}>
        {cargando ? (
          <div style={styles.empty}><Spinner /> Cargando solicitudes...</div>
        ) : datos.length === 0 ? (
          <div style={styles.empty}>
            No hay solicitudes {filtro !== "TODOS" ? `con estado ${badge[filtro]?.label}` : ""}.
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                {["Solicitante", "Correo", "Alumno", "Grado", "Estado", "Fecha", "Acciones"].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((s, i) => (
                <tr
                  key={s._id}
                  style={{ ...styles.tr, background: i % 2 === 0 ? theme.surface : theme.surfaceAlt }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2a2f4a"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? theme.surface : theme.surfaceAlt}
                >
                  <td style={styles.td}>
                    <button style={styles.linkBtn} onClick={() => setDetalle(s)}>
                      {s.nombre_solicitante}
                    </button>
                  </td>
                  <td style={{ ...styles.td, color: theme.textSoft, fontSize: "0.82rem" }}>{s.email}</td>
                  <td style={styles.td}>{s.nombre_alumno}</td>
                  <td style={{ ...styles.td, color: theme.textSoft }}>{s.grado}</td>
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
                      {s.estado === "PENDIENTE" && (
                        <>
                          <ActionBtn color={theme.success} disabled={procesando === s._id} onClick={() => resolver(s._id, "APROBADO")} title="Aprobar"><CheckIcon /></ActionBtn>
                          <ActionBtn color={theme.danger}  disabled={procesando === s._id} onClick={() => resolver(s._id, "DENEGADO")} title="Denegar"><XIcon /></ActionBtn>
                        </>
                      )}
                      {s.estado === "APROBADO" && (
                        <ActionBtn color={theme.warning} disabled={procesando === s._id} onClick={() => bloquearUsuario(s)} title="Bloquear usuario"><LockIcon /></ActionBtn>
                      )}
                      {/* ✅ Desbloquear */}
                      {s.estado === "BLOQUEADO" && (
                        <ActionBtn color={theme.success} disabled={procesando === s._id} onClick={() => desbloquearUsuario(s)} title="Desbloquear usuario"><UnlockIcon /></ActionBtn>
                      )}
                      {/* Reabrir denegado */}
                      {s.estado === "DENEGADO" && (
                        <ActionBtn color={theme.accent} disabled={procesando === s._id} onClick={() => reabrirSolicitud(s._id)} title="Reabrir solicitud"><ReabrirIcon /></ActionBtn>
                      )}
                      <ActionBtn color={theme.accent} onClick={() => setDetalle(s)} title="Ver detalle"><EyeIcon /></ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div style={styles.overlay} onClick={() => setDetalle(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitulo}>Detalle de solicitud</h2>
              <button style={styles.modalClose} onClick={() => setDetalle(null)}>✕</button>
            </div>

            <div style={styles.modalGrid}>
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
              {detalle.fecha_resolucion && (
                <Field label="Fecha resolución" value={new Date(detalle.fecha_resolucion).toLocaleString("es-HN")} />
              )}
              {detalle.resuelto_por && (
                <Field label="Resuelto por" value={detalle.resuelto_por} />
              )}
            </div>

            {detalle.estado === "PENDIENTE" && (
              <div style={styles.modalActions}>
                <button style={{ ...styles.btnModal, background: theme.success }} disabled={procesando === detalle._id} onClick={() => resolver(detalle._id, "APROBADO")}>
                  {procesando === detalle._id ? <Spinner /> : <CheckIcon />} Aprobar
                </button>
                <button style={{ ...styles.btnModal, background: theme.danger }} disabled={procesando === detalle._id} onClick={() => resolver(detalle._id, "DENEGADO")}>
                  {procesando === detalle._id ? <Spinner /> : <XIcon />} Denegar
                </button>
              </div>
            )}

            {detalle.estado === "APROBADO" && (
              <div style={styles.modalActions}>
                <button style={{ ...styles.btnModal, background: theme.warning }} disabled={procesando === detalle._id} onClick={() => bloquearUsuario(detalle)}>
                  <LockIcon /> Bloquear usuario
                </button>
              </div>
            )}

            {/* ✅ Desbloquear en modal */}
            {detalle.estado === "BLOQUEADO" && (
              <div style={styles.modalActions}>
                <button style={{ ...styles.btnModal, background: theme.success }} disabled={procesando === detalle._id} onClick={() => desbloquearUsuario(detalle)}>
                  {procesando === detalle._id ? <Spinner /> : <UnlockIcon />} Desbloquear usuario
                </button>
              </div>
            )}

            {detalle.estado === "DENEGADO" && (
              <div style={styles.modalActions}>
                <button style={{ ...styles.btnModal, background: theme.accent }} disabled={procesando === detalle._id} onClick={() => reabrirSolicitud(detalle._id)}>
                  {procesando === detalle._id ? <Spinner /> : <ReabrirIcon />} Reabrir solicitud
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-componentes ───────────────────────────────────────────────────────────
const ActionBtn = ({ color, onClick, disabled, title, children }) => (
  <button
    style={{
      background:   color + "22",
      color,
      border:       `1px solid ${color}44`,
      borderRadius: 6,
      padding:      "5px 8px",
      cursor:       disabled ? "not-allowed" : "pointer",
      opacity:      disabled ? 0.5 : 1,
      display:      "flex",
      alignItems:   "center",
      transition:   "all 0.15s",
    }}
    onClick={onClick}
    disabled={disabled}
    title={title}
    onMouseEnter={e => !disabled && (e.currentTarget.style.background = color + "44")}
    onMouseLeave={e => !disabled && (e.currentTarget.style.background = color + "22")}
  >
    {children}
  </button>
);

const Field = ({ label, value }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: "0.73rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ color: "#e8eaf0", fontWeight: 500 }}>{value}</div>
  </div>
);

// ── Iconos ────────────────────────────────────────────────────────────────────
const CheckIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const LockIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const UnlockIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>;
const EyeIcon     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const RefreshIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:6}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const ReabrirIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/></svg>;
const Spinner     = () => (
  <span style={{ display:"inline-block", width:13, height:13, border:"2px solid #ffffff44", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:5 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>
);

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = {
  root:       { minHeight: "100vh", background: "#0f1117", color: "#e8eaf0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "32px 28px", boxSizing: "border-box" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  titulo:     { fontSize: "1.7rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" },
  subtitulo:  { color: "#9ca3af", marginTop: 4, fontSize: "0.9rem" },
  btnRefresh: { display: "flex", alignItems: "center", background: "#22263a", border: "1px solid #2e3352", color: "#e8eaf0", borderRadius: 8, padding: "9px 16px", cursor: "pointer", fontSize: "0.87rem", fontWeight: 500, transition: "all 0.15s" },
  toolbar:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  filtros:    { display: "flex", gap: 8, flexWrap: "wrap" },
  filtroBtn:  { display: "flex", alignItems: "center", gap: 6, background: "#22263a", border: "1px solid #2e3352", color: "#9ca3af", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, transition: "all 0.15s" },
  filtroBtnActivo: { background: "#4f8ef722", border: "1px solid #4f8ef766", color: "#4f8ef7" },
  badge:      { borderRadius: 20, padding: "1px 8px", fontSize: "0.75rem", fontWeight: 700 },
  buscador:   { background: "#22263a", border: "1px solid #2e3352", color: "#e8eaf0", borderRadius: 8, padding: "9px 14px", fontSize: "0.87rem", width: 260, outline: "none" },
  tableWrap:  { background: "#1a1d27", border: "1px solid #2e3352", borderRadius: 12, overflow: "hidden" },
  table:      { width: "100%", borderCollapse: "collapse" },
  thead:      { background: "#22263a" },
  th:         { padding: "13px 16px", textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #2e3352" },
  tr:         { transition: "background 0.12s" },
  td:         { padding: "12px 16px", fontSize: "0.875rem", borderBottom: "1px solid #2e335222", color: "#e8eaf0" },
  estadoBadge:{ borderRadius: 20, padding: "3px 10px", fontSize: "0.78rem", fontWeight: 600, display: "inline-block" },
  acciones:   { display: "flex", gap: 6, alignItems: "center" },
  linkBtn:    { background: "none", border: "none", color: "#6ba3ff", cursor: "pointer", padding: 0, fontWeight: 600, fontSize: "0.875rem", textDecoration: "underline", textUnderlineOffset: 2 },
  empty:      { padding: "48px 24px", textAlign: "center", color: "#9ca3af", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  overlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(3px)" },
  modal:      { background: "#1a1d27", border: "1px solid #2e3352", borderRadius: 14, padding: "28px 32px", width: 500, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  modalHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  modalTitulo:{ fontSize: "1.2rem", fontWeight: 700, margin: 0 },
  modalClose: { background: "none", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer", padding: "2px 6px", borderRadius: 6 },
  modalGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" },
  modalActions:{ display: "flex", gap: 12, marginTop: 24, paddingTop: 20, borderTop: "1px solid #2e3352", flexWrap: "wrap" },
  btnModal:   { display: "flex", alignItems: "center", gap: 8, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", transition: "opacity 0.15s" },
};

export default SolicitudesPanel;