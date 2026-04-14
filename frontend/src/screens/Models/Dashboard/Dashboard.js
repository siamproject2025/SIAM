import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  Users,
  Shield,
  BarChart2,
  Paintbrush,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import * as FiIcons from "react-icons/fi";
import * as RiIcons from "react-icons/ri";
import * as FaIcons from "react-icons/fa";
import * as TbIcons from "react-icons/tb";
import * as MdIcons from "react-icons/md";
import { auth } from "../../../components/authentication/Auth";
import Home from "./Home";
import "../../../styles/Dashboard.css";
import WithPermissionNoRender from "../../../components/Permisos/WithPermissionNoRender";

const allIcons = {
  ...FiIcons,
  ...RiIcons,
  ...FaIcons,
  ...TbIcons,
  ...MdIcons,
};

const API_URL = process.env.REACT_APP_API_URL;

/* ─── Categorías (mismo orden que SideBar) ─── */
const CATEGORIAS = [
  {
    key: "Académico",
    label: "Académico",
    Icon: BookOpen,
    color: "#f48c6c",
    bg: "#f3f0ff",
    badgeColor: "#6c5fe6",
    modulos: ["Matricula", "Grados", "Horarios", "Biblioteca", "Actividades", "Calendario"],
  },
  {
    key: "Operativo",
    label: "Operativo",
    Icon: Briefcase,
    color: "#98a0fd",
    bg: "#eef3ff",
    badgeColor: "#3a6ae0",
    modulos: ["Bienes", "Donaciones", "Compras", "Proveedores"],
  },
  {
    key: "RRHH",
    label: "RRHH",
    Icon: Users,
    color: "#9b5ff5",
    bg: "#f6f0ff",
    badgeColor: "#8040e0",
    modulos: ["Personal", "Directiva"],
  },
  {
    key: "Seguridad",
    label: "Seguridad",
    Icon: Shield,
    color: "#d95f91",
    bg: "#fff0f6",
    badgeColor: "#c04478",
    modulos: ["Usuarios", "Roles", "Solicitudes", "Backup y restore", "Auditoria"],
  },
  {
    key: "Dashboard",
    label: "Dashboard",
    Icon: BarChart2,
    color: "#2baa8a",
    bg: "#edfaf5",
    badgeColor: "#1e8a6e",
    modulos: ["Dashboard"],
  },
  {
    key: "Personalización",
    label: "Personal.",
    Icon: Paintbrush,
    color: "#e07d35",
    bg: "#fff5ed",
    badgeColor: "#c06020",
    modulos: ["Pagina principal", "Mantenimientos"],
  },
];

/* Devuelve la categoría a la que pertenece un módulo */
const getCategoriaDeModulo = (titulo) =>
  CATEGORIAS.find((c) => c.modulos.includes(titulo)) ?? null;

/* ─── Mapa de permisos (idéntico al SideBar) ─── */
const moduloAPermiso = {
  Matricula: "VISUALIZAR_MATRICULA",
  Grados: "VISUALIZAR_GRADOS",
  Horarios: "VISUALIZAR_HORARIOS",
  Calendario: "VISUALIZAR_CALENDARIO",
  Biblioteca: "VISUALIZAR_BIBLIOTECA",
  Actividades: "VISUALIZAR_ACTIVIDADES",
  Compras: "VISUALIZAR_COMPRAS",
  Proveedores: "VISUALIZAR_PROVEEDORES",
  Bienes: "VISUALIZAR_BIENES",
  Donaciones: "VISUALIZAR_DONACIONES",
  Solicitudes: "VISUALIZAR_SOLICITUDES",
  Personal: "VISUALIZAR_PERSONAL",
  Directiva: "VISUALIZAR_DIRECTIVA",
  Usuarios: "VISUALIZAR_SEGURIDAD",
  Auditoria: "VISUALIZAR_AUDITORIA",
  Dashboard: "VISUALIZAR_DASHBOARD",
  Roles: "VISUALIZAR_ROLES",
  "Pagina principal": "VISUALIZAR_PAGINA_PRINCIPAL",
  "Backup y restore": "VISUALIZAR_RESTORE",
  Mantenimientos: "VISUALIZAR_MANTENIMIENTOS",
};

