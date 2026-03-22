import { useState } from "react";
import {
  getAuth, updatePassword, signOut,
  EmailAuthProvider, reauthenticateWithCredential
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function ChangePasswordLogueado() {
  const auth     = getAuth();
  const navigate = useNavigate();
  const user     = auth.currentUser;

  const [actual, setActual]       = useState("");
  const [nueva, setNueva]         = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar]     = useState(false);
  const [cargando, setCargando]   = useState(false);

  const requisitos = [
    { label: "Mínimo 8 caracteres",            test: (p) => p.length >= 8 },
    { label: "Una letra mayúscula",             test: (p) => /[A-Z]/.test(p) },
    { label: "Una letra minúscula",             test: (p) => /[a-z]/.test(p) },
    { label: "Un número",                       test: (p) => /\d/.test(p) },
    { label: "Un carácter especial (@$!%*?&)",  test: (p) => /[@$!%*?&]/.test(p) },
  ];

  const todosOk  = requisitos.every(r => r.test(nueva));
  const coincide = nueva === confirmar && confirmar !== "";

  const toast = (icon, text) => Swal.fire({
    icon, text,
    timer: 2800,
    showConfirmButton: false,
    position: "top",
    toast: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast("error", "No hay un usuario activo."); return; }
    if (!todosOk)        { toast("error", "La contraseña no cumple los requisitos."); return; }
    if (!coincide)       { toast("error", "Las contraseñas no coinciden."); return; }
    if (actual === nueva){ toast("error", "La nueva contraseña debe ser diferente a la actual."); return; }

    setCargando(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, nueva);

      Swal.fire({
        icon:              "success",
        title:             "¡Contraseña actualizada!",
        text:              "Tu contraseña fue cambiada correctamente. Serás redirigido al login.",
        confirmButtonText: "Entendido",
        confirmButtonColor:"#4f8ef7",
        background:        "#1a1d27",
        color:             "#e8eaf0",
      }).then(async () => {
        await signOut(auth);
        navigate("/login");
      });

    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast("error", "La contraseña actual es incorrecta.");
      } else if (err.code === "auth/requires-recent-login") {
        toast("error", "Por seguridad, vuelve a iniciar sesión.");
      } else {
        toast("error", "Error: " + err.message);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={s.card}>

      {/* ── Encabezado ── */}
      <div style={s.cardHeader}>
        <div style={s.iconWrap}>🔒</div>
        <div>
          <h2 style={s.cardTitulo}>Cambiar Contraseña</h2>
          <p style={s.cardSub}>Actualiza tu contraseña de acceso al sistema</p>
        </div>
      </div>

      <div style={s.divider} />

      <form onSubmit={handleSubmit} autoComplete="off">

        {/* Contraseña actual */}
        <div style={s.fieldWrap}>
          <label style={s.label}>Contraseña actual</label>
          <div style={s.inputWrap}>
            <input
              style={s.input}
              type={mostrar ? "text" : "password"}
              placeholder="Ingresa tu contraseña actual"
              value={actual}
              onChange={e => setActual(e.target.value)}
              required
            />
            <button type="button" style={s.ojo} onClick={() => setMostrar(!mostrar)}>
              {mostrar ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div style={s.divider} />

        {/* Nueva contraseña */}
        <div style={s.fieldWrap}>
          <label style={s.label}>Nueva contraseña</label>
          <div style={s.inputWrap}>
            <input
              style={{
                ...s.input,
                borderColor: nueva ? (todosOk ? "#22c55e66" : "#2e3352") : "#2e3352"
              }}
              type={mostrar ? "text" : "password"}
              placeholder="Escribe tu nueva contraseña"
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Requisitos */}
        {nueva && (
          <div style={s.requisitosBox}>
            <p style={s.reqTitulo}>Requisitos de contraseña</p>
            {requisitos.map(r => (
              <div key={r.label} style={{ ...s.req, color: r.test(nueva) ? "#22c55e" : "#6b7280" }}>
                <span>{r.test(nueva) ? "✓" : "○"}</span>
                {r.label}
              </div>
            ))}
          </div>
        )}

        {/* Confirmar contraseña */}
        <div style={{ ...s.fieldWrap, marginTop: nueva ? 16 : 0 }}>
          <label style={s.label}>Confirmar nueva contraseña</label>
          <div style={s.inputWrap}>
            <input
              style={{
                ...s.input,
                borderColor: confirmar ? (coincide ? "#22c55e66" : "#ef444466") : "#2e3352"
              }}
              type={mostrar ? "text" : "password"}
              placeholder="Repite tu nueva contraseña"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              required
            />
          </div>
          {confirmar && !coincide && (
            <span style={s.errorMsg}>Las contraseñas no coinciden</span>
          )}
        </div>

        <button
          type="submit"
          disabled={!todosOk || !coincide || !actual || cargando}
          style={{
            ...s.btn,
            opacity: (!todosOk || !coincide || !actual || cargando) ? 0.5 : 1,
            cursor:  (!todosOk || !coincide || !actual || cargando) ? "not-allowed" : "pointer",
          }}
        >
          {cargando ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>

      {/* ── Aviso de seguridad ── */}
      <div style={s.warningBox}>
        <p style={s.warningTitulo}>⚠️ Importante</p>
        <p style={s.warningText}>
          Al cambiar tu contraseña se cerrará la sesión actual y deberás ingresar con la nueva contraseña.
        </p>
      </div>

      {/* ── Tips ── */}
      <div style={s.tipsBox}>
        <p style={s.tipsLabel}>💡 Consejos de seguridad</p>
        <div style={s.tip}>• No uses la misma contraseña en otros sitios.</div>
        <div style={s.tip}>• Evita datos personales como nombres o fechas.</div>
        <div style={s.tip}>• Una contraseña más larga es siempre más segura.</div>
      </div>

    </div>
  );
}

const s = {
  card: {
    background:   "#1a1d27",
    border:       "1px solid #2e3352",
    borderRadius: 14,
    padding:      "28px 32px",
    fontFamily:   "'DM Sans', 'Segoe UI', sans-serif",
  },
  cardHeader: {
    display:    "flex",
    alignItems: "center",
    gap:        14,
    marginBottom: 20,
  },
  iconWrap: {
    fontSize:       22,
    background:     "#4f8ef715",
    border:         "1px solid #4f8ef733",
    borderRadius:   10,
    width:          44,
    height:         44,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  cardTitulo: { fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#e8eaf0" },
  cardSub:    { color: "#6b7280", fontSize: "0.82rem", margin: 0 },
  divider:    { height: 1, background: "#2e3352", margin: "20px 0" },
  fieldWrap:  { marginBottom: 16 },
  label: {
    color:         "#9ca3af",
    fontSize:      "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    display:       "block",
    marginBottom:  6,
    fontWeight:    600,
  },
  inputWrap: { position: "relative" },
  input: {
    width:        "100%",
    background:   "#22263a",
    border:       "1px solid #2e3352",
    borderRadius: 8,
    padding:      "11px 44px 11px 14px",
    color:        "#e8eaf0",
    fontSize:     "0.9rem",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color 0.15s",
  },
  ojo: {
    position:   "absolute",
    right:      12,
    top:        "50%",
    transform:  "translateY(-50%)",
    background: "none",
    border:     "none",
    cursor:     "pointer",
    fontSize:   16,
    color:      "#6b7280",
  },
  requisitosBox: {
    background:   "#22263a",
    border:       "1px solid #2e3352",
    borderRadius: 8,
    padding:      "12px 14px",
    marginBottom: 4,
  },
  reqTitulo: {
    fontSize:   "0.72rem",
    color:      "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    fontWeight: 600,
    margin:     "0 0 8px",
  },
  req: {
    fontSize:   "0.8rem",
    marginBottom: 3,
    display:    "flex",
    alignItems: "center",
    gap:        6,
  },
  errorMsg: { color: "#ef4444", fontSize: "0.78rem", marginTop: 4, display: "block" },
  btn: {
    width:        "100%",
    background:   "linear-gradient(135deg, #4f8ef7, #3b6fd4)",
    color:        "#fff",
    border:       "none",
    borderRadius: 8,
    padding:      "13px",
    fontWeight:   700,
    fontSize:     "0.95rem",
    transition:   "opacity 0.15s",
    marginTop:    8,
  },
  warningBox: {
    marginTop:    20,
    background:   "#f59e0b0f",
    border:       "1px solid #f59e0b33",
    borderRadius: 8,
    padding:      "12px 14px",
  },
  warningTitulo: { fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600, margin: "0 0 4px" },
  warningText:   { fontSize: "0.78rem", color: "#9ca3af", margin: 0, lineHeight: 1.6 },
  tipsBox: {
    marginTop:    12,
    background:   "#22263a",
    border:       "1px solid #2e3352",
    borderRadius: 8,
    padding:      "12px 14px",
  },
  tipsLabel: {
    fontSize:   "0.72rem",
    color:      "#6b7280",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin:     "0 0 8px",
  },
  tip: { fontSize: "0.78rem", color: "#9ca3af", marginBottom: 4, lineHeight: 1.5 },
};