// routes/questions.js
const express = require('express');
const router = express.Router();
const Question = require('../Models/Question'); // Asegúrate de que la ruta sea correcta
const { authenticateUser } = require('../middleware/authMiddleWare');


router.use(authenticateUser);
// Ruta POST para crear una nueva pregunta
router.post('/', async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // ⭐ NO NECESITAMOS VALIDAR askedBy, Mongoose asignará el 'default'
        // definido en el modelo si no se envía.

        const newQuestion = new Question({
            title,
            content,
            // askedBy: 'Usuario de Prueba' // Esto ya lo hace el modelo con 'default'
        });

        const question = await newQuestion.save();
        res.status(201).json(question);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor al crear la pregunta');
    }
});

// Ruta POST para añadir una respuesta a una pregunta
router.post('/:id/answers', async (req, res) => {
    try {
        const { answerContent } = req.body;
        
        // ⭐ El answeredBy se lo asignamos aquí manualmente para evitar que Mongoose
        // use el default del QuestionSchema (que es para preguntas, no respuestas).
        const newAnswer = {
            answerContent,
            answeredBy: 'Admin', // ⭐ Valor estático
            answeredAt: new Date()
        };

        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ msg: 'Pregunta no encontrada' });
        }

        question.answers.push(newAnswer);
        question.status = 'Respondida'; // Actualizar estado al responder
        
        await question.save();
        res.json(question.answers[question.answers.length - 1]); // Devolver la respuesta creada
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor al crear la respuesta');
    }
});

//  Ruta GET para obtener todas las preguntas (necesaria para el fetchQuestions del frontend)
router.get('/', async (req, res) => {
    try {
        const questions = await Question.find().sort({ createdAt: -1 });
        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor al obtener las preguntas');
    }
});

module.exports = router;