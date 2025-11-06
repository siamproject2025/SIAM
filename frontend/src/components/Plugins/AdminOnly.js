import React, { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../authentication/Auth";

const API_URL = process.env.REACT_APP_API_URL;
const AdminOnly = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
  const checkAdmin = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await axios.get(`${API_URL}/api/usuarios/role`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Verifica si es ADMIN o DOCENTE
      setIsAdmin(res.data.role === "ADMIN" || res.data.role === "DOCENTE");
    } catch (err) {
      console.error("Error verificando rol:", err);
      setIsAdmin(false);
    } finally {
      setCargando(false);
    }
  };

  checkAdmin();
}, []);

  if (cargando) return <p>Cargando...</p>;
  if (!isAdmin) return null; // no renderiza si no es admin

  return <>{children}</>;
};

export default AdminOnly;
