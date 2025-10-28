import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import "../styles/Models/Biblioteca.css";

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

export default function BibliotecaTest() {
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

  const cargarLibros = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/biblioteca");
      setLibros(res.data);
    } catch (error) {
      showNotification("Error al cargar libros", "error");
    }
  };

  useEffect(() => {
    cargarLibros();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    if (!window.confirm(`¿Seguro que deseas eliminar "${titulo}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/biblioteca/${id}`);
      cargarLibros();
      showNotification("Libro eliminado exitosamente", "success");
    } catch (error) {
      showNotification("Error al eliminar el libro", "error");
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
    if (!url) return "📄";
    const ext = url.split('.').pop().toLowerCase();
    if (ext === 'pdf') return "📕";
    if (ext === 'epub') return "📘";
    return "📄";
  };

  return (
    <div className="biblioteca-container">
      {/* Header */}
      <div className="biblioteca-header">
        <div className="header-icon">📚</div>
        <div>
          <h2>Biblioteca Digital</h2>
          <p className="biblioteca-subtitle">Gestiona tu colección de libros digitales</p>
        </div>
      </div>

      {/* Top Content */}
      <div className="biblioteca-top-content">
        <div className="biblioteca-filters-row">
          {/* Search */}
          <div className="search-container">
            <div className="search-icon">
              <SearchIcon />
            </div>
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
            <FilterIcon />
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

          {/* Botón subir libro */}
          <button
            className="btn-subir-libro"
            onClick={() => setMostrarModal(true)}
          >
            <UploadIcon />
            Subir Libro
          </button>
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
      </div>

      {/* Table */}
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
                    <td className="cell-acciones">
                      <div className="action-buttons">
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
                        <button
                          onClick={() => handleEliminar(libro._id, libro.titulo)}
                          className="btn-eliminar"
                          title="Eliminar libro"
                        >
                          🗑️
                        </button>
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

      {/* Modal Subir Libro */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Subir Nuevo Libro</h3>
              <button onClick={() => setMostrarModal(false)} className="modal-close">
                <CloseIcon />
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
                  <UploadIcon />
                  Subir Libro
                </button>
              </div>
            </form>
          </div>
        </div>
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
}