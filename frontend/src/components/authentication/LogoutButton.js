import React from 'react';
import { useNavigate } from "react-router-dom";
import appFirebase from "./Auth";
import { getAuth, signOut } from "firebase/auth";

const auth = getAuth(appFirebase);

const LogoutButton = () => {
  const navigate = useNavigate(); // Inicializa el hook

  const handleLogout = async () => {
    try {
      await signOut(auth);
        // Limpiar cualquier dato guardado en localStorage
      localStorage.removeItem("token");      // si guardaste un token
      localStorage.removeItem("userData");   // si guardaste información del usuario
      alert("Has cerrado sesión con éxito.");
      navigate('/landing'); // Redirige a la ruta '/landing'
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Hubo un problema al cerrar sesión. Por favor, inténtalo de nuevo.");
    }
  };

  return (
    <div>
      <button
        style={{ marginTop: "10px", width: "100px" }}
        className="btn btn-dark btn-sm"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default LogoutButton;
