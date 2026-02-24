// components/PrivateRoute.jsx
import React, { useState, useEffect, useRef } from "react"; // ← IMPORTANTE: agregar useRef
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../authentication/Auth";

const API_URL = process.env.REACT_APP_API_URL;

const PrivateRoute = ({ allowedRoles = [], requiredPermissions = [], mode = "OR" }) => {
  const [authState, setAuthState] = useState({
    loading: true,
    isAuth: false,
    role: null,
    permissions: [],
    hasAccess: true,
  });

  // 👇 Ref para controlar que solo se ejecute una vez
  const hasVerified = useRef(false);

  useEffect(() => {
    // 👇 Si ya verificó, no hacer nada
    if (hasVerified.current) return;
    
    const verifyAccess = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          console.log("❌ No hay usuario autenticado");
          setAuthState({
            loading: false,
            isAuth: false,
            role: null,
            permissions: [],
            hasAccess: true,
          });
          hasVerified.current = true;
          return;
        }

        const token = await user.getIdToken();
        
        // 1. Obtener el rol del usuario
        const roleResponse = await fetch(`${API_URL}/api/usuarios/role`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!roleResponse.ok) throw new Error("Error al verificar usuario");
        
        const roleData = await roleResponse.json();
        const userRole = roleData?.role;

        // 2. Obtener permisos del usuario
        let userPermissions = [];
        try {
          const permisosResponse = await fetch(`${API_URL}/api/mis-permisos`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (permisosResponse.ok) {
            const permisosData = await permisosResponse.json();
            userPermissions = permisosData.permisos || [];
          }
        } catch (permError) {
          console.log("Endpoint de permisos no disponible");
        }

        // 3. Verificar acceso
        let hasRequiredAccess = true;

        if (requiredPermissions.length > 0) {
          const permResponse = await fetch(`${API_URL}/api/verify-access`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              roles: allowedRoles,
              permisos: requiredPermissions,
              mode: mode,
            }),
          });

          if (permResponse.ok) {
            const permData = await permResponse.json();
            hasRequiredAccess = permData.hasAccess;
          }
        } else if (allowedRoles.length > 0) {
          hasRequiredAccess = allowedRoles.includes(userRole);
        }

        setAuthState({
          loading: false,
          isAuth: true,
          role: userRole,
          permissions: userPermissions,
          hasAccess: hasRequiredAccess,
        });

        // 👇 Marcar que ya verificó
        hasVerified.current = true;

      } catch (error) {
        console.error("❌ Error verificando usuario:", error.message);
        setAuthState({
          loading: false,
          isAuth: false,
          role: null,
          permissions: [],
          hasAccess: true,
        });
        hasVerified.current = true;
      }
    };

    verifyAccess();
  }, []); // 👈 Array de dependencias VACÍO - solo se ejecuta una vez al montar

  if (authState.loading) return (
    <div className="loading-screen" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.2rem',
      color: '#666'
    }}>
      Cargando...
    </div>
  );

  if (!authState.isAuth) return <Navigate to="/landing" replace />;
  if (!authState.hasAccess) return <Navigate to="/restricted" replace />;

  return <Outlet />;
};

export default PrivateRoute;