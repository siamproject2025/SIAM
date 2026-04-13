import { FiChevronLeft , FiChevronRight, FiMenu, FiChevronDown, FiBook, FiBriefcase, FiShield, FiFile, FiUsers, FiDatabase, FiBarChart2 } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/SideBar.css';
import { auth } from "./authentication/Auth";
import { FaPaintRoller , FaUserGraduate } from "react-icons/fa6";
import { RiPagesFill } from "react-icons/ri";
import { MdOutlinePendingActions } from "react-icons/md";
import { FaUsersCog } from "react-icons/fa";
import { TbBus } from "react-icons/tb";

import * as FiIcons from 'react-icons/fi';
import * as RiIcons from 'react-icons/ri';
import * as FaIcons from 'react-icons/fa';
import * as TbIcons from 'react-icons/tb';
import * as MdIcons from 'react-icons/md';

const allIcons = {
  ...FiIcons,
  ...RiIcons,
  ...FaIcons,
  ...TbIcons,
  ...MdIcons,
};

const API_URL = process.env.REACT_APP_API_URL;

// ORDEN FIJO DE CATEGORÍAS Y MÓDULOS CON SUS LABELS
const estructuraSidebar = [
  {
    categoria: "Académico",
    icon: FiBook,
    grupos: [
      {
        label: "Gestión académica",
        modulos: ["Matricula", "Grados", "Horarios"]
      },
      {
        label: "Recursos bibliográficos",
        modulos: ["Biblioteca"]
      },
      {
        label: "Eventos",
        modulos: ["Actividades", "Calendario"]
      }
    ]
  },
  {
    categoria: "Operativo",
    icon: FiBriefcase,
    grupos: [
      {
        label: "Inventario",
        modulos: ["Bienes", "Donaciones"]
      },
      {
        label: "Adquisiciones",
        modulos: ["Compras", "Proveedores"]
      }
    ]
  },
  {
    categoria: "RRHH",
    icon: FiUsers,
    grupos: [
      {
        label: "Talento humano",
        modulos: ["Personal", "Directiva"]
      }
    ]
  },
  {
    categoria: "Seguridad",
    icon: FiShield,
    grupos: [
      {
        label: "Control de accesos",
        modulos: ["Usuarios", "Roles", "Solicitudes"]
      },
      {
        label: "Respaldo y recuperación",
        modulos: ["Backup y restore"]
      },
      {
        label: "Historial de acciones",
        modulos: ["Auditoria"]
      }
    ]
  },
  {
    categoria: "Global/Dashboard",
    icon: FiBarChart2,
    grupos: [
      {
        label: "Dashboard",
        modulos: ["Dashboard"]
      }
    ]
  },
  {
    categoria: "Personalización",
    icon: FaPaintRoller,
    grupos: [
      {
        label: "Personalización",
        modulos: ["Pagina principal","Mantenimientos"]
      }
    ]
  }
];

