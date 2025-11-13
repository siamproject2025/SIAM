import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import ModalCrearOrden from "../Models/OrdenCompra/ModalCrearOrden";
import ModalDetalleOrden from "../Models/OrdenCompra/ModalDetalleOrden";
import '../../styles/Models/ordencompra.css';
import { auth } from "..//../components/authentication/Auth";
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { loadingController } from "../../api/loadingController";
import { 
  Search,
  Plus,
  Award,
  FileText,
  Truck,
  Star,
  Calendar,
  DollarSign,
  Filter,
} from 'lucide-react';

// Iconos SVG
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

const API_URL = process.env.REACT_APP_API_URL+"/api/compras";

const OrdenCompra = () => {
  // Estados principales
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState(new Set(["all"]));
  const [visibleColumns, setVisibleColumns] = useState(new Set(["numero", "proveedor", "fecha", "items", "total", "estado", "acciones"]));
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({ column: "fecha", direction: "descending" });
  const [page, setPage] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [notification, setNotification] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);


  //Dialogo de eliminación
  const [ordenAEliminar, setOrdenAEliminar] = useState(null);
const [showConfirm, setShowConfirm] = useState(false);


  // Referencias para cerrar menús al hacer clic fuera
  const statusMenuRef = useRef(null);
  const columnMenuRef = useRef(null);
  const actionMenuRef = useRef(null);

  // Columnas disponibles
  const columns = [
    { name: "NÚMERO", uid: "numero", sortable: true },
    { name: "PROVEEDOR", uid: "proveedor", sortable: true },
    { name: "FECHA", uid: "fecha", sortable: true },
    { name: "ITEMS", uid: "items", sortable: true },
    { name: "TOTAL", uid: "total", sortable: true },
    { name: "ESTADO", uid: "estado", sortable: true },
    { name: "ACCIONES", uid: "acciones", sortable: false }
  ];

  const statusOptions = [
    { name: "Todos", uid: "all" },
    { name: "Borrador", uid: "BORRADOR" },
    { name: "Enviada", uid: "ENVIADA" },
    { name: "Recibida", uid: "RECIBIDA" },
    { name: "Cerrada", uid: "CERRADA" }
  ];

  // Notificaciones
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // 🔹 Cargar proveedores
  useEffect(() => {
    
    const cargarProveedores = async () => {
    const user = auth.currentUser;
     
     try {
      loadingController.start();
      const user = auth.currentUser;
      
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();


      const res = await fetch(process.env.REACT_APP_API_URL+'/api/proveedores', {
        headers: {
          Authorization: `Bearer ${token}` // ✅ Token agregado
        }
      });

      if (!res.ok) throw new Error('Error al cargar proveedores');
      const data = await res.json();
      setProveedores(data.filter(p => p.estado === 'ACTIVO'));
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      showNotification(err.message || 'Error al cargar proveedores', 'error');
    }finally {
      loadingController.stop(); // 👈 detiene el loader
    }
  };

  cargarProveedores();
}, []);



  // 🔹 Cargar órdenes
