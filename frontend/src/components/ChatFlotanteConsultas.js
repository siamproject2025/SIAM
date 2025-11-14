import React, { useState } from 'react';
import QuestionList from './QuestionList';
import { MessageSquare, X } from 'lucide-react';
import useUserRole from './hooks/useUserRole';
import '../styles/ChatFlotanteConsultas.css';

const ROLES_PERMITIDOS_VISIBILIDAD = ["PADRE", "ADMIN", "DOCENTE"];

const ChatFlotanteConsultas = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { userRole, cargando } = useUserRole();

    if (cargando || !ROLES_PERMITIDOS_VISIBILIDAD.includes(userRole)) return null;

    let canAnswerInternally = false;
    let canAskInternally = false;
    let title = "Consultas";

    if (userRole === "ADMIN" || userRole === "DOCENTE") {
        canAnswerInternally = true;
        canAskInternally = false;
    } else if (userRole === "PADRE") {
        canAnswerInternally = false;
        canAskInternally = true;
    }

    return (
        <>
            <button
                className={`floating-btn ${isOpen ? 'is-open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Cerrar Consultas' : 'Abrir Consultas'}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>

            <div className={`chat-panel ${isOpen ? 'is-visible' : 'is-hidden'}`}>
                <div className="chat-header">
                    <h3> {title}</h3>
                    <button onClick={() => setIsOpen(false)} className="close-panel-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="chat-content">
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
