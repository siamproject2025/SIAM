import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from "recharts";
import { auth } from "../../../components/authentication/Auth";
import { FiUsers, FiShoppingCart, FiBox, FiBook, FiCalendar, FiExternalLink } from "react-icons/fi";
import "../../../styles/Home.css";

const API_URL = process.env.REACT_APP_API_URL;
const COLORS_GRAFICA = ["#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"];

export default function Home() {
  const [data, setData] = useState({
    usuarios: null, // null significa que aún no sabemos si tiene permiso
    alumnos: [],
    compras: [],
    bienes: [],
    libros: [],
    actividades: []
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const headers = { Authorization: `Bearer ${token}` };

        // Usamos Promise.allSettled para que si una falla (por rol), las demás sigan
        const results = await Promise.allSettled([
          axios.get(`${API_URL}/api/usuarios`, { headers }),
          axios.get(`${API_URL}/api/compras`, { headers }),
          axios.get(`${API_URL}/api/bienes`, { headers }),
          axios.get(`${API_URL}/api/biblioteca`, { headers }),
          axios.get(`${API_URL}/api/actividades`, { headers }),
          axios.get(`${API_URL}/api/matriculas`, { headers }),
        ]);

        setData({
          usuarios: results[0].status === "fulfilled" ? results[0].value.data.users : "no_access",
          compras: results[1].status === "fulfilled" ? results[1].value.data : [],
          bienes: results[2].status === "fulfilled" ? results[2].value.data : [],
          libros: results[3].status === "fulfilled" ? results[3].value.data : [],
          actividades: results[4].status === "fulfilled" ? results[4].value.data : [],
          alumnos: results[5].status === "fulfilled" ? results[5].value.data.data : []
        });
      } catch (error) {
        console.error("Error crítico en Home:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerDatos();
  }, []);

  if (cargando) return <div className="loader-container">Cargando Dashboard...</div>;

  // Filtrado de datos para la gráfica (solo si hay datos de bienes)
  const dataBienes = [...new Set(data.bienes.map(b => b.estado))].map(estado => ({
    name: estado,
    value: data.bienes.filter(b => b.estado === estado).length,
  }));

  return (
    <div className="dashboard-content">
      <div className="stat-cards-container">
        
        {/* TARJETA DE USUARIOS - Solo visible para quien tiene acceso */}
        {data.usuarios !== "no_access" && (
          <div className="stat-card border-blue">
            <div className="stat-info">
              <span className="stat-label">Total Usuarios</span>
              <h3 className="stat-value">{data.usuarios?.length || 0}</h3>
              <span className="stat-diff">Personal registrado</span>
            </div>
            <div className="stat-icon-circle blue-bg"><FiUsers /></div>
          </div>
        )}

        <div className="stat-card border-green">
          <div className="stat-info">
            <span className="stat-label">Alumnos</span>
            <h3 className="stat-value">{data.alumnos.length}</h3>
            <span className="stat-diff">Matrícula actual</span>
          </div>
          <div className="stat-icon-circle green-bg"><FiUsers /></div>
        </div>

        <div className="stat-card border-purple">
          <div className="stat-info">
            <span className="stat-label">Órdenes</span>
            <h3 className="stat-value">{data.compras.length}</h3>
            <span className="stat-diff">Gestión administrativa</span>
          </div>
          <div className="stat-icon-circle purple-bg"><FiShoppingCart /></div>
        </div>

        <div className="stat-card border-orange">
          <div className="stat-info">
            <span className="stat-label">Libros</span>
            <h3 className="stat-value">{data.libros.length}</h3>
            <span className="stat-diff">Biblioteca</span>
          </div>
          <div className="stat-icon-circle orange-bg"><FiBook /></div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="main-card">
          <div className="main-card-header">
            <h3>Estado de Bienes</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dataBienes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={40}>
                  {dataBienes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_GRAFICA[index % COLORS_GRAFICA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="side-column">
          <div className="main-card compact">
            <div className="main-card-header">
              <h3>Próximas Actividades</h3>
            </div>
            <div className="agenda-feed">
              {data.actividades.length > 0 ? (
                data.actividades.slice(0, 4).map((act) => (
                  <div key={act._id} className="agenda-row">
                    <div className="agenda-icon"><FiCalendar /></div>
                    <div className="agenda-details">
                      <h4>{act.nombre}</h4>
                      <p>{new Date(act.fecha).toLocaleDateString()}</p>
                    </div>
                    <FiExternalLink className="row-link" />
                  </div>
                ))
              ) : (
                <p className="empty-state">No hay actividades próximas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}