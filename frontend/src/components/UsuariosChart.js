import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { auth } from "../components/authentication/Auth";
import "../styles/UsuariosChart.css";

const API_URL = process.env.REACT_APP_API_URL;

const COLORS = ["#323232ff", "#a600ffff", "#1369fdff"];

const UsuariosChart = (actualizar) => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await axios.get(`${API_URL}/api/usuarios`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsuarios(res.data.users);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuarios();
  }, [actualizar]);

  if (cargando) return <p>Cargando datos...</p>;

  const rolesDisponibles = ["ADMIN", "DOCENTE", "PADRE"];
  const dataRoles = rolesDisponibles.map((rol) => ({
    name: rol,
    value: usuarios.filter((u) => u.roles.includes(rol)).length,
  }));

  return (
    <div className="usuarios-chart-container">
      
      <p className="usuarios-chart-total">Total de usuarios: {usuarios.length}</p>

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
            label
          >
            {dataRoles.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={dataRoles}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#323232ff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UsuariosChart;