useEffect(() => {
  const cargarOrdenes = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuario no autenticado');
      const token = await user.getIdToken();

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ Token agregado
        }
      });

      if (!res.ok) throw new Error('Error al cargar órdenes');
      const data = await res.json();
      setOrdenes(data);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
      showNotification(err.message || 'Error al cargar órdenes', 'error');
    }
  };
  
  cargarOrdenes();
}, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular estadísticas
  const totalOrdenes = ordenes.length;
  const ordenesBorrador = ordenes.filter(o => o.estado === "BORRADOR").length;
  const ordenesEnviadas = ordenes.filter(o => o.estado === "ENVIADA").length;
  const ordenesRecibidas = ordenes.filter(o => o.estado === "RECIBIDA").length;
  const ordenesCerradas = ordenes.filter(o => o.estado === "CERRADA").length;
  const valorTotal = ordenes.reduce((sum, orden) => {
    const totalOrden = orden.items?.reduce((sumItem, item) => sumItem + item.cantidad * item.costoUnit, 0) || 0;
    return sum + totalOrden;
  }, 0);

  // Filtrado
  const filteredItems = useMemo(() => {
    let filtered = [...ordenes];

    if (filterValue) {
      filtered = filtered.filter(orden =>
        orden.numero?.toLowerCase().includes(filterValue.toLowerCase()) ||
        orden.proveedor_id?.nombre?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (!statusFilter.has("all")) {
      filtered = filtered.filter(orden => statusFilter.has(orden.estado));
    }

    return filtered;
  }, [ordenes, filterValue, statusFilter]);

  // Ordenamiento
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let first = a[sortDescriptor.column];
      let second = b[sortDescriptor.column];

      if (sortDescriptor.column === "total") {
        first = a.items?.reduce((sum, item) => sum + item.cantidad * item.costoUnit, 0) || 0;
        second = b.items?.reduce((sum, item) => sum + item.cantidad * item.costoUnit, 0) || 0;
      }

      if (sortDescriptor.column === "items") {
        first = a.items?.length || 0;
        second = b.items?.length || 0;
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

  // Handlers
  const handleSort = (columnKey) => {
    if (!columns.find(c => c.uid === columnKey)?.sortable) return;
    setSortDescriptor(prev => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === "ascending" ? "descending" : "ascending"
    }));
  };

  const handleStatClick = (estado) => {
    if (estado === "all") {
      setStatusFilter(new Set(["all"]));
    } else {
      setStatusFilter(new Set([estado]));
    }
  };

  const handleCrearOrden = async (nuevaOrden) => {
  try {
    if (!nuevaOrden.numero.trim()) {
      showNotification('El número de orden es obligatorio', 'error');
      return;
    }
    if (!nuevaOrden.proveedor_id.trim()) {
      showNotification('El ID del proveedor es obligatorio', 'error');
      return;
    }
    if (!nuevaOrden.items || nuevaOrden.items.length === 0) {
      showNotification('Debe agregar al menos un ítem a la orden', 'error');
      return;
    }

    const numeroExistente = ordenes.find(o => o.numero.toLowerCase() === nuevaOrden.numero.toLowerCase());
    if (numeroExistente) {
      showNotification('Ya existe una orden con este número', 'error');
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // ✅ Token agregado
      },
      body: JSON.stringify(nuevaOrden)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al crear la orden');
    }

    const ordenCreada = await res.json();
    setOrdenes([...ordenes, ordenCreada]);
    setMostrarModalCrear(false);
    showNotification(`Orden "${ordenCreada.numero}" creada exitosamente`, 'success');
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al crear la orden', 'error');
  }
};

const handleEditarOrden = async (ordenActualizada) => {
  try {
    if (!ordenActualizada.numero.trim()) {
      showNotification('El número de orden es obligatorio', 'error');
      return;
    }
    if (!ordenActualizada.proveedor_id) {
      showNotification('Debes seleccionar un proveedor', 'error');
      return;
    }
    if (!ordenActualizada.items || ordenActualizada.items.length === 0) {
      showNotification('La orden debe tener al menos un ítem', 'error');
      return;
    }

    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const ordenParaEnviar = {
      ...ordenActualizada,
      proveedor_id: typeof ordenActualizada.proveedor_id === 'object' 
        ? ordenActualizada.proveedor_id._id 
        : ordenActualizada.proveedor_id,
      fecha: ordenActualizada.fecha || new Date().toISOString().split('T')[0]
    };

    const res = await fetch(`${API_URL}/${ordenActualizada._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` // ✅ Token agregado
      },
      body: JSON.stringify(ordenParaEnviar)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al editar la orden');
    }

    const actualizada = await res.json();
    setOrdenes(ordenes.map(o => o._id === actualizada._id ? actualizada : o));
    setOrdenSeleccionada(null);
    showNotification(`Orden "${actualizada.numero}" actualizada exitosamente`, 'success');
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al editar la orden', 'error');
  }
};

const handleEliminarOrden = (id) => {
  const orden = ordenes.find(o => o._id === id);
  setOrdenAEliminar(orden);
  setShowConfirm(true);
};

