import React, { useEffect, useState, useMemo, useRef } from "react";
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

// Iconos svg
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
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  
  
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

    // Filtro por estado - CORREGIDO
    if (estadoFiltro !== 'all') {
      filtered = filtered.filter(bien => {
        // Normalizar ambos valores para comparación
        const estadoBien = bien.estado?.toUpperCase().trim();
        const filtroEstado = estadoFiltro?.toUpperCase().trim();
        return estadoBien === filtroEstado;
      });
    }

    // Filtro por categoría
    if (categoriaFiltro !== 'all') {
      filtered = filtered.filter(bien => bien.categoria === categoriaFiltro);
    }

    return filtered;
  }, [bienes, filterValue, estadoFiltro, categoriaFiltro]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (estadoMenuRef.current && !estadoMenuRef.current.contains(event.target)) {
        setShowEstadoMenu(false);
      }
      if (categoriaMenuRef.current && !categoriaMenuRef.current.contains(event.target)) {
        setShowCategoriaMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calcular estadísticas
  const totalBienes = bienes.length;
  const bienesActivosCount = bienes.filter(b => b.estado?.toUpperCase() === "ACTIVO").length;
  const bienesMantenimientoCount = bienes.filter(b => b.estado?.toUpperCase() === "MANTENIMIENTO").length;
  const bienesInactivosCount = bienes.filter(b => b.estado?.toUpperCase() === "INACTIVO").length;
  const bienesPrestadosCount = bienes.filter(b => b.estado?.toUpperCase() === "PRESTAMO").length;
  const valorTotal = bienes.reduce((sum, b) => sum + (parseFloat(b.valor) || 0), 0);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calcular métricas - CORREGIDO
  const metrics = useMemo(() => {
    return {
      activos: bienes.filter(b => b.estado?.toUpperCase() === "ACTIVO").length,
      mantenimiento: bienes.filter(b => b.estado?.toUpperCase() === "MANTENIMIENTO").length,
      inactivos: bienes.filter(b => b.estado?.toUpperCase() === "INACTIVO").length,
      prestados: bienes.filter(b => b.estado?.toUpperCase() === "PRESTAMO").length,
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
    // 🔹 Validaciones
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

    const codigoExistente = bienes.find(
  (b) => b.codigo?.toLowerCase() === nuevoBien.codigo?.toLowerCase()
);

    if (codigoExistente) {
      showNotification('Ya existe un bien con este código', 'error');
      return;
    }

    // 🔹 Crear objeto FormData
    const formData = new FormData();
    for (const key in nuevoBien) {
      if (key === 'imagen' && nuevoBien[key]) {
        // Archivo tipo File o Blob
        formData.append('imagen', nuevoBien[key]);
      } else {
        formData.append(key, nuevoBien[key]);
      }
    }

    // 🔹 Enviar al backend sin establecer 'Content-Type'
    const res = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al crear el bien');
    }

    const bienCreado = await res.json();
    console.log("🔹 Respuesta del backend:", bienCreado);

    // 🔹 Actualizar estado y notificación
    
    setBienes([...bienes, bienCreado.data]);
    setMostrarModalCrear(false);
    showNotification(`Bien "${bienCreado.data.nombre}" creado exitosamente`, 'success');

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

    // 🔹 Crear FormData y agregar todos los campos de bienActualizado
    const formData = new FormData();
    for (const key in bienActualizado) {
      // Si es imagen y existe, agregar como archivo
      if (key === 'imagen' && bienActualizado[key]) {
        formData.append('imagen', bienActualizado[key]); // tipo File o Blob
      } else {
        formData.append(key, bienActualizado[key]);
      }
    }

    // 🔹 Enviar al backend sin headers, fetch lo detecta automáticamente
    const res = await fetch(`${API_URL}/${bienActualizado._id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al editar el bien');
    }

    const actualizada = await res.json();
    setBienes(bienes.map(b => b._id === actualizada.data._id ? actualizada.data : b));
    setBienSeleccionado(null);
    showNotification(`Bien "${actualizada.data.nombre}" actualizado exitosamente`, 'success');
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
  className={`stat-item ${estadoFiltro === 'ACTIVO' ? 'active' : ''}`}
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
  onClick={() => {
    setEstadoFiltro(estadoFiltro === 'ACTIVO' ? 'all' : 'ACTIVO');
    setPage(1);
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  }}
>
  <div
    className="stat-icon"
    style={{
      background: "rgba(255, 255, 255, 0.2)",
      padding: "0.5rem",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <span role="img" aria-label="activo">🟢</span>
  </div>
  <div className="stat-text" style={{ color: "white" }}>
    <div
      className="stat-value"
      style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}
    >
      {metrics.activos}
    </div>
    <div
      className="stat-label"
      style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}
    >
      En Uso
    </div>
  </div>
</motion.div>
<motion.div
  className={`stat-item ${estadoFiltro === 'MANTENIMIENTO' ? 'active' : ''}`}
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
  onClick={() => {
    setEstadoFiltro(estadoFiltro === 'MANTENIMIENTO' ? 'all' : 'MANTENIMIENTO');
    setPage(1);
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  }}
>
  <div
    style={{
      background: "rgba(255, 255, 255, 0.2)",
      padding: "0.5rem",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <span role="img" aria-label="mantenimiento">🟡</span>
  </div>
  <div style={{ color: "white" }}>
    <div style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {metrics.mantenimiento}
    </div>
    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Mantenimiento
    </div>
  </div>
</motion.div>

<motion.div
  className={`stat-item ${estadoFiltro === 'INACTIVO' ? 'active' : ''}`}
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
  onClick={() => {
    setEstadoFiltro(estadoFiltro === 'INACTIVO' ? 'all' : 'INACTIVO');
    setPage(1);
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  }}
>
  <div
    style={{
      background: "rgba(255, 255, 255, 0.2)",
      padding: "0.5rem",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <span role="img" aria-label="inactivo">🔴</span>
  </div>
  <div style={{ color: "white" }}>
    <div style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {metrics.inactivos}
    </div>
    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Inactivos
    </div>
  </div>
</motion.div>

<motion.div
  className={`stat-item ${estadoFiltro === 'PRESTAMO' ? 'active' : ''}`}
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
  onClick={() => {
    setEstadoFiltro(estadoFiltro === 'PRESTAMO' ? 'all' : 'PRESTAMO');
    setPage(1);
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  }}
>
  <div
    style={{
      background: "rgba(255, 255, 255, 0.2)",
      padding: "0.5rem",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <span role="img" aria-label="prestamo">🔵</span>
  </div>
  <div style={{ color: "white" }}>
    <div style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {metrics.prestados}
    </div>
    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Prestados
    </div>
  </div>
</motion.div>

<motion.div
  className={`stat-item ${estadoFiltro === 'all' ? 'active' : ''}`}
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
  onClick={() => {
    setEstadoFiltro('all');
    setPage(1);
  }}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  }}
>
  <div
    style={{
      background: "rgba(255, 255, 255, 0.2)",
      padding: "0.5rem",
      borderRadius: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <span role="img" aria-label="total">📊</span>
  </div>
  <div style={{ color: "white" }}>
    <div style={{ fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {metrics.total}
    </div>
    <div style={{ fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Total Bienes
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
           
{/* Íconos flotantes decorativos*/}
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
      </motion.div>

     
      {/* BARRA DE BÚSQUEDA Y ACCIONES */}
      <motion.div 
        className="bien-busqueda-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ 
          marginTop: "2rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
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
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          />
          {filterValue && (
            <button 
              className="search-clear"
              onClick={() => setFilterValue('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                color: '#999'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtro Estado */}
        <div className="dropdown-wrapper" ref={estadoMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowEstadoMenu(!showEstadoMenu)}
            className="filter-button"
            style={{
              padding: '0.75rem 1.5rem',
              border: '2px solid #667eea',
              borderRadius: '10px',
              background: 'white',
              color: '#667eea',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
          >
            Estado <ChevronDownIcon />
          </button>
          {showEstadoMenu && (
            <div className="dropdown-menu2" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '0.5rem',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '200px',
              zIndex: 1000,
            }}>
              {estadosOptions.map(estado => (
                <div
                  key={estado.uid}
                  onClick={() => {
                    setEstadoFiltro(estado.uid);
                    setShowEstadoMenu(false);
                    setPage(1);
                  }}
                  className={`dropdown-item ${estadoFiltro === estado.uid ? 'active' : ''}`}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: estadoFiltro === estado.uid ? '#f0f0f0' : 'transparent',
                    transition: 'background 0.2s ease'
                  }}
                >
                  <span className="checkbox" style={{ width: '20px' }}>
                    {estadoFiltro === estado.uid ? '✓' : ''}
                  </span>
                  {estado.name}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <motion.button 
          className="btn-ayuda" 
          onClick={() => setMostrarAyuda(true)} 
          title="Ver ayuda"
          whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
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
          style={{
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
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



      {/* TABLA DE BIENES */}
      <div className="bienes-table-container" style={{ 
        marginTop: '2rem',
        background: 'white',
        borderRadius: '15px',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
       <div style={{ 
       maxHeight: '600px', // ajusta según tu diseño
        overflowY: 'auto',
       overflowX: 'auto',
       borderRadius: '10px'
       }}>
          <table className="bienes-table" style={{ 
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                {columns.map(column => (
                  <th 
                    key={column.uid}
                    onClick={() => handleSort(column.uid)}
                    style={{ 
                      padding: '1rem',
                      textAlign: 'left',
                      cursor: column.sortable ? 'pointer' : 'default',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {column.name}
                    {column.sortable && sortDescriptor.column === column.uid && (
                      <span style={{ marginLeft: '5px' }}>
                        {sortDescriptor.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems .length > 0 ? (
                filteredItems .map((bien, index) => (
                  <tr 
                    key={bien._id}
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      transition: 'background 0.2s ease',
                      background: index % 2 === 0 ? 'white' : '#f9f9f9'
                    }}
                  >
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#667eea' }}>
                      {bien.codigo}
                    </td>
                    <td style={{ padding: '1rem' }}>{bien.nombre}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: '#e8eaf6',
                        color: '#667eea',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        {bien.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', maxWidth: '300px' }}>
                      {bien.descripcion}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {formatCurrency(bien.valor)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={getEstadoBadgeClass(bien.estado)} style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        {bien.estado}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        onClick={() => setBienSeleccionado(bien)}
                        className="btn-action"
                        style={{
                          padding: '0.5rem 1rem',
                          border: '2px solid #667eea',
                          borderRadius: '8px',
                          background: 'white',
                          color: '#667eea',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ 
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '1.1rem'
                  }}>
                    No se encontraron bienes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        

        {/* Información de resultados */}
        <div style={{
          marginTop: '1rem',
          textAlign: 'center',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          Mostrando bienes
          {filterValue && ` (filtrado de ${bienes.length} total)`}
        </div>
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

      {/* Modal Ayuda */}
      {mostrarAyuda && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="modal-content" style={{
            background: 'white',
            borderRadius: '15px',
            padding: '2rem',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h3 className="modal-title" style={{
              fontSize: '1.8rem',
              marginBottom: '1.5rem',
              color: '#667eea',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📚 Guía de Uso - Sistema de Bienes
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                color: '#667eea',
                marginBottom: '0.5rem',
                fontSize: '1.2rem',
                fontWeight: 600
              }}>
                🔍 Búsqueda
              </h4>
              <p style={{ marginBottom: '0.5rem', color: '#666' }}>
                Puedes buscar bienes por:
              </p>
              <ul style={{ 
                marginLeft: '1.5rem',
                marginBottom: '1rem',
                color: '#666',
                lineHeight: 1.8
              }}>
                <li><strong>Código:</strong> BIEN-001, BIEN-002, etc.</li>
                <li><strong>Nombre:</strong> Laptop, Mesa, Silla, etc.</li>
                <li><strong>Categoría:</strong> Tecnología, Mobiliario, etc.</li>
                <li><strong>Descripción:</strong> Cualquier palabra en la descripción</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                color: '#667eea',
                marginBottom: '0.5rem',
                fontSize: '1.2rem',
                fontWeight: 600
              }}>
                📋 Estados de Bienes
              </h4>
              <ul style={{ 
                marginLeft: '1.5rem',
                marginBottom: '1rem',
                color: '#666',
                lineHeight: 1.8
              }}>
                <li><strong>🟢 Activo:</strong> Bienes en uso y disponibles</li>
                <li><strong>🟡 Mantenimiento:</strong> Bienes en reparación o mantenimiento</li>
                <li><strong>🔴 Inactivo:</strong> Bienes no disponibles o retirados</li>
                <li><strong>🔵 Préstamo:</strong> Bienes prestados a terceros</li>
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                color: '#667eea',
                marginBottom: '0.5rem',
                fontSize: '1.2rem',
                fontWeight: 600
              }}>
                ✨ Funciones Principales
              </h4>
              <ul style={{ 
                marginLeft: '1.5rem',
                marginBottom: '1rem',
                color: '#666',
                lineHeight: 1.8
              }}>
                <li><strong>Crear Bien:</strong> Agregar nuevos bienes al inventario</li>
                <li><strong>Editar:</strong> Hacer clic en "Ver detalles" para editar</li>
                <li><strong>Eliminar:</strong> Opción disponible en el modal de edición</li>
                <li><strong>Filtrar:</strong> Usa los filtros de estado y categoría</li>
                <li><strong>Ordenar:</strong> Haz clic en los encabezados de columna</li>
              </ul>
            </div>

            <div className="modal-actions" style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '2rem'
            }}>
              <button 
                className="btn-cerrar" 
                onClick={() => setMostrarAyuda(false)}
                style={{
                  padding: '0.75rem 2rem',
                  border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
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