// ============================================================
// Controllers/MatriculaController.js
//
// CAMBIOS:
// FIX #1 ALTO   — Documentos subidos a Google Drive (igual que biblioteca)
//                 Los docs ya NO se guardan como base64 en MongoDB.
//                 Se guarda: { tipo, nombre, archivoUrl, nombreArchivo }
// FIX #2 ALTO   — deleteMatricula elimina también los archivos en Drive
// FIX #3 MEDIO  — updateMatricula sube nuevos docs a Drive y elimina
//                 los que el frontend ya no incluye en la lista
// ============================================================
const Estudiante = require('../Models/Estudiante');
const mongoose   = require('mongoose');
const sharp      = require('sharp');
const { google } = require('googleapis');
const { PassThrough } = require('stream');
const path       = require('path');
require('dotenv').config();

// ── Google Drive auth (igual que bibliotecaController) ───────
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/oauth2callback'
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

// Carpeta de Drive para documentos de matrícula
// Puedes usar la misma que biblioteca o crear una distinta en .env
const DOCS_FOLDER_ID = process.env.GOOGLE_DRIVE_DOCS_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;

// ── Helpers ──────────────────────────────────────────────────
const procesarImagen = async (file) => {
    if (!file) return { imagen: null, tipo_imagen: null };
    const imageSharp = sharp(file.buffer).resize(600, 600, { fit: 'inside' });
    if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
        const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
        return { imagen: buf.toString('base64'), tipo_imagen: 'image/jpeg' };
    } else if (file.mimetype === 'image/webp') {
        const buf = await imageSharp.webp({ quality: 60 }).toBuffer();
        return { imagen: buf.toString('base64'), tipo_imagen: 'image/webp' };
    }
    const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
    return { imagen: buf.toString('base64'), tipo_imagen: 'image/jpeg' };
};

// Parsea un valor JSON si viene como string (FormData envía todo como texto)
const parsearJSON = (valor) => {
    if (!valor) return null;
    if (typeof valor === 'object') return valor;
    try { return JSON.parse(valor); } catch { return null; }
};

/**
 * Sube un archivo (multer file object) a Google Drive.
 * Devuelve { archivoUrl, nombreArchivo }
 */
const subirDocADrive = async (file, tipo) => {
    const { v4: uuidv4 } = await import('uuid');
    const extension   = path.extname(file.originalname).toLowerCase();
    const nombreUnico = `matricula_${tipo}_${uuidv4()}${extension}`;

    const fileMetadata = {
        name:    nombreUnico,
        parents: [DOCS_FOLDER_ID],
    };
    const media = {
        mimeType: file.mimetype,
        body: (() => { const s = new PassThrough(); s.end(file.buffer); return s; })(),
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, webViewLink',
    });

    return {
        archivoUrl:    response.data.webViewLink,
        nombreArchivo: nombreUnico,
    };
};

/**
 * Elimina un archivo de Drive a partir de su webViewLink.
 * Falla silenciosamente si el archivo ya no existe.
 */
const eliminarDocDeDrive = async (archivoUrl) => {
    if (!archivoUrl) return;
    // El fileId está en la URL: /file/d/{fileId}/view
    const match = archivoUrl.match(/\/d\/([\w-]+)/);
    const fileId = match ? match[1] : archivoUrl.match(/[-\w]{25,}/)?.[0];
    if (!fileId) return;
    try { await drive.files.delete({ fileId }); } catch (_) { /* ignorar */ }
};

