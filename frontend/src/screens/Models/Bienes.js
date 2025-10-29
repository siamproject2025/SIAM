import React, { useEffect, useState, useMemo, useRef } from "react";
import ModalCrearBien from './Bienes/ModalCrearBien';
import ModalDetalleBien from './Bienes/ModalDetalleBien';
import Notification from '../../components/Notification';
import * as XLSX from 'xlsx';
import '../../styles/Models/Bienes.css';


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

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (estadoMenuRef.current && !estadoMenuRef.current.contains(event.target)) {
        setShowEstadoMenu(false);
      }
      if (categoriaMenuRef.current && !categoriaMenuRef.current.contains(event.target)) {
        setShowCategoriaMenu(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Botón Nuevo Bien */}
          <button
            className="btn-nuevo-bien"
            onClick={() => setMostrarModalCrear(true)}
          >
            + Nuevo Bien
          </button>
        </div>

        <div className="bienes-meta-row">
          <span className="bien-count">
            Mostrando: {sortedItems.length} {sortedItems.length === 1 ? 'bien' : 'bienes'}
            {estadoFiltro !== 'all' && ` (${estadosOptions.find(e => e.uid === estadoFiltro)?.name})`}
            {categoriaFiltro !== 'all' && ` - ${categoriaFiltro}`}
          </span>
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

      {/* Tabla */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="bienes-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th
                    key={column.uid}
                    onClick={() => handleSort(column.uid)}
                    className={`${column.sortable ? 'sortable' : ''} th-${column.uid}`}
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
                  <td colSpan={columns.length} className="empty-state">
                    <div className="empty-content">
                      <span className="empty-icon">📦</span>
                      <p>No se encontraron bienes</p>
                      <small>Intenta ajustar los filtros o crea un nuevo bien</small>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((bien) => (
                  <tr key={bien._id} className="table-row">
                    <td className="cell-codigo">{bien.codigo}</td>
                    <td className="cell-nombre">{bien.nombre}</td>
                    <td className="cell-categoria">{bien.categoria || '—'}</td>
                    <td className="cell-descripcion" title={bien.descripcion}>
                      {bien.descripcion?.substring(0, 50)}
                      {bien.descripcion?.length > 50 ? '...' : ''}
                    </td>
                    <td className="cell-valor">{formatCurrency(bien.valor)}</td>
                    <td className="cell-estado">
                      <span className={getEstadoBadgeClass(bien.estado)}>
                        {bien.estado}
                      </span>
                    </td>
                    <td className="cell-acciones">
                      <div className="action-wrapper" ref={showActionMenu === bien._id ? actionMenuRef : null}>
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === bien._id ? null : bien._id)}
                          className="action-button"
                        >
                          <DotsIcon />
                        </button>
                        {showActionMenu === bien._id && (
                          <div className="action-menu">
                            <button
                              onClick={() => {
                                setBienSeleccionado(bien);
                                setShowActionMenu(null);
                              }}
                              className="action-item action-view"
                            >
                              👁️ Ver / Editar
                            </button>
                            <button
                              onClick={() => handleEliminarBien(bien._id)}
                              className="action-item action-delete"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};

export default Bienes;