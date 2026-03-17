const express = require('express');
const router = express.Router();
const rolController = require('../Controllers/rol_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkPermission } = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo = require("../Models/Rol"); // Importar modelo para capturar datos previos


// Todas las rutas de roles requieren autenticación y permiso específico
router.get('/roles', 
  authenticateUser, 

  rolController.listarRoles
);

router.get('/roles/:id', 
  authenticateUser, 

  rolController.obtenerRol
);

router.post('/roles', 
  authenticateUser, 
  checkPermission('CREAR_ROLES'),capturarDatosPrevios(Modelo), registrarAuditoria('ROLES'),
  rolController.crearRol
);

router.put('/roles/:id', 
  authenticateUser, 
  checkPermission('ACTUALIZAR_ROLES'),capturarDatosPrevios(Modelo), registrarAuditoria('ROLES'),
  rolController.actualizarRol
);

router.delete('/roles/:id', 
  authenticateUser, 
  checkPermission('ELIMINAR_ROLES'),capturarDatosPrevios(Modelo), registrarAuditoria('ROLES'),
  rolController.eliminarRol
);

// Rutas para permisos de usuario
router.get('/usuarios/:id/permisos',
  authenticateUser,

  rolController.obtenerPermisosUsuario
);

router.get('/mis-permisos',
  authenticateUser,
  rolController.obtenerMisPermisos
);

module.exports = router;