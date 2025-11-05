import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";

// Firebase
import appFirebase from "./components/authentication/Auth";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

// Rutas públicas / privadas
import PrivateRoute from "./components/routes/PrivateRoute";
import PublicRoute from "./components/routes/PublicRoute";

// Layout
import NavBar from "./components/navBar";
import SideBar from "./components/SideBar";
import Footer from "./components/Footer";

// Pantallas públicas
import Landing from "./screens/Landing";
import Login from "./components/authentication/Login";
import ResetPassword from "./components/authentication/ResetPassword";
import ResetPasswordSeguro from "./components/authentication/ResetPasswordFirebase";

// Pantallas privadas
import Home from "./screens/Home";
import Dashboard from "./screens/Dashboard";
import ActividadesPage from "./components/ActividadesPage";
import CalendarioActividades from "./components/CalendarioActividades";
import RestrictedPage from "./screens/RestrictedPage";
import BibliotecaTest from "./components/BibliotecaTest";

// Models
import OrdenCompra from "./screens/Models/ordencompra";
import Bienes from "./screens/Models/Bienes";
import Personal from "./screens/Models/personal";
import Horarios from "./screens/Models/Horarios";
import Proveedores from "./screens/Models/proveedores";
import Donaciones from "./screens/Models/donaciones";
import AsignarRol from "./screens/AsignarRol";

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

    const INACTIVITY_LIMIT = 15 * 60 * 1000;
    const WARNING_TIME = 1 * 60 * 1000;

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
      setWarningVisible(false);

      warningTimer = setTimeout(() => setWarningVisible(true), INACTIVITY_LIMIT - WARNING_TIME);
      inactivityTimer = setTimeout(logoutUser, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    window.addEventListener("storage", resetTimer);
    resetTimer();

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.removeEventListener("storage", resetTimer);
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
    };
  }, [user]);

  return (
    <>
      <div className={`App ${appClass} ${user ? "authenticated" : "unauthenticated"}`}>
        {user && (
          <>
            <NavBar />
            <SideBar />
          </>
        )}

        <Routes>
          {/* Públicas */}
          <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/ResetPassword" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/ResetPasswordSeguro" element={<PublicRoute><ResetPasswordSeguro /></PublicRoute>} />

          {/* Privadas */}
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
            <Route path="/Calendario" element={<CalendarioActividades />} />
          </Route>

          <Route path="/restricted" element={<RestrictedPage />} />
          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>

        {warningVisible && (
          <div
            className="inactivity-warning"
            style={{
              position: "fixed",
              bottom: 20,
              right: 20,
              padding: "15px 20px",
              backgroundColor: "#ffc107",
              color: "#000",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              zIndex: 9999,
            }}
          >
            ⚠️ Sesión inactiva: se cerrará en 1 minuto. Haz clic o presiona cualquier tecla para continuar.
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default App;

