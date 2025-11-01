const Question = require('../Models/Question'); // Asegúrate de que la ruta sea correcta

// Obtener todas las preguntas y sus respuestas
exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.find()
            // Popula los campos de usuario para mostrar nombres
            .populate('askedBy', 'username') 
            .populate('answers.answeredBy', 'username') 
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Error al obtener las preguntas", error });
    }
};

// Crear una nueva pregunta
// ⚠️ IMPORTANTE: Espera que el 'userId' venga en el cuerpo de la petición (req.body) desde el Frontend.
exports.createQuestion = async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        
       
        const newQuestion = new Question({
            title,
            content
            // Usamos el userId enviado desde el frontend
            
        });

        const question = await newQuestion.save();
        res.status(201).json(question);
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: "Error al crear la pregunta", error });
    }
};

// Agregar una respuesta a una pregunta
// ⚠️ IMPORTANTE: Espera que el 'userId' venga en el cuerpo de la petición (req.body) desde el Frontend.
exports.addAnswer = async (req, res) => {
    try {
        const { answerContent, userId } = req.body;
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Pregunta no encontrada' });
        }
        
        // Verificación de existencia del userId
        if (!userId) {
            return res.status(401).json({ message: "ID de usuario requerido para enviar la respuesta." });
        }

        const newAnswer = {
            answerContent,
            // Usamos el userId enviado desde el frontend
            answeredBy: userId, 
            answeredAt: new Date()
        };

        question.answers.push(newAnswer);
        question.status = 'Answered'; 
        
        await question.save();
        
        // Recargar la pregunta con los campos populados para devolver la info completa al frontend
        const updatedQuestion = await Question.findById(question._id)
            .populate('askedBy', 'username')
            .populate('answers.answeredBy', 'username');

        res.json(updatedQuestion);

    } catch (error) {
        console.error(error.message);
        res.status(400).json({ message: "Error al agregar la respuesta", error });
    }
};

