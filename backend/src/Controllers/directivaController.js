const Directiva = require('../Models/directivaModel');
const mongoose = require('mongoose');
const { google } = require("googleapis");
const { PassThrough } = require("stream");
const Auditoria = require("../Models/Auditoria");

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

// Función auxiliar para detectar cambios específicos
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
  if (!objetoAnterior || !objetoNuevo) return { cambios: null, descripcion: '' };
  
  const cambios = {};
  const camposIgnorar = ['_id', '__v', 'createdAt', 'updatedAt', 'documentos_pdf', 'historial_cargos', 'sesiones_asistidas'];
  
  // Obtener todos los campos únicos
  const todosLosCampos = new Set([
    ...Object.keys(objetoAnterior),
    ...Object.keys(objetoNuevo)
  ]);
  
  for (const campo of todosLosCampos) {
    if (camposIgnorar.includes(campo)) continue;
    
    const valorAnterior = objetoAnterior[campo];
    const valorNuevo = objetoNuevo[campo];
    
    // Comparar valores (manejar undefined, null, objetos)
    if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
      cambios[campo] = {
        anterior: valorAnterior || 'vacío',
        nuevo: valorNuevo || 'vacío'
      };
    }
  }
  
  // Crear descripción legible
  const camposModificados = Object.keys(cambios);
  let descripcion = '';
  
  if (camposModificados.length > 0) {
    descripcion = camposModificados.map(campo => {
      const cambio = cambios[campo];
      // Truncar valores largos
      const anterior = String(cambio.anterior).substring(0, 50);
      const nuevo = String(cambio.nuevo).substring(0, 50);
      return `${campo}: "${anterior}" → "${nuevo}"`;
    }).join('; ');
  }
  
  return { cambios, descripcion };
};

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
    console.log('🚀 Iniciando creación de miembro de directiva...');

    const miembro = new Directiva(req.body);
    const nuevoMiembro = await miembro.save();

    // Crear descripción detallada
    const camposPrincipales = ['nombre', 'cargo', 'email', 'empresa', 'estado']
      .filter(c => nuevoMiembro[c])
      .map(c => `${c}=${nuevoMiembro[c]}`)
      .join(', ');
    
    const descripcionDetallada = `Miembro de directiva creado: ${camposPrincipales}`;

    // RESPUESTA EXITOSA
    res.status(201).json({
      success: true,
      message: 'Miembro de la directiva creado exitosamente',
      data: nuevoMiembro
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
    

  } catch (error) {
    console.error('❌ Error en crearMiembroDirectiva:', error);
    
    // AUDITORÍA DE ERROR
    

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
    console.log('🔄 Iniciando actualización de miembro de directiva...');

    // Obtener el miembro antes de actualizar (para auditoría)
    const miembroAnterior = await Directiva.findById(req.params.id);
    
    if (!miembroAnterior) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    // ===== PREPARAR DATOS PARA AUDITORÍA =====
    const miembroAnteriorObj = miembroAnterior.toObject ? miembroAnterior.toObject() : miembroAnterior;
    
    // Crear versiones modificadas para auditoría (sin arrays complejos)
    const datosPreviosLimpios = { ...miembroAnteriorObj };
    delete datosPreviosLimpios.documentos_pdf;
    delete datosPreviosLimpios.historial_cargos;
    delete datosPreviosLimpios.sesiones_asistidas;
    delete datosPreviosLimpios.__v;
    delete datosPreviosLimpios.createdAt;
    delete datosPreviosLimpios.updatedAt;

    const datosNuevosLimpios = { ...req.body };
    // =========================================

    // Detectar cambios
    const { cambios, descripcion } = detectarCambiosEspecificos(datosPreviosLimpios, datosNuevosLimpios);

    // Actualizar en la base de datos
    const miembroActualizado = await Directiva.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    // RESPUESTA EXITOSA
    res.json({
      success: true,
      message: 'Miembro de la directiva actualizado exitosamente',
      data: miembroActualizado
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
    

  } catch (error) {
    console.error('❌ Error en actualizarMiembroDirectiva:', error);
    
    // AUDITORÍA DE ERROR
   

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
    // Obtener el miembro antes de eliminar (para auditoría)
    const miembroEliminado = await Directiva.findById(req.params.id);

    if (!miembroEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Miembro de la directiva no encontrado'
      });
    }

    // Guardar datos importantes antes de eliminar
    const datosEliminados = {
      id: miembroEliminado._id,
      nombre: miembroEliminado.nombre,
      cargo: miembroEliminado.cargo,
      email: miembroEliminado.email,
      empresa: miembroEliminado.empresa,
      estado: miembroEliminado.estado,
      total_documentos: miembroEliminado.documentos_pdf?.length || 0
    };

    // Eliminar documentos de Google Drive antes de eliminar el miembro
    for (const documento of miembroEliminado.documentos_pdf || []) {
      if (documento.driveFileId) {
        try {
          await drive.files.delete({ fileId: documento.driveFileId });
        } catch (error) {
          console.error(`Error eliminando archivo de Drive: ${documento.driveFileId}`, error);
        }
      }
    }

    await Directiva.findByIdAndDelete(req.params.id);

    // RESPUESTA EXITOSA
    res.json({
      success: true,
      message: 'Miembro de la directiva eliminado exitosamente',
      data: { id: req.params.id }
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
    

  } catch (error) {
    console.error('❌ Error en eliminarMiembroDirectiva:', error);
    
    // AUDITORÍA DE ERROR
    

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

    // Obtener el miembro actualizado para obtener el ID del documento
    const miembroActualizado = await Directiva.findById(req.params.id);
    const documentoAgregado = miembroActualizado.documentos_pdf[miembroActualizado.documentos_pdf.length - 1];

    // RESPUESTA EXITOSA
    res.json({
      success: true,
      message: 'Documento agregado exitosamente',
      data: {
        documento: documentoData,
        documentoId: documentoAgregado._id,
        driveInfo: {
          fileId: response.data.id,
          viewLink: response.data.webViewLink,
          downloadLink: downloadLink
        }
      }
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
    

  } catch (error) {
    console.error('Error al agregar documento:', error);
    
    // AUDITORÍA DE ERROR
    

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

    const documentoAnterior = { ...miembro.documentos_pdf[documentoIndex].toObject() };
    const documento = miembro.documentos_pdf[documentoIndex];
    
    // Guardar cambios para auditoría
    const cambios = {};

    // Actualizar datos básicos
    if (req.body.nombre_archivo) {
      cambios.nombre_archivo = {
        anterior: documento.nombre_archivo,
        nuevo: req.body.nombre_archivo
      };
      miembro.documentos_pdf[documentoIndex].nombre_archivo = req.body.nombre_archivo;
    }
    if (req.body.tipo_documento) {
      cambios.tipo_documento = {
        anterior: documento.tipo_documento,
        nuevo: req.body.tipo_documento
      };
      miembro.documentos_pdf[documentoIndex].tipo_documento = req.body.tipo_documento;
    }
    if (req.body.descripcion !== undefined) {
      cambios.descripcion = {
        anterior: documento.descripcion || 'vacío',
        nuevo: req.body.descripcion || 'vacío'
      };
      miembro.documentos_pdf[documentoIndex].descripcion = req.body.descripcion;
    }
    if (req.body.numero_sesion !== undefined) {
      cambios.numero_sesion = {
        anterior: documento.numero_sesion || 'vacío',
        nuevo: req.body.numero_sesion || 'vacío'
      };
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

      cambios.archivo = {
        anterior: documento.nombre_archivo_original || 'archivo anterior',
        nuevo: req.file.originalname
      };

      // Actualizar información del documento
      miembro.documentos_pdf[documentoIndex].driveFileId = response.data.id;
      miembro.documentos_pdf[documentoIndex].driveViewLink = response.data.webViewLink;
      miembro.documentos_pdf[documentoIndex].driveDownloadLink = downloadLink;
      miembro.documentos_pdf[documentoIndex].tamano_kb = Math.round(req.file.size / 1024);
      miembro.documentos_pdf[documentoIndex].nombre_archivo_original = req.file.originalname;
      miembro.documentos_pdf[documentoIndex].fecha_subida = new Date();
    }

    await miembro.save();

    // Crear descripción de cambios
    const descripcionCambios = Object.keys(cambios).map(campo => {
      const cambio = cambios[campo];
      return `${campo}: "${cambio.anterior}" → "${cambio.nuevo}"`;
    }).join('; ');

    // RESPUESTA EXITOSA
    res.json({
      success: true,
      message: 'Documento actualizado exitosamente'
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
    

  } catch (error) {
    console.error('Error al actualizar documento:', error);
    
    // AUDITORÍA DE ERROR
    

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

    // Guardar datos del documento para auditoría
    const datosDocumento = {
      id: documento._id,
      nombre_archivo: documento.nombre_archivo,
      tipo_documento: documento.tipo_documento,
      driveFileId: documento.driveFileId,
      tamano_kb: documento.tamano_kb
    };

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

    // RESPUESTA EXITOSA
    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

    // AUDITORÍA: Registrar después de enviar la respuesta
   

  } catch (error) {
    console.error('Error al eliminar documento:', error);
    
    // AUDITORÍA DE ERROR
    

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