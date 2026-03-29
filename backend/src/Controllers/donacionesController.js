const Donacion = require('../Models/donacionesModel');
const multer = require('multer');
const sharp = require('sharp');
const { google } = require('googleapis');
const { PassThrough } = require('stream');
const path = require('path');
require('dotenv').config();

// ── Google Drive auth ────────────────────────────────────────────────────────
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/oauth2callback'
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// ── Multer: acepta imagen y documento en memoria ─────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ── Helper: sube un buffer a Google Drive y devuelve {url, nombreArchivo} ───
const subirDocumentoDrive = async (buffer, originalname, mimetype) => {
  const { v4: uuidv4 } = await import('uuid');
  const nombreArchivo = `donacion_${uuidv4()}_${originalname}`;

  const fileMetadata = {
    name: nombreArchivo,
    parents: [process.env.GOOGLE_DRIVE_DONACIONES_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID],
  };
  const media = {
    mimeType: mimetype,
    body: (() => {
      const s = new PassThrough();
      s.end(buffer);
      return s;
    })(),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink',
  });

  return { url: response.data.webViewLink, nombreArchivo };
};

// ── Helper: elimina un archivo de Drive por URL ──────────────────────────────
const eliminarDocumentoDrive = async (url) => {
  if (!url) return;
  const fileId = url.match(/[-\w]{25,}/)?.[0];
  if (fileId) {
    try {
      await drive.files.delete({ fileId });
    } catch (e) {
      console.warn('⚠️ No se pudo eliminar archivo de Drive:', e.message);
    }
  }
};

// ── Helper: detectar cambios para auditoría ──────────────────────────────────
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
  if (!objetoAnterior || !objetoNuevo) return { cambios: null, descripcion: '' };

  const cambios = {};
  const camposIgnorar = ['_id', '__v', 'createdAt', 'updatedAt', 'fecha_ingreso', 'imagen', 'tipo_imagen', 'documento_url', 'documento_nombre'];

  const todosLosCampos = new Set([
    ...Object.keys(objetoAnterior),
    ...Object.keys(objetoNuevo),
  ]);

  for (const campo of todosLosCampos) {
    if (camposIgnorar.includes(campo)) continue;
    const va = objetoAnterior[campo];
    const vn = objetoNuevo[campo];
    if (JSON.stringify(va) !== JSON.stringify(vn)) {
      cambios[campo] = { anterior: va || 'vacío', nuevo: vn || 'vacío' };
    }
  }

  const camposModificados = Object.keys(cambios);
  let descripcion = '';
  if (camposModificados.length > 0) {
    descripcion = camposModificados.map(c => {
      const ch = cambios[c];
      return `${c}: "${String(ch.anterior).substring(0, 50)}" → "${String(ch.nuevo).substring(0, 50)}"`;
    }).join('; ');
  }

  return { cambios, descripcion };
};

