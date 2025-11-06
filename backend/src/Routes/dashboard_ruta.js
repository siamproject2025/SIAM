const express = require('express');
const router = express.Router();

const dashboardController = require('../Controllers/dashboard_controller');

// ✳️ Sin middlewares, solo para probar
router.get('/dashboard', dashboardController.listarModulos);

module.exports = router;