const moduloAPermiso = {
  "Matricula": "VISUALIZAR_MATRICULA",
  "Grados": "VISUALIZAR_GRADOS",
  "Horarios": "VISUALIZAR_HORARIOS",
  "Calendario": "VISUALIZAR_CALENDARIO",
  "Biblioteca": "VISUALIZAR_BIBLIOTECA",
  "Actividades": "VISUALIZAR_ACTIVIDADES",
  "Compras": "VISUALIZAR_COMPRAS",
  "Proveedores": "VISUALIZAR_PROVEEDORES",
  "Bienes": "VISUALIZAR_BIENES",
  "Donaciones": "VISUALIZAR_DONACIONES",
  "Solicitudes": "VISUALIZAR_SOLICITUDES", 
  "Personal": "VISUALIZAR_PERSONAL",
  "Directiva": "VISUALIZAR_DIRECTIVA",
  "Usuarios": "VISUALIZAR_SEGURIDAD",
  "Auditoria": "VISUALIZAR_AUDITORIA",
  "Dashboard": "VISUALIZAR_DASHBOARD",
  "Roles": "VISUALIZAR_ROLES",
  "Pagina principal": "VISUALIZAR_PAGINA_PRINCIPAL",
  "Backup y restore": "VISUALIZAR_RESTORE",
  "Mantenimientos": "VISUALIZAR_MANTENIMIENTOS",
};

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minimizado, setMinimizado] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) { 
          setLoading(false); 
          return; 
        }
        
        const token = await user.getIdToken(true); 
        
        let roles = [];
        try {
          const rolesRes = await axios.get(`${API_URL}/api/usuarios/role`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          roles = rolesRes.data.role ? [rolesRes.data.role] : (rolesRes.data.roles || []);
          setUserRoles(roles);
        } catch (roleError) {
          console.error("Error al obtener roles:", roleError);
        }
        
        let permisos = [];
        try {
          const permisosRes = await axios.get(`${API_URL}/api/mis-permisos`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          permisos = permisosRes.data.permisos || [];
          setUserPermissions(permisos);
        } catch (permError) {
          console.error("Error al obtener permisos:", permError);
        }
        
        const modulosRes = await axios.get(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        
        let modulosFiltrados = [];
        
        modulosRes.data.modulos.forEach(modulo => {
          const titulo = modulo.titulo;
          let tieneAcceso = false;
          
          const permisoRequerido = moduloAPermiso[titulo];
          
          if (permisoRequerido) {
            const tienePermiso = permisos.includes(permisoRequerido);
            if (tienePermiso) {
              tieneAcceso = true;
            }
          }
          
          if (!tieneAcceso && !permisoRequerido && roles.length > 0) {
            if (modulo.roles && modulo.roles.length > 0) {
              const tieneRol = modulo.roles.some(rol => roles.includes(rol));
              if (tieneRol) {
                tieneAcceso = true;
              }
            }
          }
          
          if (tieneAcceso) {
            modulosFiltrados.push(modulo);
          }
        });
        
        setModulos(modulosFiltrados);
        
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleToggleSubmenu = (categoria) => {
    if (minimizado) setMinimizado(false);
    setMenuAbierto(menuAbierto === categoria ? null : categoria);
  };

  const handleClick = (link) => {
    setActiveLink(link);
    navigate(link);
    setMobileOpen(false);
  };

  if (loading) return <div className="sidebar-loading">Cargando sidebar...</div>;

  // Función para verificar si un módulo está disponible
  const moduloDisponible = (titulo) => {
    return modulos.some(modulo => modulo.titulo === titulo);
  };

  // Construir estructura filtrada con solo los grupos que tienen al menos un módulo disponible
  const estructuraFiltrada = estructuraSidebar.map(categoria => {
    const gruposFiltrados = categoria.grupos
      .map(grupo => ({
        ...grupo,
        modulos: grupo.modulos
          .map(titulo => modulos.find(m => m.titulo === titulo))
          .filter(m => m !== undefined)
      }))
      .filter(grupo => grupo.modulos.length > 0);
    
    return {
      ...categoria,
      grupos: gruposFiltrados
    };
  }).filter(categoria => categoria.grupos.length > 0);

  if (estructuraFiltrada.length === 0) {
    return (
      <div className="dashboard-sidebar">
        <button className="toggle-btn-floating" onClick={() => setMinimizado(!minimizado)}>
          {minimizado ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
        <div className="sidebar-empty">
          <p>No hay módulos disponibles para tus permisos</p>
          <small>Contacta al administrador para solicitar acceso</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
        <FiMenu size={20} />
      </button>

      <div className={`dashboard-sidebar ${minimizado ? "minimized" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        
        <button className="toggle-btn-floating" onClick={() => setMinimizado(!minimizado)}>
          {minimizado ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>

        <h2 className="sidebar-logo">{!minimizado && "WorkSpace"}</h2>
        
        <div className="sidebar-nav-container">
          {estructuraFiltrada.map((categoria) => {
            const isOpen = menuAbierto === categoria.categoria;
            
            return (
              <div key={categoria.categoria} className="menu-group">
                <div 
                  className={`group-header ${isOpen ? 'active-header' : ''}`}
                  onClick={() => handleToggleSubmenu(categoria.categoria)}
                >
                  <div className="group-info">
                    <categoria.icon size={20} />
                    {!minimizado && <span>{categoria.categoria}</span>}
                  </div>
                  {!minimizado && <FiChevronDown className={`arrow-icon ${isOpen ? 'rotate' : ''}`} />}
                </div>

                <div className={`submenu-container ${isOpen && !minimizado ? 'show' : ''}`}>
                  {categoria.grupos.map((grupo, grupoIndex) => (
                    <div key={grupo.label} className="grupo-label-container">
                      {/* Label del grupo */}
                      {!minimizado && (
                        <div className="grupo-label">
                          <span>{grupo.label}</span>
                        </div>
                      )}
                      
                      {/* Módulos del grupo */}
                      <ul className="modulos-list">
                        {grupo.modulos.map((modulo) => {
                          const IconModulo = allIcons[modulo.icon] || FiFile;
                          const isActive = activeLink === modulo.link;
                          return (
                            <li
                              key={modulo._id}
                              onClick={() => handleClick(modulo.link)}
                              className={isActive ? "active-item" : ""}
                            >
                              <IconModulo size={18} />
                              {!minimizado && <span>{modulo.titulo}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SideBar;