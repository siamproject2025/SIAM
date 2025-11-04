const express = require('express');
const router = express.Router();
const {
  obtenerMiembrosDirectiva,
  obtenerMiembroPorId,
  crearMiembroDirectiva,
  actualizarMiembroDirectiva,
  eliminarMiembroDirectiva,
  agregarDocumento,
  obtenerEstadisticas
} = require('../Controllers/directivaController');

// Rutas principales
router.route('/')
  .get(obtenerMiembrosDirectiva)    // Obtener todos los miembros
  .post(crearMiembroDirectiva);     // Crear nuevo miembro

// Rutas para estadísticas
router.route('/estadisticas/estados')
  .get(obtenerEstadisticas);        // Obtener estadísticas por estado

// Rutas con ID
router.route('/:id')
  .get(obtenerMiembroPorId)         // Obtener miembro por ID
  .put(actualizarMiembroDirectiva)  // Actualizar miembro
  .delete(eliminarMiembroDirectiva); // Eliminar miembro

// Ruta para documentos
router.route('/:id/documentos')
  .post(agregarDocumento);          // Agregar documento a miembro

module.exports = router;