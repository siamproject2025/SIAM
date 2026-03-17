const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');
const Rol = require('../Models/Rol');

// Verificar acceso (para frontend)
// authRoutes.js
router.post('/verify-access', authenticateUser, async (req, res) => {
  try {
    const { roles = [], permisos = [], mode = 'OR' } = req.body;
    const userRoles = req.user.roles;

    console.log("🔍 ===== VERIFY-ACCESS =====");
    console.log("📌 Usuario:", req.user.email || req.user._id);
    console.log("📌 Roles requeridos:", roles);
    console.log("📌 Permisos requeridos:", permisos);
    console.log("📌 Modo:", mode);

    // Obtener permisos del usuario
    const rolesDB = await Rol.find({ _id: { $in: userRoles } });
    const userPermissions = [...new Set(rolesDB.flatMap(rol => rol.permisos))];
    
    console.log("📌 Roles del usuario:", userRoles);
    console.log("📌 Permisos del usuario:", userPermissions);

    // Si hay permisos requeridos, verificar SOLO esos
    if (permisos.length > 0) {
      let tienePermiso;
      if (mode === 'OR') {
        tienePermiso = permisos.some(p => userPermissions.includes(p));
      } else {
        tienePermiso = permisos.every(p => userPermissions.includes(p));
      }
      
      console.log("📌 ¿Tiene permisos?:", tienePermiso);
      console.log("✅ Acceso permitido:", tienePermiso);
      console.log("===========================\n");
      
      return res.json({ hasAccess: tienePermiso });
    }

    // Si hay roles requeridos, verificar SOLO esos
    if (roles.length > 0) {
      let tieneRol;
      if (mode === 'OR') {
        tieneRol = roles.some(r => userRoles.includes(r));
      } else {
        tieneRol = roles.every(r => userRoles.includes(r));
      }
      
      console.log("📌 ¿Tiene roles?:", tieneRol);
      console.log("✅ Acceso permitido:", tieneRol);
      console.log("===========================\n");
      
      return res.json({ hasAccess: tieneRol });
    }

    // Si no hay ni roles ni permisos requeridos, DENEGAR por seguridad
    console.log("📌 Sin requisitos - ACCESO DENEGADO");
    console.log("===========================\n");
    res.json({ hasAccess: false });

  } catch (error) {
    console.error('❌ Error verificando acceso:', error);
    res.status(500).json({ hasAccess: false });
  }
});

// Ruta para obtener permisos del usuario actual
router.get('/mis-permisos', authenticateUser, async (req, res) => {
  try {
    const userRoles = req.user.roles;
    const roles = await Rol.find({ _id: { $in: userRoles } });
    const permisos = [...new Set(roles.flatMap(rol => rol.permisos))];
    
    res.json({
      roles: userRoles,
      permisos: permisos,
      rolesDetalle: roles
    });
  } catch (error) {
    console.error('Error al obtener mis permisos:', error);
    res.status(500).json({ message: 'Error al obtener permisos' });
  }
});

module.exports = router; // <-- SOLO UNA VEZ AL FINAL