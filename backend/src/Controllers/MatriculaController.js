// ============================================================
// Controllers/MatriculaController.js
//
// CAMBIOS vs versión anterior:
// - crearMatricula: guarda snapshot de encargados + transporte en la 1ª entrada del historial
// - agregarMatricula: guarda snapshot del estado actual del alumno al crear nuevo año
// - editarEntradaHistorial: solo modifica estado/notas — el snapshot NUNCA se toca
// - updateMatricula: actualiza datos actuales del alumno (no toca historial)
// - Campos de transporte manejados en create y update
// ============================================================
const Estudiante = require('../Models/Estudiante');
const mongoose   = require('mongoose');
const sharp      = require('sharp');
const { google } = require('googleapis');
const { PassThrough } = require('stream');
const path       = require('path');
require('dotenv').config();

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5000/oauth2callback'
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

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

const parsearJSON = (valor) => {
    if (!valor) return null;
    if (typeof valor === 'object') return valor;
    try { return JSON.parse(valor); } catch { return null; }
};

const subirDocADrive = async (file, tipo) => {
    const { v4: uuidv4 } = await import('uuid');
    const extension   = path.extname(file.originalname).toLowerCase();
    const nombreUnico = `matricula_${tipo}_${uuidv4()}${extension}`;
    const fileMetadata = { name: nombreUnico, parents: [DOCS_FOLDER_ID] };
    const media = {
        mimeType: file.mimetype,
        body: (() => { const s = new PassThrough(); s.end(file.buffer); return s; })(),
    };
    const response = await drive.files.create({ requestBody: fileMetadata, media, fields: 'id, webViewLink' });
    return { archivoUrl: response.data.webViewLink, nombreArchivo: nombreUnico };
};

const eliminarDocDeDrive = async (archivoUrl) => {
    if (!archivoUrl) return;
    const match = archivoUrl.match(/\/d\/([\w-]+)/);
    const fileId = match ? match[1] : archivoUrl.match(/[-\w]{25,}/)?.[0];
    if (!fileId) return;
    try { await drive.files.delete({ fileId }); } catch (_) { /* ignorar */ }
};

/**
 * Construye el snapshot a guardar en una entrada del historial.
 * Captura el estado ACTUAL del alumno en el momento de crear el año.
 * Este snapshot es INMUTABLE — nunca se modifica después.
 */
// Reemplaza la función construirSnapshot existente
const construirSnapshot = (estudiante, gradoNombre) => ({
    // Datos personales
    snapshot_nombre_completo:     estudiante.nombre_completo     || '',
    snapshot_fecha_nacimiento:    estudiante.fecha_nacimiento    || null,
    snapshot_edad:                estudiante.edad                || null,
    snapshot_genero:              estudiante.genero              || '',
    snapshot_id_documento:        estudiante.id_documento        || '',
    snapshot_residencia:          estudiante.residencia_direccion|| '',
    snapshot_telefono_alumno:     estudiante.telefono_alumno     || '',
    snapshot_escuela_anterior:    estudiante.escuela_anterior    || '',

    // Datos médicos
    snapshot_alergias:            estudiante.alergias            || '',
    snapshot_enfermedades:        estudiante.enfermedades        || '',
    snapshot_medicamentos:        estudiante.medicamentos        || '',
    snapshot_pediatra_nombre:     estudiante.pediatra_nombre     || estudiante.pediatra || '',
    snapshot_pediatra_telefono:   estudiante.pediatra_telefono   || '',
    snapshot_vacunas_al_dia:      estudiante.vacunas_al_dia      || false,
    snapshot_contacto_emergencia_nombre:   estudiante.contacto_emergencia_nombre   || '',
    snapshot_contacto_emergencia_telefono: estudiante.contacto_emergencia_telefono || '',

    // Encargados
    snapshot_encargados: (estudiante.encargados || []).map(e => ({
        nombre_encargado:       e.nombre_encargado       || '',
        parentesco_encargado:   e.parentesco_encargado   || '',
        id_documento_encargado: e.id_documento_encargado || '',
        telefono_encargado:     e.telefono_encargado     || '',
        email_encargado:        e.email_encargado        || '',
        es_principal:           e.es_principal           || false,
    })),

    // Transporte
    snapshot_transporte: {
        usa_transporte:                estudiante.usa_transporte                ?? false,
        transporte_ruta:               estudiante.transporte_ruta               || '',
        transporte_conductor_nombre:   estudiante.transporte_conductor_nombre   || '',
        transporte_conductor_telefono: estudiante.transporte_conductor_telefono || '',
        transporte_placa:              estudiante.transporte_placa              || '',
        transporte_empresa:            estudiante.transporte_empresa            || '',
        transporte_punto_recogida:     estudiante.transporte_punto_recogida     || '',
        transporte_observaciones:      estudiante.transporte_observaciones      || '',
    },

    // Académico
    snapshot_grado_nombre: gradoNombre || '',
    snapshot_generado:     true,
});

