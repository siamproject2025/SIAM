const Bien = require("../Models/Bien");
const sharp = require('sharp');


// Obtener todos los bienes
exports.getBienes = async (req, res) => {
  try {
    const bienes = await Bien.find();
    res.json(bienes);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener bienes", error });
  }
};

// Obtener un bien por ID
exports.getBienById = async (req, res) => {
  try {
    const bien = await Bien.findById(req.params.id);
    if (!bien) return res.status(404).json({ message: "Bien no encontrado" });
    res.json(bien);
  } catch (error) {
    res.status(500).json({ message: "Error al buscar el bien", error });
  }
};

// Crear nuevo bien

exports.createBien = async (req, res) => {
  try {
    console.log('🟢 Iniciando creación de bien...');

    // 🔹 Procesar imagen (si viene en el FormData)
    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log('🟢 Archivo recibido, procesando con Sharp...');

      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });

      // Convertir a formato adecuado y optimizar
      if (req.file.mimetype === 'image/png' || req.file.mimetype === 'image/jpeg') {
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      } else if (req.file.mimetype === 'image/webp') {
        const processedBuffer = await imageSharp.webp({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/webp';
      } else {
        // Para otros tipos, convertir a JPEG por defecto
        const processedBuffer = await imageSharp.jpeg({ quality: QUALITY }).toBuffer();
        imagenBase64 = processedBuffer.toString('base64');
        tipoImagen = 'image/jpeg';
      }

      console.log(`✅ Imagen procesada, tamaño aproximado: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // 🔹 Convertir tipos de datos del body
    //if (req.body.valor !== undefined) req.body.valor = parseFloat(req.body.valor);
    //if (req.body.fechaIngreso) req.body.fechaIngreso = new Date(req.body.fechaIngreso);

    // 🔹 Crear el objeto con los datos del bien
    const bienData = {
      ...req.body,
      imagen: imagenBase64,
      tipo_imagen: tipoImagen,
    };

    // 🔹 Guardar en la base de datos
    
    const bien = await Bien.create(bienData);
    res.status(201).json({
      success: true,
      message: 'Bien creado exitosamente',
      data: bien,
    });

   

  } catch (error) {
    console.error('❌ Error en createBien:', error);
    
    res.status(400).json({
      success: false,
      message: 'Error al crear el bien',
      error: error.message,
    });
  }
};


// Actualizar bien
exports.updateBien = async (req, res) => {
  try {
    console.log('🟢 Iniciando actualización de bien...');

    // 🔹 Procesar imagen si viene en el FormData
    let imagenBase64 = null;
    let tipoImagen = null;

    if (req.file) {
      console.log('🟢 Archivo recibido, procesando con Sharp...');

      const TARGET_WIDTH = 600;
      const TARGET_HEIGHT = 600;
      const QUALITY = 60;

      let imageSharp = sharp(req.file.buffer).resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'inside' });

      if (req.file.mimetype === 'image/png' || req.file.mimetype === 'image/jpeg') {
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

    // 🔹 Convertir tipos de datos del body
    if (req.body.valor !== undefined) req.body.valor = parseFloat(req.body.valor);
    if (req.body.fechaIngreso) req.body.fechaIngreso = new Date(req.body.fechaIngreso);

    // 🔹 Crear objeto final para actualizar
    const bienData = {
      ...req.body,
      ...(imagenBase64 && { imagen: imagenBase64, tipo_imagen: tipoImagen }),
    };

    // 🔹 Actualizar en la base de datos
    const bienActualizado = await Bien.findByIdAndUpdate(req.params.id, bienData, { new: true });
    if (!bienActualizado) return res.status(404).json({ message: "Bien no encontrado" });

    res.status(200).json({
      success: true,
      message: 'Bien actualizado exitosamente',
      data: bienActualizado,
    });

  } catch (error) {
    console.error('❌ Error en updateBien:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar el bien',
      error: error.message,
    });
  }
};


// Eliminar bien
exports.deleteBien = async (req, res) => {
  try {
    const bienEliminado = await Bien.findByIdAndDelete(req.params.id);
    if (!bienEliminado) return res.status(404).json({ message: "Bien no encontrado" });
    res.json({ message: "Bien eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el bien", error });
  }
};
