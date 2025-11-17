import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { auth } from "../../../components/authentication/Auth";
import { FiUsers, FiShoppingCart, FiBox, FiBook, FiCalendar } from "react-icons/fi";
import "../../../styles/Home.css";

const API_URL = process.env.REACT_APP_API_URL;
const COLORS = ["#323232", "#a600ff", "#1369fd", "#ffcc00", "#00bcd4"];
const COLORS2 = [ "#76b7b2", "#59a14f", "#edc949", "#af7aa1", "#ff9da7"];


export default function Home() {
  const [usuarios, setUsuarios] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [bienes, setBienes] = useState([]);
  const [libros, setLibros] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const results = await Promise.allSettled([
          axios.get(`${API_URL}/api/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/compras`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/bienes`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/biblioteca`, { headers: { Authorization: `Bearer ${token}` } }), // para libros
          axios.get(`${API_URL}/api/actividades`, { headers: { Authorization: `Bearer ${token}` } }), // nuevas actividades
          axios.get(`${API_URL}/api/matriculas`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
       
        setUsuarios(results[0].status === "fulfilled" ? results[0].value.data.users : []);
        setCompras(results[1].status === "fulfilled" ? results[1].value.data : []);
        setBienes(results[2].status === "fulfilled" ? results[2].value.data : []);
        setLibros(results[3].status === "fulfilled" ? results[3].value.data : []);
        setActividades(results[4].status === "fulfilled" ? results[4].value.data : []);
        setAlumnos(results[5].status === "fulfilled" ? results[5].value.data.data : []);
      } catch (error) {
        console.error("Error al obtener datos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);

  if (cargando) return <p className="dashboard-loading">Cargando datos...</p>;

  // === Datos de Roles ===
 

  // === Datos de Bienes por Estado ===
  const estados = [...new Set(bienes.map((b) => b.estado))];
  const dataBienes = estados.map((estado) => ({
    name: estado,
    value: bienes.filter((b) => b.estado === estado).length,
  }));

  // === Ordenar actividades por fecha
  const actividadesOrdenadas = actividades
    .map((act) => ({ ...act, fechaFormateada: new Date(act.fecha).toLocaleDateString() }))
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  return (
    <div className="plugins-container">

      {/* === TOTAL USUARIOS === */}
      <div className="plugins-card total-card blue-card">
        <div className="card-icon  ">
          <FiUsers size={48} />
        </div>
        <div>
          <h3>Total de Usuarios</h3>
          {usuarios.length === 0 ? (
            <p className="total-numberDocente">Sin permisos</p>
          ) : (
            <p className="total-number">{usuarios.length}</p>
          )}
        </div>
      </div>
      
      {/* === GRÁFICA DE ROLES === */}
      <div className="plugins-card total-card green-card">
         <div className="card-icon">
          <FiUsers size={48} />
        </div>
        <div>
          <h3>Total de alumnos</h3>
          <p className="total-number">{alumnos.length}</p>
        </div>
      </div>

      {/* === TOTAL COMPRAS === */}
      <div className="plugins-card total-card purple-card">
        <div className="card-icon">
          <FiShoppingCart size={48} />
        </div>
        <div>
          <h3>Total de Ordenes</h3>
          <p className="total-number">{compras.length}</p>
        </div>
      </div>

      {/* === TOTAL LIBROS === */}
      <div className="plugins-card total-card blue-card">
        <div className="card-icon">
          <FiBook size={48} />
        </div>
        <div>
          <h3>Total de Libros</h3>
          <p className="total-number">{libros.length}</p>
        </div>
      </div>

      {/* === BIENES POR ESTADO === */}
            <div className="plugins-card chart-card wide-card">
        <div className="chart-header">
          <FiBox size={28} style={{ marginRight: "8px", color: "#1369fd" }} />
          <h3>Bienes</h3>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataBienes}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {dataBienes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS2[index % COLORS2.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

              {/* === ACTIVIDADES CALENDARIO === */}
        <div className="plugins-card wide-card actividades-card">
          <div className="chart-header actividades-header">
            <FiCalendar size={28} style={{ marginRight: "10px", color: "#a600ff" }} />
            <h3>Próximas Actividades</h3>
          </div>
          <div className="chart-wrapper actividades-wrapper">
            {actividadesOrdenadas.length === 0 ? (
              <p className="no-actividades">No hay actividades próximas.</p>
            ) : (
              <ul className="actividades-list">
                {actividadesOrdenadas.map((act) => (
                  <li key={act._id} className="actividad-item">
                    <div className="actividad-info">
                      <strong className="actividad-nombre" style={{ textTransform: "capitalize" }}>{act.nombre}</strong>
                      <span className="actividad-fecha">{act.fechaFormateada}</span>
                    </div>
                    <div className="actividad-lugar" style={{ textTransform: "capitalize" }}>{act.lugar}</div>
                    <p className="actividad-desc" style={{ textTransform: "capitalize" }}>{act.descripcion}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

    </div>
  );
}
