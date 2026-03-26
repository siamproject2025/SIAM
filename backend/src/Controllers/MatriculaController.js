// Controllers/MatriculaController.js
const Estudiante = require('../Models/Estudiante');
const mongoose   = require('mongoose');
const sharp      = require('sharp');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const procesarImagen = async (file) => {
    if (!file) return { imagen: null, tipo_imagen: null };

    let imageSharp = sharp(file.buffer).resize(600, 600, { fit: 'inside' });

    if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
        const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
        return { imagen: buf.toString('base64'), tipo_imagen: 'image/jpeg' };
    } else if (file.mimetype === 'image/webp') {
        const buf = await imageSharp.webp({ quality: 60 }).toBuffer();
        return { imagen: buf.toString('base64'), tipo_imagen: 'image/webp' };
    } else {
        const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
        return { imagen: buf.toString('base64'), tipo_imagen: 'image/jpeg' };
    }
};

// ─────────────────────────────────────────────
// POST /api/matriculas
// Crear nuevo alumno con su primera matrícula
// ─────────────────────────────────────────────
exports.crearMatricula = async (req, res) => {
    try {
        const { id_documento, anio_matricula, grado_a_matricular,
                estado_matricula, notas, creado_por } = req.body;

        // Verificar duplicado
        const existe = await Estudiante.findOne({ id_documento });
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
            anio_matricula:     parseInt(anio_matricula) || new Date().getFullYear(),
            grado_a_matricular: grado_a_matricular,
            fecha_matricula:    new Date(),
            estado_matricula:   estado_matricula || 'activa',
            notas:              notas || '',
            realizado_por:      creado_por || req.user?.email || 'sistema'
        };

        const estudianteData = {
            ...req.body,
            ...imgData,
            historial_matriculas: [primeraMatricula]
        };

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
        res.status(500).json({
            success: false,
            message: 'Error al crear la matrícula.',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────
// POST /api/matriculas/:id/matricular
// Agregar un nuevo año al historial del alumno
// SIN sobreescribir los años anteriores.
// ─────────────────────────────────────────────
exports.agregarMatricula = async (req, res) => {
    try {
        const { id } = req.params;
        const { anio_matricula, grado_a_matricular, estado_matricula,
                notas, realizado_por } = req.body;

        if (!anio_matricula || !grado_a_matricular) {
            return res.status(400).json({
                success: false,
                message: 'El año de matrícula y el grado son requeridos.'
            });
        }

        const estudiante = await Estudiante.findById(id);
        if (!estudiante) {
            return res.status(404).json({
                success: false,
                message: 'Estudiante no encontrado.'
            });
        }

        // Verificar si ya existe una matrícula para ese año
        const yaExiste = estudiante.historial_matriculas.some(
            m => m.anio_matricula === parseInt(anio_matricula)
        );
        if (yaExiste) {
            return res.status(400).json({
                success: false,
                message: `Este alumno ya tiene una matrícula registrada para el año ${anio_matricula}. Edítala desde el historial.`
            });
        }

        // Nueva entrada de historial
        const nuevaEntrada = {
            anio_matricula:     parseInt(anio_matricula),
            grado_a_matricular: grado_a_matricular,
            fecha_matricula:    new Date(),
            estado_matricula:   estado_matricula || 'activa',
            notas:              notas || '',
            realizado_por:      realizado_por || req.user?.email || 'sistema'
        };

        // $push agrega sin tocar los elementos existentes
        // También actualizamos los campos "actuales" del alumno
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
        res.status(500).json({
            success: false,
            message: 'Error al registrar la matrícula.',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────
// PUT /api/matriculas/:id/historial/:matriculaId
// Editar UNA entrada específica del historial
// (solo estado, notas — no cambia año ni grado)
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
            return res.status(404).json({
                success: false,
                message: 'Entrada de historial no encontrada.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Entrada del historial actualizada.',
            data: actualizado
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al editar el historial.',
            error: error.message
        });
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

        res.status(200).json({
            success: true,
            count: estudiantes.length,
            data: estudiantes
        });
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
        if (!estudiante) {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
        }
        res.status(200).json({ success: true, data: estudiante });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener la matrícula', error: error.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/matriculas/:id
// Actualizar expediente del alumno (datos personales,
// médicos, encargado — NO toca el historial)
// ─────────────────────────────────────────────
exports.updateMatricula = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // No permitir sobreescribir el historial por accidente
        delete updateData.historial_matriculas;

        if (req.file) {
            let imageSharp = sharp(req.file.buffer).resize({
                width: 600, height: 600, fit: 'inside', withoutEnlargement: true
            });
            const buf = await imageSharp.jpeg({ quality: 60 }).toBuffer();
            updateData.imagen      = buf.toString('base64');
            updateData.tipo_imagen = 'image/jpeg';
        }

        const estudiante = await Estudiante.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!estudiante) {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Datos del estudiante actualizados exitosamente.',
            data: estudiante
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar la matrícula.',
            error: error.message
        });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/matriculas/:id
// ─────────────────────────────────────────────
exports.deleteMatricula = async (req, res) => {
    try {
        const estudiante = await Estudiante.findByIdAndDelete(req.params.id);
        if (!estudiante) {
            return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
        }
        res.status(200).json({
            success: true,
            message: 'Matrícula eliminada exitosamente.',
            data: estudiante
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la matrícula.',
            error: error.message
        });
    }
};