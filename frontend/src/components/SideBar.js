import { FiChevronLeft, FiChevronRight, FiMenu, FiChevronDown, FiBook, FiBriefcase, FiShield, FiFile } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/SideBar.css';
import { auth } from "./authentication/Auth";
import * as FiIcons from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL;

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minimizado, setMinimizado] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(null); 

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  // Mapeo para organizar tus componentes en carpetas
  const categorias = {
    "Académico": ["Matricula", "Grados", "Horarios", "Calendario", "Biblioteca", "Actividades"],
    "Administrativo": ["Compras", "Proveedores", "Bienes", "Donaciones", "Personal", "Directiva"],
    "Seguridad": ["Seguridad"]
  };

  const getCategoria = (titulo) => {
    for (const [cat, nombres] of Object.entries(categorias)) {
      if (nombres.includes(titulo)) return cat;
    }
    return "Otros";
  };

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { setLoading(false); return; }
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setModulos(res.data.modulos);
      } catch (err) {
        console.error("Error al cargar módulos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchModulos();
  }, []);

  const handleToggleSubmenu = (nombreCat) => {
    if (minimizado) setMinimizado(false);
    setMenuAbierto(menuAbierto === nombreCat ? null : nombreCat);
  };

  const handleClick = (link) => {
    setActiveLink(link);
    navigate(link);
    setMobileOpen(false);
  };

  if (loading) return null;

  const modulosAgrupados = modulos.reduce((acc, mod) => {
    const cat = getCategoria(mod.titulo);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mod);
    return acc;
  }, {});

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
        <FiMenu size={20} />
      </button>

      <div className={`dashboard-sidebar ${minimizado ? "minimized" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        
        {/* Botón Flotante Morado */}
        <button className="toggle-btn-floating" onClick={() => setMinimizado(!minimizado)}>
          {minimizado ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>

        <h2 className="sidebar-logo">{!minimizado && "WorkSpace"}</h2>
        
        <div className="sidebar-nav-container">
          {Object.keys(modulosAgrupados).map((catName) => (
            <div key={catName} className="menu-group">
              <div 
                className={`group-header ${menuAbierto === catName ? 'active-header' : ''}`}
                onClick={() => handleToggleSubmenu(catName)}
              >
                <div className="group-info">
                   {catName === "Académico" && <FiBook size={20} />}
                   {catName === "Administrativo" && <FiBriefcase size={20} />}
                   {catName === "Seguridad" && <FiShield size={20} />}
                   {catName === "Otros" && <FiFile size={20} />}
                   {!minimizado && <span>{catName}</span>}
                </div>
                {!minimizado && <FiChevronDown className={`arrow-icon ${menuAbierto === catName ? 'rotate' : ''}`} />}
              </div>

              <ul className={`submenu-list ${menuAbierto === catName && !minimizado ? 'show' : ''}`}>
                {modulosAgrupados[catName].map((modulo) => {
                  const IconComponent = FiIcons[modulo.icon] || FiFile;
                  const isActive = activeLink === modulo.link;
                  return (
                    <li
                      key={modulo._id}
                      onClick={() => handleClick(modulo.link)}
                      className={isActive ? "active-item" : ""}
                    >
                      <IconComponent size={18} />
                      {!minimizado && <span>{modulo.titulo}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SideBar;