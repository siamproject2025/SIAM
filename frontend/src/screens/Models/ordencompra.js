import React, { useEffect, useState, useMemo, useRef } from 'react';
import ModalCrearOrden from "../Models/OrdenCompra/ModalCrearOrden";
import ModalDetalleOrden from "../Models/OrdenCompra/ModalDetalleOrden";
import '../../styles/Models/ordencompra.css';

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

const API_URL = "http://localhost:5000/api/compras";

const OrdenCompra = () => {
  // Estados principales
  const [ordenes, setOrdenes] = useState([]);
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

  // Cargar datos
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setOrdenes(data))
      .catch(err => console.error('Error:', err));
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

  // Notificaciones
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtrado
  const filteredItems = useMemo(() => {
    let filtered = [...ordenes];

    if (filterValue) {
      filtered = filtered.filter(orden =>
        orden.numero?.toLowerCase().includes(filterValue.toLowerCase()) ||
        orden.proveedor_id?.toLowerCase().includes(filterValue.toLowerCase())
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

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      if (!ordenActualizada.proveedor_id.trim()) {
        showNotification('El ID del proveedor es obligatorio', 'error');
        return;
      }
      if (!ordenActualizada.items || ordenActualizada.items.length === 0) {
        showNotification('La orden debe tener al menos un ítem', 'error');
        return;
      }

      const ordenParaEnviar = {
        ...ordenActualizada,
        fecha: ordenActualizada.fecha || new Date().toISOString().split('T')[0]
      };

      const res = await fetch(`${API_URL}/${ordenActualizada._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  const handleEliminarOrden = async (id) => {
    const ordenAEliminar = ordenes.find(o => o._id === id);
    if (!window.confirm(`¿Seguro que deseas eliminar la orden "${ordenAEliminar?.numero}"?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar la orden');
      }
      
      setOrdenes(ordenes.filter(o => o._id !== id));
      setOrdenSeleccionada(null);
      setShowActionMenu(null);
      showNotification(`Orden "${ordenAEliminar?.numero}" eliminada exitosamente`, 'success');
    } catch (err) {
      console.error(err.message);
      showNotification(err.message || 'Error al eliminar la orden', 'error');
    }
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
    if (columnUid === "acciones") return; // No permitir ocultar acciones
    
    if (newSet.has(columnUid)) {
      if (newSet.size > 2) { // Mantener al menos 2 columnas visibles
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
      currency: 'USD',
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
      {/* Header */}
      <div className="orden-header">
        <h2>Sistema de Órdenes de Compra</h2>
        <p className="orden-subtitle">Gestiona y controla todas tus órdenes de manera eficiente</p>
      </div>

      {/* Top Content */}
      <div className="orden-top-content">
        <div className="orden-filters-row">
          {/* Search */}
          <div className="search-container">
            <div className="search-icon">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Buscar por número o proveedor..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
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

          {/* Status Filter */}
          <div 
            className="dropdown-wrapper" 
            ref={statusMenuRef}
            onMouseEnter={() => setShowStatusMenu(true)}
            onMouseLeave={() => setShowStatusMenu(false)}
          >
            <button
              className="filter-button"
            >
              Estado <ChevronDownIcon />
            </button>
            {showStatusMenu && (
              <div className="dropdown-menu">
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

          {/* Column Filter */}
          <div 
            className="dropdown-wrapper" 
            ref={columnMenuRef}
            onMouseEnter={() => setShowColumnMenu(true)}
            onMouseLeave={() => setShowColumnMenu(false)}
          >
            <button
              className="filter-button"
            >
              Columnas <ChevronDownIcon />
            </button>
            {showColumnMenu && (
              <div className="dropdown-menu">
                {columns.map(col => (
                  <div
                    key={col.uid}
                    onClick={() => toggleColumnVisibility(col.uid)}
                    className={`dropdown-item ${visibleColumns.has(col.uid) ? 'active' : ''} ${col.uid === 'acciones' ? 'disabled' : ''}`}
                  >
                    <span className="checkbox">{visibleColumns.has(col.uid) ? '✓' : ''}</span>
                    {col.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* New Order Button */}
          <button
            className="btn-nueva-orden"
            onClick={() => setMostrarModalCrear(true)}
          >
            + Nueva Orden
          </button>
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
      </div>

      {/* Table */}
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