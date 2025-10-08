import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as FiIcons from "react-icons/fi";
import '../styles/Dashboard.css';
import { auth } from "../components/authentication/Auth";

const DashboardCards = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get("http://localhost:5000/api/dashboard", {
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
    <div className="dashboard-container">
      {/* Sidebar */}
      
      <div className="dashboard-sidebar">
        <h2>Panel</h2>
        <ul>
          {modulos.map((modulo) => {
            const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile;
            return (
              <li key={modulo._id} onClick={() => navigate(modulo.link)}>
                <IconComponent size={20} style={{ marginRight: "10px" }} />
                {modulo.titulo}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Cards principales */}
      <div className="dashboard-main">
        <div className="dashboard-grid">
          {modulos.map((modulo) => {
            const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile;
            return (
              <div
                key={modulo._id}
                className="dashboard-card"
                onClick={() => navigate(modulo.link)}
              >
                <IconComponent size={40} />
                <h3>{modulo.titulo}</h3>
                <p>{modulo.descripcion}</p>
              </div>
            );
          })}
        
        
      </div>
      </div>
    </div>
  );
};

export default DashboardCards;
