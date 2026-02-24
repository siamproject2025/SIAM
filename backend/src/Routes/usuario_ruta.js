// routes/usuario_routes.js (actualizado)
const express = require('express');
const router = express.Router();
const Auth = require("../Models/usuario_modelo");
const usuarioController = require('../Controllers/usuario_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole, checkAccess } = require('../middleware/checkRole');
const { checkPermission } = require('../middleware/checkPermission');

// Crear usuario (público)
router.post('/usuarios', usuarioController.crearUsuario);

// Listar usuarios - Usando permisos en lugar de roles fijos
router.get('/usuarios', 
  authenticateUser, 
  checkPermission('VER_USUARIOS'), // Nuevo permiso específico
  usuarioController.listarUsuario
);

// Obtener rol del usuario actual
router.get("/usuarios/role", authenticateUser, (req, res) => {
  res.json({ role: req.user.roles[0] });
});

// Asignar roles a usuario
router.put('/usuarios/:id/rol', 
  authenticateUser, 
  checkPermission('ASIGNAR_ROLES'), // Permiso específico
  usuarioController.asignarRol
);

// Eliminar usuario
router.delete('/usuarios/:id', 
  authenticateUser,
  checkPermission('ELIMINAR_USUARIOS'), // Permiso específico
  usuarioController.eliminarUsuario
);

// Logout
router.post('/usuarios/logout', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    await Auth.findByIdAndUpdate(userId, { loggedIn: false });
    res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al cerrar sesión" });
  }
});

// Login
router.post("/usuarios/login", usuarioController.loginUsuario);
router.post("/usuarios/login/fallo", usuarioController.registrarIntentoFallido);
router.post("/usuarios/login/exito", usuarioController.reiniciarIntentos);

// Ejemplo de uso del nuevo middleware combinado
router.get('/usuarios/reportes', 
  authenticateUser,
  checkAccess({
    roles: ['ADMIN'], // Opcional: roles permitidos
    permisos: ['VER_REPORTES', 'GENERAR_REPORTES'], // Permisos requeridos
    mode: 'OR' // OR o AND (por defecto OR)
  }),
  (req, res) => {
    res.json({ message: 'Acceso a reportes permitido' });
  }
);

module.exports = router;