// ─────────────────────────────────────────────
// POST /api/matriculas
// Crear nuevo alumno con primera matrícula
// ─────────────────────────────────────────────
exports.crearMatricula = async (req, res) => {
    try {
        const body = req.body;

        // Verificar duplicado
        const existe = await Estudiante.findOne({ id_documento: body.id_documento });
        if (existe) {
            return res.status(400).json({
                success: false,
                message: 'El número de identidad ya está registrado. Si desea rematricular a este alumno use el botón "Nuevo año de matrícula".'
            });
        }

        // Procesar imagen de perfil
        // Con upload.fields(), la imagen llega en req.files['imagen'][0]
        const imagenFile = req.files && req.files['imagen'] ? req.files['imagen'][0] : null;
        const imgData = await procesarImagen(imagenFile);

        // Primera entrada del historial
        const primeraMatricula = {
            anio_matricula:     parseInt(body.anio_matricula) || new Date().getFullYear(),
            grado_a_matricular: body.grado_a_matricular,
            fecha_matricula:    new Date(),
            estado_matricula:   body.estado_matricula || 'activa',
            notas:              body.notas || '',
            realizado_por:      body.creado_por || req.user?.email || 'sistema'
        };

        // ── Encargados ───────────────────────────────────────
        // El frontend envía encargados como JSON string dentro de FormData
        let encargados = parsearJSON(body.encargados) || [];
        if (!encargados.length && body.nombre_encargado) {
            encargados = [{
                nombre_encargado:       body.nombre_encargado,
                parentesco_encargado:   body.parentesco_encargado   || 'Otro',
                id_documento_encargado: body.id_documento_encargado || '',
                telefono_encargado:     body.telefono_encargado     || '',
                email_encargado:        body.email_encargado        || '',
                es_principal:           true,
            }];
        }

        // ── FIX #1: Documentos → subir a Google Drive ───────
        // req.files['documentos'] contiene los archivos reales.
        // body.documentosMeta contiene un JSON array con el tipo de cada doc
        // (el índice coincide con el orden de req.files['documentos']).
        const archivosDoc  = (req.files && req.files['documentos']) ? req.files['documentos'] : [];
        const metaDocRaw   = parsearJSON(body.documentosMeta) || [];
        // También soportamos documentos ya subidos (edición): vienen como JSON en body.documentos
        const docsExistentes = parsearJSON(body.documentos) || [];

        const documentosSubidos = [];

        for (let i = 0; i < archivosDoc.length; i++) {
            const file = archivosDoc[i];
            const tipo = metaDocRaw[i]?.tipo || 'otro';
            const driveData = await subirDocADrive(file, tipo);
            documentosSubidos.push({
                tipo,
                nombre:       file.originalname,
                archivoUrl:   driveData.archivoUrl,
                nombreArchivo: driveData.nombreArchivo,
            });
        }

        // Combinar los existentes (sin archivo nuevo) + los recién subidos
        const documentos = [...docsExistentes, ...documentosSubidos];

        const estudianteData = {
            ...body,
            ...imgData,
            historial_matriculas: [primeraMatricula],
            encargados,
            documentos,
        };

        // Sincronizar campos legacy con el encargado principal
        if (encargados.length > 0) {
            const p = encargados.find(e => e.es_principal) || encargados[0];
            estudianteData.nombre_encargado       = p.nombre_encargado;
            estudianteData.parentesco_encargado   = p.parentesco_encargado;
            estudianteData.id_documento_encargado = p.id_documento_encargado;
            estudianteData.telefono_encargado     = p.telefono_encargado;
            estudianteData.email_encargado        = p.email_encargado;
        }

        const estudiante = await Estudiante.create(estudianteData);

        res.status(201).json({
            success: true,
            message: 'Matrícula creada exitosamente.',
            data: estudiante
        });

    } catch (error) {
        console.error('Error en crearMatricula:', error);
        if (error.code === 11000 && error.keyPattern?.id_documento) {
            return res.status(400).json({
                success: false,
                message: 'El número de identidad ya está registrado (duplicado).'
            });
        }
        if (error.name === 'ValidationError') {
            const msgs = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: 'Error de validación', errors: msgs });
        }
        res.status(500).json({ success: false, message: 'Error al crear la matrícula.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/matriculas/:id/matricular
// Agregar un nuevo año al historial (usa $push)
// ─────────────────────────────────────────────
exports.agregarMatricula = async (req, res) => {
    try {
        const { id } = req.params;
        const { anio_matricula, grado_a_matricular, estado_matricula, notas, realizado_por } = req.body;

        if (!anio_matricula || !grado_a_matricular) {
            return res.status(400).json({ success: false, message: 'El año de matrícula y el grado son requeridos.' });
        }

        const estudiante = await Estudiante.findById(id);
        if (!estudiante) {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado.' });
        }

        const yaExiste = estudiante.historial_matriculas.some(
            m => m.anio_matricula === parseInt(anio_matricula)
        );
        if (yaExiste) {
            return res.status(400).json({
                success: false,
                message: `Este alumno ya tiene una matrícula registrada para el año ${anio_matricula}. Edítala desde el historial.`
            });
        }

        const nuevaEntrada = {
            anio_matricula:     parseInt(anio_matricula),
            grado_a_matricular: grado_a_matricular,
            fecha_matricula:    new Date(),
            estado_matricula:   estado_matricula || 'activa',
            notas:              notas || '',
            realizado_por:      realizado_por || req.user?.email || 'sistema'
        };

        const actualizado = await Estudiante.findByIdAndUpdate(
            id,
            {
                $push: { historial_matriculas: nuevaEntrada },
                $set:  {
                    grado_a_matricular: grado_a_matricular,
                    anio_matricula:     parseInt(anio_matricula),
                    actualizado_por:    realizado_por || req.user?.email || 'sistema'
                }
            },
            { new: true, runValidators: false }
        );

        res.status(200).json({
            success: true,
            message: `Matrícula ${anio_matricula} registrada exitosamente. El historial anterior se conserva intacto.`,
            data: actualizado
        });

    } catch (error) {
        console.error('Error en agregarMatricula:', error);
        res.status(500).json({ success: false, message: 'Error al registrar la matrícula.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/matriculas/:id/historial/:matriculaId
// Editar UNA entrada del historial
// ─────────────────────────────────────────────
exports.editarEntradaHistorial = async (req, res) => {
    try {
        const { id, matriculaId } = req.params;
        const { estado_matricula, notas } = req.body;

        const actualizado = await Estudiante.findOneAndUpdate(
            { _id: id, 'historial_matriculas._id': matriculaId },
            {
                $set: {
                    'historial_matriculas.$.estado_matricula': estado_matricula,
                    'historial_matriculas.$.notas':            notas
                }
            },
            { new: true }
        );

        if (!actualizado) {
            return res.status(404).json({ success: false, message: 'Entrada de historial no encontrada.' });
        }

        res.status(200).json({ success: true, message: 'Entrada del historial actualizada.', data: actualizado });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al editar el historial.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/matriculas
// ─────────────────────────────────────────────
exports.getAllMatriculas = async (req, res) => {
    try {
        const { grado_a_matricular } = req.query;
        let filtro = {};

        if (grado_a_matricular && grado_a_matricular !== 'undefined' && grado_a_matricular !== '') {
            try {
                filtro.grado_a_matricular = new mongoose.Types.ObjectId(grado_a_matricular);
            } catch {
                return res.status(400).json({ success: false, message: 'ID de grado no válido' });
            }
        }

        const estudiantes = await Estudiante.find(filtro).sort({ fecha_matricula: -1 });
        res.status(200).json({ success: true, count: estudiantes.length, data: estudiantes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/matriculas/:id
// ─────────────────────────────────────────────
exports.getMatriculaById = async (req, res) => {
    try {
        const estudiante = await Estudiante.findById(req.params.id);
        if (!estudiante) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
        res.status(200).json({ success: true, data: estudiante });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la matrícula', error: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/matriculas/:id
// Actualizar expediente — NO toca el historial
// FIX #3: sube nuevos documentos a Drive y elimina los removidos
// ─────────────────────────────────────────────
exports.updateMatricula = async (req, res) => {
    try {
        const body = { ...req.body };

        // Proteger el historial
        delete body.historial_matriculas;

        // Procesar imagen de perfil si viene
        // Con upload.fields(), la imagen llega en req.files['imagen'][0]
        const imagenFile = req.files && req.files['imagen'] ? req.files['imagen'][0] : null;
        if (imagenFile) {
            const imageSharp = sharp(imagenFile.buffer).resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true });
            const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
            body.imagen      = buf.toString('base64');
            body.tipo_imagen = 'image/jpeg';
        }

        // ── Encargados ───────────────────────────────────────
        const encargados = parsearJSON(body.encargados) || [];
        if (encargados.length > 0) {
            body.encargados = encargados;
            const p = encargados.find(e => e.es_principal) || encargados[0];
            body.nombre_encargado       = p.nombre_encargado;
            body.parentesco_encargado   = p.parentesco_encargado;
            body.id_documento_encargado = p.id_documento_encargado;
            body.telefono_encargado     = p.telefono_encargado;
            body.email_encargado        = p.email_encargado;
        }

        // ── FIX #3: Documentos → Drive ───────────────────────
        // docsExistentes: documentos que el usuario NO eliminó (ya tienen archivoUrl)
        // archivosDoc:    archivos nuevos que el usuario adjuntó en esta edición
        const docsExistentes = parsearJSON(body.documentos) || [];
        const archivosDoc    = (req.files && req.files['documentos']) ? req.files['documentos'] : [];
        const metaDocRaw     = parsearJSON(body.documentosMeta) || [];

        // Subir los archivos nuevos a Drive
        const docsNuevos = [];
        for (let i = 0; i < archivosDoc.length; i++) {
            const file = archivosDoc[i];
            const tipo = metaDocRaw[i]?.tipo || 'otro';
            const driveData = await subirDocADrive(file, tipo);
            docsNuevos.push({
                tipo,
                nombre:        file.originalname,
                archivoUrl:    driveData.archivoUrl,
                nombreArchivo: driveData.nombreArchivo,
            });
        }

        // Detectar documentos eliminados por el usuario y borrarlos de Drive
        const estudianteActual = await Estudiante.findById(req.params.id).lean();
        if (estudianteActual) {
            const urlsExistentes = new Set(docsExistentes.map(d => d.archivoUrl).filter(Boolean));
            for (const docAntiguo of (estudianteActual.documentos || [])) {
                if (docAntiguo.archivoUrl && !urlsExistentes.has(docAntiguo.archivoUrl)) {
                    await eliminarDocDeDrive(docAntiguo.archivoUrl);
                }
            }
        }

        body.documentos = [...docsExistentes, ...docsNuevos];

        const estudiante = await Estudiante.findByIdAndUpdate(
            req.params.id, body, { new: true, runValidators: true }
        );

        if (!estudiante) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });

        res.status(200).json({ success: true, message: 'Datos del estudiante actualizados exitosamente.', data: estudiante });

    } catch (error) {
        console.error('Error en updateMatricula:', error);
        res.status(400).json({ success: false, message: 'Error al actualizar la matrícula.', error: error.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/matriculas/:id
// FIX #2: también elimina los archivos en Drive
// ─────────────────────────────────────────────
exports.deleteMatricula = async (req, res) => {
    try {
        const estudiante = await Estudiante.findByIdAndDelete(req.params.id);
        if (!estudiante) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });

        // Eliminar todos los documentos del alumno en Drive
        for (const doc of (estudiante.documentos || [])) {
            await eliminarDocDeDrive(doc.archivoUrl);
        }

        res.status(200).json({ success: true, message: 'Matrícula eliminada exitosamente.', data: estudiante });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar la matrícula.', error: error.message });
    }
};