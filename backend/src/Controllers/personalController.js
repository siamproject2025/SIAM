// ============================================================
// Controllers/personalController.js
//
// CAMBIOS:
// FIX #1  — Código autogenerado EMP-YYYY-XXXX
// FIX #2  — area_trabajo parametrizable
// FIX #3  — especialidades como array de objetos {nombre, nivel}
// FIX #5  — documentos subidos a Google Drive (documentacion + cv)
// FIX #6  — fecha_ingreso, fecha_salida, motivo_salida
// FIX #9  — auditoría: creado_por, actualizado_por
// ============================================================

const Personal  = require('../Models/personalModel');
const multer    = require('multer');
const sharp     = require('sharp');
const { google } = require('googleapis');
const { PassThrough } = require('stream');
const path      = require('path');
require('dotenv').config();

// ── Google Drive auth ─────────────────────────────────────
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/oauth2callback'
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// Carpeta de Drive para documentos de personal
const DRIVE_PERSONAL_FOLDER = process.env.GOOGLE_DRIVE_PERSONAL_FOLDER_ID
  || process.env.GOOGLE_DRIVE_FOLDER_ID;

// ── Multer — múltiples archivos ───────────────────────────
// campos: 'imagen' (1 foto), 'documentos' (hasta 10 archivos)
const upload = multer({ storage: multer.memoryStorage() });
exports.uploadMiddleware = upload.fields([
  { name: 'imagen',     maxCount: 1  },
  { name: 'documentos', maxCount: 10 }
]);

// ── Helper: subir archivo a Drive ────────────────────────
const subirArchivoADrive = async (buffer, originalname, mimetype, carpeta) => {
  const { v4: uuidv4 } = await import('uuid');
  const fileMetadata = {
    name:    `${uuidv4()}-${originalname}`,
    parents: [carpeta]
  };
  const media = {
    mimeType: mimetype,
    body: (() => { const s = new PassThrough(); s.end(buffer); return s; })()
  };
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, webViewLink'
  });
  return {
    drive_file_id:  response.data.id,
    drive_url:      response.data.webViewLink,
    nombre_archivo: fileMetadata.name
  };
};

// ── Helper: eliminar archivo de Drive ────────────────────
const eliminarArchivoEnDrive = async (fileId) => {
  if (!fileId) return;
  try { await drive.files.delete({ fileId }); } catch (e) { /* ignorar si ya no existe */ }
};

// ── Helper detectar cambios para auditoría ────────────────
const detectarCambiosEspecificos = (anterior, nuevo) => {
  if (!anterior || !nuevo) return { cambios: null, descripcion: '' };
  const cambios = {};
  const ignorar = ['_id', '__v', 'fecha_creacion', 'fecha_actualizacion', 'imagen', 'tipo_imagen', 'cv', 'documentacion'];
  const campos  = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
  for (const campo of campos) {
    if (ignorar.includes(campo)) continue;
    if (JSON.stringify(anterior[campo]) !== JSON.stringify(nuevo[campo])) {
      cambios[campo] = { anterior: anterior[campo] ?? 'vacío', nuevo: nuevo[campo] ?? 'vacío' };
    }
  }
  const modificados = Object.keys(cambios);
  const descripcion = modificados.map(c =>
    `${c}: "${String(cambios[c].anterior).substring(0, 50)}" → "${String(cambios[c].nuevo).substring(0, 50)}"`
  ).join('; ');
  return { cambios, descripcion };
};

