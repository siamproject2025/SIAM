import { FiUsers, FiInbox, FiCalendar, FiFile, FiGift, FiPackage, FiBookOpen, FiMessageSquare, FiShield, FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/SideBar.css';
// src/components/SideBar.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import "../styles/SideBar.css";
import { auth } from "./authentication/Auth";
import * as FiIcons from "react-icons/fi";
import { Music } from "lucide-react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const API_BASE =
  (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const DASHBOARD_URL = `${API_BASE}/api/dashboard`;

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [minimizado, setMinimizado] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detectar la ruta activa automáticamente
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  const [activeLink, setActiveLink] = useState("");

  const handleClick = (link) => {
    setActiveLink(link);
    navigate(link);
    setMobileOpen(false); // Cerrar en móvil al hacer clic
  };

  const toggleSidebar = () => setMinimizado(!minimizado);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  const [minimizado, setMinimizado] = useState(() => {
    const saved = localStorage.getItem("sidebar:minimizado");
    return saved === "true";
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const toggleSidebar = () => {
    setMinimizado((v) => {
      const next = !v;
      localStorage.setItem("sidebar:minimizado", String(next));
      return next;
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const user = auth?.currentUser;
        const token = await user?.getIdToken?.();

        const res = await axios.get(DASHBOARD_URL, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          timeout: 8000,
          signal: controller.signal,
        });

        let mods = Array.isArray(res.data?.modulos) ? res.data.modulos : [];

        // Normalizar estructura
        mods = mods
          .filter((m) => m && (m.link || m.route))
          .map((m) => ({
            _id: m._id || m.id || m.link || m.route,
            titulo: m.titulo || m.title || "Módulo",
            link: String(m.link || m.route || "/").trim(),
            icon: String(m.icon || "FiFile").trim(),
          }));

        // Asegurar "Grados" (una sola vez)
        const hasGrados = mods.some(
          (m) => (m.link || "").toLowerCase() === "/grados"
        );
        if (!hasGrados) {
          mods.push({
            _id: "grados-local",
            titulo: "Grados",
            link: "/grados",
            icon: "FiLayers",
          });
        }

        // Quitar duplicados por link
        const unique = [];
        const seen = new Set();
        for (const m of mods) {
          const key = (m.link || "").toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(m);
          }
        }

        setModulos(unique);
        setError("");
      } catch (e) {
        if (axios.isCancel(e)) return;
        console.warn("No se pudo cargar /api/dashboard. Usando menú mínimo.", e);
        setError("No se pudo cargar el panel. Puedes navegar desde el menú.");
        setModulos([
          { _id: "grados-local", titulo: "Grados", link: "/grados", icon: "FiLayers" },
        ]);
      } finally {
        setCargando(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <>
      {/* Botón de menú móvil */}
      <button className="mobile-menu-btn" onClick={toggleMobileSidebar}>
        <FiMenu size={20} />
      </button>

      <div className={`dashboard-sidebar ${minimizado ? "minimized" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        
        {/* Botón para minimizar/expandir */}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {minimizado ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
        </button>

        <h2>
           
          {!minimizado && "WorkSpace"}
        </h2>
        
        <ul>
          {modulos.map((modulo, index) => {
            const IconComponent = FiIcons[modulo.icon] || FiIcons.FiFile;
            const isActive = activeLink === modulo.link;
            
            return (
              <li
                key={modulo._id}
                onClick={() => handleClick(modulo.link)}
                className={isActive ? "active" : ""}
                title={minimizado ? modulo.titulo : ""}
              >
                <IconComponent size={20} />
                {!minimizado && <span>{modulo.titulo}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default SideBar;
    <nav
      className={`dashboard-sidebar ${minimizado ? "minimized" : ""}`}
      aria-label="Menú lateral"
    >
      {/* Botón minimizar/expandir */}
      <button
        className="toggle-btn"
        onClick={toggleSidebar}
        aria-label={minimizado ? "Expandir menú" : "Minimizar menú"}
      >
        {minimizado ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <h2 className="sidebar-title">
        <Music size={24} />
        {!minimizado && <span style={{ marginLeft: 8 }}>Panel</span>}
      </h2>

      {!minimizado && error && (
        <div className="alert alert-warning m-2 p-2" style={{ fontSize: 12 }}>
          {error}
        </div>
      )}

      <ul className="sidebar-list">
        {cargando && (
          <li className="text-muted" style={{ padding: "8px 12px" }}>
            Cargando menú…
          </li>
        )}

        {!cargando &&
          modulos.map((modulo) => {
            const IconComponent =
              (modulo.icon && FiIcons[modulo.icon]) || FiIcons.FiFile;

            return (
              <li
                key={modulo._id || modulo.link}
                title={minimizado ? modulo.titulo : ""}
                className="sidebar-item"
              >
                <NavLink
                  to={modulo.link}
                  className={({ isActive }) =>
                    `nav-link-item ${isActive ? "active" : ""}`
                  }
                >
                  <IconComponent
                    size={20}
                    style={{ marginRight: minimizado ? 0 : 10 }}
                    aria-hidden="true"
                  />
                  {!minimizado && <span>{modulo.titulo}</span>}
                </NavLink>
              </li>
            );
          })}
      </ul>
    </nav>
  );
};

export default SideBar;

