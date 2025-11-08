const Question = require('../Models/Question');

exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.find().sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Error al obtener las preguntas", error });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        const newQuestion = new Question({ title, content });
        const question = await newQuestion.save();
        res.status(201).json(question);
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: "Error al crear la pregunta", error });
    }
};

exports.addAnswer = async (req, res) => {
    try {
        // 💡 CAPTURAMOS LA DURACIÓN Y LA UNIDAD
        const { answerContent, userId, deleteDuration, deleteUnit } = req.body;
        const question = await Question.findById(req.params.id);

        if (!question) return res.status(404).json({ message: 'Pregunta no encontrada' });
        if (!userId) return res.status(401).json({ message: "ID de usuario requerido" });

        // --- LÓGICA DE CÁLCULO DE TIEMPO DINÁMICO ---
        let deleteAt = null;

        if (deleteDuration > 0 && deleteUnit) {
            let milliseconds;

            if (deleteUnit === 'minutes') {
                milliseconds = deleteDuration * 60 * 1000;
            } else if (deleteUnit === 'hours') {
                milliseconds = deleteDuration * 60 * 60 * 1000;
            } else {
                // Manejo de unidad no válida o por defecto (ej: 7 días)
                milliseconds = 7 * 24 * 60 * 60 * 1000; 
            }
            
            deleteAt = new Date(Date.now() + milliseconds);
        }
        // Si no se especifica duración, 'deleteAt' sigue siendo null
        // -----------------------------------------------------------

        const newAnswer = {
            answerContent,
            answeredBy: userId,
            answeredAt: new Date(),
            // 💡 Asignamos el valor calculado
            deleteAt: deleteAt 
        };

        question.answers.push(newAnswer);
        question.status = 'Respondida';
        await question.save();

        const updatedQuestion = await Question.findById(question._id);
        res.json(updatedQuestion);

    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: "Error al agregar la respuesta", error });
    }
};