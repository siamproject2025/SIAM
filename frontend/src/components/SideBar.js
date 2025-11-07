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

