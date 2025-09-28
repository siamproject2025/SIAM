import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import React, { useState } from 'react';

const PrivacyModal = (props) => {
    const [open, setOpen] = React.useState(false);
    const policyText = (
        <p>
           En SIAM, valoramos y respetamos su privacidad. Esta política de privacidad describe cómo recopilamos, utilizamos y protegemos su información personal cuando interactúa con nuestra plataforma dedicada al mundo de la fotografía. Esta incluye la publicación de fotos, concursos, reseñas de libros y podcasts.
            <br/>
            <br/>
            1. Recopilación de Información
            En SIAM, recopilamos la información que usted nos proporciona directamente cuando se registra, participa en concursos, publica fotos, comenta en reseñas de libros o suscribe a nuestros podcasts. Esta información puede incluir su nombre, dirección de correo electrónico, y cualquier otro dato relevante que nos ayude a mejorar su experiencia en nuestra plataforma.

        </p>
    );
    return (
        <>
            <button className="item1" onClick={() => setOpen(true)}>
                SIAM
            </button>
            <Modal  open={open} onClose={() => setOpen(false)} center >
                <h2>Politica de privacidad</h2>
                {policyText}
                
            </Modal>
        </>
    );
};

export default PrivacyModal;