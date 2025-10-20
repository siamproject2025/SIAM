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

//Models
import OrdenCompra from './screens/Models/ordencompra';
import Bienes from './screens/Models/Bienes';
import Personal from './screens/Models/personal';

import Proveedores from './screens/Models/proveedores';
import Donaciones from './screens/Models/donaciones';
import RestrictedPage from './screens/RestrictedPage';
import Dashboard from './screens/Dashboard';
import AsignarRol from './screens/AsignarRol';
import ResetPassword from './components/authentication/ResetPassword';
import ResetPasswordSeguro from './components/authentication/ResetPasswordFirebase';
import SideBar from './components/SideBar';

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
    if (!user) return; // solo activa timers si hay usuario

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos
    const WARNING_TIME = 1 * 60 * 1000; // 1 minuto antes
    let inactivityTimer;
    let warningTimer;

    const logoutUser = async () => {
      try {
        // Llamada al backend para revocar token
        await axios.post("/api/auth/revoke-token", { uid: user.uid });
      } catch (error) {
        console.error("Error revocando token en backend:", error);
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

      // Mostrar aviso 1 minuto antes
      warningTimer = setTimeout(() => setWarningVisible(true), INACTIVITY_LIMIT - WARNING_TIME);

      // Cerrar sesión al llegar al límite
      inactivityTimer = setTimeout(() => logoutUser(), INACTIVITY_LIMIT);
      setWarningVisible(false);
    };

    // Escuchar actividad
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("scroll", resetTimer);

    // Sincronizar múltiples pestañas
    window.addEventListener("storage", resetTimer);

    resetTimer(); // inicializa timer al montar

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("storage", resetTimer);
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
    };
  }, [user]);

  return (
    <>
      <div className={`App ${appClass} ${user ? 'authenticated' : 'unauthenticated'}`}>
        {user && <><NavBar /><SideBar/></>}

        {warningVisible && (
          <div className="inactivity-warning" style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            padding: '15px 20px',
            backgroundColor: '#ffc107',
            color: '#000',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            zIndex: 9999
          }}>
            ⚠️ Sesión inactiva: se cerrará en 1 minuto. Haz clic o presiona cualquier tecla para continuar.
          </div>
        )}

        <Routes>
          {/* Rutas públicas */}
          <Route path="/landing" element={<PublicRoute> <Landing /> </PublicRoute>} />
          <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
          <Route path='/ResetPassword' element={<PublicRoute> <ResetPassword/> </PublicRoute>} />
          <Route path='/ResetPasswordSeguro' element={<PublicRoute> <ResetPasswordSeguro/> </PublicRoute>} />


          {/* Rutas privadas */}
          <Route element={<PrivateRoute allowedRoles={["PADRE", "ADMIN", "DOCENTE"]}/>}>
            <Route path="/home" element={<Home />} />
            <Route path='/ordencompra' element={<OrdenCompra />} />
            <Route path='/Bienes' element={<Bienes />} />
            <Route path='/personal' element={<Personal />} />
           
            <Route path='/proveedores' element={<Proveedores />} />
            <Route path='/seguridad' element={<AsignarRol />} />
            <Route path='/donaciones' element={<Donaciones />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route path="/restricted" element={<RestrictedPage />} />

          {/* Redirigir rutas desconocidas */}
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;