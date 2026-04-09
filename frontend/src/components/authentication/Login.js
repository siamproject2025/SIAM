import React, { useState } from "react";
import Image from "../../assets/login.png";
import Logo from "../../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import "../../styles/login.css";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import axios from "axios";
import {
  GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../authentication/Auth";
import { ArrowBigLeftDash } from "lucide-react";
import Swal from "sweetalert2";

const API_URL = process.env.REACT_APP_API_URL;



const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [vistaActual, setVistaActual]   = useState("login"); // "login" | "solicitud"
  const [enviando, setEnviando]         = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  const navigate = useNavigate();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toast = (icon, text) => Swal.fire({
    icon, text,
    timer: 3500,
    showConfirmButton: false,
    position: "top",
    toast: true
  });

  // ── Google login ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;
      if (!user) return;

      const token = await user.getIdToken();

      // Verificar si está aprobado o crear solicitud automática
      const res = await axios.post(
        `${API_URL}/api/usuarios/google-acceso`,
        {
          email:    user.email,
          username: user.displayName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.aprobado) {
        // Usuario ya aprobado → navegar
        toast("success", "Inicio de sesión exitoso");
        navigate("/dashboard");
      }

    } catch (err) {
      // Cerrar sesión de Firebase para que no quede logueado sin aprobación
      await auth.signOut().catch(() => {});

      const mensaje = err.response?.data?.message;
      const estado  = err.response?.status;

      if (estado === 403) {
        // Solicitud pendiente, denegada o bloqueada
        Swal.fire({
          icon:               "info",
          title:              "Acceso pendiente",
          text:               mensaje || "Tu solicitud está siendo revisada.",
          confirmButtonText:  "Entendido",
          confirmButtonColor: "#4f8ef7",
        });
      } else {
        toast("error", mensaje || "Error al iniciar sesión con Google.");
      }
    }
  };

  // ── Login normal ──────────────────────────────────────────────────────────
  const handleLogin = async (data) => {
    const email = data.email.toLowerCase().trim();
    try {
      const bloqueoRes = await axios.post(
        `${API_URL}/api/usuarios/login`,
        { email },
        { validateStatus: (s) => s === 200 || s === 429 }
      );
      if (!bloqueoRes.data.permitido) {
        toast("error", bloqueoRes.data.message || "Cuenta bloqueada temporalmente");
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email, data.password);
      const user = credential.user;

      if (!user.emailVerified) {
        await auth.signOut();
        toast("error", "Verifica tu correo antes de iniciar sesión.");
        return;
      }

      await axios.post(`${API_URL}/api/usuarios/login/exito`, { email });
      toast("success", "Inicio de sesión exitoso");
      navigate("/dashboard");

    } catch (error) {
      await auth.signOut().catch(() => {});
      await handleLoginError(error, email);
    }
  };

  const handleLoginError = async (error, email) => {
    if (error.response?.status === 429) {
      toast("error", error.response.data.message || "Cuenta bloqueada temporalmente");
      return;
    }
    const code = error.code || "";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
      await axios.post(
        `${API_URL}/api/usuarios/login/fallo`,
        { email },
        { validateStatus: (s) => s === 200 || s === 429 }
      );
      toast("error", "Contraseña incorrecta");
    } else if (code === "auth/user-not-found") {
      toast("error", "No existe una cuenta con ese correo.");
    } else if (code === "auth/too-many-requests") {
      toast("error", "Demasiados intentos. Intenta más tarde.");
    } else {
      toast("error", "Error al iniciar sesión.");
    }
    reset();
  };

  // ── Enviar solicitud ──────────────────────────────────────────────────────
  const handleSolicitud = async (data) => {
    setEnviando(true);
    try {
      await axios.post(`${API_URL}/api/solicitudes`, {
        nombre_solicitante: data.nombre_solicitante,
        email:              data.email_sol.toLowerCase().trim()
      });

      Swal.fire({
        icon:               "success",
        title:              "¡Solicitud enviada!",
        html: `
          <p style="margin:0 0 10px;">Tu solicitud ha sido recibida y será revisada por el administrador.</p>
          <p style="margin:0;font-size:0.9rem;color:#6b7280;">
            📧 Si es aprobada, recibirás tus credenciales de acceso en el correo que registraste.
          </p>
        `,
        confirmButtonText:  "Entendido",
        confirmButtonColor: "#4f8ef7",
      });

      setVistaActual("login");
      reset();
    } catch (err) {
      toast("error", err.response?.data?.message || "Error al enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="login-main">

      {/* Lado izquierdo */}
      <div className="login-left">
        <img src={Image} alt="" />
      </div>

      {/* Lado derecho */}
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>

          {/* ════════ VISTA: LOGIN ════════ */}
          {vistaActual === "login" && (
            <div className="login-center">
              <h2>¡Bienvenido!</h2>
              <p>Por favor, introduzca sus datos</p>

              <form autoComplete="off" onSubmit={handleSubmit(handleLogin)}>
                <input
                  type="email"
                  placeholder="Correo"
                  {...register("email", {
                    required: "Este campo es obligatorio",
                    pattern: {
                      value:   /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                      message: "Formato de email inválido"
                    }
                  })}
                />
                {errors.email && (
                  <span className="loginMessage"><strong>{errors.email.message}</strong></span>
                )}

                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    {...register("password", { required: "Este campo es obligatorio" })}
                  />
                  <div className="messageWi">
                    {errors.password && (
                      <span className="loginMessage"><strong>{errors.password.message}</strong></span>
                    )}
                    {showPassword
                      ? <FaEyeSlash onClick={() => setShowPassword(false)} />
                      : <FaEye     onClick={() => setShowPassword(true)}  />}
                  </div>
                </div>

                <div className="login-center-options">
                  <a  className="forgot-pass-link" onClick={() => navigate("/ResetPassword")}>
                    ¿Has olvidado tu contraseña?
                  </a>
                </div>

                <div className="login-center-buttons">
                  <button type="submit" className="button">Iniciar sesión</button>
                  <button type="button" className="button" onClick={handleGoogleLogin}>
                    <FcGoogle style={{ marginRight: "8px" }} />
                    Ingresar con Google
                  </button>
                </div>
              </form>

              <p  href="#" onClick={(e) => { e.preventDefault(); setVistaActual("solicitud"); reset(); }} className="login-bottom-p">
                ¿No tienes cuenta?{" "}
                <a>
                  Solicitar acceso
                </a>
              </p>
            </div>
          )}

          {/* ════════ VISTA: SOLICITUD ════════ */}
          {vistaActual === "solicitud" && (
            <div className="login-center">
              <h2>Solicitar acceso</h2>
              <p>Completa el formulario y el administrador revisará tu solicitud</p>

              <form autoComplete="off" onSubmit={handleSubmit(handleSolicitud)}>

                {/* Nombre del solicitante */}
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  {...register("nombre_solicitante", {
                    required: "Este campo es obligatorio",
                    pattern: {
                      value:   /^[A-Z\s]+$/,
                      message: "Solo se permiten letras y espacios"
                    },
                    onChange: (e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, "");
                      setValue("nombre_solicitante", val, { shouldValidate: true });
                    }
                  })}
                />
                {errors.nombre_solicitante && (
                  <span className="loginMessage">{errors.nombre_solicitante.message}</span>
                )}

                {/* Correo */}
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  {...register("email_sol", {
                    required: "Este campo es obligatorio",
                    pattern: {
                      value:   /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                      message: "Formato de email inválido"
                    }
                  })}
                />
                {errors.email_sol && (
                  <span className="loginMessage">{errors.email_sol.message}</span>
                )}

                {/* Nombre del alumno */}
                
                <div className="login-center-buttons">
                  <button type="submit" className="button" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </div>
              </form>

              <p href="#" onClick={(e) => { e.preventDefault(); setVistaActual("login"); reset(); }} className="login-bottom-p">
                ¿Ya tienes cuenta?{" "}
                <a >
                  Iniciar sesión
                </a>
              </p>
            </div>
          )}

        </div>
      </div>

      <div className="login-back">
        <a href="/landing">
          <ArrowBigLeftDash size="100%" />
        </a>
      </div>
    </div>
  );
};

export default Login;