// src/components/QuestionItem.jsx

import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Question.css'; // Asegúrate de crear este archivo para los estilos

// 🎯 URL BASE DE TU API
// Debe apuntar al puerto donde corre tu backend (ej: Express)
const API_BASE_URL = 'http://localhost:5000/api'; 

const QuestionItem = ({ question, canAnswer, fetchQuestions }) => {
    const [answerContent, setAnswerContent] = useState('');
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [error, setError] = useState(null);

    const handleAnswerSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!answerContent.trim()) {
            setError("La respuesta no puede estar vacía.");
            return;
        }

        try {
            // 🚀 RUTA FINAL CORREGIDA: Usa la URL base y el endpoint plural '/answers'
            const postUrlCompleto = `${API_BASE_URL}/questions/${question._id}/answers`;
            
            await axios.post(postUrlCompleto, { answerContent }); 
            
            setAnswerContent('');
            setShowAnswerForm(false);
            fetchQuestions(); // Recargar la lista
            // Opcional: Podrías usar una notificación más amigable en lugar de alert
            alert("Respuesta publicada con éxito."); 
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error desconocido al enviar la respuesta.';
            console.error("Error al enviar la respuesta:", err);
            
            // Usamos la URL completa en el mensaje de error para debug
            const rutaEsperada = `${API_BASE_URL}/questions/${question._id}/answers`;
            setError(`❌ Error: ${errorMessage}. (Ruta revisada: ${rutaEsperada})`);
        }
    };

    const isQuestionOpen = question.status === 'Open';

    return (
        <div className="question-item-card">
            <h4>{question.title}</h4>
            <p className="question-content"><strong>Pregunta:</strong> {question.content}</p>
            
            {/* 1. ✅ CORRECCIÓN ID: Accede directamente a la propiedad 'askedBy' (que ahora es String) */}
            <p className="asked-by">
                <em>Preguntado por: {question.askedBy || 'Anónimo'}</em>
            </p>
            
            <p className={`status-badge status-${question.status}`}>
                Estado: **{question.status}**
            </p>
            
            {error && <div className="answer-alert-error">{error}</div>}

            {/* Respuestas */}
            {question.answers.length > 0 && <h5 className="answers-heading">Respuestas:</h5>}
            {question.answers.map((ans, index) => (
                <div key={index} className="answer-container">
                    <p className="answer-content"><strong>Respuesta:</strong> {ans.answerContent}</p>
                    {/* 2. ✅ CORRECCIÓN ID: Accede directamente a la propiedad 'answeredBy' (que ahora es String) */}
                    <p className="answered-by-info">
                        <em>Contestado por: {ans.answeredBy || 'Admin'}</em>
                    </p>
                </div>
            ))}

            {/* Formulario para Responder */}
            {canAnswer && isQuestionOpen && (
                <div className="answer-section">
                    <button className="toggle-answer-btn" onClick={() => setShowAnswerForm(!showAnswerForm)}>
                        {showAnswerForm ? 'Cancelar' : 'Responder'}
                    </button>
                    {showAnswerForm && (
                        <form onSubmit={handleAnswerSubmit} className="answer-form">
                            <textarea
                                placeholder="Escribe tu respuesta aquí..."
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                                required
                                className="answer-textarea"
                            />
                            <button type="submit" className="submit-answer-btn">
                                Enviar Respuesta
                            </button>
                        </form>
                    )}
                </div>
            )}
            {!isQuestionOpen && <p className="closed-info">Esta pregunta ya ha sido respondida. 👍</p>}
        </div>
    );
};

export default QuestionItem;