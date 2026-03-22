import { FiChevronLeft, FiChevronRight, FiMenu, FiChevronDown, FiBook, FiBriefcase, FiShield, FiFile, FiUsers, FiDatabase, FiBarChart2 } from 'react-icons/fi';
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

  // ESTRUCTURA DE CATEGORÍAS
  const categorias = {
    "Operativo": {
      icon: FiBriefcase,
      modulos: ["Compras", "Proveedores", "Donaciones", "Bienes"]
    },
    "Académico": {
      icon: FiBook,
      modulos: ["Matricula", "Horarios", "Biblioteca", "Actividades", "Calendario", "Grados"]
    },
    "RRHH": {
      icon: FiUsers,
      modulos: ["Personal", "Directiva"]
    },
    "Seguridad": {
      icon: FiShield,
      modulos: ["Seguridad", "Auditoria", "Roles", "Solicitudes"]
    },
    "Global/Dashboard": {
      icon: FiBarChart2,
      modulos: ["Dashboard"]
    }
  };

  // MAPEO DE MÓDULOS A PERMISOS (IMPORTANTE: actualizado con todos los módulos)
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
    "Solicitudes": "VISUALIZAR_SOLICITUDES", // 👈 AGREGADO
    "Personal": "VISUALIZAR_PERSONAL",
    "Directiva": "VISUALIZAR_DIRECTIVA",
    "Seguridad": "VISUALIZAR_SEGURIDAD",
    "Auditoria": "VISUALIZAR_AUDITORIA",
    "Dashboard": "VISUALIZAR_DASHBOARD",
    "Roles": "VISUALIZAR_ROLES",
  };

  const getCategoria = (titulo) => {
    for (const [cat, datos] of Object.entries(categorias)) {
      if (datos.modulos.includes(titulo)) return cat;
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
          console.log("❌ No hay usuario autenticado");
          setLoading(false); 
          return; 
        }
        
        const token = await user.getIdToken();
        console.log("🔑 Token obtenido para sidebar");
        
        // 1. OBTENER ROLES DEL USUARIO
        let roles = [];
        try {
          const rolesRes = await axios.get(`${API_URL}/api/usuarios/role`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          roles = rolesRes.data.role ? [rolesRes.data.role] : (rolesRes.data.roles || []);
          setUserRoles(roles);
          console.log("✅ Roles del usuario:", roles);
        } catch (roleError) {
          console.error("Error al obtener roles:", roleError);
        }
        
        // 2. OBTENER PERMISOS DEL USUARIO
        let permisos = [];
        try {
          const permisosRes = await axios.get(`${API_URL}/api/mis-permisos`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          permisos = permisosRes.data.permisos || [];
          setUserPermissions(permisos);
          console.log("✅ Permisos del usuario:", permisos);
        } catch (permError) {
          console.error("Error al obtener permisos:", permError);
        }
        
        // 3. OBTENER MÓDULOS DEL DASHBOARD
        const modulosRes = await axios.get(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("📦 Módulos recibidos del backend:", modulosRes.data.modulos.map(m => m.titulo));
        
        // 4. FILTRAR MÓDULOS - PRIORIZAR PERMISOS SOBRE ROLES
        let modulosFiltrados = [];
        
        // Verificar cada módulo individualmente
        modulosRes.data.modulos.forEach(modulo => {
          const titulo = modulo.titulo;
          let tieneAcceso = false;
          let razon = "";
          
          console.log(`\n🔍 Verificando módulo: ${titulo}`);
          console.log(`   - Permisos del usuario:`, permisos);
          
          // 🔥 NUEVO: Verificar si el usuario TIENE EL PERMISO ESPECÍFICO del módulo
          const permisoRequerido = moduloAPermiso[titulo];
          
          if (permisoRequerido) {
            const tienePermiso = permisos.includes(permisoRequerido);
            console.log(`   - Permiso requerido (${permisoRequerido}): ${tienePermiso}`);
            
            if (tienePermiso) {
              tieneAcceso = true;
              razon = `Tiene permiso ${permisoRequerido}`;
            } else {
              console.log(`   ❌ NO tiene el permiso ${permisoRequerido}`);
            }
          } else {
            console.log(`   ⚠️ No hay permiso definido para ${titulo} en moduloAPermiso`);
          }
          
          // 🔥 IMPORTANTE: NO usar roles como fallback si el usuario es ADMIN
          // Solo usar roles como fallback si el módulo NO tiene permiso definido
          // Y el usuario NO es ADMIN (para evitar que ADMIN vea todo)
          if (!tieneAcceso && !permisoRequerido && roles.length > 0) {
            // Solo permitir por roles si el módulo tiene roles definidos explícitamente
            if (modulo.roles && modulo.roles.length > 0) {
              const tieneRol = modulo.roles.some(rol => roles.includes(rol));
              console.log(`   - Verificación por roles (${modulo.roles}): ${tieneRol}`);
              if (tieneRol) {
                tieneAcceso = true;
                razon = `Tiene rol ${modulo.roles.join(', ')}`;
              }
            }
          }
          
          // Si tiene acceso, agregarlo a la lista
          if (tieneAcceso) {
            console.log(`   ✅ MÓDULO AUTORIZADO: ${titulo} (${razon})`);
            modulosFiltrados.push(modulo);
          } else {
            console.log(`   ❌ MÓDULO NO AUTORIZADO: ${titulo}`);
          }
        });
        
        console.log("\n📊 RESUMEN FINAL:");
        console.log(`Total módulos originales: ${modulosRes.data.modulos.length}`);
        console.log(`Total módulos filtrados: ${modulosFiltrados.length}`);
        console.log("Módulos autorizados:", modulosFiltrados.map(m => m.titulo));
        
        setModulos(modulosFiltrados);
        
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
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

  // Agrupar módulos filtrados según la nueva estructura
  const modulosAgrupados = modulos.reduce((acc, mod) => {
    const cat = getCategoria(mod.titulo);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(mod);
    return acc;
  }, {});

  console.log("📂 Módulos agrupados por categoría:", Object.keys(modulosAgrupados));

  // Ordenar las categorías según el orden definido
  const ordenCategorias = [
    "Operativo",
    "Académico",
    "RRHH",
    "Seguridad",
    "Global/Dashboard",
    "Otros"
  ];

  // Si no hay módulos, mostrar mensaje
  if (Object.keys(modulosAgrupados).length === 0) {
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
        
        {/* Botón Flotante Morado */}
        <button className="toggle-btn-floating" onClick={() => setMinimizado(!minimizado)}>
          {minimizado ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>

        <h2 className="sidebar-logo">{!minimizado && "WorkSpace"}</h2>
        
        <div className="sidebar-nav-container">
          {ordenCategorias.map((catName) => {
            const modulosCat = modulosAgrupados[catName];
            if (!modulosCat || modulosCat.length === 0) return null;
            
            const categoriaData = categorias[catName];
            const IconComponent = categoriaData ? categoriaData.icon : FiFile;
            
            return (
              <div key={catName} className="menu-group">
                <div 
                  className={`group-header ${menuAbierto === catName ? 'active-header' : ''}`}
                  onClick={() => handleToggleSubmenu(catName)}
                >
                  <div className="group-info">
                    <IconComponent size={20} />
                    {!minimizado && <span>{catName}</span>}
                  </div>
                  {!minimizado && <FiChevronDown className={`arrow-icon ${menuAbierto === catName ? 'rotate' : ''}`} />}
                </div>

                <ul className={`submenu-list ${menuAbierto === catName && !minimizado ? 'show' : ''}`}>
                  {modulosCat.map((modulo) => {
                    const IconModulo = FiIcons[modulo.icon] || FiFile;
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
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SideBar;