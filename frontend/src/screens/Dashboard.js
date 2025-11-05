import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield, FiArrowRight } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as FiIcons from "react-icons/fi";
import '../styles/Dashboard.css';
import { auth } from "../components/authentication/Auth";
import Home from './Home';
import AdminOnly from '../components/Plugins/AdminOnly';

const API_URL = process.env.REACT_APP_API_URL;

const DashboardCards = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchModulos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}api/dashboard`, {
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

  // Función para determinar el tipo de módulo
  const getModuleType = (index) => {
    const types = ['primary-module', 'success-module', 'warning-module', 'info-module'];
    return types[index % types.length];
  };

  return (
    <div className="main dashboard-container">
      <AdminOnly><Home></Home></AdminOnly>
      <div className="dashboard-main">
        <div className="dashboard-grid">
          {modulos.map((modulo, index) => {
            const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile;
            const moduleType = getModuleType(index);
            
            return (
              <div
                key={modulo._id}
                className={`dashboard-card ${moduleType}`}
                onClick={() => navigate(modulo.link)}
              >
                <div className="icon-container">
                  <IconComponent size={24} />
                </div>
                <h3>{modulo.titulo}</h3>
                <p>{modulo.descripcion}</p>
                <div className="arrow">
                  <FiArrowRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;