// ════════════════════════════════════════════════════════════
//  GET  /api/personal
// ════════════════════════════════════════════════════════════
exports.obtenerPersonal = async (req, res) => {
  try {
    const personal = await Personal.find().sort({ fecha_creacion: -1 });
    res.status(200).json(personal);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ message: 'Error al obtener el personal', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  GET  /api/personal/:id
// ════════════════════════════════════════════════════════════
exports.obtenerPersonalPorId = async (req, res) => {
  try {
    const empleado = await Personal.findById(req.params.id);
    if (!empleado) return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    res.status(200).json({ success: true, data: empleado });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener el empleado', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  POST /api/personal   — Crear empleado
// ════════════════════════════════════════════════════════════
exports.crearPersonal = async (req, res) => {
  try {
    console.log('🚀 Iniciando creación de personal...');

    const body = req.body;

    // Validar duplicados
    const identidadExiste = await Personal.findOne({ numero_identidad: body.numero_identidad });
    if (identidadExiste) return res.status(400).json({ message: 'Ya existe un empleado con este número de identidad' });

    // ── Procesar foto de perfil ───────────────────────────
    let imagenBase64 = null, tipoImagen = null;
    const imgFile = req.files?.imagen?.[0];
    if (imgFile) {
      const buf = await sharp(imgFile.buffer)
        .resize(600, 600, { fit: 'inside' })
        .jpeg({ quality: 60 })
        .toBuffer();
      imagenBase64 = buf.toString('base64');
      tipoImagen   = 'image/jpeg';
    }

    // ── Procesar documentos → Drive ───────────────────────
    // El cliente envía metadatos como JSON en body.documentos_meta
    // y los archivos como req.files.documentos[]
    let documentacionFinal = [];
    const docFiles = req.files?.documentos || [];
    let docsMeta   = [];
    if (body.documentos_meta) {
      try { docsMeta = JSON.parse(body.documentos_meta); } catch(e) {}
    }

    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      const meta = docsMeta[i] || {};
      try {
        const driveData = await subirArchivoADrive(
          file.buffer,
          file.originalname,
          file.mimetype,
          DRIVE_PERSONAL_FOLDER
        );
        documentacionFinal.push({
          tipo_documento:  meta.tipo_documento || 'OTRO',
          descripcion:     meta.descripcion    || file.originalname,
          nombre_archivo:  file.originalname,
          drive_file_id:   driveData.drive_file_id,
          drive_url:       driveData.drive_url,
          tipo_archivo:    file.mimetype,
          fecha_subida:    new Date()
        });
      } catch (driveErr) {
        console.error('Error subiendo documento a Drive:', driveErr);
      }
    }

    // ── Parsear cargo_asignacion ──────────────────────────
    let cargoObj = null;
    if (body.cargo_asignacion) {
      try { cargoObj = typeof body.cargo_asignacion === 'string' ? JSON.parse(body.cargo_asignacion) : body.cargo_asignacion; }
      catch(e) { return res.status(400).json({ message: 'Formato de cargo_asignacion inválido' }); }
    }

    // ── Parsear especialidades ────────────────────────────
    let especialidades = [];
    if (body.especialidades) {
      try { especialidades = typeof body.especialidades === 'string' ? JSON.parse(body.especialidades) : body.especialidades; }
      catch(e) { especialidades = []; }
    }

    // ── Construir objeto ──────────────────────────────────
    const personalData = {
      nombres:          body.nombres,
      apellidos:        body.apellidos,
      numero_identidad: body.numero_identidad,
      tipo_contrato:    body.tipo_contrato,
      estado:           body.estado || 'ACTIVO',
      especialidades,
      area_trabajo:     body.area_trabajo,
      telefono:         body.telefono,
      direccion_correo: body.direccion_correo,
      cargo_asignacion: cargoObj,
      salario:          body.salario,
      fecha_ingreso:    body.fecha_ingreso || Date.now(),
      fecha_salida:     body.fecha_salida  || null,
      motivo_salida:    body.motivo_salida || null,
      imagen:           imagenBase64,
      tipo_imagen:      tipoImagen,
      documentacion:    documentacionFinal,
      creado_por:       req.user?.uid   || null,
      creado_por_email: req.user?.email || null,
      fecha_creacion:   new Date()
    };

    // codigo se autogenera en el pre-save hook
    const empleadoGuardado = await Personal.create(personalData);

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: empleadoGuardado
    });

  } catch (error) {
    console.error('❌ Error al crear empleado:', error);
    res.status(500).json({ success: false, message: 'Error al crear el empleado', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  PUT  /api/personal/:id   — Actualizar empleado
// ════════════════════════════════════════════════════════════
exports.actualizarPersonal = async (req, res) => {
  try {
    console.log('🔄 Iniciando actualización de personal...');
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID no proporcionado' });

    const personalAnterior = await Personal.findById(id);
    if (!personalAnterior) return res.status(404).json({ message: 'Empleado no encontrado' });

    const body = req.body;

    // Validar duplicados
    if (body.numero_identidad) {
      const existe = await Personal.findOne({ numero_identidad: body.numero_identidad, _id: { $ne: id } });
      if (existe) return res.status(400).json({ message: 'La identidad ya está en uso' });
    }

    // ── Nueva foto ────────────────────────────────────────
    let imagenData = {};
    const imgFile  = req.files?.imagen?.[0];
    if (imgFile) {
      const buf = await sharp(imgFile.buffer).resize(600, 600, { fit: 'inside' }).jpeg({ quality: 60 }).toBuffer();
      imagenData = { imagen: buf.toString('base64'), tipo_imagen: 'image/jpeg' };
    }

    // ── Nuevos documentos → Drive ─────────────────────────
    const docFiles   = req.files?.documentos || [];
    let docsMeta     = [];
    if (body.documentos_meta) {
      try { docsMeta = JSON.parse(body.documentos_meta); } catch(e) {}
    }

    const nuevosDocsDrive = [];
    for (let i = 0; i < docFiles.length; i++) {
      const file = docFiles[i];
      const meta = docsMeta[i] || {};
      try {
        const driveData = await subirArchivoADrive(file.buffer, file.originalname, file.mimetype, DRIVE_PERSONAL_FOLDER);
        nuevosDocsDrive.push({
          tipo_documento:  meta.tipo_documento || 'OTRO',
          descripcion:     meta.descripcion    || file.originalname,
          nombre_archivo:  file.originalname,
          drive_file_id:   driveData.drive_file_id,
          drive_url:       driveData.drive_url,
          tipo_archivo:    file.mimetype,
          fecha_subida:    new Date()
        });
      } catch(e) { console.error('Error Drive:', e); }
    }

    // ── Documentos a eliminar de Drive ────────────────────
    // El cliente puede enviar body.documentos_eliminar como JSON array de drive_file_id
    if (body.documentos_eliminar) {
      let idsEliminar = [];
      try { idsEliminar = JSON.parse(body.documentos_eliminar); } catch(e) {}
      for (const fileId of idsEliminar) {
        await eliminarArchivoEnDrive(fileId);
      }
    }

    // ── Parseos ───────────────────────────────────────────
    let cargoObj = undefined;
    if (body.cargo_asignacion) {
      try { cargoObj = typeof body.cargo_asignacion === 'string' ? JSON.parse(body.cargo_asignacion) : body.cargo_asignacion; }
      catch(e) { return res.status(400).json({ message: 'Formato de cargo inválido' }); }
    }

    let especialidades = undefined;
    if (body.especialidades) {
      try { especialidades = typeof body.especialidades === 'string' ? JSON.parse(body.especialidades) : body.especialidades; }
      catch(e) { especialidades = []; }
    }

    // ── Construir updateData ──────────────────────────────
    const camposDirectos = [
      'nombres', 'apellidos', 'numero_identidad', 'tipo_contrato', 'estado',
      'area_trabajo', 'telefono', 'direccion_correo', 'salario',
      'fecha_ingreso', 'fecha_salida', 'motivo_salida'
    ];

    const updateData = {};
    camposDirectos.forEach(campo => {
      if (body[campo] !== undefined && body[campo] !== 'null') updateData[campo] = body[campo];
    });

    if (cargoObj)       updateData.cargo_asignacion = cargoObj;
    if (especialidades) updateData.especialidades   = especialidades;
    if (imagenData.imagen) {
      updateData.imagen      = imagenData.imagen;
      updateData.tipo_imagen = imagenData.tipo_imagen;
    }
    if (nuevosDocsDrive.length > 0) {
      updateData.$push = { documentacion: { $each: nuevosDocsDrive } };
    }
    if (body.documentos_eliminar) {
      let idsEliminar = [];
      try { idsEliminar = JSON.parse(body.documentos_eliminar); } catch(e) {}
      if (idsEliminar.length > 0) {
        if (!updateData.$pull) updateData.$pull = {};
        updateData.$pull.documentacion = { drive_file_id: { $in: idsEliminar } };
      }
    }

    updateData.fecha_actualizacion    = new Date();
    updateData.actualizado_por        = req.user?.uid   || null;
    updateData.actualizado_por_email  = req.user?.email || null;

    // Separar operadores $push/$pull del $set
    const setData = {};
    Object.keys(updateData).forEach(k => {
      if (!k.startsWith('$')) setData[k] = updateData[k];
    });

    const mongoOp = { $set: setData };
    if (updateData.$push) mongoOp.$push = updateData.$push;
    if (updateData.$pull) mongoOp.$pull  = updateData.$pull;

    const empleadoActualizado = await Personal.findByIdAndUpdate(id, mongoOp, { new: true, runValidators: true });

    res.status(200).json({
      success: true,
      message: 'Empleado actualizado correctamente',
      data: empleadoActualizado
    });

  } catch (error) {
    console.error('Error en actualizarPersonal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  DELETE /api/personal/:id
// ════════════════════════════════════════════════════════════
exports.eliminarPersonal = async (req, res) => {
  try {
    const personalEliminado = await Personal.findById(req.params.id);
    if (!personalEliminado) return res.status(404).json({ message: 'Empleado no encontrado' });

    // Eliminar archivos de Drive
    for (const doc of personalEliminado.documentacion || []) {
      await eliminarArchivoEnDrive(doc.drive_file_id);
    }
    for (const cv of personalEliminado.cv || []) {
      await eliminarArchivoEnDrive(cv.drive_file_id);
    }

    await Personal.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Empleado eliminado exitosamente', data: personalEliminado });
  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar el empleado', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  DELETE /api/personal/:id/documento/:fileId
//  Eliminar un documento específico de Drive
// ════════════════════════════════════════════════════════════
exports.eliminarDocumento = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    await eliminarArchivoEnDrive(fileId);
    await Personal.findByIdAndUpdate(id, {
      $pull: { documentacion: { drive_file_id: fileId } }
    });
    res.status(200).json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  GET  /api/personal/estado/:estado
// ════════════════════════════════════════════════════════════
exports.buscarPorEstado = async (req, res) => {
  try {
    const personal = await Personal.find({ estado: req.params.estado }).sort({ fecha_creacion: -1 });
    res.status(200).json({ success: true, count: personal.length, data: personal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al buscar por estado', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  GET  /api/personal/cargo/:cargo
// ════════════════════════════════════════════════════════════
exports.buscarPorCargo = async (req, res) => {
  try {
    const personal = await Personal.find({
      'cargo_asignacion.cargo': { $regex: req.params.cargo, $options: 'i' }
    }).sort({ fecha_creacion: -1 });
    res.status(200).json({ success: true, count: personal.length, data: personal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al buscar por cargo', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════
//  GET  /api/personal/especialidad/:nombre
//  FIX #7 — Filtro por especialidad
// ════════════════════════════════════════════════════════════
exports.buscarPorEspecialidad = async (req, res) => {
  try {
    const personal = await Personal.find({
      'especialidades.nombre': { $regex: req.params.nombre, $options: 'i' }
    }).sort({ fecha_creacion: -1 });
    res.status(200).json({ success: true, count: personal.length, data: personal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al buscar por especialidad', error: error.message });
  }
};