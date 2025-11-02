// Controlador: MatriculaController.js
const Estudiante = require('../Models/Estudiante'); // Importa el Modelo

// 1. Lógica para crear una nueva matrícula
exports.crearMatricula = async (req, res) => {
    try {
        // En un caso real, aquí deberías manejar la subida de la 'ruta_foto_alumno'
        // y validar que todos los campos requeridos estén presentes.

        const nuevoEstudiante = new Estudiante(req.body);
        const estudianteGuardado = await nuevoEstudiante.save();
        
        // Respuesta exitosa
        res.status(201).json({ 
            mensaje: 'Matrícula creada exitosamente', 
            estudiante: estudianteGuardado 
        });
    } catch (error) {
        // Respuesta con error
        res.status(500).json({ 
            mensaje: 'Error al crear la matrícula', 
            error: error.message 
        });
    }
};

// 2. Lógica para obtener todos los estudiantes
exports.obtenerEstudiantes = async (req, res) => {
    try {
        const estudiantes = await Estudiante.find();
        res.status(200).json(estudiantes);
    } catch (error) {
        res.status(500).json({ 
            mensaje: 'Error al obtener estudiantes', 
            error: error.message 
        });
    }
};

// 3. Lógica para obtener un estudiante por ID
exports.obtenerEstudiantePorId = async (req, res) => {
    try {
        const estudiante = await Estudiante.findById(req.params.id);
        if (!estudiante) {
            return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
        }
        res.status(200).json(estudiante);
    } catch (error) {
        res.status(500).json({ 
            mensaje: 'Error al obtener estudiante', 
            error: error.message 
        });
    }
};