// ─────────────────────────────────────────────
// POST /api/matriculas
// ─────────────────────────────────────────────
exports.crearMatricula = async (req, res) => {
    try {
        const body = req.body;

        const existe = await Estudiante.findOne({ id_documento: body.id_documento });
        if (existe) {
            return res.status(400).json({
                success: false,
                message: 'El número de identidad ya está registrado. Si desea rematricular a este alumno use el botón "Nuevo año de matrícula".'
            });
        }

        const imagenFile = req.files && req.files['imagen'] ? req.files['imagen'][0] : null;
        const imgData = await procesarImagen(imagenFile);

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

        // Datos de transporte
        const transporteData = {
            usa_transporte:               body.usa_transporte === 'true' || body.usa_transporte === true,
            transporte_ruta:              body.transporte_ruta               || '',
            transporte_conductor_nombre:  body.transporte_conductor_nombre   || '',
            transporte_conductor_telefono:body.transporte_conductor_telefono || '',
            transporte_placa:             body.transporte_placa              || '',
            transporte_empresa:           body.transporte_empresa            || '',
            transporte_punto_recogida:    body.transporte_punto_recogida     || '',
            transporte_observaciones:     body.transporte_observaciones      || '',
        };

        // Buscar nombre del grado para el snapshot
        let gradoNombreSnapshot = '';
        try {
            const Grado = mongoose.model('Grado');
            const g = await Grado.findById(body.grado_a_matricular);
            gradoNombreSnapshot = g?.grado || '';
        } catch (_) {}

        // En crearMatricula, reemplaza la llamada a construirSnapshot:
const snapshotData = {
    nombre_completo: body.nombre_completo,
    fecha_nacimiento: body.fecha_nacimiento,
    edad: body.edad,
    genero: body.genero,
    id_documento: body.id_documento,
    residencia_direccion: body.residencia_direccion,
    telefono_alumno: body.telefono_alumno,
    escuela_anterior: body.escuela_anterior,
    alergias: body.alergias,
    enfermedades: body.enfermedades,
    medicamentos: body.medicamentos,
    pediatra_nombre: body.pediatra_nombre,
    pediatra_telefono: body.pediatra_telefono,
    vacunas_al_dia: body.vacunas_al_dia,
    contacto_emergencia_nombre: body.contacto_emergencia_nombre,
    contacto_emergencia_telefono: body.contacto_emergencia_telefono,
    encargados,
    usa_transporte: transporteData.usa_transporte,
    ...transporteData,
};
const snapshot = construirSnapshot(snapshotData, gradoNombreSnapshot);

        const primeraMatricula = {
    anio_matricula:     parseInt(body.anio_matricula) || new Date().getFullYear(),
    grado_a_matricular: body.grado_a_matricular,
    fecha_matricula:    new Date(),
    estado_matricula:   body.estado_matricula || 'activa',
    notas:              body.notas || '',
    realizado_por:      body.creado_por || req.user?.email || 'sistema',
    // Sin snapshot — se generará cuando se registre el siguiente año
    snapshot_generado: false,
};
        // Documentos → Drive
        const archivosDoc  = (req.files && req.files['documentos']) ? req.files['documentos'] : [];
        const metaDocRaw   = parsearJSON(body.documentosMeta) || [];
        const docsExistentes = parsearJSON(body.documentos) || [];
        const documentosSubidos = [];
        for (let i = 0; i < archivosDoc.length; i++) {
            const file = archivosDoc[i];
            const tipo = metaDocRaw[i]?.tipo || 'otro';
            const driveData = await subirDocADrive(file, tipo);
            documentosSubidos.push({ tipo, nombre: file.originalname, archivoUrl: driveData.archivoUrl, nombreArchivo: driveData.nombreArchivo });
        }

        const estudianteData = {
            ...body,
            ...imgData,
            ...transporteData,
            historial_matriculas: [primeraMatricula],
            encargados,
            documentos: [...docsExistentes, ...documentosSubidos],
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
        res.status(201).json({ success: true, message: 'Matrícula creada exitosamente.', data: estudiante });

    } catch (error) {
        console.error('Error en crearMatricula:', error);
        if (error.code === 11000 && error.keyPattern?.id_documento) {
            return res.status(400).json({ success: false, message: 'El número de identidad ya está registrado (duplicado).' });
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
// Agregar un nuevo año al historial
// IMPORTANTE: guarda snapshot del estado actual antes de agregar
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

        const anioNuevo = parseInt(anio_matricula);

        const yaExiste = estudiante.historial_matriculas.some(
            m => m.anio_matricula === anioNuevo
        );
        if (yaExiste) {
            return res.status(400).json({
                success: false,
                message: `Este alumno ya tiene una matrícula registrada para el año ${anioNuevo}.`
            });
        }

        // Nombre del grado actual (el que está cerrando) para el snapshot
        let gradoNombreActual = '';
        try {
            const Grado = mongoose.model('Grado');
            const g = await Grado.findById(estudiante.grado_a_matricular);
            gradoNombreActual = g?.grado || '';
        } catch (_) {}

        // Construir snapshot del estado ACTUAL antes de agregar el nuevo año
        const snapshot = construirSnapshot(estudiante, gradoNombreActual);

        // Buscar la entrada del año actual del alumno para guardarle el snapshot
        const anioActualAlumno = estudiante.anio_matricula;
        const entradaActual = estudiante.historial_matriculas.find(
            m => m.anio_matricula === anioActualAlumno
        );

        // Si existe la entrada del año actual y aún no tiene snapshot, agregárselo
        if (entradaActual && !entradaActual.snapshot_generado) {
            Object.keys(snapshot).forEach(k => {
                entradaActual[k] = snapshot[k];
            });
        }

        // Agregar nueva entrada SIN snapshot
        estudiante.historial_matriculas.push({
            anio_matricula:     anioNuevo,
            grado_a_matricular,
            fecha_matricula:    new Date(),
            estado_matricula:   estado_matricula || 'activa',
            notas:              notas || '',
            realizado_por:      realizado_por || req.user?.email || 'sistema',
            snapshot_generado:  false,
        });

        // NO actualizamos grado_a_matricular ni anio_matricula del documento raíz
        estudiante.actualizado_por = realizado_por || req.user?.email || 'sistema';

        // Guardar todo en una sola operación — Mongoose maneja el array completo
        const actualizado = await estudiante.save();

        res.status(200).json({
            success: true,
            message: `Prematrícula ${anioNuevo} registrada. Snapshot del año ${anioActualAlumno} guardado.`,
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
// SOLO modifica: estado_matricula y notas
// El snapshot NUNCA se toca — es la "foto histórica" del año
// ─────────────────────────────────────────────
exports.editarEntradaHistorial = async (req, res) => {
    try {
        const { id, matriculaId } = req.params;
        const { estado_matricula, notas } = req.body;

        // Nota: INTENCIONALMENTE no actualizamos snapshot_* ni grado
        // Solo el estado operativo y notas son editables
        const actualizado = await Estudiante.findOneAndUpdate(
            { _id: id, 'historial_matriculas._id': matriculaId },
            {
                $set: {
                    'historial_matriculas.$.estado_matricula': estado_matricula,
                    'historial_matriculas.$.notas':            notas,
                    'historial_matriculas.$.editado_por':      req.user?.email || 'sistema',
                    'historial_matriculas.$.fecha_edicion':    new Date(),
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
            try { filtro.grado_a_matricular = new mongoose.Types.ObjectId(grado_a_matricular); }
            catch { return res.status(400).json({ success: false, message: 'ID de grado no válido' }); }
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
// ─────────────────────────────────────────────
exports.updateMatricula = async (req, res) => {
    try {
        const body = { ...req.body };
        delete body.historial_matriculas; // Proteger historial

        const imagenFile = req.files && req.files['imagen'] ? req.files['imagen'][0] : null;
        if (imagenFile) {
            const imageSharp = sharp(imagenFile.buffer).resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true });
            const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
            body.imagen      = buf.toString('base64');
            body.tipo_imagen = 'image/jpeg';
        }

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

        // Transporte
        if (body.usa_transporte !== undefined) {
            body.usa_transporte = body.usa_transporte === 'true' || body.usa_transporte === true;
        }

        // Documentos → Drive
        const docsExistentes = parsearJSON(body.documentos) || [];
        const archivosDoc    = (req.files && req.files['documentos']) ? req.files['documentos'] : [];
        const metaDocRaw     = parsearJSON(body.documentosMeta) || [];

        const docsNuevos = [];
        for (let i = 0; i < archivosDoc.length; i++) {
            const file = archivosDoc[i];
            const tipo = metaDocRaw[i]?.tipo || 'otro';
            const driveData = await subirDocADrive(file, tipo);
            docsNuevos.push({ tipo, nombre: file.originalname, archivoUrl: driveData.archivoUrl, nombreArchivo: driveData.nombreArchivo });
        }

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
// ─────────────────────────────────────────────
exports.deleteMatricula = async (req, res) => {
    try {
        const estudiante = await Estudiante.findByIdAndDelete(req.params.id);
        if (!estudiante) return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
        for (const doc of (estudiante.documentos || [])) {
            await eliminarDocDeDrive(doc.archivoUrl);
        }
        res.status(200).json({ success: true, message: 'Matrícula eliminada exitosamente.', data: estudiante });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar la matrícula.', error: error.message });
    }
};