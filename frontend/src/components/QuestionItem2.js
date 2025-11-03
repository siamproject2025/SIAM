// src/components/QuestionItem.jsx
import React from 'react';

const QuestionItem = ({ question, canAnswer }) => { 
    
    // ⭐ Se eliminó todo el código de estados y handlers relacionados con la respuesta.
    
    return (
        <div className="question-item-card">
            <h4>{question.title}</h4>
            <p className="question-content"><strong>Pregunta:</strong> {question.content}</p>
            
            {/* Preguntado por (muestra el string de prueba del backend) */}
            <p className="asked-by">
                <em>Preguntado por: {question.askedBy || 'Anónimo'}</em>
            </p>
            
            <p className={`status-badge status-${question.status}`}>
                Estado: **{question.status}**
            </p>
            
            {/* Respuestas (SOLO SE MUESTRAN) */}
            {question.answers.length > 0 && <h5 className="answers-heading">Respuestas:</h5>}
            {question.answers.map((ans, index) => (
                <div key={index} className="answer-container">
                    <p className="answer-content"><strong>Respuesta:</strong> {ans.answerContent}</p>
                    {/* Contestado por (muestra el string de prueba del backend) */}
                    <p className="answered-by-info">
                        <em>Contestado por: {ans.answeredBy || 'Admin'}</em>
                    </p>
                </div>
            ))}

        
            
        </div>
    );
};

export default QuestionItem;