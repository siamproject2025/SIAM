import React, { useState, useEffect } from 'react';
import axios from 'axios';
import QuestionItem from './QuestionItem';
import Notification from './Notification'; 
import { auth } from "..//components/authentication/Auth";

const API_URL = process.env.REACT_APP_API_URL+'/api';

const QuestionList = ({ canAnswer, canAsk }) => {
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ title: '', content: '' });
    const [error, setError] = useState(null);
    
    //  NUEVO ESTADO: Para manejar la notificación
    const [notification, setNotification] = useState(null); 

    useEffect(() => {
        fetchQuestions();
    }, []);

   
    const fetchQuestions = async () => {
    try {
        //  Obtener el usuario actual
        const user = auth.currentUser;
        if (!user) {
            setError("Usuario no autenticado");
            return;
        }

        //  Obtener token JWT del usuario
        const token = await user.getIdToken();

        //  Hacer la solicitud GET enviando el token en el header Authorization
        const res = await axios.get(`${API_URL}/questions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        //  Guardar preguntas en estado
        setQuestions(res.data);
        setError(null);
    } catch (err) {
        console.error("Error al obtener preguntas:", err);
        setError('No se pudieron cargar las preguntas.');
    }
};

    //  FUNCIÓN PARA CERRAR LA NOTIFICACIÓN
    const closeNotification = () => setNotification(null);

    const handleNewQuestionSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    closeNotification(); // Cierra cualquier notificación anterior

    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
        setError("El título y el contenido no pueden estar vacíos.");
        return;
    }

    try {
        //  Obtener token JWT del usuario autenticado
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");
        const token = await user.getIdToken();

        await axios.post(`${API_URL}/questions`, newQuestion, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setNewQuestion({ title: '', content: '' });
        fetchQuestions();
        
        //  Notificación de éxito
        setNotification({
            message: "¡Pregunta publicada con éxito!",
            type: 'success'
        });
        
    } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Error desconocido al crear la pregunta.';
        //  Notificación de error
        setNotification({
            message: `Error al publicar: ${errorMessage}.`,
            type: 'error'
        });
        setError(`Error al publicar: ${errorMessage}.`);
    }
};


    return (
        <div className="question-list-container">
            
            {/*  RENDERIZADO DEL COMPONENTE NOTIFICACIÓN */}
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={closeNotification}
                    duration={4000} // Duración para que se oculte automáticamente (4 segundos)
                />
            )}
            
            {error && <div className="alert-error">{error}</div>}

            {canAsk && (
                <div className="new-question-form-card">
                    <h3>Hacer una nueva pregunta </h3>
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
                            //  PASAMOS LA FUNCIÓN PARA MOSTRAR NOTIFICACIONES
                            setGlobalNotification={setNotification} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default QuestionList;