import { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import "../../styles/ResetPassword.css";

const auth = getAuth();

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // Mensaje de éxito o error
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(" Se ha enviado un correo para restablecer tu contraseña.");
    } catch (err) {
      console.error(err);
      setError(" Error: " + err.message);
    }
  };

  return (
    <div className="reset-container">
      <form className="reset-form" onSubmit={handleSubmit}>
        <h2>Recuperar Contraseña</h2>
        <input
          type="email"
          placeholder="Ingresa tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar correo</button>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
