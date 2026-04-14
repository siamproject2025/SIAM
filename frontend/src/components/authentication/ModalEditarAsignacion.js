// ModalEditarAsignacion.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Save, X, User, GraduationCap, Shield } from "lucide-react";
import AutocompleteAlumno from "./AutocompleteAlumno";

const API_URL = process.env.REACT_APP_API_URL;

const ModalEditarAsignacion = ({ usuario, onGuardado, onCancelar }) => {
  const [roles,           setRoles]           = useState([]);
  const [grados,          setGrados]          = useState([]);
  const [alumnos,         setAlumnos]         = useState([]);
  const [rolSelec,        setRolSelec]        = useState(usuario?.roles?.[0] || "");
  const [gradoSelec,      setGradoSelec]      = useState("");
  const [alumnoSelec,     setAlumnoSelec]     = useState(usuario?.alumno?._id || usuario?.alumno || "");
  const [nombreAlumnoActual, setNombreAlumnoActual] = useState("");
  const [cargando,        setCargando]        = useState(true);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [guardando,       setGuardando]       = useState(false);
  const [error,           setError]           = useState("");

  const obtenerToken = async () => {
    const { auth } = await import("./Auth");
    return auth.currentUser?.getIdToken(true);
  };

  // ── Cargar roles y grados + precargar alumno actual ───────────────────────
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
        const listaGrados = resGrados.data?.items || resGrados.data?.grados || resGrados.data || [];
        setGrados(listaGrados.filter(g => g.estado === "Activo"));

        // Si el usuario ya tiene alumno asignado, precargarlo
        const alumnoId = usuario?.alumno?._id || usuario?.alumno;
        if (alumnoId) {
          try {
            const resAlumno = await axios.get(
              `${API_URL}/api/matriculas/${alumnoId}`,
              { headers }
            );
            const alumnoData = resAlumno.data?.data || resAlumno.data;
            if (alumnoData?.nombre_completo) {
              setNombreAlumnoActual(alumnoData.nombre_completo);
            }
          } catch {
            // Si falla no bloqueamos, solo no mostramos nombre
          }
        }

      } catch (e) {
        console.error("Error cargando datos:", e);
        setError("Error al cargar roles/grados.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // ── Cargar alumnos al cambiar grado ──────────────────────────────────────
  // ❌ Antes — solo carga si hay grado seleccionado
useEffect(() => {
  if (!gradoSelec) { setAlumnos([]); return; }
  // ...
}, [gradoSelec]);

// ✅ Ahora — carga todos si no hay grado, filtra si hay grado
useEffect(() => {
  const cargar = async () => {
    setCargandoAlumnos(true);
    try {
      const token = await obtenerToken();
      // Si hay grado filtra, si no trae todos
      const url = gradoSelec
        ? `${API_URL}/api/matriculas?grado_a_matricular=${gradoSelec}`
        : `${API_URL}/api/matriculas`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lista = res.data?.data || res.data?.matriculas || res.data?.items || (Array.isArray(res.data) ? res.data : []);
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

  const guardar = async () => {
    if (!rolSelec) { setError("El rol es obligatorio."); return; }
    setGuardando(true);
    setError("");
    try {
      const token = await obtenerToken();
      await axios.patch(
        `${API_URL}/api/usuarios/${usuario._id}/asignacion`,
        { rol: rolSelec, alumno_id: alumnoSelec || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGuardado();
    } catch (e) {
      console.error("Error guardando asignación:", e);
      setError(e.response?.data?.message || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={s.overlay} onClick={onCancelar}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        {/* ── Header con gradiente ── */}
        <div style={s.header}>
          <div style={s.headerInner}>
            <div style={s.headerIcon}>
              <User size={22} color="white" />
            </div>
            <div>
              <h2 style={s.titulo}>Editar asignación</h2>
              <p style={s.subtitulo}>Modifica el rol y alumno asignado al usuario</p>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onCancelar}>
            <X size={18} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={s.body}>

          {/* Info usuario */}
          <div style={s.infoBox}>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Usuario</span>
              <span style={s.infoValue}>{usuario.username || usuario.email}</span>
            </div>
            <div style={s.infoDivider} />
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Correo</span>
              <span style={s.infoValue}>{usuario.email}</span>
            </div>
            <div style={s.infoDivider} />
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Rol actual</span>
              <span style={s.rolBadge}>{usuario.roles?.[0] || "Sin rol"}</span>
            </div>
            {nombreAlumnoActual && (
              <>
                <div style={s.infoDivider} />
                <div style={s.infoRow}>
                  <span style={s.infoLabel}>Alumno actual</span>
                  <span style={{ ...s.rolBadge, background: "#dcfce7", color: "#15803d" }}>
                    {nombreAlumnoActual}
                  </span>
                </div>
              </>
            )}
          </div>

          {cargando ? (
            <div style={s.cargandoBox}>
              <Spinner /> Cargando datos...
            </div>
          ) : (
            <>
              {/* Rol */}
              <div style={s.campo}>
                <label style={s.label}>
                  <Shield size={13} style={{ marginRight: 6 }} />
                  Rol <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  style={s.select}
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
              <div style={s.campo}>
                <label style={s.label}>
                  <GraduationCap size={13} style={{ marginRight: 6 }} />
                  Filtrar por grado <span style={s.opcional}>(opcional)</span>
                </label>
                <select
                  style={s.select}
                  value={gradoSelec}
                  onChange={e => { setGradoSelec(e.target.value); setAlumnoSelec(""); }}
                >
                  <option value="">-- Todos los grados --</option>
                  {grados.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.grado} — Aula {g.aula}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alumno */}
              <div style={s.campo}>
                <label style={s.label}>
                  <User size={13} style={{ marginRight: 6 }} />
                  Alumno <span style={s.opcional}>(opcional)</span>
                </label>
                {cargandoAlumnos ? (
                  <div style={s.cargandoBox}><Spinner /> Cargando alumnos...</div>
                ) : (
                  <AutocompleteAlumno
                    alumnos={alumnos}
                    grados={grados}
                    value={alumnoSelec}
                    onChange={setAlumnoSelec}
                    disabled={false}
                  />
                )}
                {!gradoSelec && (
                  <p style={s.hint}>Selecciona un grado para filtrar alumnos más fácilmente.</p>
                )}
              </div>

              {error && (
                <div style={s.errorBox}>
                  <X size={14} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer con botones a la derecha ── */}
        <div style={s.footer}>
          <button style={s.btnCancelar} onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button
            style={{ ...s.btnGuardar, opacity: (!rolSelec || guardando || cargando) ? 0.6 : 1, cursor: (!rolSelec || guardando || cargando) ? "not-allowed" : "pointer" }}
            disabled={!rolSelec || guardando || cargando}
            onClick={guardar}
          >
            {guardando
              ? <><Spinner /> Guardando...</>
              : <>Guardar</>
            }
          </button>
        </div>

      </div>
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = () => (
  <span style={{ display:"inline-block", width:12, height:12, border:"2px solid rgba(255,255,255,0.3)", borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", marginRight:6, flexShrink:0 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>
);

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = {
  overlay:     { position:"fixed", inset:0, background:"rgba(15,10,40,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, backdropFilter:"blur(4px)" },
  modal:       { background:"#ffffff", borderRadius:16, width:540, maxWidth:"95vw", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(108,79,191,0.2)" },

  // Header
  header:      { background:"linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%)", padding:"22px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 },
  headerInner: { display:"flex", alignItems:"center", gap:14 },
  headerIcon:  { width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  titulo:      { fontSize:"1.1rem", fontWeight:700, color:"#fff", margin:0 },
  subtitulo:   { fontSize:"0.78rem", color:"rgba(255,255,255,0.75)", margin:"3px 0 0" },
  closeBtn:    { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"background 0.15s" },

  // Body
  body:        { padding:"24px 28px", overflowY:"auto", flex:1 },
  infoBox:     { background:"#faf5ff", border:"1px solid #ede9fe", borderRadius:10, padding:"14px 18px", marginBottom:22 },
  infoRow:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0" },
  infoDivider: { height:1, background:"#ede9fe", margin:"4px 0" },
  infoLabel:   { fontSize:"0.78rem", color:"#7c3aed", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" },
  infoValue:   { fontSize:"0.875rem", color:"#1e1b4b", fontWeight:500 },
  rolBadge:    { background:"#ede9fe", color:"#5b21b6", borderRadius:20, padding:"3px 12px", fontSize:"0.78rem", fontWeight:600 },

  // Campos
  campo:       { marginBottom:18 },
  label:       { display:"flex", alignItems:"center", fontSize:"0.78rem", fontWeight:600, color:"#5b21b6", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:7 },
  opcional:    { fontWeight:400, color:"#9ca3af", textTransform:"none", fontSize:"0.75rem", marginLeft:5 },
  select:      { width:"100%", background:"#faf5ff", border:"1px solid #ddd6fe", borderRadius:8, padding:"9px 12px", fontSize:"0.875rem", color:"#1e1b4b", outline:"none", cursor:"pointer", boxSizing:"border-box" },
  hint:        { margin:"6px 0 0", fontSize:"0.75rem", color:"#9ca3af" },
  cargandoBox: { display:"flex", alignItems:"center", gap:8, color:"#7c3aed", fontSize:"0.85rem", padding:"10px 0", background:"#faf5ff", borderRadius:8, paddingLeft:12 },
  errorBox:    { display:"flex", alignItems:"center", gap:8, background:"#fef2f2", border:"1px solid #fecaca", color:"#dc2626", borderRadius:8, padding:"10px 14px", fontSize:"0.85rem", marginTop:4 },

  // Footer
  footer:      { display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 28px", borderTop:"1px solid #ede9fe", background:"#fafafa", flexShrink:0 },
  btnCancelar: { display:"flex", alignItems:"center", gap:7, background:"#E0D9F5", color:"#6C4FBF", border:"none", borderRadius:8, padding:"9px 18px", fontWeight:600, fontSize:"0.875rem", cursor:"pointer" },
  btnGuardar:  { display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg, #6C4FBF)", color:"#fff", border:"none", borderRadius:8, padding:"9px 20px", fontWeight:600, fontSize:"0.875rem", transition:"opacity 0.15s" },
};

export default ModalEditarAsignacion;