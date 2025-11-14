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
        console.log("️ No hay usuario autenticado");
        setAuthState({
          loading: false,
          isAuth: false,
          role: null,
          hasRole: true,
        });
        return;
      }

      const token = await user.getIdToken();
     
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

     

      if (!response.ok) throw new Error("Error al verificar usuario");

      // Intentamos ver el contenido bruto antes de convertirlo a JSON
      const rawText = await response.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
       
        throw new Error("El servidor devolvió una respuesta no válida (no JSON).");
      }

      const userRole = data?.role;
     

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
      console.error(" Error verificando usuario:", error.message);
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
