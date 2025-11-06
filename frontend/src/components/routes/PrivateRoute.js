import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../authentication/Auth";

const API_URL = process.env.REACT_APP_API_URL+"/api/usuarios/role";

const PrivateRoute = ({ allowedRoles = [] }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuth: false,
    role: null,
    hasRole: true, // nuevo: indica si el rol es válido
  });

 useEffect(() => {
  const verifyUser = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.log("⚠️ No hay usuario autenticado");
        setAuthState({
          loading: false,
          isAuth: false,
          role: null,
          hasRole: true,
        });
        return;
      }

      const token = await user.getIdToken();
      console.log("🔑 Token obtenido:", token.substring(0, 20) + "...");

      console.log("🌐 Llamando a:", API_URL);
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Estado de respuesta:", response.status, response.statusText);

      if (!response.ok) throw new Error("Error al verificar usuario");

      // Intentamos ver el contenido bruto antes de convertirlo a JSON
      const rawText = await response.text();
      console.log("📦 Respuesta cruda del backend:", rawText);

      let data;
      try {
        data = JSON.parse(rawText);
        console.log("✅ JSON parseado correctamente:", data);
      } catch (err) {
        console.warn("⚠️ No es JSON válido. Respuesta textual:", rawText);
        throw new Error("El servidor devolvió una respuesta no válida (no JSON).");
      }

      const userRole = data?.role;
      console.log("👤 Rol del usuario recibido:", userRole);

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        setAuthState({
          loading: false,
          isAuth: true,
          role: userRole,
          hasRole: false,
        });
      } else {
        setAuthState({
          loading: false,
          isAuth: true,
          role: userRole,
          hasRole: true,
        });
      }
    } catch (error) {
      console.error("❌ Error verificando usuario:", error.message);
      setAuthState({
        loading: false,
        isAuth: false,
        role: null,
        hasRole: true,
      });
    }
  };

  verifyUser();
}, [allowedRoles]);



  if (authState.loading) return <div>Cargando...</div>;

  // No está autenticado → landing
  if (!authState.isAuth) return <Navigate to="/landing" replace />;

  // Está autenticado pero el rol no coincide → restricted
  if (!authState.hasRole) return <Navigate to="/restricted" replace />;

  return <Outlet />;
};

export default PrivateRoute;
