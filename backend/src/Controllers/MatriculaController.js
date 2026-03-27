// ============================================================
// Controllers/MatriculaController.js
//
// CAMBIOS vs versión anterior:
// - crearMatricula:  procesa encargados[], documentos[],
//                    pediatra_nombre/telefono
// - updateMatricula: sincroniza encargados[] y campos legacy
// - agregarMatricula y editarEntradaHistorial: sin cambios
// ============================================================
const Estudiante = require('../Models/Estudiante');
const mongoose   = require('mongoose');
const sharp      = require('sharp');

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

        // Procesar imagen
        const imgData = await procesarImagen(req.file);

        // Primera entrada del historial
        const primeraMatricula = {
            anio_matricula:     parseInt(body.anio_matricula) || new Date().getFullYear(),
            grado_a_matricular: body.grado_a_matricular,
            fecha_matricula:    new Date(),
            estado_matricula:   body.estado_matricula || 'activa',
            notas:              body.notas || '',
            realizado_por:      body.creado_por || req.user?.email || 'sistema'
        };

        // ── Encargados — FIX #1 ─────────────────────────────
        // El frontend puede enviar el array como JSON string (FormData)
        let encargados = parsearJSON(body.encargados) || [];
        // Si no viene el nuevo formato, construir desde campos legacy
        if (!encargados.length) {
            if (body.nombre_encargado) {
                encargados = [{
                    nombre_encargado:       body.nombre_encargado,
                    parentesco_encargado:   body.parentesco_encargado   || 'Otro',
                    id_documento_encargado: body.id_documento_encargado || '',
                    telefono_encargado:     body.telefono_encargado     || '',
                    email_encargado:        body.email_encargado        || '',
                    es_principal:           true,
                }];
            }
        }

        // ── Documentos adjuntos — FIX #5 ────────────────────
        // Los archivos de documentos se pueden recibir como base64
        // en el body (campo documentos JSON) o como req.files
        let documentos = parsearJSON(body.documentos) || [];

        const estudianteData = {
            ...body,
            ...imgData,
            historial_matriculas: [primeraMatricula],
            encargados,
            documentos,
        };

        // Remover campos string del encargado si encargados[] fue procesado
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
// ─────────────────────────────────────────────
exports.updateMatricula = async (req, res) => {
    try {
        const body = { ...req.body };

        // Proteger el historial
        delete body.historial_matriculas;

        // Procesar imagen si viene
        if (req.file) {
            const imageSharp = sharp(req.file.buffer).resize({ width:600, height:600, fit:'inside', withoutEnlargement:true });
            const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
            body.imagen      = buf.toString('base64');
            body.tipo_imagen = 'image/jpeg';
        }

        // ── Encargados — FIX #1 ─────────────────────────────
        const encargados = parsearJSON(body.encargados) || [];
        if (encargados.length > 0) {
            body.encargados = encargados;
            // Sincronizar campos legacy
            const p = encargados.find(e => e.es_principal) || encargados[0];
            body.nombre_encargado       = p.nombre_encargado;
            body.parentesco_encargado   = p.parentesco_encargado;
            body.id_documento_encargado = p.id_documento_encargado;
            body.telefono_encargado     = p.telefono_encargado;
            body.email_encargado        = p.email_encargado;
        }

        // ── Documentos — FIX #5 ─────────────────────────────
        const documentos = parsearJSON(body.documentos);
        if (documentos !== null) body.documentos = documentos;

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
        res.status(200).json({ success: true, message: 'Matrícula eliminada exitosamente.', data: estudiante });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar la matrícula.', error: error.message });
    }
};