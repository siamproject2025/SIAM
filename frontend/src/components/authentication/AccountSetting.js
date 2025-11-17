import React, { useState } from 'react';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';

const AccountSetting = () => {
    const auth = getAuth();
    const user = auth.currentUser;

    // Estados para los campos del formulario
    const [newName, setNewName] = useState(user?.displayName || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    
    // Estado para manejo de mensajes
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!user) {
            setError('Error: Usuario no logueado.');
            return;
        }

        try {
            const updates = [];

            // 1. CAMBIAR NOMBRE (DISPLAY NAME)
            if (newName !== user.displayName) {
                updates.push(updateProfile(user, { displayName: newName }));
            }

            // 2. CAMBIAR CORREO ELECTRÓNICO
            if (newEmail !== user.email) {
                // Validación básica de formato de correo
                if (!newEmail.includes('@') || !newEmail.includes('.')) {
                    setError('Formato de correo electrónico no válido.');
                    return;
                }
                
                // Ejecuta la actualización del correo
                updates.push(updateEmail(user, newEmail));
            }
            
            // Espera a que se completen todas las actualizaciones
            if (updates.length > 0) {
                await Promise.all(updates);
                
                // Si el correo fue actualizado, Firebase envía un correo de verificación.
                if (newEmail !== user.email) {
                    setMessage('Correo actualizado. Por favor, revisa tu nueva dirección para verificar el cambio. Nombre de usuario actualizado.');
                } else {
                    setMessage('Nombre de usuario actualizado correctamente.');
                }
                
            } else {
                setMessage('No hay cambios para guardar.');
            }

        } catch (err) {
            console.error(err);
            // Manejo del error de re-autenticación (frecuente para updateEmail)
            if (err.code === 'auth/requires-recent-login') {
                setError('Error de seguridad: Debes re-autenticarte para cambiar tu correo. Por favor, inicia sesión de nuevo y vuelve a intentarlo.');
            } else {
                setError('Error al actualizar: ' + err.message);
            }
        }
    };

    return (
        <div className="account-settings-page">
            <h2>⚙️ Gestión de Perfil</h2>
            <p>Actualiza tu nombre y correo electrónico.</p>
            
            <form onSubmit={handleSubmit} className="profile-form">
                
                {/* Campo para el Nombre */}
                <label>
                    Nombre de Usuario:
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nombre de Usuario"
                        required
                    />
                </label>

                {/* Campo para el Correo */}
                <label>
                    Correo Electrónico:
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Correo Electrónico"
                        required
                    />
                </label>

                <button type="submit">Guardar Cambios</button>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default AccountSetting;