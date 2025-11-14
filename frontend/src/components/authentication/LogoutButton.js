import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import appFirebase from "./Auth";
import { getAuth, signOut } from "firebase/auth";

const auth = getAuth(appFirebase);

const LogoutButton = () => {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('success'); // 'success' o 'error'
  const [message, setMessage] = useState('');

  const showToast = (type, msg) => {
    setNotificationType(type);
    setMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      showToast('success', '¡Sesión cerrada exitosamente!');
      setTimeout(() => navigate('/landing'), 2000);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      showToast('error', 'Hubo un problema al cerrar sesión. Inténtalo de nuevo.');
    }
  };

  return (
    <div>
      <a
        
        className="exitButton"
        onClick={handleLogout}
      >
        Salir
      </a>

      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '16px 24px',
              borderRadius: '12px',
              backgroundColor: notificationType === 'success' ? '#10b981' : '#ef4444',
              color: 'white',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '300px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              {notificationType === 'success' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </motion.div>
            <span style={{ fontSize: '15px', fontWeight: '500' }}>{message}</span>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: "linear" }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                backgroundColor: 'rgba(255,255,255,0.5)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LogoutButton;