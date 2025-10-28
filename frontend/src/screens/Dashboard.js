import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as FiIcons from "react-icons/fi";
import '../styles/Dashboard.css';
import { auth } from "../components/authentication/Auth";
import Home from './Home';
import AdminOnly from '../components/Plugins/AdminOnly';

const API_URL = "http://localhost:5000/";
const DashboardCards = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();

        const res = await axios.get("http://localhost:5000/api/dashboard", {
        headers: {
            Authorization: `Bearer ${token}`
          },
        });

        setModulos(res.data.modulos);
      } catch (err) {
        console.error("Error al cargar módulos:", err);
      }
    };

    fetchModulos();
  }, []);

  return (
    <div className="main dashboard-container">
      <AdminOnly><Home></Home></AdminOnly>
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