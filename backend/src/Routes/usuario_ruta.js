const express = require('express');
const router = express.Router();
const usuarioController = require('../Controllers/usuario_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');

router.post('/usuarios',authenticateUser ,usuarioController.crearUsuario);
//router.put('/compras/:id', usuarioController.crearUsuario);
router.get('/usuarios', usuarioController.listarUsuario);

module.exports = router;
