const express = require('express');
const router = express.Router();
const Auth = require("../Models/usuario_modelo");
const Usuario = require("../Models/usuario_modelo"); // ← faltaba este import
const usuarioController = require('../Controllers/usuario_controller');
const { authenticateUser } = require('../middleware/authMiddleWare');
const { checkRole, checkAccess } = require('../middleware/checkRole');
const { checkPermission } = require('../middleware/checkPermission');
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const solicitudController = require('../Controllers/solicitud_controller');

// ══════════════════════════════════════════
//  SOLICITUDES
// ══════════════════════════════════════════

// Crear solicitud (público, sin token)
router.post('/solicitudes', solicitudController.crearSolicitud);

// Listar solicitudes — admin
router.get('/solicitudes',
  authenticateUser,
  checkPermission('VISUALIZAR_SEGURIDAD'),
  solicitudController.listarSolicitudes
);

// Aprobar o denegar solicitud — admin
router.patch('/solicitudes/:id/resolver',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  
  solicitudController.resolverSolicitud
);

// ══════════════════════════════════════════
//  USUARIOS — rutas fijas ANTES de las con :id
// ══════════════════════════════════════════

// Crear usuario (público)
router.post('/usuarios', usuarioController.crearUsuario);

// Login y variantes — DEBEN ir antes de /usuarios/:id
router.post("/usuarios/login", registrarAuditoria('USUARIOS', 'LOGIN'), usuarioController.loginUsuario);
router.post("/usuarios/login/fallo", usuarioController.registrarIntentoFallido);
router.post("/usuarios/login/exito", registrarAuditoria('USUARIOS', 'LOGIN'), usuarioController.reiniciarIntentos);
// Verificar acceso Google (público, se llama antes de navegar)
router.post('/usuarios/google-acceso', usuarioController.loginOCrearSolicitudGoogle);
// Logout
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
// Perfil del usuario actual — ANTES de /usuarios/:id
router.get('/usuarios/mi-perfil', authenticateUser, async (req, res) => {
  try {
    // ✅ req.user ya ES el usuario de MongoDB, no necesitas buscarlo
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
// Marcar password cambiado — ANTES de /usuarios/:id
router.patch('/usuarios/password-cambiado', authenticateUser, async (req, res) => {
  try {
    // ✅ usar req.user._id en lugar de buscar por authId
    await Usuario.findByIdAndUpdate(
      req.user._id,
      { debe_cambiar_password: false }
    );
    res.json({ message: 'Flag actualizado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar.' });
  }
});

// Obtener rol del usuario actual — ANTES de /usuarios/:id
router.get("/usuarios/role", authenticateUser, (req, res) => {
  res.json({ role: req.user.roles[0] });
});

// Reportes — ANTES de /usuarios/:id
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

// Listar todos los usuarios
router.get('/usuarios',
  authenticateUser,
  checkPermission('VISUALIZAR_SEGURIDAD'),
  usuarioController.listarUsuario
);

// ══════════════════════════════════════════
//  USUARIOS — rutas con :id AL FINAL
// ══════════════════════════════════════════

// Asignar rol
router.put('/usuarios/:id/rol',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'),
  registrarAuditoria('USUARIOS'),
  usuarioController.asignarRol
);

// Bloquear usuario
router.patch('/usuarios/:id/bloquear',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'), // ✅ agrega esto
  registrarAuditoria('USUARIOS'),
  solicitudController.bloquearUsuario
);

// Desbloquear usuario
router.patch('/usuarios/:id/desbloquear',
  authenticateUser,
  checkPermission('ACTUALIZAR_SEGURIDAD'),
  capturarDatosPrevios('USUARIOS'), // ✅ agrega esto
  registrarAuditoria('USUARIOS'),
  solicitudController.desbloquearUsuario
);

// Eliminar usuario
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