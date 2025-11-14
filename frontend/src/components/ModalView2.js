import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import React, { useState } from 'react';

const PrivacyModal = (props) => {
    const [open, setOpen] = React.useState(false);
    const policyText = (
        <p>
          En S.I.A.M. nos comprometemos a proteger su información personal. Esta política explica cómo manejamos sus datos:
            <br/>
            <br/>
            <strong>Información que recopilamos:</strong>
            <br/>
            Datos personales (nombre, contacto, información académica/laboral)
            Información de uso de la plataforma
            Datos técnicos del dispositivo<br/>
            <strong>Cómo usamos su información:</strong> 
            <br/>
            Para gestionar procesos académicos y administrativos
            Para mejorar nuestra plataforma
            Para comunicarnos sobre servicios importantes
            Para garantizar la seguridad del sistema<br/>
             <strong>Protección de datos:</strong>
            <br/>
            No vendemos ni compartimos su información con terceros no autorizados
            Solo el personal autorizado tiene acceso a los datos necesarios para sus funciones
            Implementamos medidas de seguridad para proteger su información
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