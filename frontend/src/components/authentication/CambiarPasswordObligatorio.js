import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, updatePassword } from "firebase/auth";
import axios from "axios";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API_URL;

const requisitos = [
  { label: "Mínimo 8 caracteres",          test: (p) => p.length >= 8 },
  { label: "Una letra mayúscula",           test: (p) => /[A-Z]/.test(p) },
  { label: "Una letra minúscula",           test: (p) => /[a-z]/.test(p) },
  { label: "Un número",                     test: (p) => /\d/.test(p) },
  { label: "Un carácter especial (@$!%*?&)",test: (p) => /[@$!%*?&]/.test(p) },
];

const CambiarPasswordObligatorio = () => {
  const [password, setPassword]     = useState("");
  const [confirmar, setConfirmar]   = useState("");
  const [mostrar, setMostrar]       = useState(false);
  const [cargando, setCargando]     = useState(false);
  const navigate = useNavigate();
  const auth     = getAuth();

  const todosOk    = requisitos.every(r => r.test(password));
  const coincide   = password === confirmar && confirmar !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!todosOk || !coincide) return;

    setCargando(true);
    try {
      const user = auth.currentUser;

      // 1. Cambiar en Firebase
      await updatePassword(user, password);

      // 2. Marcar en MongoDB que ya cambió
const token = await user.getIdToken(true);
      await axios.patch(
        `${API_URL}/api/usuarios/password-cambiado`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire({
        icon: "success",
        title: "¡Contraseña actualizada!",
        text: "Ya puedes usar el sistema normalmente.",
        timer: 2000,
        showConfirmButton: false,
        position: "top",
        toast: true
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        text: "Error al cambiar la contraseña. Intenta de nuevo.",
        timer: 2500,
        showConfirmButton: false,
        position: "top",
        toast: true
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={s.iconWrap}>🔐</div>
        <h2 style={s.titulo}>Cambia tu contraseña</h2>
        <p style={s.sub}>
          Es tu primer ingreso. Por seguridad debes establecer una contraseña personal.
        </p>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Nueva contraseña */}
          <div style={s.fieldWrap}>
            <label style={s.label}>Nueva contraseña</label>
            <div style={s.inputWrap}>
              <input
                type={mostrar ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={s.input}
                placeholder="Escribe tu nueva contraseña"
              />
              <button type="button" style={s.ojo} onClick={() => setMostrar(!mostrar)}>
                {mostrar ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Requisitos */}
          {password && (
            <div style={s.requisitos}>
              {requisitos.map(r => (
                <div key={r.label} style={{ ...s.req, color: r.test(password) ? "#a522c5" : "#6b7280" }}>
                  <span style={{ marginRight: 6 }}>{r.test(password) ? "✓" : "○"}</span>
                  {r.label}
                </div>
              ))}
            </div>
          )}

          {/* Confirmar */}
          <div style={{ ...s.fieldWrap, marginTop: 16 }}>
            <label style={s.label}>Confirmar contraseña</label>
            <input
              type={mostrar ? "text" : "password"}
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              style={{
                ...s.input,
                borderColor: confirmar
                  ? (coincide ? "#a2c522" : "#ef4444")
                  : "#2e3352"
              }}
              placeholder="Repite tu nueva contraseña"
            />
            {confirmar && !coincide && (
              <span style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: 4, display: "block" }}>
                Las contraseñas no coinciden
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!todosOk || !coincide || cargando}
            style={{
              ...s.btn,
              opacity: (!todosOk || !coincide || cargando) ? 0.5 : 1,
              cursor:  (!todosOk || !coincide || cargando) ? "not-allowed" : "pointer"
            }}
          >
            {cargando ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
};

const s = {
  root:      { minHeight: "100vh",   background: "linear-gradient(-45deg, #52eedc4f, #ae3ce7a9, #23a5d5af, #23d5abab)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  card:      { background: "#ffffff",  borderRadius: 14, padding: "40px 36px", width: 420, maxWidth: "100%" },
  iconWrap:  { fontSize: 40, textAlign: "center", marginBottom: 16 },
  titulo:    { color: "#000000", fontSize: "1.4rem", fontWeight: 700, textAlign: "center", margin: "0 0 8px" },
  sub:       { color: "#4d4d4d", fontSize: "0.88rem", textAlign: "center", lineHeight: 1.6, margin: "0 0 28px" },
  fieldWrap: { marginBottom: 8 },
  label:     { color: "#000000", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 },
  inputWrap: { position: "relative" },
  input:     { width: "100%", background: "#f3f3f3", border: "1px solid #2e3352", borderRadius: 8, padding: "11px 14px", color: "#000000", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" },
  ojo:       { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 },
  requisitos:{ background: "#ebebeb", borderRadius: 8, padding: "12px 16px", marginTop: 8 },
  req:       { fontSize: "0.82rem", marginBottom: 4, display: "flex", alignItems: "center" },
  btn:       { width: "100%", background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 8, padding: "13px", fontWeight: 700, fontSize: "0.95rem", marginTop: 24, transition: "opacity 0.15s" },
};

export default CambiarPasswordObligatorio;