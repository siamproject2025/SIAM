import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; 

// 📅 Función de utilidad para formatear la fecha a hora local
const formatToLocalTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
};

// ⏱️ Función para calcular la fecha de eliminación en el frontend
const calculateDate = (duration, unit) => {
    const dur = parseInt(duration);
    if (dur <= 0 || isNaN(dur)) return null;
    
    let milliseconds = 0;

    if (unit === 'minutes') {
        milliseconds = dur * 60 * 1000;
    } else if (unit === 'hours') {
        milliseconds = dur * 60 * 60 * 1000;
    }
    
    return new Date(Date.now() + milliseconds);
};


const QuestionItem = ({ question, canAnswer, fetchQuestions }) => {
    const [answerContent, setAnswerContent] = useState('');
    const [showAnswerForm, setShowAnswerForm] = useState(false);
    const [error, setError] = useState(null);
    const [deleteDuration, setDeleteDuration] = useState(1); 
    const [deleteUnit, setDeleteUnit] = useState('minutes'); 
    
    // Estado para la previsualización de la fecha local
    const [calculatedDeleteDate, setCalculatedDeleteDate] = useState(calculateDate(1, 'minutes')); 

    // Recalcula la fecha cada vez que cambian la duración o la unidad
    useEffect(() => {
        setCalculatedDeleteDate(calculateDate(deleteDuration, deleteUnit));
    }, [deleteDuration, deleteUnit]);
    
    const handleAnswerSubmit = async (e) => {
        // 🛑 SOLUCIÓN AL PROBLEMA DE RECARGA: Prevenir el comportamiento por defecto
        e.preventDefault(); 
        setError(null);

        if (!answerContent.trim()) {
            setError("La respuesta no puede estar vacía.");
            return;
        }
        
        const dur = parseInt(deleteDuration);
        if (dur <= 0 || isNaN(dur)) {
            setError("La duración de eliminación debe ser un número positivo.");
            return;
        }

        try {
            const postUrlCompleto = `${API_BASE_URL}/questions/${question._id}/answers`;
            
            await axios.post(postUrlCompleto, { 
                answerContent, 
                // Asumo que tu backend espera 'userId'
                // userId: /* Tu ID de usuario aquí */, 
                deleteDuration: dur,
                deleteUnit: deleteUnit
            }); 
            
            setAnswerContent('');
            setDeleteDuration(1);
            setDeleteUnit('minutes');
            setShowAnswerForm(false);
            fetchQuestions(); 
            alert("Respuesta publicada con éxito.");
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error desconocido al enviar la respuesta.';
            console.error("Error al enviar la respuesta:", err);
            setError(`Error: ${errorMessage}.`);
        }
    };

    const isQuestionOpen = question.status === 'Pendiente';

    return (
        <div className="question-item-card">
            {/* ✅ CORRECCIÓN 1: Asegura la VISUALIZACIÓN de la pregunta */}
            <h4>{question.title}</h4>
            <p className="question-content"><strong>Pregunta:</strong> {question.content}</p>
            
            <p className="asked-by">
                <em>
                    Preguntado por: {question.askedBy || 'Anónimo'} 
                    {/* Asumiendo que la pregunta tiene un campo createdAt */}
                    {question.createdAt && <span> ({formatToLocalTime(question.createdAt)})</span>}
                </em>
            </p>
            
            <p className={`status-badge status-${question.status}`}>Estado: **{question.status}**</p>
            
            {error && <div className="answer-alert-error">{error}</div>}

            {/* Respuestas */}
            {question.answers.length > 0 && <h5 className="answers-heading">Respuestas:</h5>}
            {question.answers.map((ans, index) => (
                <div key={index} className="answer-container">
                    <p className="answer-content"><strong>Respuesta:</strong> {ans.answerContent}</p>
                    <p className="answered-by-info">
                        <em>
                            Contestado por: {ans.answeredBy || 'Admin'}
                            {/* 🌎 Muestra la fecha de respuesta en hora local */}
                            {ans.answeredAt && <span> el {formatToLocalTime(ans.answeredAt)}</span>}
                            
                            {/* 🌎 Muestra la fecha de eliminación en hora local */}
                            {ans.deleteAt && 
                                <span style={{color: '#dc3545', marginLeft: '10px'}}>
                                    (Se autodestruye: {formatToLocalTime(ans.deleteAt)})
                                </span>
                            }
                        </em>
                    </p>
                </div>
            ))}

            
            {canAnswer && isQuestionOpen && (
                <div className="answer-section">
                    <button className="toggle-answer-btn" onClick={() => setShowAnswerForm(!showAnswerForm)}>
                        {showAnswerForm ? 'Cancelar' : 'Responder'}
                    </button>
                    {showAnswerForm && (
                        // 🛑 Asegura que el onSubmit apunte correctamente a handleAnswerSubmit
                        <form onSubmit={handleAnswerSubmit} className="answer-form">
                            <textarea
                                placeholder="Escribe tu respuesta aquí..."
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                                required
                                className="answer-textarea"
                            />
                            
                            {/* Control de tiempo dinámico */}
                            <div className="delete-time-controls" style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                <label style={{ fontWeight: 'normal' }}>Eliminar respuesta en:</label>
                                <input 
                                    type="number"
                                    value={deleteDuration}
                                    onChange={(e) => setDeleteDuration(e.target.value)}
                                    min="1"
                                    required
                                    style={{ width: '60px', padding: '5px' }}
                                />
                                <select 
                                    value={deleteUnit}
                                    onChange={(e) => setDeleteUnit(e.target.value)}
                                    style={{ padding: '5px' }}
                                >
                                    <option value="minutes">Minutos</option>
                                    <option value="hours">Horas</option>
                                </select>
                            </div>
                            
                            {/* 🌎 Previsualización de la Fecha de Eliminación Local */}
                            {calculatedDeleteDate && (
                                <p style={{ color: '#007bff', fontSize: '0.9em', marginTop: '5px' }}>
                                    Se eliminará a las: **{formatToLocalTime(calculatedDeleteDate.toISOString())}**
                                </p>
                            )}

                            <button type="submit" className="submit-answer-btn" style={{ marginTop: '10px' }}>Enviar Respuesta</button>
                        </form>
                    )}
                </div>
            )}
            {!isQuestionOpen && <p className="closed-info">Esta pregunta ya ha sido respondida. 👍</p>}
        </div>
    );
};

export default QuestionItem;