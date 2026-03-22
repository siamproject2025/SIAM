import React, { useState, useEffect, useRef } from "react";
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
    debeCambiarPassword: false, // ✅ nuevo flag
  });

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const verifyAccess = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setAuthState({
            loading: false,
            isAuth: false,
            role: null,
            permissions: [],
            hasAccess: true,
            debeCambiarPassword: false,
          });
          hasVerified.current = true;
          return;
        }

        const token = await user.getIdToken();

        // 1. Obtener rol
        const roleResponse = await fetch(`${API_URL}/api/usuarios/role`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!roleResponse.ok) throw new Error("Error al verificar usuario");
        const roleData = await roleResponse.json();
        const userRole = roleData?.role;

        // 2. ✅ Obtener perfil (incluye debe_cambiar_password)
        let debeCambiarPassword = false;
        try {
          const perfilResponse = await fetch(`${API_URL}/api/usuarios/mi-perfil`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (perfilResponse.ok) {
            const perfilData = await perfilResponse.json();
            debeCambiarPassword = perfilData.debe_cambiar_password || false;
          }
        } catch (perfilError) {
          console.error("Error al obtener perfil:", perfilError);
        }
const perfilResponse = await fetch(`${API_URL}/api/usuarios/mi-perfil`, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
if (perfilResponse.ok) {
  const perfilData = await perfilResponse.json();
  console.log("🔍 PERFIL:", perfilData); // ← agrega esto
  debeCambiarPassword = perfilData.debe_cambiar_password || false;
}
        // 3. Obtener permisos
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
        } catch (permError) {}

        // 4. Verificar acceso por permisos/roles
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
          debeCambiarPassword, // ✅
        });

        hasVerified.current = true;

      } catch (error) {
        console.error("❌ Error verificando usuario:", error.message);
        setAuthState({
          loading: false,
          isAuth: false,
          role: null,
          permissions: [],
          hasAccess: true,
          debeCambiarPassword: false,
        });
        hasVerified.current = true;
      }
    };

    verifyAccess();
  }, []);

  if (authState.loading) return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "1.2rem",
      color: "#666",
    }}>
      Cargando...
    </div>
  );

  if (!authState.isAuth) return <Navigate to="/landing" replace />;

  // ✅ Si debe cambiar password y NO está ya en esa ruta, redirigir
  if (authState.debeCambiarPassword) {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (!authState.hasAccess) return <Navigate to="/restricted" replace />;

  return <Outlet />;
};

export default PrivateRoute;
