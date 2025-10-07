
import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield } from 'react-icons/fi';
// src/components/DashboardCards.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as FiIcons from "react-icons/fi";
import '../styles/Dashboard.css'; // Importamos el CSS externo
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
        setModulos(res.data.modulos); // Datos filtrados por rol desde el backend
      } catch (err) {
        console.error("Error al cargar módulos:", err);
      }
    };

    fetchModulos();
  }, []);

  return (
    <div className='dashBack'>
    <div className="dashboard-grid">
      {modulos.map((modulo) => {
        const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile; // Icono dinámico

        return (
          <div key={modulo._id} className="dashboard-card" style={{
                  cursor: "pointer",            // Cambia el cursor a mano
                  transition: "transform 0.2s, box-shadow 0.2s"
                }} onClick={() => navigate(modulo.link)}>
            
            <IconComponent size={40} />
            <h3>{modulo.titulo}</h3>
            <p>{modulo.descripcion}</p>
            
          </div>
        );
      })}
    </div>
    </div>
  );
};

export default DashboardCards;
