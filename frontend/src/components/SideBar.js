import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield, FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/SideBar.css';
import { auth } from "./authentication/Auth";
import * as FiIcons from "react-icons/fi";
import { Music } from "lucide-react";

const API_URL = process.env.REACT_APP_API_URL;

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [minimizado, setMinimizado] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detectar la ruta activa automáticamente
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  const [activeLink, setActiveLink] = useState("");

  const handleClick = (link) => {
    setActiveLink(link);
    navigate(link);
    setMobileOpen(false); // Cerrar en móvil al hacer clic
  };

  const toggleSidebar = () => setMinimizado(!minimizado);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setModulos(res.data.modulos);
      } catch (err) {
        console.error("Error al cargar módulos:", err);
      }
    };

    fetchModulos();
  }, []);

  return (
    <>
      {/* Botón de menú móvil */}
      <button className="mobile-menu-btn" onClick={toggleMobileSidebar}>
        <FiMenu size={20} />
      </button>

      <div className={`dashboard-sidebar ${minimizado ? "minimized" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        
        {/* Botón para minimizar/expandir */}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {minimizado ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>

        <h2>
           
          {!minimizado && "WorkSpace"}
        </h2>
        
        <ul>
          {modulos.map((modulo, index) => {
            const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile;
            const isActive = activeLink === modulo.link;
            
            return (
              <li
                key={modulo._id}
                onClick={() => handleClick(modulo.link)}
                className={isActive ? "active" : ""}
                title={minimizado ? modulo.titulo : ""}
              >
                <IconComponent size={20} />
                {!minimizado && <span>{modulo.titulo}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default SideBar;