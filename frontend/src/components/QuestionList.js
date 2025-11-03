import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionItem from './QuestionItem';

const API_BASE_URL = 'http://localhost:5000/api';

const QuestionList = ({ canAnswer, canAsk }) => {
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/questions`);
            setQuestions(res.data);
            setError(null);
        } catch (err) {
            console.error("Error al obtener preguntas:", err);
            setError('No se pudieron cargar las preguntas.');
        }
    };

    const handleNewQuestionSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
            setError("El título y el contenido no pueden estar vacíos.");
            return;
        }

        try {
            await axios.post(`${API_BASE_URL}/questions`, newQuestion);
            setNewQuestion({ title: '', content: '' });
            fetchQuestions();
            alert("¡Pregunta publicada con éxito!");
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error desconocido al crear la pregunta.';
            setError(`Error al publicar: ${errorMessage}.`);
        }
    };

    return (
        <div className="question-list-container">
            <h2>Módulo de Consultas</h2>

            {error && <div className="alert-error">{error}</div>}

            {canAsk && (
                <div className="new-question-form-card">
                    <h3>Hacer una nueva pregunta ❓</h3>
                    <form onSubmit={handleNewQuestionSubmit}>
                        <input
                            type="text"
                            placeholder="Título de la pregunta"
                            value={newQuestion.title}
                            onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Contenido o detalles de la pregunta"
                            value={newQuestion.content}
                            onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                            required
                        />
                        <button type="submit">Publicar Pregunta</button>
                    </form>
                </div>
            )}

            <h3>Preguntas Recientes</h3>
            <div className="questions-list">
                {questions.length === 0 && !error ? (
                    <p>No hay preguntas publicadas aún.</p>
                ) : (
                    questions.map((q) => (
                        <QuestionItem
                            key={q._id}
                            question={q}
                            canAnswer={canAnswer}
                            fetchQuestions={fetchQuestions}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default QuestionList;
