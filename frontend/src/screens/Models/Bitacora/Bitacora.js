// src/screens/Models/Bitacora/Bitacora.js
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import "../../../styles/Bitacora/Bitacora.css"
const Bitacora = () => {
  // Estados con valores por defecto seguros
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    busqueda: '',
    modulo: 'todos',
    accion: 'todos',
    resultado: 'todos',
    fechaInicio: '',
    fechaFin: '',
    usuario: ''
  });
  const [selectedRegistro, setSelectedRegistro] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Stats con valores por defecto EXPLÍCITOS
  const [stats, setStats] = useState({
    total: 0,
    exitos: 0,
    errores: 0,
    denegados: 0
  });

  // Módulos disponibles
  const modulos = [
    { value: 'todos', label: 'Todos los módulos' },
    { value: 'USUARIOS', label: 'Usuarios' },
    { value: 'ROLES', label: 'Roles' },
    { value: 'PROVEEDORES', label: 'Proveedores' },
    { value: 'BIENES', label: 'Bienes' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'ESTUDIANTES', label: 'Estudiantes' },
    { value: 'HORARIOS', label: 'Horarios' },
    { value: 'ACTIVIDADES', label: 'Actividades' },
    { value: 'LIBROS', label: 'Libros' }
  ];

  // Acciones disponibles
  const acciones = [
    { value: 'todos', label: 'Todas las acciones' },
    { value: 'CREATE', label: 'Creación' },
    { value: 'UPDATE', label: 'Actualización' },
    { value: 'DELETE', label: 'Eliminación' },
    { value: 'LOGIN', label: 'Inicio de sesión' },
    { value: 'LOGOUT', label: 'Cierre de sesión' },
    { value: 'VIEW', label: 'Visualización' },
    { value: 'EXPORT', label: 'Exportación' }
  ];

  // Resultados
  const resultados = [
    { value: 'todos', label: 'Todos los resultados' },
    { value: 'EXITO', label: 'Éxito' },
    { value: 'ERROR', label: 'Error' },
    { value: 'DENEGADO', label: 'Denegado' }
  ];

  // Cargar registros
  const cargarRegistros = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Construir parámetros
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);

      // Agregar filtros solo si tienen valor
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'todos' && value !== '') {
          params.append(key, value);
        }
      });

      console.log('Consultando API con params:', params.toString());
      
      const response = await api.get(`/auditoria?${params.toString()}`);
      console.log('Respuesta de API:', response.data);
      
      // Asegurarnos de que response.data existe
      if (response && response.data) {
        // Actualizar registros
        setRegistros(response.data.registros || []);
        setTotalCount(response.data.total || 0);
        
        // Actualizar stats con validación completa
        const nuevosStats = {
          total: response.data.stats?.total ?? response.data.total ?? 0,
          exitos: response.data.stats?.exitos ?? 0,
          errores: response.data.stats?.errores ?? 0,
          denegados: response.data.stats?.denegados ?? 0
        };
        
        console.log('Actualizando stats:', nuevosStats);
        setStats(nuevosStats);
      } else {
        // Si no hay datos, mantener valores por defecto
        setStats({
          total: 0,
          exitos: 0,
          errores: 0,
          denegados: 0
        });
      }
    } catch (err) {
      console.error('Error detallado:', err);
      setError('Error al cargar los registros de auditoría: ' + (err.response?.data?.mensaje || err.message));
      
      // En caso de error, mantener stats con valores por defecto
      setStats({
        total: 0,
        exitos: 0,
        errores: 0,
        denegados: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente y cuando cambien página o límite
  useEffect(() => {
    cargarRegistros();
  }, [page, limit]);

  // Función segura para obtener stats
  const getStatsValue = (key) => {
    if (!stats) return 0;
    return stats[key] || 0;
  };

  // Manejadores
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(1); // Resetear a primera página al buscar
    cargarRegistros();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewDetails = (registro) => {
    setSelectedRegistro(registro);
    setShowModal(true);
  };

  const handleRefresh = () => {
    cargarRegistros();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      
      // Agregar filtros solo si tienen valor
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'todos' && value !== '') {
          params.append(key, value);
        }
      });
      
      const response = await api.get(`/auditoria/exportar?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bitacora_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Error al exportar la bitácora');
    }
  };

  const handleClearFilters = () => {
    setFilters({
      busqueda: '',
      modulo: 'todos',
      accion: 'todos',
      resultado: 'todos',
      fechaInicio: '',
      fechaFin: '',
      usuario: ''
    });
    setPage(1);
    // Recargar después de limpiar filtros
    setTimeout(() => cargarRegistros(), 0);
  };

  // Renderizar chip de acción
  const renderAccionChip = (accion) => {
    if (!accion) return null;
    
    const config = {
      CREATE: { className: 'chip-success', icon: '✓', label: 'Creación' },
      UPDATE: { className: 'chip-info', icon: '↻', label: 'Actualización' },
      DELETE: { className: 'chip-error', icon: '✗', label: 'Eliminación' },
      LOGIN: { className: 'chip-primary', icon: '→', label: 'Login' },
      LOGOUT: { className: 'chip-secondary', icon: '←', label: 'Logout' },
      VIEW: { className: 'chip-warning', icon: '👁', label: 'Vista' },
      EXPORT: { className: 'chip-primary', icon: '↓', label: 'Exportación' }
    };

    const { className, icon, label } = config[accion] || { className: 'chip-secondary', icon: '•', label: accion };

    return (
      <span className={`chip ${className}`}>
        <span className="chip-icon">{icon}</span>
        {label}
      </span>
    );
  };

  // Renderizar badge de resultado
  const renderResultadoBadge = (resultado) => {
    if (!resultado) return null;
    
    const config = {
      EXITO: { className: 'exito', icon: '✓', label: 'Éxito' },
      ERROR: { className: 'error', icon: '✗', label: 'Error' },
      DENEGADO: { className: 'denegado', icon: '⚠', label: 'Denegado' }
    };

    const { className, icon, label } = config[resultado] || { className: '', icon: '•', label: resultado };

    return (
      <span className={`result-badge ${className}`}>
        <span className="badge-icon">{icon}</span>
        {label}
      </span>
    );
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return `Hoy, ${date.toLocaleTimeString()}`;
      } else if (diffDays === 1) {
        return `Ayer, ${date.toLocaleTimeString()}`;
      } else if (diffDays < 7) {
        return date.toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Obtener iniciales del usuario
  const getUserInitials = (username) => {
    if (!username) return 'S';
    return username.charAt(0).toUpperCase();
  };

  // Calcular páginas
  const totalPages = Math.ceil((totalCount || 0) / limit);

  // Renderizado condicional seguro
  return (
    <div className="bitacora-container">
      {/* Header */}
      <div className="bitacora-header fade-in">
        <h1>
          <span className="header-icon">📋</span>
          Bitácora del Sistema
        </h1>
        <p>Registro detallado de todas las acciones realizadas en el sistema para fines de auditoría</p>
      </div>

      {/* Stats Cards - CON VALORES SEGUROS */}
      <div className="stats-grid">
        <div className="stat-card total fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-info">
            <h3>Total Registros</h3>
            <div className="stat-number">{stats?.total ?? 0}</div>
          </div>
          <div className="stat-icon">📊</div>
        </div>

        <div className="stat-card exito fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-info">
            <h3>Éxitos</h3>
            <div className="stat-number">{stats?.exitos ?? 0}</div>
          </div>
          <div className="stat-icon">✓</div>
        </div>

        <div className="stat-card error fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-info">
            <h3>Errores</h3>
            <div className="stat-number">{stats?.errores ?? 0}</div>
          </div>
          <div className="stat-icon">✗</div>
        </div>

        <div className="stat-card denegado fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="stat-info">
            <h3>Denegados</h3>
            <div className="stat-number">{stats?.denegados ?? 0}</div>
          </div>
          <div className="stat-icon">⚠</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel fade-in">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscar</label>
            <div className="search-input">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="filter-input"
                placeholder="Buscar por usuario, email, acción..."
                value={filters.busqueda}
                onChange={(e) => handleFilterChange('busqueda', e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Módulo</label>
            <select
              className="filter-select"
              value={filters.modulo}
              onChange={(e) => handleFilterChange('modulo', e.target.value)}
            >
              {modulos.map(mod => (
                <option key={mod.value} value={mod.value}>{mod.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Acción</label>
            <select
              className="filter-select"
              value={filters.accion}
              onChange={(e) => handleFilterChange('accion', e.target.value)}
            >
              {acciones.map(acc => (
                <option key={acc.value} value={acc.value}>{acc.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Resultado</label>
            <select
              className="filter-select"
              value={filters.resultado}
              onChange={(e) => handleFilterChange('resultado', e.target.value)}
            >
              {resultados.map(res => (
                <option key={res.value} value={res.value}>{res.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              className="filter-input"
              value={filters.fechaInicio}
              onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              className="filter-input"
              value={filters.fechaFin}
              onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
            />
          </div>
        </div>

        <div className="filters-actions">
          <button className="btn btn-secondary" onClick={handleClearFilters}>
            <span>🗑</span>
            Limpiar Filtros
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <span>↻</span>
            Actualizar
          </button>
          <button className="btn btn-primary" onClick={handleSearch}>
            <span>🔍</span>
            Buscar
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <span>↓</span>
            Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container fade-in">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            {error}
          </div>
        )}

        <table className="audit-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Módulo</th>
              <th>Detalles</th>
              <th>Resultado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="loading-spinner">
                  <div className="spinner"></div>
                </td>
              </tr>
            ) : !registros || registros.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No hay registros</h3>
                  <p>No se encontraron registros de auditoría con los filtros aplicados</p>
                </td>
              </tr>
            ) : (
              registros.map((registro, index) => (
                <tr key={registro._id || index} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {getUserInitials(registro.usuario?.username)}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{registro.usuario?.username || 'Sistema'}</span>
                        <span className="user-email">{registro.usuario?.email || 'sistema@local'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{renderAccionChip(registro.accion)}</td>
                  <td>
                    <span className="chip chip-primary">
                      {registro.modulo || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <div className="details-preview" title={registro.detalles}>
                      {registro.detalles?.substring(0, 50)}
                      {registro.detalles?.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td>{renderResultadoBadge(registro.resultado)}</td>
                  <td>
                    <div className="date-cell">
                      {formatDate(registro.fecha_creacion)}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewDetails(registro)}
                      >
                        <p>Ver detalles</p>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination - Solo mostrar si hay registros */}
        {totalCount > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalCount)} de {totalCount} registros
            </div>
            
            <div className="rows-per-page">
              <label>Filas por página:</label>
              <select 
                className="rows-select"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                ⟪
              </button>
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ⟨
              </button>
              
              {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    className={`pagination-btn ${pageNum === page ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ⟩
              </button>
              <button
                className="pagination-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                ⟫
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for details */}
      {showModal && selectedRegistro && (
        <div className="modal-overlay-bitacora" onClick={() => setShowModal(false)}>
          <div className="modal-content-bitacora" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bitacora">
              <h2>
                <span className="header-icon">📋</span>
                Detalles del Registro
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✗</button>
            </div>
            
            <div className="modal-body-bitacora">
              <div className="modal-section-bitacora">
                <h3 className="modal-section-title">Información del Usuario</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Usuario</div>
                    <div className="detail-value">{selectedRegistro.usuario?.username || 'Sistema'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Email</div>
                    <div className="detail-value">{selectedRegistro.usuario?.email || 'No disponible'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Rol</div>
                    <div className="detail-value">{selectedRegistro.usuario?.rol || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3 className="modal-section-title">Información de la Acción</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">Acción</div>
                    <div className="detail-value">{renderAccionChip(selectedRegistro.accion)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Módulo</div>
                    <div className="detail-value">
                      <span className="chip chip-primary">{selectedRegistro.modulo}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Resultado</div>
                    <div className="detail-value">{renderResultadoBadge(selectedRegistro.resultado)}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">Fecha y Hora</div>
                    <div className="detail-value">
                      {selectedRegistro.fecha_creacion ? 
                        new Date(selectedRegistro.fecha_creacion).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) : 'Fecha no disponible'
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3 className="modal-section-title">Detalles de la Petición</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <div className="detail-label">IP Address</div>
                    <div className="detail-value">{selectedRegistro.ip_address || 'No disponible'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">User Agent</div>
                    <div className="detail-value" style={{ fontSize: '11px' }}>
                      {selectedRegistro.user_agent || 'No disponible'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">URL</div>
                    <div className="detail-value">{selectedRegistro.detalles}</div>
                  </div>
                </div>
              </div>

              {(selectedRegistro.entidad?.datos_previos || selectedRegistro.entidad?.datos_nuevos) && (
                <div className="modal-section">
                  <h3 className="modal-section-title">Cambios en la Entidad</h3>
                  <div className="detail-grid">
                    {selectedRegistro.entidad?.datos_previos && (
                      <div className="detail-item">
                        <div className="detail-label">Datos Previos</div>
                        <pre className="data-preview">
                          {JSON.stringify(selectedRegistro.entidad.datos_previos, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedRegistro.entidad?.datos_nuevos && (
                      <div className="detail-item">
                        <div className="detail-label">Datos Nuevos</div>
                        <pre className="data-preview">
                          {JSON.stringify(selectedRegistro.entidad.datos_nuevos, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRegistro.error_message && (
                <div className="modal-section">
                  <div className="alert alert-error">
                    <span className="alert-icon">⚠</span>
                    <div>
                      <strong>Error:</strong> {selectedRegistro.error_message}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitacora;