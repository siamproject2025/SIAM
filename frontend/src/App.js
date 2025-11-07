import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from "react";
import PrivateRoute from "./components/routes/PrivateRoute";
import appFirebase from "./components/authentication/Auth";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import axios from "axios";
import NavBar from './components/navBar';
import Login from './components/authentication/Login';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Landing from "./screens/Landing";
import Home from "./screens/Home";
import Footer from './components/Footer';
import PublicRoute from './components/routes/PublicRoute';
import BibliotecaTest from './components/BibliotecaTest';


//Models
import OrdenCompra from './screens/Models/ordencompra';
import Bienes from './screens/Models/Bienes';
import Personal from './screens/Models/personal';
import Horarios from './screens/Models/Horarios';
import Matricula from './screens/Models/Matricula';
import Directiva from './screens/Models/directiva'; // ← Cambiado a mayúscula
import Proveedores from './screens/Models/proveedores';
import Donaciones from './screens/Models/donaciones';
import RestrictedPage from './screens/RestrictedPage';
import Dashboard from './screens/Dashboard';
import AsignarRol from './screens/AsignarRol';
import ResetPassword from './components/authentication/ResetPassword';
import ResetPasswordSeguro from './components/authentication/ResetPasswordFirebase';
import SideBar from './components/SideBar';
import ActividadesPage from './components/ActividadesPage';
import CalendarioActividades from './components/CalendarioActividades';
import ChatFlotanteConsultas from './components/ChatFlotanteConsultas';


const auth = getAuth(appFirebase);

function App() {
  const [user, setUser] = useState(null);
  const [warningVisible, setWarningVisible] = useState(false);

  const location = useLocation();
  const appClass = location.pathname === "/login" ? "no-margin" : "with-margin";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userFirebase) => {
      setUser(userFirebase || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  if (!user) return;

  const INACTIVITY_LIMIT = 15* 60 * 1000; // 15 minutos
  const WARNING_TIME = 1 * 60 * 1000; // 1 minuto antes

  let inactivityTimer;
  let warningTimer;

  const logoutUser = async () => {
    try {
      await axios.post("/api/auth/revoke-token", { uid: user.uid });
    } catch (error) {
      console.error("Error revocando token:", error);
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error cerrando sesión en Firebase:", error);
    }

    window.location.href = "/login";
  };

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    setWarningVisible(false); // oculta el aviso inmediatamente

    // mostrar aviso 1 min antes
    warningTimer = setTimeout(() => {
      setWarningVisible(true);
    }, INACTIVITY_LIMIT - WARNING_TIME);

    // cerrar sesión al llegar al límite
    inactivityTimer = setTimeout(() => {
      logoutUser();
    }, INACTIVITY_LIMIT);
  };

  // Escucha de actividad del usuario
  const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
  activityEvents.forEach((event) => window.addEventListener(event, resetTimer));

  // sincroniza con otras pestañas
  window.addEventListener("storage", resetTimer);

  resetTimer(); // inicializa al entrar

  return () => {
    activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    window.removeEventListener("storage", resetTimer);
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
  };
}, [user]);


return (
  <>
    <div className={`App ${appClass} ${user ? 'authenticated' : 'unauthenticated'}`}>
      {/* Renderiza NavBar solo si el usuario está autenticado */}
      {user && <NavBar />}
        <ChatFlotanteConsultas></ChatFlotanteConsultas>
      <div className="app-content">
        {user && <SideBar />}
<ChatFlotanteConsultas />
        <main className="main-content">
        <Routes>
        {/* Rutas públicas */}
        <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/ResetPassword" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/ResetPasswordSeguro" element={<PublicRoute><ResetPasswordSeguro /></PublicRoute>} />

        {/* Rutas privadas */}
        <Route element={<PrivateRoute allowedRoles={["PADRE", "ADMIN", "DOCENTE"]} />}>
          <Route path="/home" element={<Home />} />
          <Route path="/ordencompra" element={<OrdenCompra />} />
          <Route path="/Bienes" element={<Bienes />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/seguridad" element={<AsignarRol />} />
          <Route path="/donaciones" element={<Donaciones />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Actividades" element={<ActividadesPage />} />
          <Route path="/biblioteca" element={<BibliotecaTest />} />
          <Route path="/horarios" element={<Horarios />} />
          <Route path="/Calendario" element={<CalendarioActividades />} />
          <Route path="/directiva" element={<Directiva />} />  
          <Route path="/admisiones" element={<Matricula />} />                              
        </Route>

        <Route element={<PrivateRoute allowedRoles={["", "ADMIN", "DOCENTE"]} />}>
          <Route path="/home" element={<Home />} />
        </Route>


        <Route path="/restricted" element={<RestrictedPage />} />

        {/* Redirigir rutas desconocidas */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
          </main>
        </div>

        <Footer />
      {/* Advertencia de inactividad */}
      {warningVisible && (
        <div
          className="inactivity-warning"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            padding: '15px 20px',
            backgroundColor: '#ffc107',
            color: '#000',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 9999,
          }}
        >
          ⚠️ Sesión inactiva: se cerrará en 1 minuto. Haz clic o presiona cualquier tecla para continuar.
        </div>
      )}
    </div>

    
  </>
);

// src/App.js
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Grados
import GradosIndex from "./pages/grados/GradosIndex";
import GradosForm from "./pages/grados/GradosForm";

// Opcional
import Footer from "./components/Footer";

// Asegúrate de tener src/ErrorBoundary.jsx export default
import ErrorBoundary from "./ErrorBoundary";

export default function App() {
  return (
    <>
      <div className="App with-margin unauthenticated">
        <ErrorBoundary>
          <Routes>
            {/* Listado */}
            <Route path="/grados" element={<GradosIndex />} />

            {/* Formularios */}
            <Route path="/grados/nuevo" element={<GradosForm />} />
            <Route path="/grados/:id" element={<GradosForm />} />
            <Route path="/grados/:id/editar" element={<GradosForm />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/grados" replace />} />
          </Routes>
        </ErrorBoundary>
      </div>

      {/* Quita el Footer si no lo necesitas ahora */}
      <Footer />
    </>
  );
}

