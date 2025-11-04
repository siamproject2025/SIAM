// controllers/matriculaController.js
const Estudiante = require('../Models/Estudiante');
const multer = require('multer');
const sharp = require('sharp');

// Configuración de multer para guardar archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Middleware para rutas POST/PUT
exports.upload = upload.single('foto'); // nombre del input en el frontend

// -------------------
// Crear matrícula
// -------------------
exports.crearMatricula = async (req, res) => {
  try {
    // Generar siguiente ID si tu modelo lo requiere
  

    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log('🟢 Archivo recibido, procesando con Sharp...');

      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });

      if (['image/png', 'image/jpeg'].includes(req.file.mimetype)) {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      } else if (req.file.mimetype === 'image/webp') {
        const processedBuffer = await imageSharp.webp({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/webp';
      } else {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      }

      console.log(`✅ Imagen procesada, tamaño aproximado: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    const estudianteData = {
      ...req.body,
      
      imagen: imagenBase64,
      tipo_imagen: tipoImagen
    };

    const estudiante = await Estudiante.create(estudianteData);

    res.status(201).json({
      success: true,
      message: 'Matrícula creada exitosamente',
      data: estudiante
    });
  } catch (error) {
    console.error('❌ Error en crearMatricula:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la matrícula',
      error: error.message
    });
  }
};

// -------------------
// Obtener todas las matrículas
// -------------------
exports.getAllMatriculas = async (req, res) => {
  try {
    const estudiantes = await Estudiante.find().sort({ fecha_creacion: -1 });
    res.status(200).json({
      success: true,
      count: estudiantes.length,
      data: estudiantes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las matrículas',
      error: error.message
    });
  }
};

// -------------------
// Obtener matrícula por ID
// -------------------
exports.getMatriculaById = async (req, res) => {
  try {
    const estudiante = await Estudiante.findOne({ _id: req.params.id });

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: estudiante
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la matrícula',
      error: error.message
    });
  }
};

// -------------------
// Actualizar matrícula
// -------------------
exports.updateMatricula = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      const MAX_WIDTH = 600;
      const MAX_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true
      });

      const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
      updateData.imagen = processedBuffer.toString('base64');
      updateData.tipo_imagen = 'image/jpeg';
    }

    const estudiante = await Estudiante.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Matrícula actualizada exitosamente',
      data: estudiante
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar la matrícula',
      error: error.message
    });
  }
};

// -------------------
// Eliminar matrícula
// -------------------
exports.deleteMatricula = async (req, res) => {
  try {
    const estudiante = await Estudiante.findOneAndDelete({ _id: req.params.id });

    if (!estudiante) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Matrícula eliminada exitosamente',
      data: estudiante
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la matrícula',
      error: error.message
    });
  }
};
