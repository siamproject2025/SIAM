// src/components/AccountSettings.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import { IoShieldOutline, IoPersonOutline, IoChevronBackOutline } from 'react-icons/io5'; 
import ChangePasswordLogueado from './ChangePasswordLogueado'; // El
import AccountSetting from './AccountSetting'; 
import './AccountSettings.css'

const AccountSettings = () => {
    // Estado para gestionar qué pestaña está activa: 'profile' o 'security'
    const [activeTab, setActiveTab] = useState('profile'); 
    
    // Función para renderizar el contenido de la pestaña activa
    const renderContent = () => {
        switch (activeTab) {
            case 'security':
                return <ChangePasswordLogueado />; // Componente de cambio de contraseña
            case 'profile':
            default:
                return <AccountSetting />; // Componente de nombre/correo
        }
    };
    
    // Usaremos el estilo de tu dashboard como base visual
    return (
        <div className="account-settings-page container-layout">
            
            {/* Título de la Sección Principal */}
            <div className="header-section">
                {/* Ícono y Título, replicando el estilo de tu barra lateral */}
                <h2 className="page-title">
                    <IoShieldOutline size={28} style={{ marginRight: '10px' }} />
                    Configuración de Cuenta
                </h2>
            </div>
            
            {/* Contenedor Principal con las Pestañas (Tabs) */}
            <div className="settings-content-wrapper">
                
                {/* Columna de Navegación/Pestañas */}
                <div className="settings-sidebar">
                    <button 
                        className={`setting-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <IoPersonOutline size={20} />
                        Información del Perfil
                    </button>
                    
                    <button 
                        className={`setting-tab ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <IoShieldOutline size={20} />
                        Seguridad (Contraseña)
                    </button>
                </div>

                {/* Área de Contenido de la Pestaña */}
                <div className="settings-main-content">
                    {renderContent()}
                </div>
            </div>
            
        </div>
    );
};

export default AccountSettings;