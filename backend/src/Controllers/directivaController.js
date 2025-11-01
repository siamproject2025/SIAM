// controllers/directivaController.js
const Directiva = require('../Models/directivaModel');
const crypto = require('crypto');

// ============================================
// CRUD DE MIEMBROS
// ============================================

// @desc    Obtener todos los miembros de la directiva
// @route   GET /api/directiva
// @access  Public
exports.getAllMiembros = async (req, res) => {
  try {
    const { estado, cargo, page = 1, limit = 10 } = req.query;
    
    // Construir filtro
    const filter = {};
    if (estado) filter.estado = estado;
    if (cargo) filter.cargo = cargo;
    
    // Paginación
    const skip = (page - 1) * limit;
    
    // Proyección para excluir archivos binarios en listado
    const miembros = await Directiva.find(filter)
      .select('-documentos_pdf.archivo_binario')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fecha_registro: -1 });
    
    const total = await Directiva.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: miembros.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: miembros
    });
  } catch (error) {
    console.error('Error al obtener miembros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener miembros de la directiva',
      error: error.message
    });
  }
};

// @desc    Obtener un miembro por ID
// @route   GET /api/directiva/:id
// @access  Public
exports.getMiembroById = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id)
      .select('-documentos_pdf.archivo_binario');
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: miembro
    });
  } catch (error) {
    console.error('Error al obtener miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el miembro',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo miembro
// @route   POST /api/directiva
// @access  Private
exports.createMiembro = async (req, res) => {
  try {
    const { nombre, cargo, email, telefono, empresa, estado, notas } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !cargo || !email || !telefono) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporcione todos los campos requeridos: nombre, cargo, email, telefono'
      });
    }
    
    // Verificar si el email ya existe
    const miembroExistente = await Directiva.findOne({ email: email.toLowerCase() });
    if (miembroExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un miembro con ese email'
      });
    }
    
    const miembro = await Directiva.create({
      nombre,
      cargo,
      email,
      telefono,
      empresa,
      estado: estado || 'activo',
      fecha_registro: new Date(),
      documentos_pdf: [],
      historial_cargos: [{
        cargo,
        fecha_inicio: new Date(),
        fecha_fin: null
      }],
      sesiones_asistidas: [],
      notas
    });
    
    res.status(201).json({
      success: true,
      message: 'Miembro creado exitosamente',
      data: miembro
    });
  } catch (error) {
    console.error('Error al crear miembro:', error);
    
    // Manejar error de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un miembro con ese email'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear el miembro',
      error: error.message
    });
  }
};

// @desc    Actualizar un miembro
// @route   PUT /api/directiva/:id
// @access  Private
exports.updateMiembro = async (req, res) => {
  try {
    const { nombre, cargo, email, telefono, empresa, estado, notas } = req.body;
    
    const miembro = await Directiva.findById(req.params.id);
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    // Si el cargo cambió, actualizar historial
    if (cargo && cargo !== miembro.cargo) {
      // Cerrar cargo anterior
      const cargoActual = miembro.historial_cargos.find(h => !h.fecha_fin);
      if (cargoActual) {
        cargoActual.fecha_fin = new Date();
      }
      
      // Agregar nuevo cargo
      miembro.historial_cargos.push({
        cargo,
        fecha_inicio: new Date(),
        fecha_fin: null
      });
    }
    
    // Actualizar campos
    if (nombre) miembro.nombre = nombre;
    if (cargo) miembro.cargo = cargo;
    if (email) miembro.email = email;
    if (telefono) miembro.telefono = telefono;
    if (empresa !== undefined) miembro.empresa = empresa;
    if (estado) miembro.estado = estado;
    if (notas !== undefined) miembro.notas = notas;
    
    await miembro.save();
    
    res.status(200).json({
      success: true,
      message: 'Miembro actualizado exitosamente',
      data: miembro
    });
  } catch (error) {
    console.error('Error al actualizar miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el miembro',
      error: error.message
    });
  }
};

// @desc    Eliminar un miembro
// @route   DELETE /api/directiva/:id
// @access  Private
exports.deleteMiembro = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    await miembro.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Miembro eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    console.error('Error al eliminar miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el miembro',
      error: error.message
    });
  }
};

// ============================================
// GESTIÓN DE PDFs
// ============================================

// @desc    Subir un PDF a un miembro
// @route   POST /api/directiva/:id/pdf
// @access  Private
exports.uploadPDF = async (req, res) => {
  try {
    const { tipo_documento, descripcion } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }
    
    if (!tipo_documento) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de documento es obligatorio'
      });
    }
    
    const miembro = await Directiva.findById(req.params.id);
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    // Validar tipo de archivo
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten archivos PDF'
      });
    }
    
    // Validar tamaño (10MB máximo recomendado)
    const tamanoMB = req.file.size / (1024 * 1024);
    if (tamanoMB > 10) {
      return res.status(400).json({
        success: false,
        message: 'El archivo excede el tamaño máximo de 10MB'
      });
    }
    
    // Calcular hash MD5
    const hash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
    
    // Crear objeto de documento PDF
    const documentoPDF = {
      nombre_archivo: req.file.originalname,
      tipo_documento,
      descripcion: descripcion || '',
      fecha_subida: new Date(),
      archivo_binario: req.file.buffer,
      tamano_kb: req.file.size / 1024,
      hash_md5: hash,
      content_type: req.file.mimetype
    };
    
    // Agregar el documento al array
    miembro.documentos_pdf.push(documentoPDF);
    
    await miembro.save();
    
    // Obtener el documento recién agregado (sin el binario)
    const documentoAgregado = miembro.documentos_pdf[miembro.documentos_pdf.length - 1];
    const docResponse = documentoAgregado.toObject();
    delete docResponse.archivo_binario;
    
    res.status(201).json({
      success: true,
      message: 'PDF subido exitosamente',
      data: docResponse
    });
  } catch (error) {
    console.error('Error al subir PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir el PDF',
      error: error.message
    });
  }
};

