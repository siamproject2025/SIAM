const express = require('express');
const router = express.Router();
const rolController = require('../Controllers/rol_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');

// Todas las rutas de roles requieren autenticación y permiso específico
router.get('/roles', 
  authenticateUser, 
  checkPermission('VISUALIZAR_SEGURIDAD'),
  rolController.listarRoles
);

router.get('/roles/:id', 
  authenticateUser, 
  checkPermission('VISUALIZAR_SEGURIDAD'),
  rolController.obtenerRol
);

router.post('/roles', 
  authenticateUser, 
  checkPermission('CREAR_SEGURIDAD'),
  rolController.crearRol
);

router.put('/roles/:id', 
  authenticateUser, 
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  rolController.actualizarRol
);

router.delete('/roles/:id', 
  authenticateUser, 
  checkPermission('ELIMINAR_SEGURIDAD'),
  rolController.eliminarRol
);

// Rutas para permisos de usuario
router.get('/usuarios/:id/permisos',
  authenticateUser,
  checkPermission('VISUALIZAR_SEGURIDAD'),
  rolController.obtenerPermisosUsuario
);

router.get('/mis-permisos',
  authenticateUser,
  rolController.obtenerMisPermisos
);

module.exports = router;