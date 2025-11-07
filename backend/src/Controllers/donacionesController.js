// controllers/donacionesController.js
const Donacion = require('../Models/donacionesModel');
const multer = require('multer');
const sharp = require('sharp');

// Configuración de multer para guardar archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Ruta para usar en Express (ejemplo)
// app.post('/donaciones', upload.single('imagen'), createDonacion);

// Función auxiliar para procesar imágenes
const procesarImagen = async (buffer, mimetype) => {
  try {
    console.log('🟢 Procesando imagen con Sharp...');

    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    const QUALITY = 80;
    const MAX_SIZE_MB = 2;

    // Configuración optimizada de Sharp
    let imageProcessor = sharp(buffer)
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true, // No agrandar imágenes pequeñas
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Fondo blanco para PNG transparentes
      })
      .jpeg({ 
        quality: QUALITY,
        mozjpeg: true, // Mejor compresión
        chromaSubsampling: '4:4:4' // Mejor calidad de color
      });

    // Mantener formato WebP si originalmente era WebP
    if (mimetype === 'image/webp') {
      imageProcessor = sharp(buffer)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: QUALITY });
    }

    const processedBuffer = await imageProcessor.toBuffer();

    // Verificar tamaño resultante
    const bufferSizeMB = processedBuffer.length / (1024 * 1024);
    if (bufferSizeMB > MAX_SIZE_MB) {
      console.warn(`⚠️ Imagen comprimida pero aún grande: ${bufferSizeMB.toFixed(2)}MB`);
    }

    console.log(`✅ Imagen procesada: ${(bufferSizeMB).toFixed(2)} MB`);

    return {
      imagenBase64: processedBuffer.toString('base64'),
      tipoImagen: mimetype === 'image/webp' ? 'image/webp' : 'image/jpeg'
    };

  } catch (error) {
    console.error('❌ Error procesando imagen:', error);
    throw new Error('Error al procesar la imagen: ' + error.message);
  }
};

exports.createDonacion = async (req, res) => {
  try {
    const nextId = await Donacion.getNextId();

    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      const resultadoImagen = await procesarImagen(req.file.buffer, req.file.mimetype);
      imagenBase64 = resultadoImagen.imagenBase64;
      tipoImagen = resultadoImagen.tipoImagen;
    }

    const donacionData = {
      ...req.body,
      id_donacion: nextId,
      imagen: imagenBase64,
      tipo_imagen: tipoImagen,
      // Si también quieres usar foto_principal con URL
      foto_principal: req.body.foto_principal || null
    };

    const donacion = await Donacion.create(donacionData);

    // No enviar la imagen Base64 en la respuesta para evitar payload grande
    const donacionResponse = donacion.toObject();
    delete donacionResponse.imagen;
    delete donacionResponse.tipo_imagen;

    res.status(201).json({
      success: true,
      message: 'Donación creada exitosamente',
      data: donacionResponse
    });
  } catch (error) {
    console.error('❌ Error en createDonacion:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la donación',
      error: error.message
    });
  }
};

// Obtener todas las donaciones (sin imágenes para optimizar)
exports.getAllDonaciones = async (req, res) => {
  try {
    const donaciones = await Donacion.find()
      .select('-imagen -tipo_imagen') // Excluir campos de imagen para optimizar
      .sort({ fecha: -1 });
    
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

// Obtener una donación por ID (con imagen opcional)
exports.getDonacionById = async (req, res) => {
  try {
    const includeImage = req.query.includeImage === 'true';
    
    let query = Donacion.findOne({ id_donacion: req.params.id });
    
    if (!includeImage) {
      query = query.select('-imagen -tipo_imagen');
    }
    
    const donacion = await query;

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

// Obtener solo la imagen de una donación
exports.getImagenDonacion = async (req, res) => {
  try {
    const donacion = await Donacion.findOne(
      { id_donacion: req.params.id },
      { imagen: 1, tipo_imagen: 1, _id: 0 }
    );

    if (!donacion || !donacion.imagen) {
      return res.status(404).json({
        success: false,
        message: 'Imagen no encontrada'
      });
    }

    // Convertir Base64 a buffer para enviar como imagen
    const imageBuffer = Buffer.from(donacion.imagen, 'base64');
    
    res.set('Content-Type', donacion.tipo_imagen);
    res.set('Content-Length', imageBuffer.length);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache de 1 día
    
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la imagen',
      error: error.message
    });
  }
};

// Actualizar una donación
exports.updateDonacion = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const resultadoImagen = await procesarImagen(req.file.buffer, req.file.mimetype);
      updateData.imagen = resultadoImagen.imagenBase64;
      updateData.tipo_imagen = resultadoImagen.tipoImagen;
    }

    const donacion = await Donacion.findOneAndUpdate(
      { id_donacion: req.params.id },
      updateData,
      { new: true, runValidators: true }
    ).select('-imagen -tipo_imagen'); // Excluir imagen en respuesta

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
      data: {
        id_donacion: donacion.id_donacion,
        tipo_donacion: donacion.tipo_donacion
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la donación',
      error: error.message
    });
  }
};

// Obtener donaciones por almacén (sin imágenes)
exports.getDonacionesByAlmacen = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ id_almacen: req.params.id_almacen })
      .select('-imagen -tipo_imagen')
      .sort({ fecha: -1 });

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

// Obtener donaciones por tipo (sin imágenes)
exports.getDonacionesByTipo = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ tipo_donacion: req.params.tipo })
      .select('-imagen -tipo_imagen')
      .sort({ fecha: -1 });

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

// Middleware para manejar errores de multer
exports.handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB permitido.'
      });
    }
  }
  next(error);
};

module.exports = exports;