const confirmarEliminacionOrden = async () => {
  setShowConfirm(false);
  if (!ordenAEliminar) return;

  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuario no autenticado');
    const token = await user.getIdToken();

    const res = await fetch(`${API_URL}/${ordenAEliminar._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error al eliminar la orden');
    }

    setOrdenes(ordenes.filter(o => o._id !== ordenAEliminar._id));
    setOrdenSeleccionada(null);
    setShowActionMenu(null);
    showNotification(`Orden "${ordenAEliminar.numero}" eliminada exitosamente`, 'success');
    setOrdenAEliminar(null);
  } catch (err) {
    console.error(err.message);
    showNotification(err.message || 'Error al eliminar la orden', 'error');
  }
};

const cancelarEliminacionOrden = () => {
  setShowConfirm(false);
  setOrdenAEliminar(null);
};



  const toggleStatusFilter = (status) => {
    const newSet = new Set(statusFilter);
    if (status === "all") {
      setStatusFilter(new Set(["all"]));
    } else {
      newSet.delete("all");
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      setStatusFilter(newSet.size === 0 ? new Set(["all"]) : newSet);
    }
  };

  const toggleColumnVisibility = (columnUid) => {
    const newSet = new Set(visibleColumns);
    if (columnUid === "acciones") return;
    
    if (newSet.has(columnUid)) {
      if (newSet.size > 2) {
        newSet.delete(columnUid);
      }
    } else {
      newSet.add(columnUid);
    }
    setVisibleColumns(newSet);
  };

  const visibleColumnsArray = useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.uid));
  }, [visibleColumns]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      'BORRADOR': 'estado-badge estado-borrador',
      'ENVIADA': 'estado-badge estado-enviada',
      'RECIBIDA': 'estado-badge estado-recibida',
      'CERRADA': 'estado-badge estado-cerrada'
    };
    return clases[estado] || 'estado-badge';
  };

  return (
    <div className="orden-compra-container">
      {/* 🎨 ENCABEZADO MEJORADO */}
      <motion.div 
        className="orden-header"
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
                <FileText size={36} fill="white" color="white" />
              </motion.div>
              Sistema de Órdenes de Compra
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                style={{ marginLeft: 'auto' }}
              >
                <Truck size={32} color="white" />
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
              Gestiona y controla todas tus órdenes de compra de manera eficiente y profesional
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
  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
  onClick={() => handleStatClick("BORRADOR")}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    color: "rgba(255, 255, 255, 0.9)",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer"
  }}
>
  <div className="stat-icon" style={{
    background: "rgba(255, 255, 255, 0.2)",
    color: "rgba(255, 255, 255, 0.9)",
    padding: "0.5rem",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
    <Award size={20} color="white" />
  </div>
  <div className="stat-text" style={{ color: "white" }}>
    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {ordenesBorrador}
    </div>
    <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Órdenes Borrador
    </div>
  </div>
</motion.div>

<motion.div
  className="stat-item"
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
  onClick={() => handleStatClick("ENVIADA")}
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
    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {ordenesEnviadas}
    </div>
    <div className="stat-label" style={{color:"white", fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Órdenes Enviadas
    </div>
  </div>
</motion.div>

<motion.div
  className="stat-item"
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
  onClick={() => handleStatClick("RECIBIDA")}
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
  <div className="stat-text" style={{ color:"white",color: "white" }}>
    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {ordenesRecibidas}
    </div>
    <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Órdenes Recibidas
    </div>
  </div>
</motion.div>

<motion.div
  className="stat-item"
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
  onClick={() => handleStatClick("CERRADA")}
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
    <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
      {ordenesCerradas}
    </div>
    <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
      Órdenes Cerradas
    </div>
  </div>
</motion.div>

<motion.div
  className="stat-item"
  whileHover={{ scale: 1.05, y: -2 }}
  transition={{ type: "spring", stiffness: 300 }}
  onClick={() => handleStatClick("all")} // 👈 al hacer clic muestra todas las órdenes
  style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(255, 255, 255, 0.15)",
    padding: "0.75rem 1.25rem",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    cursor: "pointer" // 👈 indica que es clickeable
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
    <FileText size={20} color="white" />
  </div>
  <div className="stat-text" style={{ color: "white" }}>
    <div
      className="stat-value"
      style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}
    >
      {totalOrdenes}
    </div>
    <div
      className="stat-label"
      style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}
    >
      Total Órdenes
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
                  <div className="stat-value" style={{ color:"white",fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>
                    {formatCurrency(valorTotal)}
                  </div>
                  <div className="stat-label" style={{ color:"white",fontSize: "0.85rem", opacity: 0.9, marginTop: "2px" }}>
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
                <Filter size={20} color="white" />
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

        {/* BARRA DE BÚSQUEDA Y FILTROS MEJORADA */}
        <motion.div 
          className="orden-top-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ marginTop: "2rem" }}
        >
          <div className="orden-filters-row">
            {/* Search */}
            <div className="search-container" style={{ position: 'relative', flex: 1 }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666', zIndex: 2 }}
              >
                <Search size={18} />
              </motion.div>
              <input
                type="text"
                placeholder="Buscar por número o proveedor..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="search-input"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem',
                  paddingLeft: '40px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
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
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div 
              className="dropdown-wrapper-compras" 
              ref={statusMenuRef}
              style={{ position: 'relative' }}
            >
              <motion.button
                className="filter-button-estado-compra"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                style={{
                  padding: '0.8rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Filter size={16} />
                Estado
                <ChevronDownIcon />
              </motion.button>
              {showStatusMenu && (
                <div className="dropdown-menu-compra">
                  {statusOptions.map(status => (
                    <div
                      key={status.uid}
                      onClick={() => toggleStatusFilter(status.uid)}
                      className={`dropdown-item ${statusFilter.has(status.uid) ? 'active' : ''}`}
                    >
                      <span className="checkbox">{statusFilter.has(status.uid) ? '✓' : ''}</span>
                      {status.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Order Button */}
            <motion.button
              className="btn-nueva-orden"
              onClick={() => setMostrarModalCrear(true)}
              whileHover={{ 
                scale: 1.08, 
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{
                padding: '0.8rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
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
              Nueva Orden
            </motion.button>
          </div>

          <div className="orden-meta-row">
            <span className="orden-count">Total: {sortedItems.length} órdenes</span>
            <div className="rows-per-page">
              <span>Filas por página:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rows-select"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* El resto del código (tabla, paginación, modales) se mantiene igual */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="orden-table">
            <thead>
              <tr>
                {visibleColumnsArray.map(column => (
                  <th
                    key={column.uid}
                    onClick={() => handleSort(column.uid)}
                    className={column.sortable ? 'sortable' : ''}
                  >
                    <div className="th-content">
                      {column.name}
                      {column.sortable && sortDescriptor.column === column.uid && (
                        <span className="sort-icon">
                          {sortDescriptor.direction === "ascending" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnsArray.length} className="empty-state">
                    <div className="empty-content">
                      <span className="empty-icon">📋</span>
                      <p>No se encontraron órdenes</p>
                      <small>Intenta ajustar los filtros o crea una nueva orden</small>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((orden) => {
                  const total = orden.items?.reduce((sum, item) => sum + item.cantidad * item.costoUnit, 0) || 0;
                  const itemsCount = orden.items?.length || 0;
                  const totalProductos = orden.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

                  return (
                    <tr key={orden._id} className="table-row">
                      {visibleColumns.has("numero") && (
                        <td className="cell-numero">{orden.numero}</td>
                      )}
                      {visibleColumns.has("proveedor") && (
                        <td className="cell-proveedor" title={orden.proveedor_id?.empresa || "Sin empresa"}>
                           {orden.proveedor_id?.nombre? `${orden.proveedor_id.nombre} (${orden.proveedor_id.empresa})` : "Sin proveedor"}
                         </td>
                      )}
                      {visibleColumns.has("fecha") && (
                        <td className="cell-fecha">
                          {orden.fecha ? new Date(orden.fecha).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }) : '—'}
                        </td>
                      )}
                      {visibleColumns.has("items") && (
                        <td className="cell-items">
                          <div className="items-info">
                            <span className="items-count">{itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}</span>
                            <span className="items-total">({totalProductos} unidades)</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.has("total") && (
                        <td className="cell-total">{formatCurrency(total)}</td>
                      )}
                      {visibleColumns.has("estado") && (
                        <td className="cell-estado">
                          <span className={getEstadoBadgeClass(orden.estado)}>
                            {orden.estado}
                          </span>
                        </td>
                      )}
                      {visibleColumns.has("acciones") && (
                        <td className="cell-acciones">
                          <div className="action-wrapper" ref={showActionMenu === orden._id ? actionMenuRef : null}>
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === orden._id ? null : orden._id)}
                              className="action-button"
                            >
                              <DotsIcon />
                            </button>
                            {showActionMenu === orden._id && (
                              <div className="action-menu">
                                <button
                                  onClick={() => {
                                    setOrdenSeleccionada(orden);
                                    setShowActionMenu(null);
                                  }}
                                  className="action-item action-view"
                                >
                                  👁️ Ver / Editar
                                </button>
                                <button
                                  onClick={() => handleEliminarOrden(orden._id)}
                                  className="action-item action-delete"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {items.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Mostrando {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, sortedItems.length)} de {sortedItems.length}
            </div>
            
            <div className="pagination-controls">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="pagination-button"
                title="Primera página"
              >
                ⟪
              </button>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="pagination-button"
              >
                ← Anterior
              </button>
              
              <span className="pagination-pages">
                Página {page} de {pages}
              </span>
              
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="pagination-button"
              >
                Siguiente →
              </button>
              <button
                onClick={() => setPage(pages)}
                disabled={page === pages}
                className="pagination-button"
                title="Última página"
              >
                ⟫
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Modales */}
      {mostrarModalCrear && (
        <ModalCrearOrden
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearOrden}
          ordenesExistentes={ordenes}
        />
      )}

      {ordenSeleccionada && (
        <ModalDetalleOrden
          orden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
          onUpdate={handleEditarOrden}
          onDelete={handleEliminarOrden}
        />
      )}

{showConfirm && (
  <ConfirmDialog
    message={`¿Seguro que deseas eliminar la orden "${ordenAEliminar?.numero}"?`}
    onConfirm={confirmarEliminacionOrden}
    onCancel={cancelarEliminacionOrden}
    visible={showConfirm}
  />
)}


      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✓' : notification.type === 'error' ? '✕' : 'ℹ'}
          </span>
          {notification.message}
        </div>
      )}
    </div>
  );
  
};


export default OrdenCompra;