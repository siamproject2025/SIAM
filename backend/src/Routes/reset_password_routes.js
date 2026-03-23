const express    = require('express');
const router     = express.Router();
const resetCtrl  = require('../Controllers/reset_password_controller');

// ── Sin autenticación: el usuario no tiene sesión cuando resetea ──────────

// PASO 1 — Solicitar código OTP al correo
router.post('/reset-password/solicitar', resetCtrl.solicitarOTP);

// PASO 2 — Verificar código OTP
router.post('/reset-password/verificar', resetCtrl.verificarOTP);

// PASO 3 — Cambiar contraseña con código verificado
router.post('/reset-password/cambiar',   resetCtrl.cambiarPassword);

module.exports = router;