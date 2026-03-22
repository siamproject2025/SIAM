import { useState } from "react";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function ResetPasswordSeguro() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword]         = useState("");
  const [confirmar, setConfirmar]       = useState("");
  const [mostrar, setMostrar]           = useState(false);
  const [cargando, setCargando]         = useState(false);
  const [emailUsuario, setEmailUsuario] = useState("");
  const [codigoValido, setCodigoValido] = useState(null); // null=verificando, true=ok, false=inválido
  const [enviado, setEnviado]           = useState(false);

  const oobCode = searchParams.get("oobCode");

  const requisitos = [
    { label: "Mínimo 8 caracteres",            test: (p) => p.length >= 8 },
    { label: "Una letra mayúscula",             test: (p) => /[A-Z]/.test(p) },
    { label: "Una letra minúscula",             test: (p) => /[a-z]/.test(p) },
    { label: "Un número",                       test: (p) => /\d/.test(p) },
    { label: "Un carácter especial (@$!%*?&)",  test: (p) => /[@$!%*?&]/.test(p) },
  ];

  const todosOk  = requisitos.every(r => r.test(password));
  const coincide = password === confirmar && confirmar !== "";

  // ── Verificar el código al montar ─────────────────────────────────────────
  useEffect(() => {
    if (!oobCode) {
      setCodigoValido(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(email => {
        setEmailUsuario(email);
        setCodigoValido(true);
      })
      .catch(() => setCodigoValido(false));
  }, [oobCode]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!todosOk || !coincide || cargando) return;

    setCargando(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setEnviado(true);
      setTimeout(() => navigate("/login"), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // ── Estilos ───────────────────────────────────────────────────────────────
  const s = {
    root: {
      minHeight:      "100vh",
      background:     "#0f1117",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "24px 16px",
      fontFamily:     "'DM Sans', 'Segoe UI', sans-serif",
      position:       "relative",
      overflow:       "hidden",
    },
    glow: {
      position:     "absolute",
      width:        500,
      height:       500,
      borderRadius: "50%",
      background:   "radial-gradient(circle, #4f8ef715 0%, transparent 70%)",
      top:          -100,
      right:        -100,
      pointerEvents:"none",
    },
    glow2: {
      position:     "absolute",
      width:        400,
      height:       400,
      borderRadius: "50%",
      background:   "radial-gradient(circle, #22c55e10 0%, transparent 70%)",
      bottom:       -80,
      left:         -80,
      pointerEvents:"none",
    },
    card: {
      background:   "#1a1d27",
      border:       "1px solid #2e3352",
      borderRadius: 16,
      padding:      "40px 36px",
      width:        440,
      maxWidth:     "100%",
      position:     "relative",
      boxShadow:    "0 24px 64px rgba(0,0,0,0.5)",
    },
    badge: {
      display:        "inline-flex",
      alignItems:     "center",
      gap:            6,
      background:     "#4f8ef715",
      border:         "1px solid #4f8ef733",
      borderRadius:   20,
      padding:        "4px 12px",
      fontSize:       "0.75rem",
      color:          "#4f8ef7",
      fontWeight:     600,
      marginBottom:   20,
      letterSpacing:  "0.04em",
    },
    titulo: {
      fontSize:     "1.6rem",
      fontWeight:   800,
      color:        "#e8eaf0",
      margin:       "0 0 6px",
      letterSpacing:"-0.03em",
    },
    subtitulo: {
      color:        "#6b7280",
      fontSize:     "0.88rem",
      margin:       "0 0 28px",
      lineHeight:   1.6,
    },
    emailBox: {
      background:   "#22263a",
      border:       "1px solid #2e3352",
      borderRadius: 8,
      padding:      "10px 14px",
      marginBottom: 24,
      display:      "flex",
      alignItems:   "center",
      gap:          8,
    },
    emailLabel: {
      fontSize:  "0.72rem",
      color:     "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      display:   "block",
      marginBottom: 2,
    },
    emailText: {
      color:     "#e8eaf0",
      fontSize:  "0.88rem",
      fontWeight: 500,
    },
    fieldWrap:  { marginBottom: 16 },
    label: {
      color:         "#9ca3af",
      fontSize:      "0.78rem",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      display:       "block",
      marginBottom:  6,
    },
    inputWrap:  { position: "relative" },
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
      borderRadius: 8,
      padding:      "12px 14px",
      marginTop:    8,
      marginBottom: 16,
    },
    req: {
      fontSize:   "0.8rem",
      marginBottom: 3,
      display:    "flex",
      alignItems: "center",
      gap:        6,
      transition: "color 0.2s",
    },
    divider: {
      height:     1,
      background: "#2e3352",
      margin:     "20px 0",
    },
    btn: {
      width:        "100%",
      background:   "linear-gradient(135deg, #4f8ef7, #3b6fd4)",
      color:        "#fff",
      border:       "none",
      borderRadius: 8,
      padding:      "13px",
      fontWeight:   700,
      fontSize:     "0.95rem",
      cursor:       "pointer",
      transition:   "opacity 0.15s, transform 0.15s",
      marginTop:    8,
    },
    infoTips: {
      marginTop:    24,
      background:   "#22263a",
      border:       "1px solid #2e3352",
      borderRadius: 10,
      padding:      "14px 16px",
    },
    tipTitle: {
      fontSize:   "0.75rem",
      color:      "#6b7280",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      marginBottom: 10,
      fontWeight:  600,
    },
    tip: {
      display:    "flex",
      alignItems: "flex-start",
      gap:        8,
      marginBottom: 7,
      fontSize:   "0.8rem",
      color:      "#9ca3af",
      lineHeight: 1.5,
    },
    successBox: {
      textAlign:  "center",
      padding:    "20px 0",
    },
    successIcon: {
      fontSize:     48,
      marginBottom: 16,
    },
    successTitulo: {
      fontSize:   "1.3rem",
      fontWeight: 700,
      color:      "#22c55e",
      margin:     "0 0 8px",
    },
    successSub: {
      color:    "#9ca3af",
      fontSize: "0.88rem",
      margin:   0,
    },
    errorBox: {
      textAlign:  "center",
      padding:    "20px 0",
    },
    errorIcon: {
      fontSize:     48,
      marginBottom: 16,
    },
  };

  // ── Pantalla: verificando código ──────────────────────────────────────────
  if (codigoValido === null) {
    return (
      <div style={s.root}>
        <div style={s.card}>
          <div style={{ textAlign: "center", color: "#6b7280", fontSize: "0.9rem" }}>
            <SpinnerGrande />
            <p style={{ marginTop: 12 }}>Verificando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: código inválido/expirado ────────────────────────────────────
  if (codigoValido === false) {
    return (
      <div style={s.root}>
        <div style={s.glow} /><div style={s.glow2} />
        <div style={s.card}>
          <div style={s.errorBox}>
            <div style={s.errorIcon}>⚠️</div>
            <h2 style={{ ...s.titulo, color: "#ef4444", textAlign: "center" }}>
              Enlace inválido
            </h2>
            <p style={{ ...s.subtitulo, textAlign: "center" }}>
              Este enlace de restablecimiento ya expiró o no es válido.<br />
              Solicita uno nuevo desde la pantalla de login.
            </p>
            <button
              style={{ ...s.btn, marginTop: 20 }}
              onClick={() => navigate("/ResetPassword")}
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: contraseña cambiada con éxito ───────────────────────────────
  if (enviado) {
    return (
      <div style={s.root}>
        <div style={s.glow} /><div style={s.glow2} />
        <div style={s.card}>
          <div style={s.successBox}>
            <div style={s.successIcon}>✅</div>
            <h2 style={s.successTitulo}>¡Contraseña actualizada!</h2>
            <p style={s.successSub}>
              Tu contraseña fue restablecida correctamente.<br />
              Serás redirigido al login en unos segundos...
            </p>
            <div style={{ marginTop: 20, height: 4, background: "#2e3352", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: "#22c55e",
                borderRadius: 4,
                animation: "progress 3.5s linear forwards",
              }} />
              <style>{`@keyframes progress { from { width: 0% } to { width: 100% } }`}</style>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla principal ────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      <div style={s.glow} />
      <div style={s.glow2} />
      <div style={s.card}>

        {/* Badge */}
        <div style={s.badge}>
          🔐 Restablecer contraseña
        </div>

        <h1 style={s.titulo}>Nueva contraseña</h1>
        <p style={s.subtitulo}>
          Crea una contraseña segura para proteger tu cuenta del sistema escolar.
        </p>

        {/* Email del usuario */}
        <div style={s.emailBox}>
          <span style={{ fontSize: 18 }}>📧</span>
          <div>
            <span style={s.emailLabel}>Cuenta</span>
            <span style={s.emailText}>{emailUsuario}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">

          {/* Nueva contraseña */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Nueva contraseña</label>
            <div style={s.inputWrap}>
              <input
                style={{
                  ...s.input,
                  borderColor: password
                    ? (todosOk ? "#22c55e66" : "#2e3352")
                    : "#2e3352"
                }}
                type={mostrar ? "text" : "password"}
                placeholder="Escribe tu nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" style={s.ojo} onClick={() => setMostrar(!mostrar)}>
                {mostrar ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Requisitos */}
          {password && (
            <div style={s.requisitosBox}>
              {requisitos.map(r => (
                <div
                  key={r.label}
                  style={{ ...s.req, color: r.test(password) ? "#22c55e" : "#6b7280" }}
                >
                  <span>{r.test(password) ? "✓" : "○"}</span>
                  {r.label}
                </div>
              ))}
            </div>
          )}

          {/* Confirmar contraseña */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Confirmar contraseña</label>
            <div style={s.inputWrap}>
              <input
                style={{
                  ...s.input,
                  borderColor: confirmar
                    ? (coincide ? "#22c55e66" : "#ef444466")
                    : "#2e3352"
                }}
                type={mostrar ? "text" : "password"}
                placeholder="Repite tu nueva contraseña"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
              />
            </div>
            {confirmar && !coincide && (
              <span style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: 4, display: "block" }}>
                Las contraseñas no coinciden
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!todosOk || !coincide || cargando}
            style={{
              ...s.btn,
              opacity:   (!todosOk || !coincide || cargando) ? 0.5 : 1,
              cursor:    (!todosOk || !coincide || cargando) ? "not-allowed" : "pointer",
            }}
          >
            {cargando ? "Guardando..." : "Restablecer contraseña"}
          </button>
        </form>

        {/* Divider + tips de seguridad */}
        <div style={s.divider} />
        <div style={s.infoTips}>
          <p style={s.tipTitle}>💡 Consejos de seguridad</p>
          <div style={s.tip}>
            <span>•</span>
            No uses la misma contraseña en otros sitios.
          </div>
          <div style={s.tip}>
            <span>•</span>
            Evita datos personales como fechas de nacimiento o nombres.
          </div>
          <div style={s.tip}>
            <span>•</span>
            Una contraseña más larga es siempre más segura.
          </div>
          <div style={s.tip}>
            <span>•</span>
            Este enlace expira en 1 hora por razones de seguridad.
          </div>
        </div>

        {/* Volver al login */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.82rem", color: "#6b7280" }}>
          ¿Recordaste tu contraseña?{" "}
          <span
            style={{ color: "#4f8ef7", cursor: "pointer", fontWeight: 600 }}
            onClick={() => navigate("/login")}
          >
            Volver al login
          </span>
        </p>

      </div>
    </div>
  );
}

const SpinnerGrande = () => (
  <div style={{
    width:       40,
    height:      40,
    border:      "3px solid #2e3352",
    borderTop:   "3px solid #4f8ef7",
    borderRadius:"50%",
    animation:   "spin 0.8s linear infinite",
    margin:      "0 auto",
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
);