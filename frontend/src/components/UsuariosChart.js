import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { auth } from "../components/authentication/Auth";
import "../styles/UsuariosChart.css";

const API_URL = process.env.REACT_APP_API_URL;

// Array de colores para los diferentes roles (puedes expandirlo)
const COLORS = [
  "#323232ff", "#a600ffff", "#1369fdff", "#10b981", "#f59e0b", 
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#d946ef", "#06b6d4", "#84cc16", "#f43f5e"
];

const UsuariosChart = ({ actualizar }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [todosRoles, setTodosRoles] = useState([]);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}/api/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const usuariosData = res.data.users;
        setUsuarios(usuariosData);
        
        // Extraer todos los roles únicos de todos los usuarios
        const rolesUnicos = new Set();
        usuariosData.forEach(usuario => {
          if (usuario.roles && Array.isArray(usuario.roles)) {
            usuario.roles.forEach(rol => rolesUnicos.add(rol));
          }
        });
        
        setTodosRoles(Array.from(rolesUnicos).sort());
        
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuarios();
  }, [actualizar]);

  if (cargando) return <p className="chart-loading">Cargando datos...</p>;

  // Calcular distribución de roles dinámicamente
  const dataRoles = todosRoles.map((rol) => ({
    name: rol,
    value: usuarios.filter((u) => u.roles && u.roles.includes(rol)).length,
  })).filter(item => item.value > 0); // Solo mostrar roles que tienen al menos 1 usuario

  // Calcular total de usuarios
  const totalUsuarios = usuarios.length;

  // Si no hay datos, mostrar mensaje
  if (dataRoles.length === 0) {
    return (
      <div className="usuarios-chart-container">
        <p className="usuarios-chart-total">Total de usuarios: {totalUsuarios}</p>
        <div className="chart-no-data">
          <p>No hay datos de roles para mostrar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usuarios-chart-container">
      <div className="chart-header">
        <p className="usuarios-chart-total">Total de usuarios: {totalUsuarios}</p>
        <p className="usuarios-chart-roles">Roles activos: {dataRoles.length}</p>
      </div>

      <div className="charts-wrapper">
        {/* Gráfico de Pastel */}
        <div className="chart-wrapper">
          <h4 className="chart-subtitle">Distribución por roles</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dataRoles}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {dataRoles.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} usuarios`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras */}
        <div className="chart-wrapper">
          <h4 className="chart-subtitle">Cantidad por rol</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dataRoles} layout="vertical" margin={{ left: 50 }}>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip 
                formatter={(value) => [`${value} usuarios`, 'Cantidad']}
              />
              <Bar dataKey="value" fill="#667eea">
                {dataRoles.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UsuariosChart;