// @desc    Obtener lista de PDFs de un miembro (sin contenido binario)
// @route   GET /api/directiva/:id/pdfs
// @access  Public
exports.getPDFList = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id)
      .select('nombre email documentos_pdf');
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    // Mapear los documentos sin el contenido binario
    const pdfs = miembro.documentos_pdf.map(doc => ({
      _id: doc._id,
      nombre_archivo: doc.nombre_archivo,
      tipo_documento: doc.tipo_documento,
      descripcion: doc.descripcion,
      fecha_subida: doc.fecha_subida,
      tamano_kb: doc.tamano_kb,
      hash_md5: doc.hash_md5
    }));
    
    res.status(200).json({
      success: true,
      count: pdfs.length,
      miembro: {
        nombre: miembro.nombre,
        email: miembro.email
      },
      data: pdfs
    });
  } catch (error) {
    console.error('Error al obtener lista de PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de PDFs',
      error: error.message
    });
  }
};

// @desc    Descargar un PDF específico
// @route   GET /api/directiva/:id/pdf/:pdfId
// @access  Public
exports.downloadPDF = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    const documento = miembro.documentos_pdf.id(req.params.pdfId);
    
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_archivo}"`);
    res.setHeader('Content-Length', documento.archivo_binario.length);
    
    res.send(documento.archivo_binario);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar el PDF',
      error: error.message
    });
  }
};

// @desc    Eliminar un PDF específico
// @route   DELETE /api/directiva/:id/pdf/:pdfId
// @access  Private
exports.deletePDF = async (req, res) => {
  try {
    const miembro = await Directiva.findById(req.params.id);
    
    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }
    
    const documento = miembro.documentos_pdf.id(req.params.pdfId);
    
    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Remover el documento usando pull
    miembro.documentos_pdf.pull(req.params.pdfId);
    await miembro.save();
    
    res.status(200).json({
      success: true,
      message: 'PDF eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    console.error('Error al eliminar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el PDF',
      error: error.message
    });
  }
};

// @desc    Buscar PDFs por tipo
// @route   GET /api/directiva/pdfs/tipo/:tipo
// @access  Public
exports.buscarPDFsPorTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    
    const miembros = await Directiva.find({
      'documentos_pdf.tipo_documento': tipo
    }).select('nombre cargo email documentos_pdf');
    
    // Filtrar solo los documentos del tipo solicitado
    const resultados = miembros.map(miembro => ({
      miembro: {
        _id: miembro._id,
        nombre: miembro.nombre,
        cargo: miembro.cargo,
        email: miembro.email
      },
      documentos: miembro.documentos_pdf
        .filter(doc => doc.tipo_documento === tipo)
        .map(doc => ({
          _id: doc._id,
          nombre_archivo: doc.nombre_archivo,
          descripcion: doc.descripcion,
          fecha_subida: doc.fecha_subida,
          tamano_kb: doc.tamano_kb
        }))
    })).filter(resultado => resultado.documentos.length > 0);
    
    res.status(200).json({
      success: true,
      count: resultados.length,
      tipo_documento: tipo,
      data: resultados
    });
  } catch (error) {
    console.error('Error al buscar PDFs por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar PDFs',
      error: error.message
    });
  }
};

// ============================================
// ESTADÍSTICAS
// ============================================

// @desc    Obtener estadísticas de documentos
// @route   GET /api/directiva/stats/documentos
// @access  Public
exports.getEstadisticasDocumentos = async (req, res) => {
  try {
    const estadisticas = await Directiva.aggregate([
      { $unwind: '$documentos_pdf' },
      {
        $group: {
          _id: '$documentos_pdf.tipo_documento',
          cantidad: { $sum: 1 },
          tamano_total_kb: { $sum: '$documentos_pdf.tamano_kb' }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);
    
    const totalDocumentos = estadisticas.reduce((acc, stat) => acc + stat.cantidad, 0);
    const tamanoTotalKB = estadisticas.reduce((acc, stat) => acc + stat.tamano_total_kb, 0);
    
    res.status(200).json({
      success: true,
      data: {
        por_tipo: estadisticas,
        totales: {
          documentos: totalDocumentos,
          tamano_kb: tamanoTotalKB,
          tamano_mb: (tamanoTotalKB / 1024).toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas generales
// @route   GET /api/directiva/stats/general
// @access  Public
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    const totalMiembros = await Directiva.countDocuments();
    const miembrosActivos = await Directiva.countDocuments({ estado: 'activo' });
    const miembrosInactivos = await Directiva.countDocuments({ estado: 'inactivo' });
    const miembrosSuspendidos = await Directiva.countDocuments({ estado: 'suspendido' });
    
    // Estadísticas por cargo
    const porCargo = await Directiva.aggregate([
      {
        $group: {
          _id: '$cargo',
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { cantidad: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total_miembros: totalMiembros,
        por_estado: {
          activos: miembrosActivos,
          inactivos: miembrosInactivos,
          suspendidos: miembrosSuspendidos
        },
        por_cargo: porCargo
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas generales',
      error: error.message
    });
  }
};

module.exports = exports;