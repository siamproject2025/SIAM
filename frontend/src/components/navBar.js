import React, { useState } from "react";
import "../styles/NavBar.css";
import { Link } from "react-router-dom";
import LoginProfile from "./authentication/LoginProfile";
import { Music } from "lucide-react";

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

  return (
    <nav className="navbar">
      {/* Botón hamburguesa */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>

      {/* Logo */}
      <a href="#inicio" className="logo">
        <Music size={24} />
        <span className="logo-text">S.I.A.M.</span>
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

      {/* Perfil de usuario */}
      <LoginProfile />
    </nav>
  );
}

export default NavBar;
