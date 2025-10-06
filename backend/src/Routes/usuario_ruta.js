const express = require('express');
const router = express.Router();
const usuarioController = require('../Controllers/usuario_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkrole');

// Crear usuario (solo usuarios autenticados pueden hacerlo)
router.post('/usuarios', usuarioController.crearUsuario);

// Listar usuarios (solo ADMIN)
router.get('/usuarios', authenticateUser, checkRole(['ADMIN']), usuarioController.listarUsuario);

router.get("/usuarios/role", authenticateUser,(req, res) => {
  res.json({ role: req.user.roles[0] }); // devuelve el primer rol
});
module.exports = router;
