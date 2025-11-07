// controllers/donacionesController.js
const Donacion = require('../Models/DonacionesModel');

// Obtener todas las donaciones
exports.getAllDonaciones = async (req, res) => {
  try {
    const donaciones = await Donacion.find().sort({ fecha: -1 });
    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las donaciones',
      error: error.message
    });
  }
};

// Obtener una donación por ID
exports.getDonacionById = async (req, res) => {
  try {
    const donacion = await Donacion.findOne({ id_donacion: req.params.id });
    
    if (!donacion) {
      return res.status(404).json({
        success: false,
        message: 'Donación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: donacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la donación',
      error: error.message
    });
  }
};

// Crear una nueva donación
exports.createDonacion = async (req, res) => {
  try {
    // Generar el siguiente ID automáticamente
    const nextId = await Donacion.getNextId();
    
    const donacionData = {
      ...req.body,
      id_donacion: nextId
    };

    const donacion = await Donacion.create(donacionData);

    res.status(201).json({
      success: true,
      message: 'Donación creada exitosamente',
      data: donacion
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear la donación',
      error: error.message
    });
  }
};

// Actualizar una donación
exports.updateDonacion = async (req, res) => {
  try {
    const donacion = await Donacion.findOneAndUpdate(
      { id_donacion: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!donacion) {
      return res.status(404).json({
        success: false,
        message: 'Donación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donación actualizada exitosamente',
      data: donacion
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la donación',
      error: error.message
    });
  }
};

// Eliminar una donación
exports.deleteDonacion = async (req, res) => {
  try {
    const donacion = await Donacion.findOneAndDelete({ id_donacion: req.params.id });

    if (!donacion) {
      return res.status(404).json({
        success: false,
        message: 'Donación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Donación eliminada exitosamente',
      data: donacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la donación',
      error: error.message
    });
  }
};

// Obtener donaciones por almacén
exports.getDonacionesByAlmacen = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ id_almacen: req.params.id_almacen }).sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las donaciones del almacén',
      error: error.message
    });
  }
};

// Obtener donaciones por tipo
exports.getDonacionesByTipo = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ tipo_donacion: req.params.tipo }).sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las donaciones por tipo',
      error: error.message
    });
  }
};

// Obtener estadísticas de donaciones
exports.getEstadisticasDonaciones = async (req, res) => {
  try {
    const stats = await Donacion.aggregate([
      {
        $group: {
          _id: '$tipo_donacion',
          total: { $sum: '$cantidad_donacion' },
          cantidad_donaciones: { $sum: 1 },
          promedio: { $avg: '$cantidad_donacion' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
};