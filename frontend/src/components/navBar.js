import React, { useState, useEffect } from "react";
import "../styles/NavBar.css";
import { Link, useLocation } from "react-router-dom";
import useUserRole from "./hooks/useUserRole"; 
import LoginProfile from "./authentication/LoginProfile";
import {  Music, Zap, Home, BarChart3, Users } from "lucide-react";

const links = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home
  }/*,
  {
    name: "Bienes",
    href: "/bienes",
    icon: BarChart3
  },
  {
    name: "Usuarios",
    href: "/usuarios",
    icon: Users
  }*/
];

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
 // 2.  Llamar al Custom Hook para obtener el rol
  const { userRole, cargando } = useUserRole();

  // Función para capitalizar la primera letra del rol
  const formatRole = (role) => {
    if (!role) return "Invitado";
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };
  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      {/* Botón hamburguesa */}
      

      {/* Logo */}
      <Link to="/dashboard" className="logo">
        <div className="logo-icon">
          <Music size={20} />
        </div>
        <span className="logo-text">S.I.A.M.</span>
      </Link>

      {/* Links de navegación */}
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {links.map((link, index) => {
          const IconComponent = link.icon;
          const isActive = location.pathname === link.href;
          
          return (
            <Link
              key={index}
              to={link.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <IconComponent size={16} style={{ marginRight: '8px' }} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* 3. ️ Visualización del Rol (Nuevo elemento) */}
      <div className="nav-role-display">
        {cargando ? (
            <span className="role-loading">Cargando...</span>
        ) : (
            <>
                <Zap size={16} className={`role-icon role-${userRole?.toLowerCase()}`} />
                <span className="role-text">
                    Permisos: {formatRole(userRole)}
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