import { FiChevronLeft, FiChevronRight, FiMenu, FiChevronDown, FiBook, FiBriefcase, FiShield, FiFile } from 'react-icons/fi';
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import '../styles/SideBar.css';
import { auth } from "./authentication/Auth";
import * as FiIcons from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL;

const SideBar = () => {
  const [modulos, setModulos] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]); // 👈 NUEVO: roles del usuario
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

  // Mapeo para organizar tus componentes en carpetas
  const categorias = {
    "Académico": ["Matricula", "Grados", "Horarios", "Calendario", "Biblioteca", "Actividades"],
    "Administrativo": ["Compras", "Proveedores", "Bienes", "Donaciones", "Personal", "Directiva"],
    "Seguridad": ["Seguridad", "Auditoria", "Roles"]
  };

  // MAPEO DE MÓDULOS A PERMISOS (usado como respaldo)
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
    "Personal": "VISUALIZAR_PERSONAL",
    "Directiva": "VISUALIZAR_DIRECTIVA",
    "Seguridad": "VISUALIZAR_SEGURIDAD",
    "Auditoria": "VISUALIZAR_AUDITORIA",
    "Dashboard": "VISUALIZAR_DASHBOARD",
    "Roles" : "VISUALIZAR_ROLES"
  };

  const getCategoria = (titulo) => {
    for (const [cat, nombres] of Object.entries(categorias)) {
      if (nombres.includes(titulo)) return cat;
    }
    return "Otros";
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) { 
          setLoading(false); 
          return; 
        }
        
        const token = await user.getIdToken();
        
        // 👇 1. OBTENER ROLES DEL USUARIO (NUEVO)
        let roles = [];
        try {
          const rolesRes = await axios.get(`${API_URL}/api/usuarios/role`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Asumiendo que la respuesta es { role: "ADMIN" } o { roles: ["ADMIN"] }
          roles = rolesRes.data.role ? [rolesRes.data.role] : (rolesRes.data.roles || []);
          setUserRoles(roles);
       
        } catch (roleError) {
        }
        
        // 👇 2. OBTENER PERMISOS DEL USUARIO
        let permisos = [];
        try {
          const permisosRes = await axios.get(`${API_URL}/api/mis-permisos`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          permisos = permisosRes.data.permisos || [];
          setUserPermissions(permisos);
        } catch (permError) {
        }
        
        // 👇 3. OBTENER MÓDULOS DEL DASHBOARD
        const modulosRes = await axios.get(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        
        // 👇 4. FILTRAR MÓDULOS (PERMISOS + ROLES COMO FALLBACK)
        let modulosFiltrados = modulosRes.data.modulos;
        
        // Si tenemos permisos, filtramos por ellos
        if (permisos.length > 0) {
          modulosFiltrados = modulosRes.data.modulos.filter(modulo => {
            const titulo = modulo.titulo;
            
            // OPCIÓN 1: Usar el permiso del módulo si existe
            if (modulo.permiso) {
              const tienePermiso = permisos.includes(modulo.permiso);
              if (tienePermiso) return true;
            }
            
            // OPCIÓN 2: Usar el mapeo de título a permiso
            const permisoRequerido = moduloAPermiso[titulo];
            if (permisoRequerido) {
              const tienePermiso = permisos.includes(permisoRequerido);
              if (tienePermiso) return true;
            }
            
            // 👇 FALLBACK: Verificar por ROLES del módulo
            if (modulo.roles && modulo.roles.length > 0 && roles.length > 0) {
              const tieneRol = modulo.roles.some(rol => roles.includes(rol));
              if (tieneRol) return true;
            }
            
            return false;
          });
        } 
        // Si no hay permisos, filtramos solo por roles
        else if (roles.length > 0) {
          modulosFiltrados = modulosRes.data.modulos.filter(modulo => {
            if (modulo.roles && modulo.roles.length > 0) {
              const tieneRol = modulo.roles.some(rol => roles.includes(rol));
              return tieneRol;
            }
            return false;
          });
        }
        
        setModulos(modulosFiltrados);
        
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleToggleSubmenu = (nombreCat) => {
    if (minimizado) setMinimizado(false);
    setMenuAbierto(menuAbierto === nombreCat ? null : nombreCat);
  };

  const handleClick = (link) => {
    setActiveLink(link);
    navigate(link);
    setMobileOpen(false);
  };

  if (loading) return <div className="sidebar-loading">Cargando sidebar...</div>;

  // Agrupar módulos filtrados
  const modulosAgrupados = modulos.reduce((acc, mod) => {
    const cat = getCategoria(mod.titulo);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mod);
    return acc;
  }, {});


  // Si no hay módulos, mostrar mensaje
  if (Object.keys(modulosAgrupados).length === 0) {
    return (
      <div className="dashboard-sidebar">
        <button className="toggle-btn-floating" onClick={() => setMinimizado(!minimizado)}>
          {minimizado ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
        <div className="sidebar-empty">
          <p>No hay módulos disponibles</p>
          <small>Contacta al administrador</small>
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
        
        {/* Botón Flotante Morado */}
        <button className="toggle-btn-floating" onClick={() => setMinimizado(!minimizado)}>
          {minimizado ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>

        <h2 className="sidebar-logo">{!minimizado && "WorkSpace"}</h2>
        
        <div className="sidebar-nav-container">
          {Object.keys(modulosAgrupados).map((catName) => (
            <div key={catName} className="menu-group">
              <div 
                className={`group-header ${menuAbierto === catName ? 'active-header' : ''}`}
                onClick={() => handleToggleSubmenu(catName)}
              >
                <div className="group-info">
                   {catName === "Académico" && <FiBook size={20} />}
                   {catName === "Administrativo" && <FiBriefcase size={20} />}
                   {catName === "Seguridad" && <FiShield size={20} />}
                   {catName === "Otros" && <FiFile size={20} />}
                   {!minimizado && <span>{catName}</span>}
                </div>
                {!minimizado && <FiChevronDown className={`arrow-icon ${menuAbierto === catName ? 'rotate' : ''}`} />}
              </div>

              <ul className={`submenu-list ${menuAbierto === catName && !minimizado ? 'show' : ''}`}>
                {modulosAgrupados[catName].map((modulo) => {
                  const IconComponent = FiIcons[modulo.icon] || FiFile;
                  const isActive = activeLink === modulo.link;
                  return (
                    <li
                      key={modulo._id}
                      onClick={() => handleClick(modulo.link)}
                      className={isActive ? "active-item" : ""}
                    >
                      <IconComponent size={18} />
                      {!minimizado && <span>{modulo.titulo}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SideBar;