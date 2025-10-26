import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/SideBar.css';
import { auth } from "./authentication/Auth";
import * as FiIcons from "react-icons/fi";
import { Music } from "lucide-react";

const API_URL = "http://localhost:5000/";

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("");
  const [minimizado, setMinimizado] = useState(false); // estado de minimizado

  const handleClick = (link) => {
    setActiveLink(link);
    navigate(link);
  };

  const toggleSidebar = () => setMinimizado(!minimizado);

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}api/dashboard`, {
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
    <div className={`dashboard-sidebar ${minimizado ? "minimized" : ""}`}>
      
      {/* Botón para minimizar/expandir */}
      <button className="toggle-btn" onClick={toggleSidebar}>
        {minimizado ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <h2><Music size={24} /> Panel</h2>
      <ul>
        {modulos.map((modulo) => {
          const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile;
          return (
            <li
              key={modulo._id}
              onClick={() => handleClick(modulo.link)}
              className={activeLink === modulo.link ? "active" : ""}
              title={minimizado ? modulo.titulo : ""} // tooltip al estar minimizado
            >
              <IconComponent size={20} style={{ marginRight: minimizado ? "0" : "10px" }} />
              {!minimizado && modulo.titulo}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SideBar;