/* ─── Componente ─── */
const DashboardCards = () => {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        let roles = [];
        try {
          const r = await axios.get(`${API_URL}/api/usuarios/role`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          roles = r.data.role ? [r.data.role] : r.data.roles || [];
        } catch (e) { console.error("Error roles:", e); }

        let permisos = [];
        try {
          const p = await axios.get(`${API_URL}/api/mis-permisos`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          permisos = p.data.permisos || [];
        } catch (e) { console.error("Error permisos:", e); }

        const modRes = await axios.get(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const todos = modRes.data.modulos || [];

        /* Filtrado idéntico al SideBar */
        const autorizados = todos.filter((m) => {
          const permisoReq = moduloAPermiso[m.titulo];
          if (permisoReq) return permisos.includes(permisoReq);
          if (m.roles?.length > 0) return m.roles.some((r) => roles.includes(r));
          return false;
        });

        /* Ordenar según el orden definido en CATEGORIAS */
        const orden = CATEGORIAS.flatMap((c) => c.modulos);
        autorizados.sort(
          (a, b) => orden.indexOf(a.titulo) - orden.indexOf(b.titulo)
        );

        setModulos(autorizados);
      } catch (err) {
        console.error("Error al cargar módulos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* Categorías que realmente tienen módulos disponibles */
  const categoriasDisponibles = useMemo(() =>
    CATEGORIAS.filter((cat) =>
      modulos.some((m) => cat.modulos.includes(m.titulo))
    ),
    [modulos]
  );

  /* Cards filtradas */
  const modulosFiltrados = useMemo(() => {
    if (filtroActivo === "Todos") return modulos;
    const cat = CATEGORIAS.find((c) => c.key === filtroActivo);
    return cat ? modulos.filter((m) => cat.modulos.includes(m.titulo)) : modulos;
  }, [modulos, filtroActivo]);

  /* Hora de saludo */
  const saludo = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-spinner" />
        Cargando módulos...
      </div>
    );
  }

  if (modulos.length === 0) {
    return (
      <div className="dash-container">
        <Home />
        <div className="dash-empty">
          <p>No hay módulos disponibles para tus permisos.</p>
          <small>Contacta al administrador para solicitar acceso.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <WithPermissionNoRender requiredPermissions={["VISUALIZAR_DASHBOARD"]}> <Home /></WithPermissionNoRender>

      {/* ── Hero header ── */}
      <div className="dash-hero">
        <div className="dash-hero-eyebrow">
          <span className="dash-hero-dot" />
          <span className="dash-hero-label">Panel de control</span>
        </div>
        <h1 className="dash-hero-title">{saludo}, bienvenido</h1>
        <p className="dash-hero-sub">Selecciona un módulo para comenzar</p>

        <div className="dash-hero-stats">
          <span className="dash-stat-pill total">
            <LayoutGrid size={12} />
            {modulos.length} módulos disponibles
          </span>
          {categoriasDisponibles.map((cat) => {
            const count = modulos.filter((m) => cat.modulos.includes(m.titulo)).length;
            const CatIcon = cat.Icon;
            return (
              <span
                key={cat.key}
                className="dash-stat-pill cat"
                style={{ color: cat.color, borderColor: cat.bg, background: cat.bg }}
              >
                <CatIcon size={11} strokeWidth={2.5} />
                {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Body con filtros + grid ── */}
      <div className="dash-body">

        {/* Filtros de categoría */}
        <div className="dash-filters">
          <button
            className={`dash-filter-btn ${filtroActivo === "Todos" ? "active" : ""}`}
            onClick={() => setFiltroActivo("Todos")}
          >
            <LayoutGrid size={13} strokeWidth={2} />
            Todos
          </button>
          {categoriasDisponibles.map((cat) => {
            const CatIcon = cat.Icon;
            return (
              <button
                key={cat.key}
                className={`dash-filter-btn ${filtroActivo === cat.key ? "active" : ""}`}
                style={
                  filtroActivo === cat.key
                    ? { background: cat.color, borderColor: cat.color }
                    : {}
                }
                onClick={() => setFiltroActivo(cat.key)}
              >
                <CatIcon size={13} strokeWidth={2} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grid de cards */}
        <div className="dash-grid">
          {modulosFiltrados.map((modulo, index) => {
            const cat = getCategoriaDeModulo(modulo.titulo);
            const color = cat?.color ?? "#7c6ff7";
            const bg = cat?.bg ?? "#f3f0ff";
            const badgeColor = cat?.badgeColor ?? "#6d5fe6";
            const CatIcon = cat?.Icon ?? LayoutGrid;
            const IconComp = allIcons[modulo.icon] ?? FiIcons.FiFile;
            const isHovered = hoveredId === modulo._id;

            return (
              <div
                key={modulo._id}
                className="dash-card"
                style={{
                  animationDelay: `${Math.min(index * 0.04, 0.5)}s`,
                  borderColor: isHovered ? color + "55" : undefined,
                  boxShadow: isHovered ? `0 12px 32px ${color}1a` : undefined,
                }}
                onClick={() => navigate(modulo.link)}
                onMouseEnter={() => setHoveredId(modulo._id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Franja de color */}
                <div className="dash-card-stripe" style={{ background: color }} />

                {/* Badge de categoría */}
                <div
                  className="dash-card-badge"
                  style={{ background: bg, color: badgeColor }}
                >
                  <CatIcon size={10} strokeWidth={2.5} />
                  {cat?.key ?? ""}
                </div>

                {/* Ícono del módulo */}
                <div
                  className="dash-icon-wrap"
                  style={{ background: isHovered ? color : bg }}
                >
                  <IconComp
                    size={20}
                    color={isHovered ? "#ffffff" : color}
                    strokeWidth={1.8}
                  />
                </div>

                {/* Título */}
                <h3 className="dash-card-title">{modulo.titulo}</h3>

                {/* Descripción */}
                {modulo.descripcion && (
                  <p className="dash-card-desc">{modulo.descripcion}</p>
                )}

                {/* Footer */}
                <div className="dash-card-footer">
                  <span
                    className="dash-arrow"
                    style={{ color: isHovered ? color : undefined }}
                  >
                    Abrir <ArrowRight size={13} strokeWidth={2} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardCards;