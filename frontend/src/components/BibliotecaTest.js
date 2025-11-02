// src/components/BibliotecaTest.jsx

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import useUserRole from "./hooks/useUserRole"; 
import "../styles/Models/Biblioteca.css";
import { 
  Search,
  Upload,
  Download,
  Book,
  X,
  Filter,
  Users,
  Award,
  FileText,
  BookIcon,
  DownloadIcon,
  Star,
  Calendar,
  BookOpen
} from 'lucide-react';

// Mantener los iconos SVG existentes para compatibilidad
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function BibliotecaTest() {
  
  const { userRole, cargando } = useUserRole();


  const [libros, setLibros] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [sortDescriptor, setSortDescriptor] = useState({ column: "fecha", direction: "descending" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);
  // ==========================================================

  const canUpload = userRole === "ADMIN" || userRole === "DOCENTE";
  const canDelete = userRole === "ADMIN";
  

  const cargarLibros = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/biblioteca");
      setLibros(res.data);
    } catch (error) {
      showNotification("Error al cargar libros", "error");
    }
  };

  // 3. 🔄 useEffect para cargar libros DESPUÉS de obtener el rol
  useEffect(() => {
    if (!cargando) { 
      cargarLibros();
    }
  }, [cargando]); 

  const totalLibros = libros.length;
  const librosPDF = libros.filter(libro => libro.archivoUrl?.endsWith('.pdf')).length;
  const librosEPUB = libros.filter(libro => libro.archivoUrl?.endsWith('.epub')).length;
  const librosRecientes = libros.filter(libro => {
    const fechaLibro = new Date(libro.fechaCreacion);
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    return fechaLibro > hace30Dias;
  }).length;

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 Validación de permiso de subida
    if (!canUpload) {
      showNotification("No tienes permiso para subir libros", "error");
      setMostrarModal(false);
      return;
    }

    if (!titulo.trim()) {
      showNotification("El título es obligatorio", "error");
      return;
    }
    
    if (!autor.trim()) {
      showNotification("El autor es obligatorio", "error");
      return;
    }
    
    if (!archivo) {
      showNotification("Debes seleccionar un archivo", "error");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("autor", autor);
    formData.append("archivo", archivo);

    try {
      await axios.post("http://localhost:5000/api/biblioteca", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitulo("");
      setAutor("");
      setArchivo(null);
      setMostrarModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      cargarLibros();
      showNotification("Libro subido exitosamente", "success");
    } catch (error) {
      showNotification("Error al subir el libro", "error");
    }
  };

  const handleEliminar = async (id, titulo) => {
    // 🛑 Validación de permiso de eliminación
    if (!canDelete) {
        showNotification("No tienes permiso para eliminar libros", "error");
        return;
    }

    if (!window.confirm(`¿Seguro que deseas eliminar "${titulo}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/biblioteca/${id}`);
      cargarLibros();
      showNotification("Libro eliminado exitosamente", "success");
    } catch (error) {
      showNotification("Error al eliminar el libro", "error");
    }
  };

  // Filtrado (useMemo) - Se mantiene completo
  const filteredItems = useMemo(() => {
    let filtered = [...libros];

    if (filterValue) {
      filtered = filtered.filter(libro =>
        libro.titulo?.toLowerCase().includes(filterValue.toLowerCase()) ||
        libro.autor?.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (tipoFiltro !== "todos") {
      filtered = filtered.filter(libro => {
        if (!libro.archivoUrl) return false;
        const extension = libro.archivoUrl.split('.').pop().toLowerCase();
        return extension === tipoFiltro;
      });
    }

    return filtered;
  }, [libros, filterValue, tipoFiltro]);

  // Ordenamiento (useMemo) - Se mantiene completo
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let first = a[sortDescriptor.column];
      let second = b[sortDescriptor.column];

      if (sortDescriptor.column === "fecha") {
        first = new Date(a.fechaCreacion);
        second = new Date(b.fechaCreacion);
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredItems, sortDescriptor]);

  // Paginación (useMemo) - Se mantiene completo
  const pages = Math.ceil(sortedItems.length / rowsPerPage) || 1;
  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedItems.slice(start, start + rowsPerPage);
  }, [page, sortedItems, rowsPerPage]);

  const handleSort = (columnKey) => {
    setSortDescriptor(prev => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === "ascending" ? "descending" : "ascending"
    }));
  };

  const getFileIcon = (url) => {
    if (!url) return "📄";
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'pdf') return "📕";
    if (ext === 'epub') return "📘";
    return "📄";
  };

  
  if (cargando) {
      return (
          <div className="biblioteca-loading">
              <svg className="spinner" viewBox="0 0 50 50">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
              </svg>
              Cargando permisos y biblioteca...
          </div>
      );
  }

  
  return (
    <div className="biblioteca-container">
      {/* 🎨 ENCABEZADO MEJORADO */}
      <motion.div 
        className="biblioteca-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="header-gradient"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Patrón de fondo */}
          <div className="header-pattern" />

          <div className="header-content">
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <Book size={36} fill="white" color="white" />
              </motion.div>
              Biblioteca Digital
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                className="floating-main-icon"
              >
                <BookOpen size={32} color="white" />
              </motion.div>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="header-subtitle"
            >
              Gestiona tu colección de libros digitales de manera profesional. 
            </motion.p>

            <motion.div 
              className="header-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
                <motion.div 
                    className="stat-item"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <div className="stat-icon"><Book size={20} color="white" /></div>
                    <div className="stat-text">
                        <div className="stat-value">{totalLibros}</div>
                        <div className="stat-label">Total Libros</div>
                    </div>
                </motion.div>
                <motion.div 
                    className="stat-item"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                    <div className="stat-icon"><FileText size={20} color="white" /></div>
                    <div className="stat-text">
                        <div className="stat-value">{librosPDF}</div>
                        <div className="stat-label">Libros PDF</div>
                    </div>
                </motion.div>
                <motion.div 
                    className="stat-item"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                    <div className="stat-icon"><Award size={20} color="white" /></div>
                    <div className="stat-text">
                        <div className="stat-value">{librosRecientes}</div>
                        <div className="stat-label">Recientes</div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div 
              className="floating-icons"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
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
                >
                    <FileText size={20} color="white" />
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
                >
                    <Calendar size={20} color="white" />
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
                >
                    <Star size={20} color="white" />
                </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* BARRA DE BÚSQUEDA Y FILTROS MEJORADA */}
        <motion.div 
          className="biblioteca-top-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="biblioteca-filters-row">
            {/* Search */}
            <div className="search-container">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="search-icon-animated"
              >
                <Search size={18} />
              </motion.div>
              <input
                type="text"
                placeholder="Buscar por título o autor..."
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

            {/* Filtro por tipo */}
            <div className="filter-tipo-wrapper">
              <Filter size={18} />
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="filter-select"
              >
                <option value="todos">Todos los formatos</option>
                <option value="pdf">PDF</option>
                <option value="epub">EPUB</option>
              </select>
            </div>

          
            {canUpload && (
                <motion.button
                    className="btn-subir-libro"
                    onClick={() => setMostrarModal(true)}
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
                        <Upload size={18} />
                    </motion.div>
                    Subir Libro
                </motion.button>
            )}
          </div>

          <div className="biblioteca-meta-row">
            <span className="libro-count">
              Total: {sortedItems.length} {sortedItems.length === 1 ? 'libro' : 'libros'}
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
              </select>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* TABLA DE LIBROS */}
       <div className="table-container">
         <div className="table-wrapper">
          <table className="biblioteca-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("titulo")} className="sortable th-titulo">
                  <div className="th-content">
                    TÍTULO
                    {sortDescriptor.column === "titulo" && (
                      <span className="sort-icon">
                        {sortDescriptor.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort("autor")} className="sortable th-autor">
                  <div className="th-content">
                    AUTOR
                    {sortDescriptor.column === "autor" && (
                      <span className="sort-icon">
                        {sortDescriptor.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th onClick={() => handleSort("fecha")} className="sortable th-fecha">
                  <div className="th-content">
                    FECHA
                    {sortDescriptor.column === "fecha" && (
                      <span className="sort-icon">
                        {sortDescriptor.direction === "ascending" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="th-formato">
                  <div className="th-content">FORMATO</div>
                </th>
                <th className="th-acciones">
                  <div className="th-content">ACCIONES</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <div className="empty-content">
                      <BookIcon />
                      <p>No se encontraron libros</p>
                      <small>Intenta ajustar los filtros o sube un nuevo libro</small>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((libro) => (
                  <tr key={libro._id} className="table-row">
                    <td className="cell-titulo">
                      <div className="titulo-wrapper">
                        <span className="file-icon">{getFileIcon(libro.archivoUrl)}</span>
                        {libro.titulo}
                      </div>
                    </td>
                    <td className="cell-autor">{libro.autor}</td>
                    <td className="cell-fecha">
                      {new Date(libro.fechaCreacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="cell-formato">
                      {libro.archivoUrl ? (
                        <span className={`formato-badge ${libro.archivoUrl.split('.').pop().toLowerCase()}`}>
                          {libro.archivoUrl.split('.').pop().toUpperCase()}
                        </span>
                      ) : (
                        <span className="formato-badge sin-archivo">N/A</span>
                      )}
                    </td>
                    
                    {/* 🛑 CELDAS DE ACCIONES: Condicional por Permiso (Eliminar) */}
                    <td className="cell-acciones">
                      <div className="action-buttons">
                        {/* Descargar: visible para todos */}
                        {libro.archivoUrl ? (
                          <a
                            href={libro.archivoUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-descargar"
                            title="Descargar libro"
                          >
                            <DownloadIcon />
                            Descargar
                          </a>
                        ) : (
                          <span className="sin-archivo-text">Sin archivo</span>
                        )}
                        
                        {/* 🛑 Botón Eliminar: SOLO VISIBLE si canDelete es true */}
                        {canDelete && (
                            <button
                                onClick={() => handleEliminar(libro._id, libro.titulo)}
                                className="btn-eliminar"
                                title="Eliminar libro"
                            >
                                🗑️
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
         </div>

        {/* Paginación: Mantenida completa */}
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
              >
                ⟫
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🛑 Modal Subir Libro: Condicional por Permiso (Visibilidad) */}
      <AnimatePresence>
        {mostrarModal && canUpload && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setMostrarModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="modal-header">
                <h3>📤 Subir Nuevo Libro</h3>
                <button onClick={() => setMostrarModal(false)} className="modal-close">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Título del Libro *</label>
                  <input
                    type="text"
                    placeholder="Ej: Introducción a MongoDB"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Autor *</label>
                  <input
                    type="text"
                    placeholder="Ej: John Doe"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Archivo (PDF o EPUB) *</label>
                  <div className="file-input-wrapper">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.epub"
                      onChange={(e) => setArchivo(e.target.files[0])}
                      className="file-input"
                      required
                    />
                    {archivo && (
                      <div className="file-selected">
                        ✓ {archivo.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-guardar">
                    <Upload size={16} />
                    Subir Libro
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {/* Si mostrarModal es true pero canUpload es false, no se renderiza nada (silenciosamente) */}
        {mostrarModal && !canUpload && (
            // Pequeña animación para indicar que el modal fue bloqueado, pero sin mostrar el contenido
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="modal-overlay" 
                onClick={() => setMostrarModal(false)}
            />
        )}
      </AnimatePresence>


      {/* Notification (sin cambios) */}
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
}