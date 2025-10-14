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

import RestrictedPage from './screens/RestrictedPage';
import Dashboard from './screens/Dashboard';

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
    <> {/* Se movio al index el authprovider y el router que envuelve la app*/}
       <div  className={`App ${appClass} ${user ? 'authenticated' : 'unauthenticated'}`}>
              {/* Renderiza NavBar solo si el usuario está autenticado */}
              
              {user && <><NavBar />{/*<Sidebar/>*/}</>}
              <Routes>
                {/* Rutas públicas */}
                <Route path="/landing" element={<PublicRoute> <Landing /> </PublicRoute>}/>
                <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
                {/* Rutas privadas */}
                <Route element={<PrivateRoute allowedRoles={["PADRE", "ADMIN", "DOCENTE"]}/>}>
                  <Route path="/home" element={<Home />} />

                  <Route path='/ordencompra' element={<OrdenCompra />} />
                  <Route path='/Bienes' element={<Bienes />} />

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
