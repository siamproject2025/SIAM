
import React, { useState } from 'react';
import QuestionList from './QuestionList'; 
import { MessageSquare, X } from 'lucide-react'; 
import useUserRole from './hooks/useUserRole'; 
import '../styles/ChatFlotanteConsultas.css'; 

// Roles que tienen permiso para VER el botón flotante
const ROLES_PERMITIDOS_VISIBILIDAD = ["PADRE", "ADMIN", "DOCENTE"];

const ChatFlotanteConsultas = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const { userRole, cargando } = useUserRole();

    
    if (cargando || !ROLES_PERMITIDOS_VISIBILIDAD.includes(userRole)) {
        return null; 
    }

    // --- Lógica de Permisos Internos ---
    let canAnswerInternally = false;
    let canAskInternally = false;
    let title = "Consultas";

    if (userRole === "ADMIN" || userRole === "DOCENTE") {
        canAnswerInternally = true; //  ADMIN/DOCENTE pueden responder
        canAskInternally = false;  //  ADMIN/DOCENTE no pueden preguntar
        title = "Consultas (Gestión y Respuesta)";
    } else if (userRole === "PADRE") {
        canAnswerInternally = false; // PADRE no puede responder
        canAskInternally = true;     //  PADRE puede preguntar
        title = "Consultas (Solo Preguntas)";
    }
    
    
    return (
        <>
            {/* Botón Flotante */}
            <button 
                className={`floating-btn ${isOpen ? 'is-open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Cerrar Consultas' : 'Abrir Consultas'}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>

            {/* Panel Desplegable */}
            <div className={`chat-panel ${isOpen ? 'is-visible' : 'is-hidden'}`}>
                <div className="chat-header">
                    <h3>💬 {title}</h3>
                    <button onClick={() => setIsOpen(false)} className="close-panel-btn">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="chat-content">
                    {/* 🚀 Pasa los permisos de preguntar y responder a QuestionList */}
                    <QuestionList 
                        canAnswer={canAnswerInternally} 
                        canAsk={canAskInternally}
                    /> 
                </div>
            </div>
        </>
    );
};

export default ChatFlotanteConsultas;