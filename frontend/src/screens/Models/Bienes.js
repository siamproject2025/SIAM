import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import ModalCrearBien from "./Bienes/ModalCrearBien";
import ModalDetalleBien from "./Bienes/ModalDetalleBien";
import Notification from "../../components/Notification";
import "../../styles/Models/Bienes.css";
import {
  Package,
  Search as SearchIconLucide,
  HelpCircle,
  Plus,
  Building2,
  Shield,
  Star,
  Calendar,
  DollarSign
} from "lucide-react";

// SVGs simples
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const API_URL = "http://localhost:5000/api/bienes";

const Bienes = () => {
  // Estados principales
  const [bienes, setBienes] = useState([]);
  const [bienSeleccionado, setBienSeleccionado] = useState(null);

  const [filterValue, setFilterValue] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [categoriaFiltro, setCategoriaFiltro] = useState("all");
  const [sortDescriptor, setSortDescriptor] = useState({ column: "codigo", direction: "ascending" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [notification, setNotification] = useState(null);

  // Estados que usabas pero no estaban definidos
  const [busqueda, setBusqueda] = useState("");
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  // dropdowns
  const [showEstadoMenu, setShowEstadoMenu] = useState(false);
  const [showCategoriaMenu, setShowCategoriaMenu] = useState(false);

  const estadoMenuRef = useRef(null);
  const categoriaMenuRef = useRef(null);

  // Columnas (por si luego usas tabla)
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
      .then((res) => res.json())
      .then((data) => {
        // Asegurar arreglo
        const arr = Array.isArray(data) ? data : Array.isArray(data?.bienes) ? data.bienes : [];
        setBienes(arr);
      })
      .catch((err) => console.error("Error al obtener los bienes:", err));
  }, []);

  // Métricas simples
  const totalBienes = bienes.length;
  const bienesActivosCount = bienes.filter((b) => b.estado === "ACTIVO").length;
  const valorTotal = bienes.reduce((sum, b) => sum + (parseFloat(b.valor) || 0), 0);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Métricas detalladas
  const metrics = useMemo(() => {
    return {
      activos: bienes.filter((b) => b.estado === "ACTIVO").length,
      mantenimiento: bienes.filter((b) => b.estado === "MANTENIMIENTO").length,
      inactivos: bienes.filter((b) => b.estado === "INACTIVO").length,
      prestados: bienes.filter((b) => b.estado === "PRESTAMO").length,
      total: bienes.length
    };
  }, [bienes]);

  // Categorías únicas
  const categorias = useMemo(() => {
    const cats = [...new Set(bienes.map((b) => b.categoria).filter(Boolean))];
    return cats.sort();
  }, [bienes]);

  // CRUD
  const handleCrearBien = async (nuevoBien) => {
    try {
      if (!nuevoBien?.codigo?.trim()) return showNotification("El código del bien es obligatorio", "error");
      if (!nuevoBien?.nombre?.trim()) return showNotification("El nombre del bien es obligatorio", "error");
      if (!nuevoBien?.estado) return showNotification("Debe seleccionar un estado inicial", "error");
      if (!nuevoBien?.valor || Number(nuevoBien.valor) <= 0)
        return showNotification("El valor debe ser mayor a 0", "error");

      const dup = bienes.find((b) => b.codigo?.toLowerCase() === nuevoBien.codigo.toLowerCase());
      if (dup) return showNotification("Ya existe un bien con este código", "error");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoBien)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al crear el bien");
      }

      const bienCreado = await res.json();
      setBienes((prev) => [...prev, bienCreado]);
      setMostrarModalCrear(false);
      showNotification(`Bien "${bienCreado?.nombre ?? ""}" creado exitosamente`, "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Error al crear el bien", "error");
    }
  };

  const handleEditarBien = async (bienActualizado) => {
    try {
      if (!bienActualizado?._id) return showNotification("Falta el ID del bien", "error");

      const res = await fetch(`${API_URL}/${bienActualizado._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bienActualizado)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al editar el bien");
      }

      const actualizada = await res.json();
      setBienes((prev) => prev.map((b) => (b._id === actualizada._id ? actualizada : b)));
      setBienSeleccionado(null);
      showNotification(`Bien "${actualizada?.nombre ?? ""}" actualizado exitosamente`, "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Error al editar el bien", "error");
    }
  };

  const handleEliminarBien = async (id) => {
    const bienAEliminar = bienes.find((b) => b._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar el bien "${bienAEliminar?.nombre ?? ""}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al eliminar el bien");
      }
      setBienes((prev) => prev.filter((b) => b._id !== id));
      setBienSeleccionado(null);
      showNotification(`Bien "${bienAEliminar?.nombre ?? ""}" eliminado exitosamente`, "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Error al eliminar el bien", "error");
    }
  };

  // Filtro y orden
  const filteredItems = useMemo(() => {
    let filtered = [...bienes];

    const q = (filterValue || busqueda || "").toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (bien) =>
          bien.codigo?.toLowerCase().includes(q) ||
          bien.nombre?.toLowerCase().includes(q) ||
          bien.categoria?.toLowerCase().includes(q) ||
          bien.descripcion?.toLowerCase().includes(q)
      );
    }

    if (estadoFiltro !== "all") filtered = filtered.filter((bien) => bien.estado === estadoFiltro);
    if (categoriaFiltro !== "all") filtered = filtered.filter((bien) => bien.categoria === categoriaFiltro);

    return filtered;
  }, [bienes, filterValue, busqueda, estadoFiltro, categoriaFiltro]);

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

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      ACTIVO: "estado-badge estado-activo",
      MANTENIMIENTO: "estado-badge estado-mantenimiento",
      INACTIVO: "estado-badge estado-inactivo",
      PRESTAMO: "estado-badge estado-prestamo"
    };
    return clases[estado] || "estado-badge";
  };

  // Placeholder para los grupos (para que compile)
  const renderGrupoBienes = (titulo, lista) => (
    <div className="grupo-bienes">
      <h4>{titulo}</h4>
      {lista.length === 0 ? (
        <div className="text-muted">Sin elementos</div>
      ) : (
        <ul>
          {lista.map((b) => (
            <li key={b._id}>
              {b.codigo} — {b.nombre} — <span className={getEstadoBadgeClass(b.estado)}>{b.estado}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Agrupaciones (para los renderGrupoBienes)
  const bienesActivos = bienes.filter((b) => b.estado === "ACTIVO");
  const bienesMantenimiento = bienes.filter((b) => b.estado === "MANTENIMIENTO");
  const bienesInactivos = bienes.filter((b) => b.estado === "INACTIVO");
  const bienesPrestados = bienes.filter((b) => b.estado === "PRESTAMO");

  // --- UI ---
  return (
    <div className="bienes-container">
      {/* Header */}
      <div className="bienes-header">
        <h2>Sistema de Gestión de Bienes</h2>
        <p className="bienes-subtitle">Controla y administra el inventario de bienes institucionales</p>
      </div>

      {/* Métricas rápidas */}
      <div className="metrics-cards-container">
        <div
          className={`metric-card metric-activo ${estadoFiltro === "ACTIVO" ? "active" : ""}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === "ACTIVO" ? "all" : "ACTIVO");
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
          className={`metric-card metric-mantenimiento ${estadoFiltro === "MANTENIMIENTO" ? "active" : ""}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === "MANTENIMIENTO" ? "all" : "MANTENIMIENTO");
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
          className={`metric-card metric-inactivo ${estadoFiltro === "INACTIVO" ? "active" : ""}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === "INACTIVO" ? "all" : "INACTIVO");
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
          className={`metric-card metric-prestamo ${estadoFiltro === "PRESTAMO" ? "active" : ""}`}
          onClick={() => {
            setEstadoFiltro(estadoFiltro === "PRESTAMO" ? "all" : "PRESTAMO");
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
          className={`metric-card metric-total ${estadoFiltro === "all" ? "active" : ""}`}
          onClick={() => {
            setEstadoFiltro("all");
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

      {/* Barra de búsqueda y acciones */}
      <div className="bienes-top-content">
        <div className="bienes-filters-row">
          {/* Buscador */}
          <div className="search-container">
            <div className="search-icon">
              <SearchIconLucide size={18} />
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
              <button className="search-clear" onClick={() => setFilterValue("")}>
                ✕
              </button>
            )}
          </div>

          {/* Filtro Estado */}
          <div className="dropdown-wrapper" ref={estadoMenuRef}>
            <button onClick={() => setShowEstadoMenu(!showEstadoMenu)} className="filter-button">
              Estado <ChevronDownIcon />
            </button>
            {showEstadoMenu && (
              <div className="dropdown-menu">
                {estadosOptions.map((estado) => (
                  <div
                    key={estado.uid}
                    onClick={() => {
                      setEstadoFiltro(estado.uid);
                      setShowEstadoMenu(false);
                      setPage(1);
                    }}
                    className={`dropdown-item ${estadoFiltro === estado.uid ? "active" : ""}`}
                  >
                    <span className="checkbox">{estadoFiltro === estado.uid ? "✓" : ""}</span>
                    {estado.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filtro Categoría */}
          <div className="dropdown-wrapper" ref={categoriaMenuRef}>
            <button onClick={() => setShowCategoriaMenu(!showCategoriaMenu)} className="filter-button">
              Categoría <ChevronDownIcon />
            </button>
            {showCategoriaMenu && (
              <div className="dropdown-menu">
                <div
                  onClick={() => {
                    setCategoriaFiltro("all");
                    setShowCategoriaMenu(false);
                    setPage(1);
                  }}
                  className={`dropdown-item ${categoriaFiltro === "all" ? "active" : ""}`}
                >
                  <span className="checkbox">{categoriaFiltro === "all" ? "✓" : ""}</span>
                  Todas
                </div>
                {categorias.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      setCategoriaFiltro(cat);
                      setShowCategoriaMenu(false);
                      setPage(1);
                    }}
                    className={`dropdown-item ${categoriaFiltro === cat ? "active" : ""}`}
                  >
                    <span className="checkbox">{categoriaFiltro === cat ? "✓" : ""}</span>
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          <button className="btn-ayuda" onClick={() => setMostrarAyuda(true)} title="Ver ayuda">
            <HelpCircle size={18} /> Ayuda
          </button>
          <button className="btn-nueva-bien" onClick={() => setMostrarModalCrear(true)} title="Crear nuevo bien">
            <Plus size={18} /> Nuevo Bien
          </button>
        </div>
      </div>

      {/* Encabezado bonito con métricas (mantengo tu diseño principal) */}
      <motion.div
        className="bien-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
        style={{ marginTop: "1rem" }}
      >
        <motion.div
          className="header-gradient"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "1.75rem",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div className="header-content" style={{ position: "relative", zIndex: 2 }}>
            <motion.h2
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{
                fontSize: "2.2rem",
                color: "white",
                marginBottom: "0.25rem",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
            >
              <Package size={32} color="white" />
              Sistema de Bienes
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                style={{ marginLeft: "auto" }}
              >
                <Building2 size={28} color="white" />
              </motion.div>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ color: "rgba(255,255,255,0.95)", margin: 0 }}
            >
              Gestiona y controla todos tus bienes de manera eficiente y profesional
            </motion.p>

            {/* Stats rápidas */}
            <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <div style={{ color: "white" }}>
                <strong>Total:</strong> {totalBienes}
              </div>
              <div style={{ color: "white" }}>
                <strong>Activos:</strong> {bienesActivosCount}
              </div>
              <div style={{ color: "white" }}>
                <strong>Valor:</strong> ${valorTotal.toLocaleString()}
              </div>
            </div>

            {/* Íconos flotantes decorativos */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                display: "flex",
                gap: 10,
                opacity: 0.9
              }}
            >
              <Calendar size={18} color="white" />
              <Shield size={18} color="white" />
              <Star size={18} color="white" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Grupos simples para que compile */}
      <div className="bien-categorias-container" style={{ marginTop: "1.25rem" }}>
        {renderGrupoBienes("Bienes en uso", bienesActivos)}
        {renderGrupoBienes("Bienes en mantenimiento", bienesMantenimiento)}
        {renderGrupoBienes("Bienes inactivos", bienesInactivos)}
        {renderGrupoBienes("Bienes prestados", bienesPrestados)}
      </div>

      {/* Modales */}
      {mostrarModalCrear && (
        <ModalCrearBien onClose={() => setMostrarModalCrear(false)} onCreate={handleCrearBien} />
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">📚 Guía de Uso - Sistema de Bienes</h3>
            <p>Buscar por código, nombre, categoría o descripción. Crear / Editar / Eliminar bienes del inventario.</p>
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

