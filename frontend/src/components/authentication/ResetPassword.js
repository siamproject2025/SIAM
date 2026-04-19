import React, { useState, useRef, useEffect } from "react";
import Logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { ArrowBigLeftDash } from "lucide-react";
import Swal from "sweetalert2";
import axios from "axios";
import "../../styles/login.css";  // reutiliza tus estilos base
import "./ResetPassword.css";     // estilos específicos (ver abajo)

const API_URL = process.env.REACT_APP_API_URL;

// ── Componente de inputs OTP (6 cajas individuales) ──────────────────────
const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[idx]  = val;
    const next = arr.join("");
    onChange(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    const nextFocus = Math.min(pasted.length, 5);
    inputs.current[nextFocus]?.focus();
  };
  

  return (
    <div className="otp-boxes" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className={`otp-box ${value[idx] ? "filled" : ""}`}
          autoFocus={idx === 0}
        />
      ))}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────
const ResetPassword = () => {
  const navigate  = useNavigate();

  // Paso: "correo" | "otp" | "nueva"
  const [paso, setPaso]               = useState("correo");
  const [email, setEmail]             = useState("");
  const [otp, setOtp]                 = useState("");
  const [nuevaPass, setNuevaPass]     = useState("");
  const [confirmaPass, setConfirmaPass] = useState("");
  const [cargando, setCargando]       = useState(false);
  const [countdown, setCountdown]     = useState(0); // segundos para reenviar
  const [showPass, setShowPass]         = useState(false);
const [showConfirm, setShowConfirm]   = useState(false);
  // Countdown reenvío
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const toast = (icon, text) =>
    Swal.fire({ icon, text, timer: 3500, showConfirmButton: false, position: "top", toast: true });

  // ── PASO 1: Solicitar OTP ────────────────────────────────────────────
  const handleSolicitarOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast("warning", "Ingresa tu correo electrónico.");
    setCargando(true);
    try {
      await axios.post(`${API_URL}/api/reset-password/solicitar`, { email: email.toLowerCase().trim() });
      setPaso("otp");
      setCountdown(60); // 60 seg antes de poder reenviar
      toast("success", "Código enviado. Revisa tu correo.");
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al enviar el código.");
    } finally {
      setCargando(false);
    }
  };

  // ── Reenviar OTP ─────────────────────────────────────────────────────
  const handleReenviar = async () => {
    if (countdown > 0) return;
    setCargando(true);
    try {
      await axios.post(`${API_URL}/api/reset-password/solicitar`, { email: email.toLowerCase().trim() });
      setOtp("");
      setCountdown(60);
      toast("success", "Nuevo código enviado.");
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al reenviar.");
    } finally {
      setCargando(false);
    }
  };

  // ── PASO 2: Verificar OTP ────────────────────────────────────────────
  const handleVerificarOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return toast("warning", "Ingresa el código de 6 dígitos completo.");
    setCargando(true);
    try {
      await axios.post(`${API_URL}/api/reset-password/verificar`, {
        email: email.toLowerCase().trim(),
        codigo: otp
      });
      setPaso("nueva");
    } catch (err) {
      toast("error", err.response?.data?.message || "Código incorrecto o expirado.");
      setOtp("");
    } finally {
      setCargando(false);
    }
  };

  // ── PASO 3: Cambiar contraseña ───────────────────────────────────────
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (nuevaPass.length < 8) {
      return toast("warning", "La contraseña debe tener al menos 8 caracteres.");
    }
    if (nuevaPass !== confirmaPass) {
      return toast("warning", "Las contraseñas no coinciden.");
    }
    setCargando(true);
    try {
      await axios.post(`${API_URL}/api/reset-password/cambiar`, {
        email:           email.toLowerCase().trim(),
        codigo:          otp,
        nueva_password:  nuevaPass
      });
      Swal.fire({
        icon:               "success",
        title:              "¡Contraseña actualizada!",
        text:               "Ya puedes iniciar sesión con tu nueva contraseña.",
        confirmButtonText:  "Ir al login",
        confirmButtonColor: "#4f8ef7"
      }).then(() => navigate("/login"));
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  // ── Indicador de pasos ───────────────────────────────────────────────
  const pasos = ["correo", "otp", "nueva"];
  const pasoIdx = pasos.indexOf(paso);

  return (
    <div className="login-main">
      {/* Lado izquierdo decorativo — igual que Login */}
      <div className="login-left reset-left">
        <div className="reset-decoration">
          <div className="reset-circle c1" />
          <div className="reset-circle c2" />
          <div className="reset-circle c3" />
          <div className="reset-lock">🔐</div>
        </div>
      </div>

      {/* Lado derecho */}
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
          </div>

          {/* Stepper visual */}
          <div className="reset-stepper">
            {["Correo", "Verificar", "Nueva clave"].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`step ${i <= pasoIdx ? "active" : ""} ${i < pasoIdx ? "done" : ""}`}>
                  <div className="step-circle">
                    {i < pasoIdx ? "✓" : i + 1}
                  </div>
                  <span className="step-label">{label}</span>
                </div>
                {i < 2 && <div className={`step-line ${i < pasoIdx ? "done" : ""}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* ════ PASO 1: Correo ════ */}
          {paso === "correo" && (
            <div className="login-center">
              <h2>Restablecer contraseña</h2>
              <p>Ingresa tu correo y te enviaremos un código de verificación</p>
              <form autoComplete="off" onSubmit={handleSolicitarOTP}>
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="login-center-buttons">
                  <button type="submit" className="button" disabled={cargando}>
                    {cargando ? "Enviando..." : "Enviar código"}
                  </button>
                </div>
              </form>
              <p href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }} className="login-bottom-p">
                ¿Recordaste tu contraseña?{" "}
                <a >
                  Iniciar sesión
                </a>
              </p>
            </div>
          )}

          {/* ════ PASO 2: OTP ════ */}
          {paso === "otp" && (
            <div className="login-center">
              <h2>Ingresa el código</h2>
              <p>
                Enviamos un código de 6 dígitos a <strong>{email}</strong>
              </p>
              <form autoComplete="off" onSubmit={handleVerificarOTP}>
                <OTPInput value={otp} onChange={setOtp} />

                <div className="reset-reenviar">
                  {countdown > 0 ? (
                    <span className="reenviar-countdown">
                      Reenviar código en <strong>{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="reenviar-btn"
                      onClick={handleReenviar}
                      disabled={cargando}
                    >
                      ¿No recibiste el código? Reenviar
                    </button>
                  )}
                </div>

                <div className="login-center-buttons">
                  <button type="submit" className="button" disabled={cargando || otp.length < 6}>
                    {cargando ? "Verificando..." : "Verificar código"}
                  </button>
                  <button
                    type="button"
                    className="login-bottom-p"
                    onClick={() => { setPaso("correo"); setOtp(""); }}
                  >
                    Cambiar correo
                  </button>
                </div>
              </form>
            </div>
          )}

         {/* ════ PASO 3: Nueva contraseña ════ */}
{paso === "nueva" && (
  <div className="login-center">
    <h2>Nueva contraseña</h2>
    <p>Elige una contraseña segura</p>
    <form autoComplete="off" onSubmit={handleCambiarPassword}>
 <div className="pass-input-div">
  <input
    type={showPass ? "text" : "password"}
    placeholder="Nueva contraseña"
    value={nuevaPass}
    onKeyDown={(e) => e.key === " " && e.preventDefault()}
    onChange={(e) => setNuevaPass(e.target.value.replace(/\s/g, ""))}
    required
  />
  {/* ✅ Ojito en el primero también */}
  <div className="messageWi" style={{ cursor: "pointer" }}
    onClick={() => setShowPass((v) => !v)}>
    {showPass ? "🙈" : "👁️"}
  </div>
</div>



      {/* ✅ Requisitos visuales */}
      {nuevaPass.length > 0 && (
        <ul className="password-requirements">
          {[
            { ok: nuevaPass.length >= 8,                             text: "Mínimo 8 caracteres" },
            { ok: /[A-Z]/.test(nuevaPass),                          text: "Una letra mayúscula" },
            { ok: /[a-z]/.test(nuevaPass),                          text: "Una letra minúscula" },
            { ok: /[0-9]/.test(nuevaPass),                          text: "Un número" },
            { ok: /[!@#$%^&*(),.?":{}|<>]/.test(nuevaPass),        text: "Un símbolo (!@#$%...)" },
          ].map((req, i) => (
            <li key={i} style={{ color: req.ok ? "#22c55e" : "#ef4444" }}>
              {req.ok ? "✓" : "✗"} {req.text}
            </li>
          ))}
        </ul>
      )}

      <div className="pass-input-div">
  <input
    type={showConfirm ? "text" : "password"}
    placeholder="Confirmar contraseña"
    value={confirmaPass}
    onKeyDown={(e) => e.key === " " && e.preventDefault()}
    onChange={(e) => setConfirmaPass(e.target.value.replace(/\s/g, ""))}
    required
  />
  {/* ✅ Estado independiente */}
  <div className="messageWi" style={{ cursor: "pointer" }}
    onClick={() => setShowConfirm((v) => !v)}>
    {showConfirm ? "🙈" : "👁️"}
  </div>
</div>

      <PasswordStrength password={nuevaPass} />

      <div className="login-center-buttons">
        <button
          type="submit"
          className="button"
          // ✅ Deshabilitado hasta que se cumplan todos los requisitos
          disabled={cargando || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])\S{8,}$/.test(nuevaPass)}
        >
          {cargando ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  </div>
)}
        </div>
      </div>

      <div className="login-back">
        <a href="/login">
          <ArrowBigLeftDash size="100%" />
        </a>
      </div>
    </div>
  );
};

// ── Indicador de fuerza de contraseña ────────────────────────────────────
const PasswordStrength = ({ password }) => {
  const getStrength = (p) => {
    let score = 0;
    if (p.length >= 8)  score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const score  = getStrength(password);
  const labels = ["", "Muy débil", "Débil", "Regular", "Buena", "Fuerte"];
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

  if (!password) return null;

  return (
    <div className="strength-wrapper">
      <div className="strength-bars">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="strength-bar"
            style={{ background: i <= score ? colors[score] : "#e5e7eb" }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
};

export default ResetPassword;
