import { useState } from "react";
import { getAuth, updatePassword } from "firebase/auth"; // <-- Importa updatePassword
import { useNavigate } from "react-router-dom"; 
// Importa el hook para obtener el usuario actual (asumiendo que usas 'useAuth' o un similar)
// Si usas un Context, ajusta el import según tu implementación. 
// Para este ejemplo, asumiremos que obtienes el usuario directamente de getAuth().currentUser
import "../../styles/ResetPassword.css"; 

export default function ChangePasswordLogueado() {
 const auth = getAuth();
 const navigate = useNavigate();
 const user = auth.currentUser; // <-- Obtiene el usuario actualmente logueado

 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [message, setMessage] = useState("");
 const [error, setError] = useState("");

 // Regex para contraseña segura (Misma lógica, ¡bien hecho!)
 const validarContrasena = (pwd) => {
 const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
 return regex.test(pwd);
 };

const handleSubmit = async (e) => {
 e.preventDefault();
 setMessage("");
 setError("");

    if (!user) {
        setError("Error: No hay un usuario logueado. Por favor, inicia sesión de nuevo.");
        return;
    }

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
 // 1. LLAMADA CLAVE: Usamos updatePassword con el usuario actual y la nueva contraseña
 await updatePassword(user, password); 
      
 setMessage(" Contraseña actualizada correctamente. Es posible que debas iniciar sesión de nuevo.");

 // Opcionalmente, puedes redirigir al dashboard después de un éxito
 setTimeout(() => navigate("/dashboard"), 3000); 
      
 } catch (err) {
 console.error(err);
      
      // Manejo específico si la sesión es antigua (requiere re-autenticación)
      if (err.code === 'auth/requires-recent-login') {
          setError("Error: Por seguridad, debes re-autenticarte para cambiar tu contraseña. Por favor, cierra sesión y vuelve a entrar o implementa un paso de verificación de contraseña actual.");
      } else {
          setError(" Error al cambiar la contraseña: " + err.message);
      }
 }
 };

 return (
 <div className="reset-container">
 <form className="reset-form" onSubmit={handleSubmit}>
 <h2>Cambiar Contraseña</h2>
        {/* Aquí podrías añadir un campo para la Contraseña Actual si lo requiere la lógica */}
 <input
 type="password"
 placeholder="Nueva contraseña"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 />
 <input
 type="password"
 placeholder="Confirmar nueva contraseña"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 />
 <button type="submit">Cambiar contraseña</button>
 {message && <p className="success">{message}</p>}
 {error && <p className="error">{error}</p>}
 </form>
 </div>
 );
}