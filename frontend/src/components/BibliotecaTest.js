// src/components/BibliotecaTest.jsx

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import axios from "axios";
import useUserRole from "./hooks/useUserRole"; 
import "../styles/Models/Biblioteca.css";
import { auth } from "../components/authentication/Auth";

import { 
  FiSearch,
  FiUpload,
  FiDownload,
  FiBook,
  FiX,
  FiFilter,
  FiUsers,
  FiAward,
  FiFileText,
  FiStar,
  FiCalendar,
  FiBookOpen,
  FiTrash2, // ✅ Icono de eliminar agregado
  FiFile,
  FiArrowUp,
  FiArrowDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiUser,
  FiLock
} from 'react-icons/fi';

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
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL+"/api/biblioteca";
  // Permisos basados en rol
  const canUpload = userRole === "ADMIN" || userRole === "DOCENTE";
  const canDelete = userRole === "ADMIN";

  const cargarLibros = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ Token agregado
        }
      });

      setLibros(res.data);
    } catch (error) {
      console.error(error);
      showNotification(error.message || "Error al cargar libros", "error");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!cargando) { 
      cargarLibros();
    }
  }, [cargando]);

  // Calcular estadísticas
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

    // Validar tipo de archivo
    const fileExtension = archivo.name.split('.').pop().toLowerCase();
    if (!['pdf', 'epub'].includes(fileExtension)) {
      showNotification("Solo se permiten archivos PDF y EPUB", "error");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();

      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("autor", autor);
      formData.append("archivo", archivo);

      await axios.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}` // ✅ Token agregado
        },
      });

      setTitulo("");
      setAutor("");
      setArchivo(null);
      setMostrarModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      cargarLibros();
      showNotification("Libro subido exitosamente", "success");

    } catch (error) {
      console.error(error);
      showNotification(error.message || "Error al subir el libro", "error");
    }
  };


    const handleEliminar = async (id, titulo) => {
    if (!canDelete) {
      showNotification("No tienes permiso para eliminar libros", "error");
      return;
    }

    if (!window.confirm(`¿Seguro que deseas eliminar "${titulo}"?`)) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Usuario no autenticado");
      const token = await user.getIdToken();

      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ Token agregado
        }
      });

      cargarLibros();
      showNotification("Libro eliminado exitosamente", "success");
    } catch (error) {
      console.error(error);
      showNotification(error.message || "Error al eliminar el libro", "error");
    }
  };


  // Filtrado
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

  // Ordenamiento
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

  // Paginación
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
    if (!url) return <FiFile className="file-icon-default" />;
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FiFileText className="file-icon-pdf" />;
    if (ext === 'epub') return <FiBook className="file-icon-epub" />;
    return <FiFile className="file-icon-default" />;
  };

  const getSortIcon = (columnKey) => {
    if (sortDescriptor.column !== columnKey) return null;
    return sortDescriptor.direction === "ascending" ? 
      <FiArrowUp className="sort-icon" /> : 
      <FiArrowDown className="sort-icon" />;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivo(file);
    }
  };

  const resetForm = () => {
    setTitulo("");
    setAutor("");
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleModalClose = () => {
    setMostrarModal(false);
    resetForm();
  };

  if (cargando) {
    return (
      <div className="biblioteca-loading">
        <motion.div
         
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FiBook size={40} />
        </motion.div>
        <p>Cargando permisos y biblioteca...</p>
      </div>
    );
  }

  return (
    <div className="biblioteca-container">
      {/* ENCABEZADO */}
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
          <div className="header-content">
            <motion.h2
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <FiBook size={36} className="header-main-icon" />
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
                <FiBookOpen size={32} />
              </motion.div>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="header-subtitle"
            >
              Gestiona tu colección de libros digitales de manera profesional
              <span className="user-role-badge">
                <FiUser size={12} />
                {userRole}
              </span>
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
                <div className="stat-icon">
                  <FiBook size={20} />
                </div>
                <div className="stat-text">
                  <div className="stat-value" style={{color:"white"}}>{totalLibros}</div>
                  <div className="stat-label" style={{color:"white"}}>Total Libros</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              >
                <div className="stat-icon">
                  <FiFileText size={20} />
                </div>
                <div className="stat-text">
                  <div className="stat-value" style={{color:"white"}}>{librosPDF}</div>
                  <div className="stat-label" style={{color:"white"}}>Libros PDF</div>
                </div>
              </motion.div>

              <motion.div 
                className="stat-item"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <div className="stat-icon">
                  <FiAward size={20} />
                </div>
                <div className="stat-text">
                  <div className="stat-value" style={{color:"white"}}>{librosRecientes}</div>
                  <div className="stat-label" style={{color:"white"}}>Recientes</div>
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
                <FiFileText size={20} />
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
                <FiCalendar size={20} />
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
                <FiStar size={20} />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <motion.div 
          className="biblioteca-top-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="biblioteca-filters-row">
            <div className="search-container">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="search-icon-animated"
              >
                <FiSearch size={18} />
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
                  <FiX size={14} />
                </button>
              )}
            </div>

            <div className="filter-tipo-wrapper">
              <FiFilter size={18} />
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
                  boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <FiUpload size={18} />
                </motion.div>
                Subir Libro
              </motion.button>
            )}
          </div>

          <div className="biblioteca-meta-row">
            <span className="libro-count">
              <FiBook size={14} />
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

      {/* TABLA PRINCIPAL */}
      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">
              <motion.div
               
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FiBook size={40} className="loading-spinner" />
              </motion.div>
              <p>Cargando libros...</p>
            </div>
          ) : (
            <table className="biblioteca-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("titulo")} className="sortable th-titulo">
                    <div className="th-content">
                      TÍTULO
                      {getSortIcon("titulo")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("autor")} className="sortable th-autor">
                    <div className="th-content">
                      AUTOR
                      {getSortIcon("autor")}
                    </div>
                  </th>
                  <th onClick={() => handleSort("fecha")} className="sortable th-fecha">
                    <div className="th-content">
                      FECHA
                      {getSortIcon("fecha")}
                    </div>
                  </th>
                  <th className="th-formato">
                    <div className="th-content">
                      <FiFileText size={14} />
                      FORMATO
                    </div>
                  </th>
                  <th className="th-acciones">
                    <div className="th-content">
                      <FiUsers size={14} />
                      ACCIONES
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <div className="empty-content">
                        <FiBook size={40} className="empty-icon" />
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
                          <span className="titulo-text">{libro.titulo}</span>
                        </div>
                      </td>
                      <td className="cell-autor">{libro.autor}</td>
                      <td className="cell-fecha">
                        <FiCalendar size={12} className="fecha-icon" />
                        {new Date(libro.fechaCreacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="cell-formato">
                        {libro.archivoUrl ? (
                          <span className={`formato-badge ${libro.extension.split('.').pop().toLowerCase()}`}>
                            {libro.extension.split('.').pop().toUpperCase()}
                          </span>
                        ) : (
                          <span className="formato-badge sin-archivo">
                            <FiAlertCircle size={10} />
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="cell-acciones">
                        <div className="action-buttons">
                          {libro.archivoUrl ? (
                            <motion.a
                              href={libro.archivoUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-descargar"
                              title="Descargar libro"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FiDownload size={14} />
                              Descargar
                            </motion.a>
                          ) : (
                            <span className="sin-archivo-text">
                              <FiAlertCircle size={12} />
                              Sin archivo
                            </span>
                          )}
                    
                          {canDelete && (
                            <motion.button
                              onClick={() => handleEliminar(libro._id, libro.titulo)}
                              className="btn btn-danger"
                              title="Eliminar libro"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              style={{ 
                                border: '2px solid red', // Borde rojo para verificar que se renderiza
                              
                                color: 'white',           // Texto blanco
                                padding: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <FiTrash2 size={16} />
                            
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINACIÓN */}
        {items.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <FiInfo size={14} />
              Mostrando {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, sortedItems.length)} de {sortedItems.length}
            </div>
            
            <div className="pagination-controls">
              <motion.button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="pagination-button"
                title="Primera página"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiChevronsLeft size={14} />
              </motion.button>
              <motion.button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="pagination-button"
                title="Página anterior"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiChevronLeft size={14} />
                Anterior
              </motion.button>
              
              <span className="pagination-pages">
                Página {page} de {pages}
              </span>
              
              <motion.button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="pagination-button"
                title="Siguiente página"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Siguiente
                <FiChevronRight size={14} />
              </motion.button>
              <motion.button
                onClick={() => setPage(pages)}
                disabled={page === pages}
                className="pagination-button"
                title="Última página"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiChevronsRight size={14} />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL SUBIR LIBRO */}
      <AnimatePresence>
        {mostrarModal && canUpload && (
          <motion.div 
            className="modal-overlay" 
            onClick={handleModalClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <div className="modal-header">
                <h3>
                  <FiUpload />
                  Subir Nuevo Libro
                </h3>
                <button onClick={handleModalClose} className="modal-close">
                  <FiX size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>
                    <FiBook size={14} />
                    Título del Libro *
                  </label>
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
                  <label>
                    <FiUsers size={14} />
                    Autor *
                  </label>
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
                  <label>
                    <FiFileText size={14} />
                    Archivo (PDF o EPUB) *
                  </label>
                  <div className="file-input-wrapper">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.epub"
                      onChange={handleFileChange}
                      className="file-input"
                      required
                    />
                    {archivo && (
                      <div className="file-selected">
                        <FiCheckCircle size={14} />
                        {archivo.name}
                      </div>
                    )}
                  </div>
                  <small className="file-hint">
                    Formatos aceptados: PDF, EPUB
                  </small>
                </div>

                <div className="modal-actions">
                  <motion.button
                    type="button"
                    onClick={handleModalClose}
                    className="btn-cancelar"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiX size={14} />
                    Cancelar
                  </motion.button>
                  <motion.button 
                    type="submit" 
                    className="btn-guardar"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiUpload size={14} />
                    Subir Libro
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification notification-${notification.type}`}
            initial={{ opacity: 0, y: -50, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 100 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <span className="notification-icon">
              {notification.type === 'success' ? 
                <FiCheckCircle size={20} /> : 
                notification.type === 'error' ? 
                <FiAlertCircle size={20} /> : 
                <FiInfo size={20} />
              }
            </span>
            <span className="notification-message">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="notification-close"
            >
              <FiX size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}