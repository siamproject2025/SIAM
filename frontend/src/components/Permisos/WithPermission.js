// components/Permisos/WithPermission.js
import React, { useState, useEffect, useRef } from 'react';
import { auth } from "../authentication/Auth";

const WithPermission = ({ requiredPermissions, children, fallback = null }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const verificacionRealizada = useRef(false); // Control para una sola verificación

  useEffect(() => {
    // Si ya verificamos, no repetir
    if (verificacionRealizada.current) {
      setLoading(false);
      return;
    }

    const checkPermission = async () => {
      try {
        // Marcar que ya estamos verificando
        verificacionRealizada.current = true;
        
        const user = auth.currentUser;
        if (!user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Obtener token
        const token = await user.getIdToken();
        
        // Hacer SOLO UNA petición a mis-permisos
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/mis-permisos`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const userPermissions = data.permisos || [];
          
          // Verificar si tiene ALGUNO de los permisos requeridos
          const tienePermiso = requiredPermissions.some(permiso => 
            userPermissions.includes(permiso)
          );
          
          setHasPermission(tienePermiso);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Error verificando permisos:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, []); // 👈 IMPORTANTE: Array vacío = solo se ejecuta UNA VEZ

  // Mientras carga, no mostrar nada
  if (loading) return null;
  
  // Si tiene permiso, mostrar children, si no, mostrar fallback
  return hasPermission ? children : fallback;
};

export default WithPermission;