import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import ModalCrearBien from './Bienes/ModalCrearBien';
import ModalDetalleBien from './Bienes/ModalDetalleBien';
import Notification from '../../components/Notification';
import * as XLSX from 'xlsx';
import '../../styles/Models/Bienes.css';
import { 
  Package,
  Search,
  HelpCircle,
  Plus,
  Users,
  Award,
  Building2,
  Truck,
  Star,
  Shield,
  Calendar,
  DollarSign
} from 'lucide-react';


// Iconos SVG
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const API_URL = "http://localhost:5000/api/bienes";

const Bienes = () => {
  // Estados principales
  const [bienes, setBienes] = useState([]);
  const [bienSeleccionado, setBienSeleccionado] = useState(null);
  const [filterValue, setFilterValue] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('all');
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');
  const [sortDescriptor, setSortDescriptor] = useState({ column: "codigo", direction: "ascending" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [showCategoriaMenu, setShowCategoriaMenu] = useState(false);
  
  const actionMenuRef = useRef(null);
  const estadoMenuRef = useRef(null);
  const categoriaMenuRef = useRef(null);

  // Columnas de la tabla
  const columns = [
    { name: "CÓDIGO", uid: "codigo", sortable: true },
    { name: "NOMBRE", uid: "nombre", sortable: true },
    { name: "CATEGORÍA", uid: "categoria", sortable: true },
    { name: "DESCRIPCIÓN", uid: "descripcion", sortable: false },
    { name: "VALOR", uid: "valor", sortable: true },
    { name: "ESTADO", uid: "estado", sortable: true },
    { name: "ACCIONES", uid: "acciones", sortable: false }
  ];

  const estadosOptions = [
    { name: "Todos", uid: "all" },
    { name: "Activo", uid: "ACTIVO" },
    { name: "Mantenimiento", uid: "MANTENIMIENTO" },
    { name: "Inactivo", uid: "INACTIVO" },
    { name: "Préstamo", uid: "PRESTAMO" }
  ];

  // Cargar datos
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setBienes(data))
      .catch(err => console.error('Error al obtener los bienes:', err));
  }, []);

  // Calcular estadísticas
  const totalBienes = bienes.length;
  const bienesActivosCount = bienes.filter(b => b.estado === "ACTIVO").length;
  const bienesMantenimientoCount = bienes.filter(b => b.estado === "MANTENIMIENTO").length;
  const bienesInactivosCount = bienes.filter(b => b.estado === "INACTIVO").length;
  const bienesPrestadosCount = bienes.filter(b => b.estado === "PRESTAMO").length;
  const valorTotal = bienes.reduce((sum, b) => sum + (parseFloat(b.valor) || 0), 0);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calcular métricas
  const metrics = useMemo(() => {
    return {
      activos: bienes.filter(b => b.estado === "ACTIVO").length,
      mantenimiento: bienes.filter(b => b.estado === "MANTENIMIENTO").length,
      inactivos: bienes.filter(b => b.estado === "INACTIVO").length,
      prestados: bienes.filter(b => b.estado === "PRESTAMO").length,
      total: bienes.length
    };
  }, [bienes]);

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const cats = [...new Set(bienes.map(b => b.categoria).filter(Boolean))];
    return cats.sort();
  }, [bienes]);

  // Handlers CRUD
  const handleCrearBien = async (nuevoBien) => {
    try {
      if (!nuevoBien.codigo.trim()) {
        showNotification('El código del bien es obligatorio', 'error');
        return;
      }
      if (!nuevoBien.nombre.trim()) {
        showNotification('El nombre del bien es obligatorio', 'error');
        return;
      }
      if (!nuevoBien.estado) {
        showNotification('Debe seleccionar un estado inicial', 'error');
        return;
      }
      if (!nuevoBien.valor || nuevoBien.valor <= 0) {
        showNotification('El valor debe ser mayor a 0', 'error');
        return;
      }

      const codigoExistente = bienes.find(b => b.codigo.toLowerCase() === nuevoBien.codigo.toLowerCase());
      if (codigoExistente) {
        showNotification('Ya existe un bien con este código', 'error');
        return;
      }

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoBien)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el bien');
      }
      
      const bienCreado = await res.json();
      setBienes([...bienes, bienCreado]);
      setMostrarModalCrear(false);
      showNotification(`Bien "${bienCreado.nombre}" creado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al crear el bien', 'error');
    }
  };

  const handleEditarBien = async (bienActualizado) => {
    try {
      if (!bienActualizado.codigo.trim()) {
        showNotification('El código del bien es obligatorio', 'error');
        return;
      }
      if (!bienActualizado.nombre.trim()) {
        showNotification('El nombre del bien es obligatorio', 'error');
        return;
      }
      if (!bienActualizado.estado) {
        showNotification('Debe seleccionar un estado', 'error');
        return;
      }
      if (!bienActualizado.valor || bienActualizado.valor <= 0) {
        showNotification('El valor debe ser mayor a 0', 'error');
        return;
      }

      const res = await fetch(`${API_URL}/${bienActualizado._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bienActualizado)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al editar el bien');
      }
      
      const actualizada = await res.json();
      setBienes(bienes.map(b => b._id === actualizada._id ? actualizada : b));
      setBienSeleccionado(null);
      showNotification(`Bien "${actualizada.nombre}" actualizado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al editar el bien', 'error');
    }
  };

  const handleEliminarBien = async (id) => {
    const bienAEliminar = bienes.find(b => b._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar el bien "${bienAEliminar?.nombre}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar el bien');
      }
      
      setBienes(bienes.filter(b => b._id !== id));
      setBienSeleccionado(null);
      setShowActionMenu(null);
      showNotification(`Bien "${bienAEliminar?.nombre}" eliminado exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar el bien', 'error');
    }
  };

  // Filtrado
  const filteredItems = useMemo(() => {
    let filtered = [...bienes];

    // Filtro por búsqueda
    if (filterValue) {
      filtered = filtered.filter(bien =>
        bien.codigo?.toLowerCase().includes(filterValue.toLowerCase()) ||
        bien.nombre?.toLowerCase().includes(filterValue.toLowerCase()) ||
        bien.categoria?.toLowerCase().includes(filterValue.toLowerCase()) ||
        bien.descripcion?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Filtro por estado
    if (estadoFiltro !== 'all') {
      filtered = filtered.filter(bien => bien.estado === estadoFiltro);
    }

    // Filtro por categoría
    if (categoriaFiltro !== 'all') {
      filtered = filtered.filter(bien => bien.categoria === categoriaFiltro);
    }

    return filtered;
  }, [bienes, filterValue, estadoFiltro, categoriaFiltro]);

  // Ordenamiento
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let first = a[sortDescriptor.column];
      let second = b[sortDescriptor.column];

      if (sortDescriptor.column === "valor") {
        first = Number(a.valor) || 0;
        second = Number(b.valor) || 0;
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  // Paginación
  const pages = Math.ceil(sortedItems.length / rowsPerPage) || 1;
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [page, sortedItems, rowsPerPage]);

  const handleSort = (columnKey) => {
    const column = columns.find(c => c.uid === columnKey);
    if (!column?.sortable) return;
    
    setSortDescriptor(prev => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === "ascending" ? "descending" : "ascending"
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      'ACTIVO': 'estado-badge estado-activo',
      'MANTENIMIENTO': 'estado-badge estado-mantenimiento',
      'INACTIVO': 'estado-badge estado-inactivo',
      'PRESTAMO': 'estado-badge estado-prestamo'
    };
    return clases[estado] || 'estado-badge';
  };

  return (
    <div className="bienes-container">
      {/* Header */}
      <div className="bienes-header">
        <h2>Sistema de Gestión de Bienes</h2>
        <p className="bienes-subtitle">Controla y administra el inventario de bienes institucionales</p>
      </div>

      {/* Cards Métricas */}
      <div className="metrics-cards-container">
        <div 
          className={`metric-card metric-activo ${estadoFiltro === 'ACTIVO' ? 'active' : ''}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === 'ACTIVO' ? 'all' : 'ACTIVO');
            setPage(1);
          }}
        >
          <div className="metric-icon">🟢</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.activos}</div>
            <div className="metric-label">En Uso</div>
          </div>
        </div>

        <div 
          className={`metric-card metric-mantenimiento ${estadoFiltro === 'MANTENIMIENTO' ? 'active' : ''}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === 'MANTENIMIENTO' ? 'all' : 'MANTENIMIENTO');
            setPage(1);
          }}
        >
          <div className="metric-icon">🟡</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.mantenimiento}</div>
            <div className="metric-label">Mantenimiento</div>
          </div>
        </div>

        <div 
          className={`metric-card metric-inactivo ${estadoFiltro === 'INACTIVO' ? 'active' : ''}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === 'INACTIVO' ? 'all' : 'INACTIVO');
            setPage(1);
          }}
        >
          <div className="metric-icon">🔴</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.inactivos}</div>
            <div className="metric-label">Inactivos</div>
          </div>
        </div>

        <div 
          className={`metric-card metric-prestamo ${estadoFiltro === 'PRESTAMO' ? 'active' : ''}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === 'PRESTAMO' ? 'all' : 'PRESTAMO');
            setPage(1);
          }}
        >
          <div className="metric-icon">🔵</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.prestados}</div>
            <div className="metric-label">Prestados</div>
          </div>
        </div>

        <div 
          className={`metric-card metric-total ${estadoFiltro === 'all' ? 'active' : ''}`}
          onClick={() => {
            setEstadoFiltro('all');
            setPage(1);
          }}
        >
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.total}</div>
            <div className="metric-label">Total Bienes</div>
          </div>
        </div>
      </div>

      {/* Top Content - Filtros */}
      <div className="bienes-top-content">
        <div className="bienes-filters-row">
          {/* Search */}
          <div className="search-container">
            <div className="search-icon">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar por código, nombre, categoría o descripción..."
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setPage(1);
              }}
              className="search-input"
            />
            {filterValue && (
              <button 
                className="search-clear"
                onClick={() => setFilterValue('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro Estado */}
          <div className="dropdown-wrapper" ref={estadoMenuRef}>
            <button
              onClick={() => setShowEstadoMenu(!showEstadoMenu)}
              className="filter-button"
            >
              Estado <ChevronDownIcon />
            </button>
            {showEstadoMenu && (
              <div className="dropdown-menu">
                {estadosOptions.map(estado => (
                  <div
                    key={estado.uid}
                    onClick={() => {
                      setEstadoFiltro(estado.uid);
                      setShowEstadoMenu(false);
                      setPage(1);
                    }}
                    className={`dropdown-item ${estadoFiltro === estado.uid ? 'active' : ''}`}
                  >
                    <span className="checkbox">{estadoFiltro === estado.uid ? '✓' : ''}</span>
                    {estado.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtro Categoría */}
          <div className="dropdown-wrapper" ref={categoriaMenuRef}>
            <button
              onClick={() => setShowCategoriaMenu(!showCategoriaMenu)}
              className="filter-button"
            >
              Categoría <ChevronDownIcon />
            </button>
            {showCategoriaMenu && (
              <div className="dropdown-menu">
                <div
                  onClick={() => {
                    setCategoriaFiltro('all');
                    setShowCategoriaMenu(false);
                    setPage(1);
                  }}
                  className={`dropdown-item ${categoriaFiltro === 'all' ? 'active' : ''}`}
                >
                  <span className="checkbox">{categoriaFiltro === 'all' ? '✓' : ''}</span>
                  Todas
                </div>
                {categorias.map(cat => (
                  <div
                    key={cat}
                    onClick={() => {
                      setCategoriaFiltro(cat);
                      setShowCategoriaMenu(false);
                      setPage(1);
                    }}
                    className={`dropdown-item ${categoriaFiltro === cat ? 'active' : ''}`}
                  >
                    <span className="checkbox">{categoriaFiltro === cat ? '✓' : ''}</span>
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

  return (
    <div className="bien-container">
      {/* 🎨 ENCABEZADO MEJORADO */}
      <motion.div 
        className="bien-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="header-gradient"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "2.5rem",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Patrón de fondo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            opacity: 0.3
          }} />

          <div className="header-content" style={{ position: "relative", zIndex: 2 }}>
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              style={{
                fontSize: "2.8rem",
                color: "white",
                marginBottom: "0.5rem",
                fontWeight: 800,
                textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                letterSpacing: "-0.5px",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <Package size={36} fill="white" color="white" />
              </motion.div>
              Sistema de Bienes
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                style={{ marginLeft: 'auto' }}
              >
                <Building2 size={32} color="white" />
              </motion.div>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "1.2rem",
                marginBottom: 0,
                fontWeight: 500,
                textShadow: "0 1px 5px rgba(0,0,0,0.1)"
              }}
            >
              Gestiona y controla todos tus bienes de manera eficiente y profesional
            </motion.p>

            <motion.div 
              className="header-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              style={{
                display: "flex",
                gap: "2rem",
                marginTop: "1.5rem",
                flexWrap: "wrap"
              }}
            >
              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="stat-icon" style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Package size={20} color="white" />
                </div>
                <div className="stat-text" style={{ color: "white" }}>
                  <div className="stat-value" style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    {totalBienes}
                  </div>
                  <div className="stat-label" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    Total Bienes
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="stat-icon" style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Award size={20} color="white" />
                </div>
                <div className="stat-text" style={{ color: "white" }}>
                  <div className="stat-value" style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    {bienesActivosCount}
                  </div>
                  <div className="stat-label" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    Bienes Activos
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)"
                }}
              >
                <div className="stat-icon" style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "0.5rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <DollarSign size={20} color="white" />
                </div>
                <div className="stat-text" style={{ color: "white" }}>
                  <div className="stat-value" style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    ${valorTotal.toLocaleString()}
                  </div>
                  <div className="stat-label" style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
                    Valor Total
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="floating-icons"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{
                position: "absolute",
                top: "20px",
                right: "30px",
                display: "flex",
                gap: "15px",
                zIndex: 3
              }}
            >
              <motion.div 
                className="floating-icon"
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <Calendar size={20} color="white" />
              </motion.div>
              <motion.div 
                className="floating-icon"
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, -8, 8, 0]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <Shield size={20} color="white" />
              </motion.div>
              <motion.div 
                className="floating-icon"
                animate={{ 
                  y: [0, -12, 0],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 4.2, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  padding: "12px",
                  borderRadius: "50%",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.3)"
                }}
              >
                <Star size={20} color="white" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* BARRA DE BÚSQUEDA Y ACCIONES */}
        <motion.div 
          className="bien-busqueda-bar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ marginTop: "2rem" }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
            >
              <Search size={18} />
            </motion.div>
            <input
              type="text"
              className="bien-busqueda"
              placeholder="Buscar por código, nombre, categoría o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <motion.button 
            className="btn-ayuda" 
            onClick={() => setMostrarAyuda(true)} 
            title="Ver ayuda"
            whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <HelpCircle size={18} />
            </motion.div>
            Ayuda
          </motion.button>
          
          <motion.button 
            className="btn-nueva-bien" 
            onClick={() => setMostrarModalCrear(true)} 
            title="Crear nuevo bien"
            whileHover={{ 
              scale: 1.08, 
              boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Plus size={18} />
            </motion.div>
            Nuevo Bien
          </motion.button>
        </motion.div>
      </motion.div>

      {/* El resto del código se mantiene igual */}
      <div className="bien-categorias-container">
        {renderGrupoBienes("Bienes en uso", bienesActivos)}
        {renderGrupoBienes("Bienes en mantenimiento", bienesMantenimiento)}
        {renderGrupoBienes("Bienes inactivos", bienesInactivos)}
        {renderGrupoBienes("Bienes prestados", bienesPrestados)}
      </div>

      {/* Modales */}
      {mostrarModalCrear && (
        <ModalCrearBien
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearBien}
        />
      )}

      {bienSeleccionado && (
        <ModalDetalleBien
          bien={bienSeleccionado}
          onClose={() => setBienSeleccionado(null)}
          onUpdate={handleEditarBien}
          onDelete={handleEliminarBien}
        />
      )}

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Modal Ayuda se mantiene igual */}
      {mostrarAyuda && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Bienes</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>🔍 Búsqueda</h4>
              <p>Puedes buscar bienes por:</p>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Código:</strong> BIEN-001, BIEN-002, etc.</li>
                <li><strong>Nombre:</strong> Laptop, Mesa, Silla, etc.</li>
                <li><strong>Categoría:</strong> Tecnología, Mobiliario, etc.</li>
                <li><strong>Descripción:</strong> Cualquier palabra en la descripción</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>📋 Categorías de Bienes</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>🟢 En Uso:</strong> Bienes activos y disponibles</li>
                <li><strong>🟡 Mantenimiento:</strong> Bienes en reparación o mantenimiento</li>
                <li><strong>🔴 Inactivos:</strong> Bienes no disponibles o retirados</li>
                <li><strong>🔵 Prestados:</strong> Bienes prestados a terceros</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>✨ Funciones Principales</h4>
              <ul style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                <li><strong>Crear Bien:</strong> Agregar nuevos bienes al inventario</li>
                <li><strong>Editar:</strong> Hacer clic en cualquier bien para editarlo</li>
                <li><strong>Eliminar:</strong> Opción disponible en el modal de edición</li>
                <li><strong>Filtrar:</strong> Usa la barra de búsqueda para encontrar bienes</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button className="btn-cerrar" onClick={() => setMostrarAyuda(false)}>
                ✅ Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bienes;