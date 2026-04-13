// components/Permisos/WithPermission.js
import React, { useState, useEffect, useRef } from 'react';
import { auth } from "../authentication/Auth";

const WithPermissionNoRender = ({ requiredPermissions, children }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const verificacionRealizada = useRef(false);

  useEffect(() => {
    if (verificacionRealizada.current) {
      setLoading(false);
      return;
    }

    const checkPermission = async () => {  // <-- nombre diferente al prop
      try {
        verificacionRealizada.current = true;

        const user = auth.currentUser;
        if (!user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        const token = await user.getIdToken(true);

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/mis-permisos`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          const userPermissions = data.permisos || [];
          const tienePermiso = requiredPermissions.some(p =>  // ahora sí usa el prop
            userPermissions.includes(p)
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
  }, []);

  if (loading || !hasPermission) return null;

  return children;
};

export default WithPermissionNoRender;