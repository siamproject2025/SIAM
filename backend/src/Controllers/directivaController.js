// ============================================================
// Controllers/directivaController.js
//
// CAMBIOS vs versión anterior:
// - crearMiembroDirectiva:    guarda numero_identidad, foto,
//   fecha_inicio_cargo, creado_por, fecha_creacion_sistema
// - actualizarMiembroDirectiva: guarda actualizado_por,
//   fecha_actualizacion, vigencia del cargo
// - Los demás endpoints (documentos, eliminar) sin cambios
// ============================================================
const Directiva  = require('../Models/directivaModel');
const mongoose   = require('mongoose');
const { google } = require("googleapis");
const { PassThrough } = require("stream");
const path = require("path");
require("dotenv").config();

// ── Google Drive auth ────────────────────────────────────────
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/oauth2callback"
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version:"v3", auth: oAuth2Client });

// ── Helper: detectar cambios para auditoría ──────────────────
const detectarCambiosEspecificos = (anterior, nuevo) => {
    if (!anterior || !nuevo) return { cambios: null, descripcion: '' };
    const ignorar = ['_id','__v','createdAt','updatedAt','documentos_pdf','historial_cargos','sesiones_asistidas'];
    const cambios = {};
    const campos = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);
    for (const c of campos) {
        if (ignorar.includes(c)) continue;
        if (JSON.stringify(anterior[c]) !== JSON.stringify(nuevo[c])) {
            cambios[c] = { anterior: anterior[c] || 'vacío', nuevo: nuevo[c] || 'vacío' };
        }
    }
    const desc = Object.keys(cambios).map(c => {
        const a = String(cambios[c].anterior).substring(0,50);
        const n = String(cambios[c].nuevo).substring(0,50);
        return `${c}: "${a}" → "${n}"`;
    }).join('; ');
    return { cambios, descripcion: desc };
};

// ── GET /api/directiva ────────────────────────────────────────
const obtenerMiembrosDirectiva = async (req, res) => {
    try {
        const { estado, cargo } = req.query;
        const filtro = {};
        if (estado) filtro.estado = estado;
        if (cargo)  filtro.cargo  = { $regex: cargo, $options: 'i' };
        const miembros = await Directiva.find(filtro).sort({ nombre: 1 });
        res.json({ success: true, count: miembros.length, data: miembros });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener los miembros', error: err.message });
    }
};

// ── GET /api/directiva/:id ────────────────────────────────────
const obtenerMiembroPorId = async (req, res) => {
    try {
        const miembro = await Directiva.findById(req.params.id);
        if (!miembro) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        res.json({ success: true, data: miembro });
    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
        res.status(500).json({ success: false, message: 'Error al obtener el miembro', error: err.message });
    }
};

// ── POST /api/directiva ───────────────────────────────────────
const crearMiembroDirectiva = async (req, res) => {
    try {
        const body = req.body;

        // FIX #4: registrar auditoría de creación
        const userEmail = req.user?.email || body.creado_por || 'sistema';

        const payload = {
            ...body,
            // FIX #1: numero_identidad viene en el body
            // FIX #2: foto como base64 viene en body.foto
            // FIX #3: fechas de vigencia
            fecha_inicio_cargo:     body.fecha_inicio_cargo || null,
            fecha_fin_cargo:        body.fecha_fin_cargo    || null,
            motivo_salida:          body.motivo_salida      || '',
            // FIX #4: auditoría
            creado_por:             userEmail,
            fecha_creacion_sistema: new Date(),
            fecha_registro:         body.fecha_registro ? new Date(body.fecha_registro) : new Date(),
        };

        const miembro = new Directiva(payload);
        const nuevoMiembro = await miembro.save();

        res.status(201).json({
            success: true,
            message: 'Miembro de la directiva creado exitosamente',
            data: nuevoMiembro
        });

    } catch (err) {
        console.error('Error en crearMiembroDirectiva:', err);
        if (err.code === 11000) {
            // Identificar qué campo es duplicado
            const campo = Object.keys(err.keyPattern || {})[0] || 'campo';
            return res.status(400).json({
                success: false,
                message: campo === 'numero_identidad'
                    ? 'El número de identidad ya está registrado para otro miembro.'
                    : 'El email ya está registrado'
            });
        }
        if (err.name === 'ValidationError') {
            const msgs = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: 'Error de validación', errors: msgs });
        }
        res.status(500).json({ success: false, message: 'Error al crear el miembro', error: err.message });
    }
};

