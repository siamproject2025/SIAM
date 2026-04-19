const express = require('express');
const router = express.Router();
const Auth = require("../Models/usuario_modelo");
const Usuario = require("../Models/usuario_modelo");
const usuarioController = require('../Controllers/usuario_controller');
const { checkRole, checkAccess } = require('../middleware/checkRole');
const { checkPermission } = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const solicitudController = require('../Controllers/solicitud_controller');
const { authenticateUser, authenticateIfPresent } = require('../middleware/authMiddleWare');


// ══════════════════════════════════════════
//  SOLICITUDES
// ══════════════════════════════════════════

router.post('/solicitudes', solicitudController.crearSolicitud);

router.get('/solicitudes',
  authenticateUser,
  checkPermission('VISUALIZAR_SEGURIDAD'),
  solicitudController.listarSolicitudes
);

router.patch('/solicitudes/:id/resolver',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  solicitudController.resolverSolicitud
);

// ══════════════════════════════════════════
//  CONFIGURACIÓN DE BLOQUEO (parametrizable)
// ══════════════════════════════════════════

router.get('/config/bloqueo',
  authenticateUser,
  checkPermission('VISUALIZAR_SEGURIDAD'),
  usuarioController.obtenerConfigBloqueo
);

router.put('/config/bloqueo',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  registrarAuditoria('SISTEMA', 'ACTUALIZAR_CONFIG'),
  usuarioController.actualizarConfigBloqueo
);

// ══════════════════════════════════════════
//  USUARIOS — rutas fijas ANTES de las con :id
// ══════════════════════════════════════════

router.post('/usuarios', usuarioController.crearUsuario);
router.post("/usuarios/login", authenticateIfPresent, registrarAuditoria('USUARIOS', 'LOGIN'), usuarioController.loginUsuario);
router.post("/usuarios/login/exito", authenticateIfPresent, registrarAuditoria('USUARIOS', 'LOGIN'), usuarioController.reiniciarIntentos);
router.post("/usuarios/login/fallo", usuarioController.registrarIntentoFallido);

router.post('/usuarios/google-acceso',
  authenticateIfPresent,
  registrarAuditoria('USUARIOS', 'LOGIN'),
  usuarioController.loginOCrearSolicitudGoogle
);

router.post('/usuarios/logout',
  authenticateUser,
  registrarAuditoria('USUARIOS', 'LOGOUT'),
  async (req, res) => {
    try {
      const userId = req.user._id;
      await Auth.findByIdAndUpdate(userId, { loggedIn: false });
      res.status(200).json({ message: "Sesión cerrada correctamente" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error al cerrar sesión" });
    }
  }
);

router.patch('/solicitudes/:id/reabrir',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('SOLICITUDES'),
  registrarAuditoria('SOLICITUDES'),
  solicitudController.reabrirSolicitud
);

router.get('/usuarios/mi-perfil', authenticateUser, async (req, res) => {
  try {
    const usuario = req.user;
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json({
      debe_cambiar_password: usuario.debe_cambiar_password,
      roles:  usuario.roles,
      estado: usuario.estado
    });
  } catch (err) {
    res.status(500).json({ message: 'Error.' });
  }
});

router.patch('/usuarios/password-cambiado', authenticateUser, async (req, res) => {
  try {
    await Usuario.findByIdAndUpdate(
      req.user._id,
      { debe_cambiar_password: false }
    );
    res.json({ message: 'Flag actualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar.' });
  }
});

router.get("/usuarios/role", authenticateUser, (req, res) => {
  res.json({ role: req.user.roles[0] });
});

router.get('/usuarios/reportes',
  authenticateUser,
  checkAccess({
    roles: ['ADMIN'],
    permisos: ['VER_REPORTES', 'GENERAR_REPORTES'],
    mode: 'OR'
  }),
  (req, res) => {
    res.json({ message: 'Acceso a reportes permitido' });
  }
);

router.get('/usuarios',
  authenticateUser,
  checkPermission('VISUALIZAR_SEGURIDAD'),
  usuarioController.listarUsuario
);

// ══════════════════════════════════════════
//  USUARIOS — rutas con :id AL FINAL
// ══════════════════════════════════════════

router.put('/usuarios/:id/rol',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  usuarioController.asignarRol
);

// ── Actualizar username ──
router.patch('/usuarios/:id/username',
  authenticateUser,
  checkPermission('ACTUALIZAR_USUARIOS'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  usuarioController.actualizarUsername
);

router.patch('/usuarios/:id/bloquear',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  solicitudController.bloquearUsuario
);

router.patch('/usuarios/:id/desbloquear',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  solicitudController.desbloquearUsuario
);

router.delete('/usuarios/:id',
  authenticateUser,
  checkPermission('ELIMINAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  usuarioController.eliminarUsuario
);

router.patch('/usuarios/:id/asignacion',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  usuarioController.actualizarAsignacion
);

module.exports = router;