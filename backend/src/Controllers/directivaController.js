const Directiva = require('../Models/directivaModel');
const mongoose = require('mongoose');
const { google } = require("googleapis");
const { PassThrough } = require("stream");
const path = require("path");
require("dotenv").config();

// Configuración de OAuth2 para Google Drive
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/oauth2callback"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oAuth2Client });

// @desc    Obtener todos los miembros de la directiva
// @route   GET /api/directiva
// @access  Public
const obtenerMiembrosDirectiva = async (req, res) => {
  try {
    const { estado, cargo } = req.query;
    let filtro = {};

    if (estado) filtro.estado = estado;
    if (cargo) filtro.cargo = { $regex: cargo, $options: 'i' };

    const miembros = await Directiva.find(filtro)
      .sort({ nombre: 1 });

    res.json({
      success: true,
      count: miembros.length,
      data: miembros
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener los miembros de la directiva',
      error: error.message
    });
  }
};

// @desc    Obtener un miembro de la directiva por ID
// @route   GET /api/directiva/:id
// @access  Public
const obtenerMiembroPorId = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    res.json({
      success: true,
      data: miembro
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al obtener el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo miembro de la directiva
// @route   POST /api/directiva
// @access  Public
const crearMiembroDirectiva = async (req, res) => {
  try {
    const miembro = new Directiva(req.body);
    const nuevoMiembro = await miembro.save();

    res.status(201).json({
      success: true,
      message: 'Miembro de la directiva creado exitosamente',
      data: nuevoMiembro
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Actualizar un miembro de la directiva
// @route   PUT /api/directiva/:id
// @access  Public
const actualizarMiembroDirectiva = async (req, res) => {
  try {
    const miembro = await Directiva.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Miembro de la directiva actualizado exitosamente',
      data: miembro
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Eliminar un miembro de la directiva
// @route   DELETE /api/directiva/:id
// @access  Public
const eliminarMiembroDirectiva = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    // Eliminar documentos de Google Drive antes de eliminar el miembro
    for (const documento of miembro.documentos_pdf) {
      if (documento.driveFileId) {
        try {
          await drive.files.delete({ fileId: documento.driveFileId });
        } catch (error) {
          console.error(`Error eliminando archivo de Drive: ${documento.driveFileId}`, error);
        }
      }
    }

    await Directiva.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Miembro de la directiva eliminado exitosamente',
      data: miembro
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el miembro de la directiva',
      error: error.message
    });
  }
};

// @desc    Agregar documento PDF a un miembro (CON GOOGLE DRIVE)
// @route   POST /api/directiva/:id/documentos
// @access  Public
const agregarDocumento = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado un archivo PDF'
      });
    }

    // Validar que sea un PDF
    if (!req.file.mimetype.startsWith('application/pdf')) {
      return res.status(400).json({
        success: false,
        message: 'El archivo debe ser un PDF'
      });
    }

    // Validar tamaño del archivo (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'El archivo no debe exceder los 10MB'
      });
    }

    // Import dinámico compatible con CommonJS
    const { v4: uuidv4 } = await import("uuid");

    const fileMetadata = {
      name: `${uuidv4()}-${req.file.originalname}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: (() => {
        const stream = new PassThrough();
        stream.end(req.file.buffer);
        return stream;
      })(),
    };

    // Subir a Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Obtener enlace de descarga directa
    const downloadLink = `https://drive.google.com/uc?export=download&id=${response.data.id}`;

    const documentoData = {
      nombre_archivo: req.body.nombre_archivo || req.file.originalname,
      tipo_documento: req.body.tipo_documento || 'otro',
      descripcion: req.body.descripcion || '',
      numero_sesion: req.body.numero_sesion || '',
      fecha_subida: new Date(),
      driveFileId: response.data.id,
      driveViewLink: response.data.webViewLink,
      driveDownloadLink: downloadLink,
      tamano_kb: Math.round(req.file.size / 1024),
      nombre_archivo_original: req.file.originalname
    };

    await miembro.agregarDocumento(documentoData);

    res.json({
      success: true,
      message: 'Documento agregado exitosamente',
      data: {
        documento: documentoData,
        driveInfo: {
          fileId: response.data.id,
          viewLink: response.data.webViewLink,
          downloadLink: downloadLink
        }
      }
    });
  } catch (error) {
    console.error('Error al agregar documento:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al agregar el documento',
      error: error.message
    });
  }
};

