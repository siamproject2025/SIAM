import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "./authentication/Auth";
import { applyActionCode } from "firebase/auth";
import Swal from "sweetalert2";

const VerifyEmail = () => {
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleVerifyEmail = async () => {
      try {
        // Obtener los parámetros de la URL
        const queryParams = new URLSearchParams(location.search);
        const mode = queryParams.get("mode");
        const oobCode = queryParams.get("oobCode");

        console.log("📍 Verificando email con código:", oobCode);

        if (!oobCode) {
          throw new Error("No se encontró código de verificación");
        }

        // Aplicar la verificación
        await applyActionCode(auth, oobCode);
        
        // ✅ SI LLEGAMOS AQUÍ, LA VERIFICACIÓN FUE EXITOSA
        console.log("✅ Verificación exitosa!");
        
        setMessage("¡Correo verificado exitosamente!");
        setVerifying(false);
        
        // Cerrar sesión por seguridad
        await auth.signOut();
        
        // Mostrar mensaje de éxito
        Swal.fire({
          icon: 'success',
          title: '¡Email verificado!',
          text: 'Tu correo ha sido verificado correctamente. Ya puedes iniciar sesión.',
          timer: 3000,
          showConfirmButton: false
        });

        // Redirigir al login
        setTimeout(() => {
          navigate("/login");
        }, 3000);

      } catch (error) {
        // ❌ SOLO LLEGAMOS AQUÍ SI HUBO ERROR
        console.error("❌ Error en verificación:", error.code, error.message);
        /*
        // Manejar errores específicos
        if (error.code === 'auth/expired-action-code') {
          setError("El enlace de verificación ha expirado (válido por 1 hora). Solicita uno nuevo.");
        } else if (error.code === 'auth/invalid-action-code') {
          setError("El enlace de verificación ya fue usado o es inválido.");
        } else if (error.code === 'auth/user-disabled') {
          setError("Esta cuenta ha sido deshabilitada.");
        } else if (error.code === 'auth/user-not-found') {
          setError("Usuario no encontrado.");
        } else {
          setError(`Error al verificar: ${error.message}`);
        }
        
        setVerifying(false);
        
        Swal.fire({
          icon: 'error',
          title: 'Error de verificación',
          text: error.code === 'auth/expired-action-code' 
            ? 'El enlace ha expirado' 
            : 'El enlace es inválido o ya fue usado',
          confirmButtonText: 'Ir al login'
        }).then(() => {
          
        });*/
      }
      navigate("/login");
    };

    handleVerifyEmail();
  }, [location, navigate]);

  // Renderizado (igual que antes)
  return (
    <div className="verify-email-container" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="verify-email-card" style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>
          Verificación de Correo Electrónico
        </h2>
        
        {verifying ? (
          <div className="verifying">
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>Verificando tu correo electrónico...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p style={{ color: '#f44336', margin: '20px 0' }}>{error}</p>
            <button 
              onClick={() => navigate("/login")}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 30px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              Ir al login
            </button>
          </div>
        ) : (
          <div className="success-message">
            <p style={{ color: '#4CAF50', margin: '20px 0' }}>{message}</p>
            <button 
              onClick={() => navigate("/login")}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '10px 30px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              Ir al login
            </button>
          </div>
        )}
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VerifyEmail;