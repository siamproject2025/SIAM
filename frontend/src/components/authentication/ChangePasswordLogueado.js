import { useState } from "react";
import {
  getAuth,
  updatePassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

import "./ResetPassword.css";

export default function ChangePasswordLogueado() {
  const auth = getAuth();
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validarContrasena = (pwd) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!user) {
      setError("No hay un usuario activo.");
      return;
    }

    if (!validarContrasena(password)) {
      setError("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (currentPassword === password) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, password);

      setMessage("¡Contraseña actualizada! Cerrando sesión...");

      setTimeout(async () => {
        await signOut(auth);
        navigate("/login");
      }, 500);
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("La contraseña actual es incorrecta.");
      } else if (err.code === "auth/requires-recent-login") {
        setError("Por seguridad, vuelve a iniciar sesión.");
      } else {
        setError("Error: " + err.message);
      }
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <form className="reset-form" onSubmit={handleSubmit}>
          <h2>Cambiar Contraseña</h2>

          <div className="form-group">
            <label>Contraseña actual</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Nueva Contraseña</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirmar nueva Contraseña</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Actualizar y cerrar sesión
          </button>

          <div className="status-messages">
            {message && <p className="success-msg">{message}</p>}
            {error && <p className="error-msg">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
