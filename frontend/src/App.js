
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from "react";
import PrivateRoute from "./components/routes/PrivateRoute";
import appFirebase from "./components/authentication/Auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import NavBar from './components/navBar';
import Login from './components/authentication/Login';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Landing from "./screens/Landing"
import Home from "./screens/Home";
import Footer from "./components/Footer";
import PublicRoute from './components/routes/PublicRoute';
import { useLocation } from "react-router-dom";

//Models
import OrdenCompra from './screens/Models/ordencompra';
import Bienes from './screens/Models/Bienes';


import RestrictedPage from './screens/RestrictedPage';
import Dashboard from './screens/Dashboard';
import AsignarRol from './screens/AsignarRol';

const auth = getAuth(appFirebase);
function App() {
   const [user, setUser] = useState(null);
   
  const location = useLocation();
  const appClass = location.pathname === "/login" ? "no-margin" : "with-margin";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userFirebase) => {
      setUser(userFirebase || null);
    });

    return () => unsubscribe(); // limpieza al desmontar
  }, []);
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
                  <Route path='/seguridad' element={<AsignarRol />} />

                  <Route path="/dashboard" element={<Dashboard />} />

                </Route>

                {/* Ruta de aterrizaje pública */}
                <Route path="/landing" element={<Landing />} />
                <Route path="/restricted" element={<RestrictedPage />} />

                {/* Redirigir rutas desconocidas */}
                <Route path="*" element={<Navigate to="/landing" replace />} />
              </Routes>

              {/* Renderiza Footer solo si el usuario está autenticado */}
              
            </div><Footer />
      </>
  );
}

export default App;
