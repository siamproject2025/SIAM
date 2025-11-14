// controllers/donacionesController.js
const Donacion = require('../Models/donacionesModel');
const multer = require('multer');
const sharp = require('sharp');

// Configuración de multer para guardar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Ruta para usar en Express (ejemplo)
// app.post('/donaciones', upload.single('imagen'), createDonacion);

exports.createDonacion = async (req, res) => {
  try {
    const nextId = await Donacion.getNextId();

    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log(' Archivo recibido, procesando con Sharp...');

      // Procesar con Sharp
      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60; // Ajusta según lo que necesites

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });

      // Convertir a JPEG si no lo es, y aplicar calidad
      if (req.file.mimetype === 'image/png' || req.file.mimetype === 'image/jpeg') {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      } else if (req.file.mimetype === 'image/webp') {
        const processedBuffer = await imageSharp.webp({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/webp';
      } else {
        // Para otros tipos, convertir a JPEG
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      }

      console.log(` Imagen procesada, tamaño aproximado: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    const donacionData = {
      ...req.body,
      id_donacion: nextId,
      imagen: imagenBase64,
      tipo_imagen: tipoImagen
    };

    const donacion = await Donacion.create(donacionData);

    res.status(201).json({
      success: true,
      message: 'Donación creada exitosamente',
      data: donacion
    });
  } catch (error) {
    console.error(' Error en createDonacion:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la donación',
      error: error.message
    });
  }};
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



// Actualizar una donación
exports.updateDonacion = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: 'inside', // Mantiene proporción
        withoutEnlargement: true // No agranda imágenes pequeñas
      });

      const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
      updateData.imagen = processedBuffer.toString('base64');
      updateData.tipo_imagen = 'image/jpeg';
    }

    const donacion = await Donacion.findOneAndUpdate(
      { id_donacion: req.params.id },
      updateData,
      { new: true, runValidators: true }
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