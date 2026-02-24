const Rol = require('../Models/Rol');

const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(401).json({ message: 'Usuario no autenticado o sin roles' });
    }

    const userRoles = req.user.roles;
    const tieneAcceso = userRoles.some(role => rolesPermitidos.includes(role));

    if (!tieneAcceso) {
      return res.status(403).json({ message: 'Acceso denegado - Rol no autorizado' });
    }

    next();
  };
};

// Middleware combinado (roles Y/O permisos)
const checkAccess = (options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Usuario no autenticado' });
      }

      const { roles = [], permisos = [], mode = 'OR' } = options;
      const userRoles = req.user.roles;
      
      // Verificar roles
      let tieneRol = true;
      if (roles.length > 0) {
        tieneRol = mode === 'OR' 
          ? roles.some(rol => userRoles.includes(rol))
          : roles.every(rol => userRoles.includes(rol));
      }

      // Obtener permisos
      const rolesDB = await Rol.find({ _id: { $in: userRoles } });
      const userPermissions = [...new Set(rolesDB.flatMap(rol => rol.permisos))];
      req.userPermissions = userPermissions;

      // Verificar permisos
      let tienePermiso = true;
      if (permisos.length > 0) {
        tienePermiso = mode === 'OR'
          ? permisos.some(p => userPermissions.includes(p))
          : permisos.every(p => userPermissions.includes(p));
      }

      // Decidir acceso
      let accesoPermitido = false;
      if (mode === 'OR') {
        accesoPermitido = (roles.length === 0 || tieneRol) || (permisos.length === 0 || tienePermiso);
      } else {
        accesoPermitido = (roles.length === 0 || tieneRol) && (permisos.length === 0 || tienePermiso);
      }

      if (!accesoPermitido) {
        return res.status(403).json({ 
          message: 'Acceso denegado - No cumple requisitos' 
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando acceso:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

module.exports = { checkRole, checkAccess };