// @desc    Actualizar documento PDF de un miembro
// @route   PUT /api/directiva/:id/documentos/:documentoId
// @access  Public
const actualizarDocumento = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    const documentoIndex = miembro.documentos_pdf.findIndex(
      doc => doc._id.toString() === req.params.documentoId
    );

    if (documentoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    const documento = miembro.documentos_pdf[documentoIndex];

    // Actualizar datos básicos
    if (req.body.nombre_archivo) {
      miembro.documentos_pdf[documentoIndex].nombre_archivo = req.body.nombre_archivo;
    }
    if (req.body.tipo_documento) {
      miembro.documentos_pdf[documentoIndex].tipo_documento = req.body.tipo_documento;
    }
    if (req.body.descripcion !== undefined) {
      miembro.documentos_pdf[documentoIndex].descripcion = req.body.descripcion;
    }
    if (req.body.numero_sesion !== undefined) {
      miembro.documentos_pdf[documentoIndex].numero_sesion = req.body.numero_sesion;
    }

    // Actualizar archivo si se proporciona uno nuevo
    if (req.file) {
      // Validar nuevo archivo
      if (!req.file.mimetype.startsWith('application/pdf')) {
        return res.status(400).json({
          success: false,
          message: 'El archivo debe ser un PDF'
        });
      }

      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'El archivo no debe exceder los 10MB'
        });
      }

      // Eliminar archivo anterior de Drive si existe
      if (documento.driveFileId) {
        try {
          await drive.files.delete({ fileId: documento.driveFileId });
        } catch (error) {
          console.error('Error eliminando archivo anterior de Drive:', error);
        }
      }

      // Subir nuevo archivo a Drive
      const { v4: uuidv4 } = await import("uuid");

      const fileMetadata = {
        name: `${uuidv4()}-${req.file.originalname}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: req.file.mimetype,
        body: (() => {
          const stream = new PassThrough();
          stream.end(req.file.buffer);
          return stream;
        })(),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: "id, webViewLink, webContentLink",
      });

      // Hacer el archivo público
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      const downloadLink = `https://drive.google.com/uc?export=download&id=${response.data.id}`;

      // Actualizar información del documento
      miembro.documentos_pdf[documentoIndex].driveFileId = response.data.id;
      miembro.documentos_pdf[documentoIndex].driveViewLink = response.data.webViewLink;
      miembro.documentos_pdf[documentoIndex].driveDownloadLink = downloadLink;
      miembro.documentos_pdf[documentoIndex].tamano_kb = Math.round(req.file.size / 1024);
      miembro.documentos_pdf[documentoIndex].nombre_archivo_original = req.file.originalname;
      miembro.documentos_pdf[documentoIndex].fecha_subida = new Date();
    }

    await miembro.save();

    res.json({
      success: true,
      message: 'Documento actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    if (error.name === 'ValidationError') {
      const mensajesError = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: mensajesError
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el documento',
      error: error.message
    });
  }
};

// @desc    Eliminar documento PDF de un miembro
// @route   DELETE /api/directiva/:id/documentos/:documentoId
// @access  Public
const eliminarDocumento = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    const documento = miembro.documentos_pdf.find(
      doc => doc._id.toString() === req.params.documentoId
    );

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Eliminar archivo de Google Drive si existe
    if (documento.driveFileId) {
      try {
        await drive.files.delete({ fileId: documento.driveFileId });
      } catch (error) {
        console.error('Error eliminando archivo de Drive:', error);
      }
    }

    // Eliminar documento del array
    miembro.documentos_pdf = miembro.documentos_pdf.filter(
      doc => doc._id.toString() !== req.params.documentoId
    );

    await miembro.save();

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el documento',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de la directiva
// @route   GET /api/directiva/estadisticas/estados
// @access  Public
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await Directiva.aggregate([
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Directiva.countDocuments();

    res.json({
      success: true,
      data: {
        estadisticas,
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  obtenerMiembrosDirectiva,
  obtenerMiembroPorId,
  crearMiembroDirectiva,
  actualizarMiembroDirectiva,
  eliminarMiembroDirectiva,
  agregarDocumento,
  actualizarDocumento,
  eliminarDocumento,
  obtenerEstadisticas
};