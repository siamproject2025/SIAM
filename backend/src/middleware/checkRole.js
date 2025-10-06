const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    
    if (!req.user || !req.user.roles) {
      console.log("Usuario no autenticado o sin roles");
      return res.status(401).json({ message: 'Usuario no autenticado o sin roles' });
    }

    const userRoles = req.user.roles;

    const tieneAcceso = userRoles.some(role => rolesPermitidos.includes(role));
   
    if (!tieneAcceso) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    next();
  };
};

module.exports = { checkRole };
