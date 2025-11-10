const express = require('express');
const router = express.Router();
const Auth = require("../Models/usuario_modelo");
const usuarioController = require('../Controllers/usuario_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');


// Crear usuario (solo usuarios autenticados pueden hacerlo)
router.post('/usuarios', usuarioController.crearUsuario);

// Listar usuarios (solo ADMIN)
router.get('/usuarios', authenticateUser, checkRole(['ADMIN']), usuarioController.listarUsuario);

router.get("/usuarios/role", authenticateUser,(req, res) => {
  res.json({ role: req.user.roles[0] }); // devuelve el primer rol
});

// Nueva ruta: asignar roles (solo ADMIN)
router.put('/usuarios/:id/rol', authenticateUser, checkRole(['ADMIN']), usuarioController.asignarRol);

// Eliminar usuario (solo ADMIN)
router.delete( '/usuarios/:id', authenticateUser,checkRole(['ADMIN']), usuarioController.eliminarUsuario
);

router.post('/usuarios/logout', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Aquí puedes marcar en tu DB que la sesión se cerró, ej:
    await Auth.findByIdAndUpdate(userId, { loggedIn: false });

    res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al cerrar sesión" });
  }
});

module.exports = router;
