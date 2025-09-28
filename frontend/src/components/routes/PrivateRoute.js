import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth } from "../authentication/Auth";

const PrivateRoute = () => {
  const [isAuth, setIsAuth] = useState(null); // Estado para controlar la autenticación

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setIsAuth(false);
          return;
        }

        const token = await user.getIdToken();
        const decoded = JSON.parse(atob(token.split(".")[1])); // Decodifica el payload

        // Verifica si el token ha expirado
        setIsAuth(decoded.exp * 1000 > Date.now());
      } catch (error) {
        console.error("Error al verificar el token:", error);
        setIsAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuth === null) {
    return <div>Cargando...</div>; // Muestra un indicador de carga mientras verifica
  }

  return isAuth ? <Outlet /> : <Navigate to="/landing" replace />;
};

export default PrivateRoute;
