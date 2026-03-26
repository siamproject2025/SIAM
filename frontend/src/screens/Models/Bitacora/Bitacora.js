// src/screens/Models/Bitacora/Bitacora.js
import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import "../../../styles/Bitacora/Bitacora.css"
import { TbChartInfographic } from "react-icons/tb";
import { FaBookBookmark } from "react-icons/fa6";
import { FaCheckDouble } from "react-icons/fa";
import { MdError } from "react-icons/md";
import { IoWarning } from "react-icons/io5";
import { FaSearch, FaTrash } from "react-icons/fa";
import WithPermission from '../../../components/Permisos/WithPermission';

// ─────────────────────────────────────────────
// Helper: Comparador visual de datos prev/nuevo
// ─────────────────────────────────────────────
// Campos de auditoría/sistema que nunca se muestran
const EXCLUDED_FIELDS = new Set([
  '_id', '__v',
  'fecha_registro', 'fecha_creacion', 'fecha_actualizacion',
  'createdAt', 'updatedAt', 'created_at', 'updated_at'
]);

// Detecta si un string es una fecha ISO válida
const isISODate = (val) => {
  if (typeof val !== 'string') return false;
  // Debe tener forma de fecha ISO (contiene T o es yyyy-mm-dd)
  if (!/^\d{4}-\d{2}-\d{2}/.test(val)) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
};

// Formatea fecha de forma legible
const formatDateValue = (val) =>
  new Date(val).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

// Humaniza nombres de campo
const humanizeKey = (key) =>
  key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase()).trim();

// Renderiza un valor primitivo o fecha de forma legible
const FormatPrimitive = ({ val }) => {
  if (val === null || val === undefined || val === '')
    return <em style={{ color: '#a0aec0' }}>—</em>;
  if (typeof val === 'boolean')
    return <span>{val ? 'Sí' : 'No'}</span>;
  if (isISODate(val))
    return <span>{formatDateValue(val)}</span>;
  return <span>{String(val)}</span>;
};

// Renderiza un array de strings/números como etiquetas
const TagList = ({ items, color }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
    {items.map((item, i) => (
      <span key={i} style={{
        padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
        background: color === 'red' ? '#fff5f5' : color === 'green' ? '#f0fff4' : '#edf2f7',
        color: color === 'red' ? '#c53030' : color === 'green' ? '#276749' : '#4a5568',
        border: `1px solid ${color === 'red' ? '#fed7d7' : color === 'green' ? '#c6f6d5' : '#e2e8f0'}`
      }}>
        {isISODate(String(item)) ? formatDateValue(item) : String(item)}
      </span>
    ))}
  </div>
);

