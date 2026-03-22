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
    hasAccess: false,
    debeCambiarPassword: false,
  });

  const verificationInProgress = useRef(false);
  const hasVerified = useRef(false);
  
  // 👇 Guardar props como ref para evitar re-ejecuciones
  const propsRef = useRef({ allowedRoles, requiredPermissions, mode });

  // Actualizar ref cuando cambien las props (pero sin causar efecto)
  useEffect(() => {
    propsRef.current = { allowedRoles, requiredPermissions, mode };
  }, [allowedRoles, requiredPermissions, mode]);

  // Función de verificación local
  const verifyAccessLocally = (userRole, userPermissions, allowedRolesParam, requiredPermissionsParam, modeParam) => {
    let hasRole = true;
    if (allowedRolesParam.length > 0) {
      hasRole = allowedRolesParam.includes(userRole);
    }

    let hasPermissions = true;
    if (requiredPermissionsParam.length > 0) {
      if (modeParam === "OR") {
        hasPermissions = requiredPermissionsParam.some(perm => userPermissions.includes(perm));
      } else {
        hasPermissions = requiredPermissionsParam.every(perm => userPermissions.includes(perm));
      }
    }

    if (allowedRolesParam.length > 0 && requiredPermissionsParam.length > 0) {
      return modeParam === "OR" ? (hasRole || hasPermissions) : (hasRole && hasPermissions);
    }
    
    if (allowedRolesParam.length > 0) return hasRole;
    if (requiredPermissionsParam.length > 0) return hasPermissions;
    
    return true;
  };

  useEffect(() => {
    // Si ya verificó o hay una verificación en curso, no hacer nada
    if (hasVerified.current || verificationInProgress.current) {
      return;
    }

    const verifyAccess = async () => {
      verificationInProgress.current = true;
      console.log("🚀 INICIANDO VERIFICACIÓN DE ACCESO (una sola vez)");
      
      try {
        const user = auth.currentUser;

        if (!user) {
          console.log("❌ No hay usuario autenticado");
          setAuthState({
            loading: false,
            isAuth: false,
            role: null,
            permissions: [],
            hasAccess: false,
            debeCambiarPassword: false,
          });
          hasVerified.current = true;
          verificationInProgress.current = false;
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

        // 2. Obtener perfil
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
        } catch (permError) {
          console.error("Error al obtener permisos:", permError);
        }

        // 4. Verificar acceso usando las props actuales del ref
        const currentProps = propsRef.current;
        let hasRequiredAccess = true;

        if (currentProps.requiredPermissions.length > 0) {
          try {
            const permResponse = await fetch(`${API_URL}/api/verify-access`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                roles: currentProps.allowedRoles,
                permisos: currentProps.requiredPermissions,
                mode: currentProps.mode,
              }),
            });

            if (permResponse.ok) {
              const permData = await permResponse.json();
              hasRequiredAccess = permData.hasAccess;
            } else {
              hasRequiredAccess = verifyAccessLocally(
                userRole, 
                userPermissions, 
                currentProps.allowedRoles, 
                currentProps.requiredPermissions, 
                currentProps.mode
              );
            }
          } catch (error) {
            console.error("Error en verificación:", error);
            hasRequiredAccess = verifyAccessLocally(
              userRole, 
              userPermissions, 
              currentProps.allowedRoles, 
              currentProps.requiredPermissions, 
              currentProps.mode
            );
          }
        } else if (currentProps.allowedRoles.length > 0) {
          hasRequiredAccess = currentProps.allowedRoles.includes(userRole);
        }

        console.log("📊 Acceso final:", hasRequiredAccess);

        setAuthState({
          loading: false,
          isAuth: true,
          role: userRole,
          permissions: userPermissions,
          hasAccess: hasRequiredAccess,
          debeCambiarPassword,
        });

        hasVerified.current = true;

      } catch (error) {
        console.error("❌ Error verificando usuario:", error);
        setAuthState({
          loading: false,
          isAuth: false,
          role: null,
          permissions: [],
          hasAccess: false,
          debeCambiarPassword: false,
        });
        hasVerified.current = true;
      } finally {
        verificationInProgress.current = false;
      }
    };

    verifyAccess();
  }, []); // 👈 Array de dependencias VACÍO - solo se ejecuta UNA VEZ al montar

  // 👇 Efecto separado para detectar cambios en autenticación (sin causar bucle)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && !authState.loading && authState.isAuth) {
        // Usuario se deslogueó, resetear estado
        console.log("🔄 Usuario deslogueado, reseteando estado");
        setAuthState({
          loading: false,
          isAuth: false,
          role: null,
          permissions: [],
          hasAccess: false,
          debeCambiarPassword: false,
        });
        hasVerified.current = false;
      } else if (user && hasVerified.current && !authState.isAuth) {
        // Usuario se logueó, resetear para verificar de nuevo
        console.log("🔄 Usuario logueado, reiniciando verificación");
        hasVerified.current = false;
        verificationInProgress.current = false;
        setAuthState(prev => ({ ...prev, loading: true }));
      }
    });

    return () => unsubscribe();
  }, [authState.isAuth, authState.loading]);

  if (authState.loading) {
    return (
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
  }

  if (!authState.isAuth) {
    return <Navigate to="/landing" replace />;
  }

  if (authState.debeCambiarPassword) {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (!authState.hasAccess) {
    return <Navigate to="/restricted" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;