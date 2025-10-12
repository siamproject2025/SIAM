import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/SideBar.css';
import { auth } from "./authentication/Auth";
import * as FiIcons from "react-icons/fi";

const API_URL = "http://localhost:5000/";

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();

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
      );
};

export default SideBar;