// ── PUT /api/directiva/:id ────────────────────────────────────
const actualizarMiembroDirectiva = async (req, res) => {
    try {
        const miembroAnterior = await Directiva.findById(req.params.id);
        if (!miembroAnterior) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });

        const userEmail = req.user?.email || req.body.actualizado_por || 'sistema';

        // FIX #4: actualizar campos de auditoría
        const payload = {
            ...req.body,
            actualizado_por:   userEmail,
            fecha_actualizacion: new Date(),
            fecha_registro:    req.body.fecha_registro ? new Date(req.body.fecha_registro) : miembroAnterior.fecha_registro,
            // FIX #3: vigencia del cargo
            fecha_inicio_cargo: req.body.fecha_inicio_cargo || miembroAnterior.fecha_inicio_cargo,
            fecha_fin_cargo:    req.body.fecha_fin_cargo    || miembroAnterior.fecha_fin_cargo,
            motivo_salida:      req.body.motivo_salida      ?? miembroAnterior.motivo_salida,
        };

        const miembroActualizado = await Directiva.findByIdAndUpdate(
            req.params.id, payload, { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Miembro de la directiva actualizado exitosamente',
            data: miembroActualizado
        });

    } catch (err) {
        console.error('Error en actualizarMiembroDirectiva:', err);
        if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
        if (err.code === 11000) {
            const campo = Object.keys(err.keyPattern || {})[0] || 'campo';
            return res.status(400).json({
                success: false,
                message: campo === 'numero_identidad'
                    ? 'El número de identidad ya está registrado para otro miembro.'
                    : 'El email ya está registrado'
            });
        }
        if (err.name === 'ValidationError') {
            const msgs = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: 'Error de validación', errors: msgs });
        }
        res.status(500).json({ success: false, message: 'Error al actualizar el miembro', error: err.message });
    }
};

// ── DELETE /api/directiva/:id ─────────────────────────────────
const eliminarMiembroDirectiva = async (req, res) => {
    try {
        const miembro = await Directiva.findById(req.params.id);
        if (!miembro) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });

        // Eliminar archivos de Drive
        for (const doc of miembro.documentos_pdf || []) {
            if (doc.driveFileId) {
                try { await drive.files.delete({ fileId: doc.driveFileId }); } catch(e) { console.error('Drive delete error:', e.message); }
            }
        }

        await Directiva.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Miembro eliminado exitosamente', data: { id: req.params.id } });

    } catch (err) {
        if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
        res.status(500).json({ success: false, message: 'Error al eliminar el miembro', error: err.message });
    }
};

// ── POST /api/directiva/:id/documentos ───────────────────────
const agregarDocumento = async (req, res) => {
    try {
        const miembro = await Directiva.findById(req.params.id);
        if (!miembro) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        if (!req.file)  return res.status(400).json({ success: false, message: 'No se proporcionó un archivo PDF' });
        if (!req.file.mimetype.startsWith('application/pdf')) return res.status(400).json({ success: false, message: 'El archivo debe ser un PDF' });
        if (req.file.size > 10 * 1024 * 1024)                return res.status(400).json({ success: false, message: 'El archivo no debe exceder 10MB' });

        const { v4: uuidv4 } = await import("uuid");
        const fileMetadata = { name: `${uuidv4()}-${req.file.originalname}`, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] };
        const media = { mimeType: req.file.mimetype, body: (() => { const s = new PassThrough(); s.end(req.file.buffer); return s; })() };
        const response = await drive.files.create({ requestBody: fileMetadata, media, fields: "id, webViewLink, webContentLink" });
        await drive.permissions.create({ fileId: response.data.id, requestBody: { role:'reader', type:'anyone' } });
        const downloadLink = `https://drive.google.com/uc?export=download&id=${response.data.id}`;

        const documentoData = {
            nombre_archivo:          req.body.nombre_archivo || req.file.originalname,
            tipo_documento:          req.body.tipo_documento || 'otro',
            descripcion:             req.body.descripcion    || '',
            numero_sesion:           req.body.numero_sesion  || '',
            fecha_subida:            new Date(),
            driveFileId:             response.data.id,
            driveViewLink:           response.data.webViewLink,
            driveDownloadLink:       downloadLink,
            tamano_kb:               Math.round(req.file.size / 1024),
            nombre_archivo_original: req.file.originalname,
        };

        await miembro.agregarDocumento(documentoData);
        const actualizado = await Directiva.findById(req.params.id);
        const docAgregado = actualizado.documentos_pdf[actualizado.documentos_pdf.length - 1];

        res.json({ success: true, message: 'Documento agregado exitosamente', data: { documento: documentoData, documentoId: docAgregado._id } });

    } catch (err) {
        console.error('Error al agregar documento:', err);
        res.status(500).json({ success: false, message: 'Error al agregar el documento', error: err.message });
    }
};

