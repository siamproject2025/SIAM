import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from "react";
import PrivateRoute from "./components/routes/PrivateRoute";
import appFirebase from "./components/authentication/Auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import NavBar from './components/navBar';
import Login from './components/authentication/Login';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/authentication/AuthProvider";
import Landing from "./screens/Landing"
import Home from "./screens/Home";
import Footer from "./components/Footer";
import PublicRoute from './components/routes/PublicRoute';

//Models
import OrdenCompra from './screens/Models/ordencompra';


const auth = getAuth(appFirebase);
function App() {
   const [user, setUser] = useState(null);

  onAuthStateChanged(auth, (userFirebase) => {
    if (userFirebase) {
      setUser(userFirebase);
    } else {
      setUser(null);
    }
  });
  return (
    <AuthProvider>
      <Router>
       <div  className={`App ${user ? 'authenticated' : 'unauthenticated'}`}>
              {/* Renderiza NavBar solo si el usuario está autenticado */}
              {user && <><NavBar />{/*<Sidebar/>*/}</>}
              <Routes>
                {/* Rutas públicas */}
                <Route path="/landing" element={<PublicRoute> <Landing /> </PublicRoute>}/>
                <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
                {/* Rutas privadas */}
                <Route element={<PrivateRoute />}>
                  <Route path="/home" element={<Home />} />
                  <Route path='/ordencompra' element={<OrdenCompra />} />
                </Route>

                {/* Ruta de aterrizaje pública */}
                <Route path="/landing" element={<Landing />} />

                {/* Redirigir rutas desconocidas */}
                <Route path="*" element={<Navigate to="/landing" replace />} />
              </Routes>

              {/* Renderiza Footer solo si el usuario está autenticado */}
              <Footer />
            </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
