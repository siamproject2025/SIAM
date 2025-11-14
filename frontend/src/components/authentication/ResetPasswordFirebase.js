import { useState, useEffect } from "react";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../../styles/ResetPassword.css";

export default function ResetPasswordSeguro() {
  const auth = getAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const oobCode = searchParams.get("oobCode"); // Captura el código del enlace

  // Regex para contraseña segura
  const validarContrasena = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validarContrasena(password)) {
      setError(
        " La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(" Las contraseñas no coinciden.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setMessage(" Contraseña restablecida correctamente.");
      
      // Redirige al login después de 3 segundos
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.error(err);
      setError(" Error: " + err.message);
    }
  };

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h2>Restablecer Contraseña</h2>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Restablecer contraseña</button>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
