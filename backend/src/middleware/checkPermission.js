const Rol = require('../Models/Rol');

// Verificar un permiso específico
const checkPermission = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const userRoles = req.user.roles;
      const roles = await Rol.find({ _id: { $in: userRoles } });
      const userPermissions = [...new Set(roles.flatMap(rol => rol.permisos))];
      
      if (!userPermissions.includes(permisoRequerido)) {
        return res.status(403).json({ 
          message: `Acceso denegado - Permiso requerido: ${permisoRequerido}` 
        });
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Error verificando permiso:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Verificar múltiples permisos (todos requeridos - AND)
const checkAllPermissions = (permisosRequeridos) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const roles = await Rol.find({ _id: { $in: req.user.roles } });
      const userPermissions = [...new Set(roles.flatMap(rol => rol.permisos))];
      
      const tieneTodos = permisosRequeridos.every(p => userPermissions.includes(p));
      
      if (!tieneTodos) {
        return res.status(403).json({ 
          message: 'Acceso denegado - Faltan permisos requeridos' 
        });
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

// Verificar al menos un permiso (OR)
const checkAnyPermission = (permisosRequeridos) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const roles = await Rol.find({ _id: { $in: req.user.roles } });
      const userPermissions = [...new Set(roles.flatMap(rol => rol.permisos))];
      
      const tieneAlguno = permisosRequeridos.some(p => userPermissions.includes(p));
      
      if (!tieneAlguno) {
        return res.status(403).json({ 
          message: 'Acceso denegado - Se requiere al menos un permiso' 
        });
      }

      req.userPermissions = userPermissions;
      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

module.exports = { checkPermission, checkAllPermissions, checkAnyPermission };