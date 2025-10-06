import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../authentication/Auth";

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
          setAuthState({
            loading: false,
            isAuth: false,
            role: null,
            hasRole: true, // no se llegó a verificar el rol
          });
          return;
        }

        const token = await user.getIdToken();

        const response = await fetch("http://localhost:5000/api/usuarios/role", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Error al verificar usuario");

        const data = await response.json();
        const userRole = data.role;

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
          setAuthState({
            loading: false,
            isAuth: true,
            role: userRole,
            hasRole: false, // rol no permitido
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
        console.error("Error verificando usuario:", error);
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
