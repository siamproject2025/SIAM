// routes/modulo_routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../Controllers/dashboard_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole } = require('../middleware/checkRole');

// Listar módulos (solo usuarios autenticados pueden ver)
router.get('/dashboard', authenticateUser, dashboardController.listarModulos);

// Si quieres filtrar por rol (ejemplo: solo ADMIN y DOCENTE pueden listar)
router.get('/dashboard/admin', authenticateUser, checkRole(['ADMIN', 'DOCENTE']), dashboardController.listarModulos);

module.exports = router;