// ════════════════════════════════════════════════════════════════════════════
// CREAR donación
// ════════════════════════════════════════════════════════════════════════════
exports.createDonacion = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de donación...');

    const nextId = await Donacion.getNextId();

    // ── Procesar imagen ──────────────────────────────────────────────────────
    let imagenBase64 = null;
    let tipoImagen   = null;

    if (req.files?.imagen?.[0] || req.file) {
      const imgFile = req.files?.imagen?.[0] || req.file;
      console.log('📸 Procesando imagen con Sharp...');
      const processedBuffer = await sharp(imgFile.buffer)
        .resize(600, 600, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();
      imagenBase64 = processedBuffer.toString('base64');
      tipoImagen   = 'image/jpeg';
      console.log(`✅ Imagen procesada: ${(imagenBase64.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // ── Procesar documento → Drive ───────────────────────────────────────────
    let documentoUrl    = null;
    let documentoNombre = null;

    const docFile = req.files?.documento?.[0];
    if (docFile) {
      console.log('📄 Subiendo documento a Drive...');
      const resultado = await subirDocumentoDrive(docFile.buffer, docFile.originalname, docFile.mimetype);
      documentoUrl    = resultado.url;
      documentoNombre = resultado.nombreArchivo;
      console.log('✅ Documento subido:', documentoUrl);
    }

    // ── Datos de auditoría: fecha_ingreso es automática (no la toca el usuario) ─
    const donacionData = {
      ...req.body,
      id_donacion:    nextId,
      imagen:         imagenBase64,
      tipo_imagen:    tipoImagen,
      documento_url:  documentoUrl,
      documento_nombre: documentoNombre,
      // fecha_ingreso se genera en el modelo con default: Date.now
      creado_por:       req.user?._id || req.user?.id,
      creado_por_email: req.user?.email || null,
      fecha_creacion:   new Date(),
    };

    const donacion = await Donacion.create(donacionData);

    res.status(201).json({
      success: true,
      message: 'Donación creada exitosamente',
      data: donacion,
    });

  } catch (error) {
    console.error('❌ Error en createDonacion:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear la donación',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// OBTENER todas las donaciones
// ════════════════════════════════════════════════════════════════════════════
exports.getAllDonaciones = async (req, res) => {
  try {
    const donaciones = await Donacion.find().sort({ fecha_ingreso: -1 });
    res.status(200).json({
      success: true,
      count: donaciones.length,
      data: donaciones,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener las donaciones', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// OBTENER una donación por ID
// ════════════════════════════════════════════════════════════════════════════
exports.getDonacionById = async (req, res) => {
  try {
    const donacion = await Donacion.findOne({ id_donacion: req.params.id });
    if (!donacion) return res.status(404).json({ success: false, message: 'Donación no encontrada' });
    res.status(200).json({ success: true, data: donacion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener la donación', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ACTUALIZAR donación
// ════════════════════════════════════════════════════════════════════════════
exports.updateDonacion = async (req, res) => {
  try {
    console.log('🔄 Iniciando actualización de donación...');

    const donacionAnterior = await Donacion.findOne({ id_donacion: req.params.id });
    if (!donacionAnterior) {
      return res.status(404).json({ success: false, message: 'Donación no encontrada' });
    }

    // No permitir editar donaciones anuladas (solo consultarlas)
    if (donacionAnterior.estado === 'Anulada' && req.body.estado !== 'Anulada') {
      return res.status(400).json({ success: false, message: 'No se puede modificar una donación anulada' });
    }

    const updateData = { ...req.body };

    // ── Procesar nueva imagen ────────────────────────────────────────────────
    const imgFile = req.files?.imagen?.[0] || (req.file && req.file.fieldname === 'imagen' ? req.file : null);
    if (imgFile) {
      console.log('📸 Procesando imagen con Sharp...');
      const processedBuffer = await sharp(imgFile.buffer)
        .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 60 })
        .toBuffer();
      updateData.imagen     = processedBuffer.toString('base64');
      updateData.tipo_imagen = 'image/jpeg';
      console.log(`✅ Imagen procesada: ${(updateData.imagen.length / 1024 / 1024).toFixed(2)} MB`);
    }

    // ── Procesar nuevo documento → Drive ────────────────────────────────────
    const docFile = req.files?.documento?.[0];
    if (docFile) {
      // Eliminar documento anterior de Drive
      await eliminarDocumentoDrive(donacionAnterior.documento_url);

      console.log('📄 Subiendo nuevo documento a Drive...');
      const resultado = await subirDocumentoDrive(docFile.buffer, docFile.originalname, docFile.mimetype);
      updateData.documento_url    = resultado.url;
      updateData.documento_nombre = resultado.nombreArchivo;
      console.log('✅ Documento actualizado:', resultado.url);
    }

    // Auditoría: quién actualizó
    updateData.actualizado_por       = req.user?._id || req.user?.id;
    updateData.actualizado_por_email = req.user?.email || null;
    updateData.fecha_actualizacion   = new Date();

    // Detectar cambios
    const donacionAnteriorObj   = donacionAnterior.toObject ? donacionAnterior.toObject() : donacionAnterior;
    const datosPreviosLimpios   = { ...donacionAnteriorObj };
    delete datosPreviosLimpios.imagen;
    delete datosPreviosLimpios.tipo_imagen;
    const datosNuevosLimpios    = { ...updateData };
    delete datosNuevosLimpios.imagen;
    delete datosNuevosLimpios.tipo_imagen;

    const { cambios, descripcion } = detectarCambiosEspecificos(datosPreviosLimpios, datosNuevosLimpios);

    const donacion = await Donacion.findOneAndUpdate(
      { id_donacion: req.params.id },
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Donación actualizada exitosamente',
      data: donacion,
    });

  } catch (error) {
    console.error('❌ Error en updateDonacion:', error);
    res.status(400).json({ success: false, message: 'Error al actualizar la donación', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ELIMINAR donación
// ════════════════════════════════════════════════════════════════════════════
exports.deleteDonacion = async (req, res) => {
  try {
    const donacionEliminada = await Donacion.findOne({ id_donacion: req.params.id });
    if (!donacionEliminada) return res.status(404).json({ success: false, message: 'Donación no encontrada' });

    // Eliminar documento de Drive si existe
    await eliminarDocumentoDrive(donacionEliminada.documento_url);

    await Donacion.findOneAndDelete({ id_donacion: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Donación eliminada exitosamente',
      data: donacionEliminada,
    });
  } catch (error) {
    console.error('❌ Error en deleteDonacion:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la donación', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ANULAR donación (alias semántico: cambia estado a Anulada sin eliminar)
// ════════════════════════════════════════════════════════════════════════════
exports.anularDonacion = async (req, res) => {
  try {
    const donacion = await Donacion.findOne({ id_donacion: req.params.id });
    if (!donacion) return res.status(404).json({ success: false, message: 'Donación no encontrada' });

    if (donacion.estado === 'Anulada') {
      return res.status(400).json({ success: false, message: 'La donación ya está anulada' });
    }

    const actualizado = await Donacion.findOneAndUpdate(
      { id_donacion: req.params.id },
      {
        estado: 'Anulada',
        actualizado_por:       req.user?._id || req.user?.id,
        actualizado_por_email: req.user?.email || null,
        fecha_actualizacion:   new Date(),
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Donación anulada. El registro se conserva con trazabilidad.',
      data: actualizado,
    });
  } catch (error) {
    console.error('❌ Error en anularDonacion:', error);
    res.status(500).json({ success: false, message: 'Error al anular la donación', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// OBTENER donaciones por almacén
// ════════════════════════════════════════════════════════════════════════════
exports.getDonacionesByAlmacen = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ id_almacen: req.params.id_almacen }).sort({ fecha_ingreso: -1 });
    res.status(200).json({ success: true, count: donaciones.length, data: donaciones });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener donaciones del almacén', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// OBTENER donaciones por tipo
// ════════════════════════════════════════════════════════════════════════════
exports.getDonacionesByTipo = async (req, res) => {
  try {
    const donaciones = await Donacion.find({ tipo_donacion: req.params.tipo }).sort({ fecha_ingreso: -1 });
    res.status(200).json({ success: true, count: donaciones.length, data: donaciones });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener donaciones por tipo', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ════════════════════════════════════════════════════════════════════════════
exports.getEstadisticasDonaciones = async (req, res) => {
  try {
    const stats = await Donacion.aggregate([
      {
        $group: {
          _id: '$tipo_donacion',
          total: { $sum: '$cantidad_donacion' },
          cantidad_donaciones: { $sum: 1 },
          promedio: { $avg: '$cantidad_donacion' },
        },
      },
      { $sort: { total: -1 } },
    ]);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas', error: error.message });
  }
};