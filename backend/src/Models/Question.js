// models/Question.js
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    answerContent: {
        type: String,
        required: true,
        maxlength: 5000
    },
    // ⭐ Cambiamos a String y ya no es requerido
    answeredBy: { 
        type: String,
        default: 'Admin' 
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
});

const QuestionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 150
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    // ⭐ Cambiamos a String y ya no es requerido
    askedBy: {
        type: String,
        default: 'Anonimo' 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pendiente', 'Respondida'],
        default: 'Pendiente'
    },
    answers: [AnswerSchema]
});

module.exports = mongoose.model('Question', QuestionSchema);