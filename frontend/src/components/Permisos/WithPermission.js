// components/Permisos/WithPermission.js
import React, { useState, useEffect, useRef } from 'react';
import { auth } from "../authentication/Auth";

const WithPermission = ({ 
  requiredPermissions, 
  children,
  // Props específicos para cuando está deshabilitado
  disableStyle = true, // Aplica estilos de deshabilitado
  disableTooltip = "No tienes permisos para realizar esta acción"
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const verificacionRealizada = useRef(false);

  useEffect(() => {
    if (verificacionRealizada.current) {
      setLoading(false);
      return;
    }

    const checkPermission = async () => {
      try {
        verificacionRealizada.current = true;
        
        const user = auth.currentUser;
        if (!user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/mis-permisos`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const userPermissions = data.permisos || [];
          
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
  }, []);

  // Mientras carga, mostrar el botón deshabilitado
  if (loading) {
    if (React.isValidElement(children)) {
      return React.cloneElement(children, { 
        disabled: true,
        title: "Verificando permisos..."
      });
    }
    return null;
  }
  
  // Si tiene permiso, mostrar el botón normalmente
  if (hasPermission) return children;
  
  // Si no tiene permiso, mostrar el botón deshabilitado
  if (React.isValidElement(children)) {
    const disabledProps = {
      disabled: true,
      onClick: null, // Prevenir cualquier click
      style: disableStyle ? { 
        ...children.props.style,
        opacity: 0.5,
        cursor: 'not-allowed' 
      } : children.props.style,
      title: disableTooltip
    };
    
    return React.cloneElement(children, disabledProps);
  }
  
  return children;
};

export default WithPermission;