// ── PUT /api/directiva/:id/documentos/:documentoId ────────────
const actualizarDocumento = async (req, res) => {
    try {
        const miembro = await Directiva.findById(req.params.id);
        if (!miembro) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        const idx = miembro.documentos_pdf.findIndex(d => d._id.toString() === req.params.documentoId);
        if (idx === -1) return res.status(404).json({ success: false, message: 'Documento no encontrado' });

        if (req.body.nombre_archivo) miembro.documentos_pdf[idx].nombre_archivo = req.body.nombre_archivo;
        if (req.body.tipo_documento) miembro.documentos_pdf[idx].tipo_documento  = req.body.tipo_documento;
        if (req.body.descripcion !== undefined) miembro.documentos_pdf[idx].descripcion = req.body.descripcion;
        if (req.body.numero_sesion !== undefined) miembro.documentos_pdf[idx].numero_sesion = req.body.numero_sesion;

        if (req.file) {
            const doc = miembro.documentos_pdf[idx];
            if (!req.file.mimetype.startsWith('application/pdf')) return res.status(400).json({ success: false, message: 'El archivo debe ser un PDF' });
            if (req.file.size > 10 * 1024 * 1024)                return res.status(400).json({ success: false, message: 'El archivo no debe exceder 10MB' });
            if (doc.driveFileId) { try { await drive.files.delete({ fileId: doc.driveFileId }); } catch(e) {} }
            const { v4: uuidv4 } = await import("uuid");
            const fileMetadata = { name: `${uuidv4()}-${req.file.originalname}`, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] };
            const media = { mimeType: req.file.mimetype, body: (() => { const s = new PassThrough(); s.end(req.file.buffer); return s; })() };
            const response = await drive.files.create({ requestBody: fileMetadata, media, fields: "id, webViewLink" });
            await drive.permissions.create({ fileId: response.data.id, requestBody: { role:'reader', type:'anyone' } });
            const dl = `https://drive.google.com/uc?export=download&id=${response.data.id}`;
            miembro.documentos_pdf[idx].driveFileId             = response.data.id;
            miembro.documentos_pdf[idx].driveViewLink            = response.data.webViewLink;
            miembro.documentos_pdf[idx].driveDownloadLink        = dl;
            miembro.documentos_pdf[idx].tamano_kb                = Math.round(req.file.size / 1024);
            miembro.documentos_pdf[idx].nombre_archivo_original  = req.file.originalname;
            miembro.documentos_pdf[idx].fecha_subida             = new Date();
        }

        await miembro.save();
        res.json({ success: true, message: 'Documento actualizado exitosamente' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al actualizar el documento', error: err.message });
    }
};

// ── DELETE /api/directiva/:id/documentos/:documentoId ─────────
const eliminarDocumento = async (req, res) => {
    try {
        const miembro = await Directiva.findById(req.params.id);
        if (!miembro) return res.status(404).json({ success: false, message: 'Miembro no encontrado' });
        const doc = miembro.documentos_pdf.find(d => d._id.toString() === req.params.documentoId);
        if (!doc) return res.status(404).json({ success: false, message: 'Documento no encontrado' });
        if (doc.driveFileId) { try { await drive.files.delete({ fileId: doc.driveFileId }); } catch(e) {} }
        miembro.documentos_pdf = miembro.documentos_pdf.filter(d => d._id.toString() !== req.params.documentoId);
        await miembro.save();
        res.json({ success: true, message: 'Documento eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al eliminar el documento', error: err.message });
    }
};

// ── GET /api/directiva/estadisticas/estados ───────────────────
const obtenerEstadisticas = async (req, res) => {
    try {
        const estadisticas = await Directiva.aggregate([{ $group: { _id:'$estado', count:{ $sum:1 } } }]);
        const total = await Directiva.countDocuments();
        res.json({ success: true, data: { estadisticas, total } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas', error: err.message });
    }
};

module.exports = {
    obtenerMiembrosDirectiva, obtenerMiembroPorId,
    crearMiembroDirectiva, actualizarMiembroDirectiva, eliminarMiembroDirectiva,
    agregarDocumento, actualizarDocumento, eliminarDocumento,
    obtenerEstadisticas
};