// Renderiza un array de objetos como mini-tabla, excluyendo _id y fechas de sistema
const ObjectArrayDiff = ({ prevArr, nextArr, color }) => {
  const arr = (nextArr || prevArr || []);
  if (arr.length === 0) return <em style={{ color: '#a0aec0' }}>—</em>;

  const keys = Array.from(
    new Set(arr.flatMap(obj => Object.keys(obj || {})))
  ).filter(k => !EXCLUDED_FIELDS.has(k));

  if (keys.length === 0) return <em style={{ color: '#a0aec0' }}>—</em>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
        <thead>
          <tr style={{ background: color === 'red' ? '#fff5f5' : color === 'green' ? '#f0fff4' : '#edf2f7' }}>
            {keys.map(k => (
              <th key={k} style={{
                padding: '4px 8px', textAlign: 'left', fontWeight: 700,
                color: color === 'red' ? '#c53030' : color === 'green' ? '#276749' : '#4a5568',
                whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0'
              }}>
                {humanizeKey(k)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arr.map((obj, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              {keys.map(k => (
                <td key={k} style={{ padding: '4px 8px', color: '#2d3748' }}>
                  <FormatPrimitive val={obj?.[k]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Decide cómo renderizar un valor según su tipo
const RenderValue = ({ val, color }) => {
  if (val === null || val === undefined || val === '')
    return <em style={{ color: '#a0aec0' }}>—</em>;

  if (Array.isArray(val)) {
    if (val.length === 0) return <em style={{ color: '#a0aec0' }}>Lista vacía</em>;
    // Array de objetos → mini-tabla
    if (typeof val[0] === 'object' && val[0] !== null)
      return <ObjectArrayDiff prevArr={null} nextArr={val} color={color} />;
    // Array de primitivos → etiquetas
    return <TagList items={val} color={color} />;
  }

  if (typeof val === 'object')
    return <FormatPrimitive val={JSON.stringify(val)} />;

  return <FormatPrimitive val={val} />;
};

// ─── Comparador principal ───────────────────────────────────────────────────
const DataComparator = ({ datosPrevios, datosNuevos }) => {
  const hasBoth = !!(datosPrevios && datosNuevos);

  const allKeys = Array.from(
    new Set([
      ...Object.keys(datosPrevios || {}),
      ...Object.keys(datosNuevos || {})
    ])
  ).filter((key) => !EXCLUDED_FIELDS.has(key));

  // Considera "vacío" a null, undefined, '', [], {}
  const isEmpty = (val) => {
    if (val === null || val === undefined || val === '') return true;
    if (Array.isArray(val) && val.length === 0) return true;
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true;
    return false;
  };

  // Normaliza undefined/null/''/[]/{} a null para comparar de forma uniforme
  const normalize = (val) => {
    if (isEmpty(val)) return null;
    return val;
  };

  // Solo mostrar campos donde ambos lados normalizados son distintos
  const visibleKeys = hasBoth
    ? allKeys.filter((key) => {
        const prev = normalize(datosPrevios?.[key]);
        const next = normalize(datosNuevos?.[key]);
        // Si ambos normalizan a null, ignorar
        if (prev === null && next === null) return false;
        // Comparar serializados
        return JSON.stringify(prev) !== JSON.stringify(next);
      })
    : allKeys.filter((key) => !isEmpty((datosPrevios || datosNuevos)?.[key]));

  if (visibleKeys.length === 0)
    return (
      <p style={{ color: '#718096', fontSize: '13px' }}>
        {hasBoth ? 'No se detectaron cambios en los datos.' : 'Sin datos disponibles.'}
      </p>
    );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#edf2f7' }}>
            <th style={{ ...thStyle, width: '160px' }}>Campo</th>
            {datosPrevios && <th style={{ ...thStyle, color: '#c53030' }}>Valor anterior</th>}
            {datosNuevos  && <th style={{ ...thStyle, color: '#276749' }}>Valor nuevo</th>}
          </tr>
        </thead>
        <tbody>
          {visibleKeys.map((key) => {
            const prev = datosPrevios?.[key];
            const next = datosNuevos?.[key];
            const changed = JSON.stringify(prev) !== JSON.stringify(next);
            return (
              <tr key={key} style={{ background: changed ? '#fffaf0' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ ...tdStyle, fontWeight: '600', color: '#4a5568', verticalAlign: 'top' }}>
                  {changed && <span style={{ marginRight: 4, color: '#dd6b20' }}>●</span>}
                  {humanizeKey(key)}
                </td>
                {datosPrevios && (
                  <td style={{
                    ...tdStyle, verticalAlign: 'top',
                    color: changed ? '#c53030' : '#4a5568',
                    background: changed ? '#fff5f5' : 'transparent',
                  }}>
                    <RenderValue val={prev} color={changed ? 'red' : 'neutral'} />
                  </td>
                )}
                {datosNuevos && (
                  <td style={{
                    ...tdStyle, verticalAlign: 'top',
                    color: changed ? '#276749' : '#4a5568',
                    background: changed ? '#f0fff4' : 'transparent',
                    fontWeight: changed ? '600' : '400'
                  }}>
                    <RenderValue val={next} color={changed ? 'green' : 'neutral'} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasBoth && (
        <p style={{ fontSize: '11px', color: '#a0aec0', marginTop: '8px' }}>
          {visibleKeys.length} campo{visibleKeys.length !== 1 ? 's' : ''} modificado{visibleKeys.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: '700',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '8px 12px',
  verticalAlign: 'top',
  wordBreak: 'break-word'
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const Bitacora = () => {
  const [auditEnabled, setAuditEnabled] = useState(true);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAction, setAuditAction] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Estado para borrar bitácora
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState('partial'); // 'partial' | 'all'
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteFechaHasta, setDeleteFechaHasta] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusLoading, setStatusLoading] = useState(true);

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

  const [stats, setStats] = useState({
    total: 0,
    exitos: 0,
    errores: 0,
    denegados: 0
  });

  const modulos = [
    { value: 'todos', label: 'Todos los módulos' },
    { value: 'USUARIOS', label: 'Usuarios' },
    { value: 'ROLES', label: 'Roles' },
    { value: 'PROVEEDORES', label: 'Proveedores' },
    { value: 'BIENES', label: 'Bienes' },
    { value: 'MATRICULA', label: 'Matricula' },
    { value: 'BIBLIOTECA', label: 'Biblioteca' },
    { value: 'GRADOS', label: 'Grados' },
    { value: 'PERSONAL', label: 'Personal' },
    { value: 'ESTUDIANTES', label: 'Estudiantes' },
    { value: 'HORARIOS', label: 'Horarios' },
    { value: 'ACTIVIDADES', label: 'Actividades' },
    { value: 'ORDENES_COMPRA', label: 'Orden de compra' },
    { value: 'AUDITORIA', label: 'Auditoria' },
  ];

  const acciones = [
    { value: 'todos', label: 'Todas las acciones' },
    { value: 'CREATE', label: 'Creación' },
    { value: 'UPDATE', label: 'Actualización' },
    { value: 'DELETE', label: 'Eliminación' },
    { value: 'LOGIN', label: 'Inicio de sesión' },
    { value: 'LOGOUT', label: 'Cierre de sesión' },
    { value: 'EXPORT', label: 'Exportación' }
  ];

  const resultados = [
    { value: 'todos', label: 'Todos los resultados' },
    { value: 'EXITO', label: 'Éxito' },
    { value: 'ERROR', label: 'Error' },
    { value: 'DENEGADO', label: 'Denegado' }
  ];

  // ── Cargar estado de auditoría ──
  const cargarEstadoAuditoria = async () => {
    try {
      const response = await api.get('/audit-status');
      setAuditEnabled(response.data.enabled);
    } catch (error) {
      console.error('Error cargando estado:', error);
      setAuditEnabled(true);
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleAudit = async (enable) => {
    setAuditLoading(true);
    try {
      const response = await api.post('/audit-status', { enabled: enable });
      if (response.data.enabled === enable) {
        setAuditEnabled(enable);
        setShowAuditModal(false);

        if (enable) cargarRegistros();
      }
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setAuditLoading(false);
    }
  };

  const confirmAuditToggle = (action) => {
    setAuditAction(action);
    setShowAuditModal(true);
  };

  useEffect(() => {
    cargarEstadoAuditoria();
  }, []);

  // ── Cargar registros ──
  const cargarRegistros = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'todos' && value !== '') {
          // FIX: fechaFin incluye hasta las 23:59:59 del día seleccionado
          if (key === 'fechaFin') {
            params.append(key, `${value}T23:59:59`);
          } else {
            params.append(key, value);
          }
        }
      });

      if (!auditEnabled) {
        params.append('skipAudit', 'true');
      }

      const response = await api.get(`/auditoria?${params.toString()}`);

      if (response && response.data) {
        setRegistros(response.data.registros || []);
        setTotalCount(response.data.total || 0);
        const nuevosStats = {
          total: response.data.stats?.total ?? response.data.total ?? 0,
          exitos: response.data.stats?.exitos ?? 0,
          errores: response.data.stats?.errores ?? 0,
          denegados: response.data.stats?.denegados ?? 0
        };
        setStats(nuevosStats);
      } else {
        setStats({ total: 0, exitos: 0, errores: 0, denegados: 0 });
      }
    } catch (err) {
      console.error('Error detallado:', err);
      setError('Error al cargar los registros de auditoría: ' + (err.response?.data?.mensaje || err.message));
      setStats({ total: 0, exitos: 0, errores: 0, denegados: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!statusLoading) {
      cargarRegistros();
    }
  }, [page, limit, statusLoading]);

  // ── Handlers ──
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(1);
    cargarRegistros();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = (registro) => {
    setSelectedRegistro(registro);
    setShowModal(true);
  };

  const handleRefresh = () => {
    cargarRegistros();
  };

  // FIX: Exportar - fechaFin correcta + nombre de archivo con fecha legible
const handleExport = async () => {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'todos' && value !== '') {
        if (key === 'fechaFin') {
          params.append(key, `${value}T23:59:59`);
        } else {
          params.append(key, value);
        }
      }
    });

    const response = await api.get(`/auditoria/exportar?${params.toString()}`, {
      responseType: 'blob',
      headers: {
        Accept: 'text/csv'  // ✅ indica que esperamos CSV
      }
    });

    // ✅ Verificar que realmente llegó un CSV y no un JSON de error
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/csv') && !contentType.includes('application/octet-stream')) {
      // El backend devolvió un error en JSON
      const text = await response.data.text();
      const error = JSON.parse(text);
      throw new Error(error.mensaje || 'Error al exportar');
    }

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;

    const fecha = new Date().toLocaleDateString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\//g, '-');

    link.setAttribute('download', `bitacora_${fecha}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (err) {
    console.error('Error exportando:', err);
    setError('Error al exportar: ' + (err.message || 'Error desconocido'));
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
    setTimeout(() => cargarRegistros(), 0);
  };

  // ── Borrar bitácora ──
  const handleDeleteBitacora = async () => {
    setDeleteLoading(true);
    try {
      const params = new URLSearchParams();
      if (deleteMode === 'partial' && deleteFechaHasta) {
        params.append('fechaHasta', `${deleteFechaHasta}T23:59:59`);
      }
      await api.delete(`/auditoria/limpiar?${params.toString()}`);
      setShowDeleteModal(false);
      setDeleteFechaHasta('');
  
      cargarRegistros();
    } catch (err) {
      alert('❌ Error al eliminar: ' + (err.response?.data?.mensaje || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render helpers ──
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor(Math.abs(now - date) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return `Hoy, ${date.toLocaleTimeString()}`;
      if (diffDays === 1) return `Ayer, ${date.toLocaleTimeString()}`;
      if (diffDays < 7) return date.toLocaleDateString('es-ES', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getUserInitials = (username) => {
    if (!username) return 'S';
    return username.charAt(0).toUpperCase();
  };

  const totalPages = Math.ceil((totalCount || 0) / limit);

  if (statusLoading) {
    return (
      <div className="bitacora-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando configuración de auditoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bitacora-container">
      {/* Header */}
      <div className="bitacora-header fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <h1>
            <span className="header-icon"><FaBookBookmark /></span>
            Bitácora del Sistema
          </h1>
          <div className={`audit-status-indicator ${auditEnabled ? 'audit-status-active' : 'audit-status-inactive'}`}>
            <span style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: auditEnabled ? '#48bb78' : '#f56565',
              animation: auditEnabled ? 'none' : 'pulse 1.5s infinite',
              display: 'inline-block'
            }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Auditoría: {auditEnabled ? 'ACTIVA' : 'INACTIVA'}
            </span>
          </div>
        </div>
        <p>Registro detallado de todas las acciones realizadas en el sistema para fines de auditoría</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card-bitacora total fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-info">
            <h3>Total Registros</h3>
            <div className="stat-number">{stats?.total ?? 0}</div>
          </div>
          <div className="stat-icon"><TbChartInfographic /></div>
        </div>
        <div className="stat-card-bitacora exito fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-info">
            <h3>Éxitos</h3>
            <div className="stat-number">{stats?.exitos ?? 0}</div>
          </div>
          <div className="stat-icon"><FaCheckDouble /></div>
        </div>
        <div className="stat-card-bitacora error fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-info">
            <h3>Errores</h3>
            <div className="stat-number">{stats?.errores ?? 0}</div>
          </div>
          <div className="stat-icon"><MdError /></div>
        </div>
        <div className="stat-card-bitacora denegado fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="stat-info">
            <h3>Denegados</h3>
            <div className="stat-number">{stats?.denegados ?? 0}</div>
          </div>
          <div className="stat-icon"><IoWarning /></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-panel fade-in">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscar</label>
            <div className="search-input">
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
            <select className="filter-select" value={filters.modulo} onChange={(e) => handleFilterChange('modulo', e.target.value)}>
              {modulos.map(mod => <option key={mod.value} value={mod.value}>{mod.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Acción</label>
            <select className="filter-select" value={filters.accion} onChange={(e) => handleFilterChange('accion', e.target.value)}>
              {acciones.map(acc => <option key={acc.value} value={acc.value}>{acc.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Resultado</label>
            <select className="filter-select" value={filters.resultado} onChange={(e) => handleFilterChange('resultado', e.target.value)}>
              {resultados.map(res => <option key={res.value} value={res.value}>{res.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Fecha Inicio</label>
            <input type="date" className="filter-input" value={filters.fechaInicio} onChange={(e) => handleFilterChange('fechaInicio', e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Fecha Fin</label>
            <input type="date" className="filter-input" value={filters.fechaFin} onChange={(e) => handleFilterChange('fechaFin', e.target.value)} />
          </div>
        </div>

        <div className="filters-actions">
          <button className="btn btn-secondary" onClick={handleClearFilters}>
            <span>🗑</span> Limpiar Filtros
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <span>↻</span> Actualizar
          </button>
          <button className="btn btn-primary" onClick={handleSearch}>
            <span><FaSearch /></span> Buscar
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <span>↓</span> Exportar CSV
          </button>

          {/* Botón Borrar Bitácora */}
          <WithPermission requiredPermissions={["ELIMINAR_AUDITORIA"]}>
            <button
              className="btn"
              onClick={() => setShowDeleteModal(true)}
              style={{ background: '#e53e3e', color: 'white', border: 'none', minWidth: '160px' }}
            >
              <FaTrash style={{ marginRight: '6px' }} />
              Borrar Bitácora
            </button>
          </WithPermission>

          {/* Botón activar/desactivar auditoría */}
          <WithPermission requiredPermissions={["ACTUALIZAR_AUDITORIA"]}>
            <button
              className={`btn ${auditEnabled ? 'btn-warning' : 'btn-success'}`}
              onClick={() => confirmAuditToggle(auditEnabled ? 'disable' : 'enable')}
              disabled={auditLoading}
              style={{
                background: auditEnabled ? '#ed8936' : '#48bb78',
                color: 'white', border: 'none', minWidth: '160px'
              }}
            >
              {auditLoading
                ? <><span className="spinner-small"></span>Procesando...</>
                : auditEnabled ? 'Desactivar Auditoría' : 'Activar Auditoría'
              }
            </button>
          </WithPermission>
        </div>
      </div>

      {/* Alerta auditoría inactiva */}
      {!auditEnabled && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Auditoría desactivada:</strong> Los registros mostrados son históricos.
            Las nuevas acciones no se están registrando.
          </div>
        </div>
      )}

      {/* Tabla — sin columna Detalles */}
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
              <th>Resultado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="loading-spinner">
                  <div className="spinner"></div>
                </td>
              </tr>
            ) : !registros || registros.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
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
                      <div className="user-avatar">{getUserInitials(registro.usuario?.username)}</div>
                      <div className="user-info">
                        <span className="user-name">{registro.usuario?.username || 'Sistema'}</span>
                        <span className="user-email">{registro.usuario?.email || 'sistema@local'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{renderAccionChip(registro.accion)}</td>
                  <td>
                    <span className="chip chip-primary">{registro.modulo || 'N/A'}</span>
                  </td>
                  <td>{renderResultadoBadge(registro.resultado)}</td>
                  <td>
                    <div className="date-cell">{formatDate(registro.fecha_creacion)}</div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" onClick={() => handleViewDetails(registro)}>
                        <p>Ver detalles</p>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {totalCount > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, totalCount)} de {totalCount} registros
            </div>
            <div className="rows-per-page">
              <label>Filas por página:</label>
              <select className="rows-select" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="pagination-controls">
              <button className="pagination-btn" onClick={() => setPage(1)} disabled={page === 1}>⟪</button>
              <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>⟨</button>
              {totalPages > 0 && [...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                return (
                  <button key={i} className={`pagination-btn ${pageNum === page ? 'active' : ''}`} onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </button>
                );
              })}
              <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>⟩</button>
              <button className="pagination-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>⟫</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal detalles con comparación visual ── */}
      {showModal && selectedRegistro && (
        <div className="modal-overlay-bitacora" onClick={() => setShowModal(false)}>
          <div className="modal-content-bitacora" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header-bitacora">
              <h2>
                <span className="header-icon"><FaBookBookmark fontSize="30px" />  </span>
                Detalles del Registro
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✗</button>
            </div>

            <div className="modal-body-bitacora">
              {/* Info usuario */}
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

              {/* Info acción */}
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
                      {selectedRegistro.fecha_creacion
                        ? new Date(selectedRegistro.fecha_creacion).toLocaleString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })
                        : 'Fecha no disponible'}
                    </div>
                  </div>
                </div>
              </div>


              {/* ── Comparación visual de cambios ── */}
              {(selectedRegistro.entidad?.datos_previos || selectedRegistro.entidad?.datos_nuevos) && (
                <div className="modal-section">
                  <h3 className="modal-section-title">
                    {selectedRegistro.entidad?.datos_previos && selectedRegistro.entidad?.datos_nuevos
                      ? '🔄 Cambios realizados'
                      : selectedRegistro.entidad?.datos_nuevos
                        ? '➕ Datos creados'
                        : '🗑️ Datos eliminados'}
                  </h3>

                  {/* Leyenda visual */}
                  {selectedRegistro.entidad?.datos_previos && selectedRegistro.entidad?.datos_nuevos && (
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 12, height: 12, background: '#fff5f5', border: '1px solid #fc8181', borderRadius: 2, display: 'inline-block' }}></span>
                        Valor anterior
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 12, height: 12, background: '#f0fff4', border: '1px solid #68d391', borderRadius: 2, display: 'inline-block' }}></span>
                        Valor nuevo
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#dd6b20' }}>●</span>
                        Campo modificado
                      </span>
                    </div>
                  )}

                  <DataComparator
                    datosPrevios={selectedRegistro.entidad?.datos_previos}
                    datosNuevos={selectedRegistro.entidad?.datos_nuevos}
                  />
                </div>
              )}

              {/* Solo datos nuevos (CREATE sin estructura entidad) */}
              {!selectedRegistro.entidad?.datos_previos && !selectedRegistro.entidad?.datos_nuevos &&
               selectedRegistro.accion === 'CREATE' &&
               selectedRegistro.entidad &&
               typeof selectedRegistro.entidad === 'object' && (
                <div className="modal-section">
                  <h3 className="modal-section-title">➕ Datos registrados</h3>
                  <DataComparator
                    datosPrevios={null}
                    datosNuevos={selectedRegistro.entidad}
                  />
                </div>
              )}

              {/* Error message */}
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
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar auditoría ── */}
      {showAuditModal && (
        <div className="modal-overlay-bitacora" onClick={() => setShowAuditModal(false)}>
          <div className="modal-content-bitacora" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bitacora" style={{
              background: auditAction === 'disable' ? '#fed7d7' : '#c6f6d5'
            }}>
              <h3 style={{ color: auditAction === 'disable' ? '#742a2a' : '#22543d' }}>
                {auditAction === 'disable' ? 'Desactivar Auditoría' : 'Activar Auditoría'}
              </h3>
              <button className="modal-close" onClick={() => setShowAuditModal(false)}>✗</button>
            </div>

            <div className="modal-body-bitacora" style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>
                  {auditAction === 'disable' ? <IoWarning /> : <FaCheckDouble />}
                </span>
                <h3 style={{ margin: '0 0 12px 0', color: '#2d3748' }}>
                  {auditAction === 'disable' ? '¿Estás seguro de desactivar la auditoría?' : '¿Estás seguro de activar la auditoría?'}
                </h3>
                <p style={{ color: '#718096', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  {auditAction === 'disable'
                    ? 'Al desactivar la auditoría, no se registrarán las acciones de los usuarios en el sistema.'
                    : 'Al activar la auditoría, se comenzarán a registrar todas las acciones de los usuarios nuevamente.'}
                </p>
              </div>
              {auditAction === 'disable' && (
                <div className="alert alert-warning" style={{ marginTop: '16px' }}>
                  <span className="alert-icon"><IoWarning /></span>
                  <div>
                    <strong>Importante:</strong> Esta acción quedará registrada y puede ser auditada posteriormente.
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAuditModal(false)} disabled={auditLoading}>Cancelar</button>
              <button
                className="btn"
                onClick={() => toggleAudit(auditAction === 'enable')}
                disabled={auditLoading}
                style={{ background: auditAction === 'disable' ? '#f56565' : '#48bb78', color: 'white', minWidth: '140px' }}
              >
                {auditLoading
                  ? <><span className="spinner-small"></span>Procesando...</>
                  : auditAction === 'disable' ? 'Sí, Desactivar' : 'Sí, Activar'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal borrar bitácora ── */}
      {showDeleteModal && (
        <div className="modal-overlay-bitacora" onClick={() => !deleteLoading && setShowDeleteModal(false)}>
          <div className="modal-content-bitacora" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-bitacora" style={{ background: '#fed7d7' }}>
              <h3 style={{ color: '#742a2a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTrash /> Borrar Bitácora
              </h3>
              <button className="modal-close" onClick={() => !deleteLoading && setShowDeleteModal(false)}>✗</button>
            </div>

            <div className="modal-body-bitacora" style={{ padding: '24px' }}>
              <p style={{ color: '#4a5568', marginBottom: '20px', fontSize: '14px' }}>
                Selecciona el tipo de eliminación que deseas realizar:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px', border: `2px solid ${deleteMode === 'partial' ? '#f56565' : '#e2e8f0'}`,
                  borderRadius: '8px', cursor: 'pointer',
                  background: deleteMode === 'partial' ? '#fff5f5' : 'white'
                }}>
                  <input
                    type="radio" name="deleteMode" value="partial"
                    checked={deleteMode === 'partial'}
                    onChange={() => setDeleteMode('partial')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#2d3748' }}>Borrado parcial</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Elimina registros anteriores a una fecha específica</div>
                  </div>
                </label>

                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px', border: `2px solid ${deleteMode === 'all' ? '#f56565' : '#e2e8f0'}`,
                  borderRadius: '8px', cursor: 'pointer',
                  background: deleteMode === 'all' ? '#fff5f5' : 'white'
                }}>
                  <input
                    type="radio" name="deleteMode" value="all"
                    checked={deleteMode === 'all'}
                    onChange={() => setDeleteMode('all')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: '600', color: '#c53030' }}>Borrado total</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>Elimina TODOS los registros de la bitácora</div>
                  </div>
                </label>
              </div>

              {deleteMode === 'partial' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '6px' }}>
                    Eliminar registros hasta la fecha:
                  </label>
                  <input
                      type="date"
                      className="filter-input"
                      value={deleteFechaHasta}
                      onChange={(e) => setDeleteFechaHasta(e.target.value)}
                      max={new Date().toISOString().split('T')[0]} // ✅ no permite fechas futuras
                      style={{ width: '100%' }}
                    />
                  {deleteFechaHasta && (
                    <p style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                      Se eliminarán todos los registros hasta el{' '}
                      {new Date(deleteFechaHasta + 'T12:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })} (inclusive)
                    </p>
                  )}
                </div>
              )}

              <div className="alert alert-warning">
                <span className="alert-icon">⚠️</span>
                <div style={{ fontSize: '13px' }}>
                  <strong>Esta acción no se puede deshacer.</strong> Los registros eliminados no podrán recuperarse.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
                Cancelar
              </button>
              <button
                className="btn"
                onClick={handleDeleteBitacora}
                disabled={deleteLoading || (deleteMode === 'partial' && !deleteFechaHasta)}
                style={{ background: '#e53e3e', color: 'white', minWidth: '160px' }}
              >
                {deleteLoading
                  ? <><span className="spinner-small"></span>Eliminando...</>
                  : <><FaTrash style={{ marginRight: '6px' }} />{deleteMode === 'all' ? 'Borrar todo' : 'Borrar registros'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitacora;