//Prueba
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
import Home from "./screens/Models/Dashboard/Home";
import PublicRoute from './components/routes/PublicRoute';
import BibliotecaTest from './components/BibliotecaTest';
import CrearRol from './screens/Models/CreacionRol/CrearRol';

//Models
import OrdenCompra from './screens/Models/OrdenCompra/ordencompra';
import Bienes from './screens/Models/Bienes/Bienes';
import Personal from './screens/Models/Personas/personal';
import Horarios from './screens/Models/Matriculas/Horarios';
import Matricula from './screens/Models/Matriculas/Matricula';
import Directiva from './screens/Models/Personas/directiva';
import Proveedores from './screens/Models/Personas/proveedores';
import Donaciones from './screens/Models/donaciones';
import RestrictedPage from './screens/RestrictedPage';
import Dashboard from './screens/Models/Dashboard/Dashboard';
import AsignarRol from './screens/Models/Dashboard/AsignarRol';
import ResetPassword from './components/authentication/ResetPassword';
import ResetPasswordSeguro from './components/authentication/ResetPasswordFirebase';
import SideBar from './components/SideBar';
import ActividadesPage from './components/Actividades/ActividadesPage';
import CalendarioActividades from './components/Actividades/CalendarioActividades';
import ChatFlotanteConsultas from './components/ChatFlotanteConsultas';
import GradosPage from './screens/Models/Matriculas/grados';
import AccountSettings from './components/authentication/AccountSettings';
import ChangePasswordLogueado from './components/authentication/ChangePasswordLogueado';
import Bitacora from './screens/Models/Bitacora/Bitacora';
import VerifyEmail from './components/VerifyEmail';
import SolicitudesPanel from "./components/authentication/SolicitudesPanel";
import CambiarPasswordObligatorio from './components/authentication/CambiarPasswordObligatorio';

const auth = getAuth(appFirebase);
const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser]                     = useState(null);
  const [warningVisible, setWarningVisible] = useState(false);

  const location = useLocation();
  const appClass = location.pathname === "/login" ? "no-margin" : "with-margin";

  // ── ¿Estamos en cambiar-password? Renderizar sin layout ──
  const esCambiarPassword = location.pathname === "/cambiar-password";

  // ── Auth state ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userFirebase) => {
      setUser(userFirebase || null);
    });
    return () => unsubscribe();
  }, []);

  // ── Inactividad ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000;
    const WARNING_TIME     = 1  * 60 * 1000;

    let inactivityTimer;
    let warningTimer;

  
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      setWarningVisible(false);

      warningTimer = setTimeout(() => {
        setWarningVisible(true);
      }, INACTIVITY_LIMIT - WARNING_TIME);

      /*inactivityTimer = setTimeout(() => {
        logoutUser();
      }, INACTIVITY_LIMIT);*/
    };

    const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));
    window.addEventListener("storage", resetTimer);
    resetTimer();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener("storage", resetTimer);
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
    };
  }, [user]);

  // ── Pantalla de cambio obligatorio — sin NavBar ni SideBar ──
  if (esCambiarPassword) {
    return (
      <Routes>
        <Route path="/cambiar-password" element={<CambiarPasswordObligatorio />} />
      </Routes>
    );
  }

  // ── Render normal con layout completo ───────────────────
  return (
    <div className={`App ${appClass} ${user ? 'authenticated' : 'unauthenticated'}`}>
      {user && <NavBar />}
      <ChatFlotanteConsultas />

      <div className="app-content">
        {user && <SideBar />}

        <main className="main-content">
          <Routes>

            {/* ==================== RUTAS PÚBLICAS ==================== */}
            <Route path="/landing"             element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login"               element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/ResetPassword"       element={<PublicRoute><ResetPassword /></PublicRoute>} />
            <Route path="/ResetPasswordSeguro" element={<PublicRoute><ResetPasswordSeguro /></PublicRoute>} />
            <Route path="/verifyEmail"         element={<PublicRoute><VerifyEmail /></PublicRoute>} />

            <Route path="/account"    element={<AccountSettings />} />
            <Route path="/contrasena" element={<ChangePasswordLogueado />} />

            {/* ==================== MÓDULO HOME ==================== */}
            <Route element={<PrivateRoute />}>
              <Route path="/home" element={<Home />} />
            </Route>

            {/* ==================== MÓDULO SEGURIDAD ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_SEGURIDAD"]} />}>
              <Route path="/seguridad"         element={<AsignarRol />} />
              <Route path="/admin/solicitudes" element={<SolicitudesPanel />} />
            </Route>

            {/* ==================== MÓDULO COMPRAS ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_COMPRAS"]} />}>
              <Route path="/ordencompra" element={<OrdenCompra />} />
            </Route>

            {/* ==================== MÓDULO BIENES ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_BIENES"]} />}>
              <Route path="/Bienes" element={<Bienes />} />
            </Route>

            {/* ==================== MÓDULO PROVEEDORES ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_PROVEEDORES"]} />}>
              <Route path="/proveedores" element={<Proveedores />} />
            </Route>

            {/* ==================== MÓDULO DONACIONES ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_DONACIONES"]} />}>
              <Route path="/donaciones" element={<Donaciones />} />
            </Route>

            {/* ==================== MÓDULO DIRECTIVA ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_DIRECTIVA"]} />}>
              <Route path="/directiva" element={<Directiva />} />
            </Route>

            {/* ==================== MÓDULO PERSONAL ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_PERSONAL"]} />}>
              <Route path="/personal" element={<Personal />} />
            </Route>

            {/* ==================== MÓDULO AUDITORIA ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_AUDITORIA"]} />}>
              <Route path='/bitacira' element={<Bitacora />} />
            </Route>

            {/* ==================== MÓDULO BIBLIOTECA ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_BIBLIOTECA"]} />}>
              <Route path="/biblioteca" element={<BibliotecaTest />} />
            </Route>

            {/* ==================== MÓDULO CALENDARIO ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_CALENDARIO"]} />}>
              <Route path="/Calendario" element={<CalendarioActividades />} />
            </Route>

            {/* ==================== MÓDULO ACTIVIDADES ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_ACTIVIDADES"]} />}>
              <Route path="/Actividades" element={<ActividadesPage />} />
            </Route>

            {/* ==================== MÓDULO GRADOS ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_GRADOS"]} />}>
              <Route path="/grados" element={<GradosPage />} />
            </Route>

            {/* ==================== MÓDULO HORARIOS ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_HORARIOS"]} />}>
              <Route path="/horarios" element={<Horarios />} />
            </Route>

            {/* ==================== MÓDULO MATRICULA ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_MATRICULA"]} />}>
              <Route path="/admisiones" element={<Matricula />} />
            </Route>

            {/* ==================== MÓDULO DASHBOARD ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_DASHBOARD"]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* ==================== MÓDULO ROLES ==================== */}
            <Route element={<PrivateRoute requiredPermissions={["VISUALIZAR_ROLES"]} />}>
              <Route path="/roles" element={<CrearRol />} />
            </Route>

            {/* ==================== RUTA RESTRINGIDA ==================== */}
            <Route path="/restricted" element={<RestrictedPage />} />

            {/* ==================== REDIRECCIÓN ==================== */}
            <Route path="*" element={<Navigate to="/landing" replace />} />

          </Routes>
        </main>
      </div>

      {warningVisible && (
        <div className="inactivity-warning">
          ⚠️ Sesión inactiva: se cerrará en 1 minuto. Haz clic o presiona cualquier tecla para continuar.
        </div>
      )}
    </div>
  );
}

export default App;