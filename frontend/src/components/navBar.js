
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Music, Zap } from "lucide-react"; 
import useUserRole from "./hooks/useUserRole"; 
import LoginProfile from "./authentication/LoginProfile";
import "../styles/NavBar.css";

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
  }/*,
  {
    name: "Usuarios",
    href: "/usuarios",
  },
  {
    name: "Reportes",
    href: "/reportes",
  }*/,
];

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  // 2. 🚀 Llamar al Custom Hook para obtener el rol
  const { userRole, cargando } = useUserRole();

  // Función para capitalizar la primera letra del rol
  const formatRole = (role) => {
    if (!role) return "Invitado";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <nav className="navbar">
      {/* Botón hamburguesa */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Logo */}
      <a href="#inicio" className="logo">
        <Music size={24} />
        <span className="logo-text">S.I.A.M</span>
      </a>

      
      {/* Links */}
      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        {links.map((x, index) => (
          <Link
            key={index}
            to={x.href}
            onClick={() => setMenuOpen(false)} // Cierra menú al hacer clic
          >
            {x.name}
          </Link>
        ))}
      </div>

      {/* 3. 🛡️ Visualización del Rol (Nuevo elemento) */}
      <div className="nav-role-display">
        {cargando ? (
            <span className="role-loading">Cargando...</span>
        ) : (
            <>
                <Zap size={16} className={`role-icon role-${userRole?.toLowerCase()}`} />
                <span className="role-text">
                    Permisos: 🔑🔐{formatRole(userRole)}🔐🔑
                </span>
            </>
        )}
      </div>

      {/* Perfil de usuario */}
      <LoginProfile />
    </nav>
  );
}

export default NavBar;