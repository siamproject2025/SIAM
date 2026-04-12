// ============================================================
// OrdenCompra.js — Módulo de Órdenes de Compra
// Fixes:
//  - handleCrearOrden: acepta (datos, esFormData) de ModalCrearOrden
//  - handleEditarOrden: usa fetch PUT con JSON limpio
//  - handleEliminarOrden: cierra el modal de detalle al eliminar
//  - handleCrearOrden: refresca lista con populate correcto
// ============================================================
import React, { useEffect, useState, useMemo, useRef } from "react";
import ModalCrearOrden   from "./ModalCrearOrden";
import ModalDetalleOrden from "./ModalDetalleOrden";
import Notification      from "../../../components/Notification";
import * as XLSX         from "xlsx";
import "../../../styles/Models/Bienes.css";
import "../../../styles/Models/ordencompra.css";
import { auth }              from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import { motion }            from "framer-motion";
import ConfirmDialog         from "../../../components/ConfirmDialog/ConfirmDialog";
import {
  ShoppingCart, Search, HelpCircle, Plus,
  Download, Filter, Edit, Trash2,
  CheckCircle, Send, Package, XCircle,
  DollarSign
} from "lucide-react";

const API_URL      = process.env.REACT_APP_API_URL + "/api/compras";
const API_PROV_URL = process.env.REACT_APP_API_URL + "/api/proveedores";

const S = {
  btn: (bg, col = "#fff") => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
    fontWeight: 700, border: "none", cursor: "pointer",
    background: bg, color: col, fontFamily: "inherit", transition: "all .18s"
  })
};

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const formatFecha = (fecha) => {
  if (!fecha || fecha === "null") return "No registrado";
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return "No registrado";
    // UTC a GMT-6 Honduras (America/Tegucigalpa)
    const offsetMs = -6 * 60 * 60 * 1000;
    const local = new Date(date.getTime() + offsetMs);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(local.getUTCDate())}/${pad(local.getUTCMonth() + 1)}/${local.getUTCFullYear()} ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  } catch {
    return "No registrado";
  }
};

const columns = [
  { name: "NÚMERO",    uid: "numero",    sortable: true  },
  { name: "PROVEEDOR", uid: "proveedor", sortable: true  },
  { name: "FECHA",     uid: "fecha",     sortable: true  },
  { name: "ÍTEMS",     uid: "items",     sortable: false },
  { name: "TOTAL",     uid: "total",     sortable: true  },
  { name: "ESTADO",    uid: "estado",    sortable: true  },
  { name: "ACCIONES",  uid: "acciones",  sortable: false },
];

const estadosOptions = [
  { name: "Todos",    uid: "all"      },
  { name: "Borrador", uid: "BORRADOR" },
  { name: "Enviada",  uid: "ENVIADA"  },
  { name: "Recibida", uid: "RECIBIDA" },
  { name: "Cerrada",  uid: "CERRADA"  },
];



const ROWS = 15;

const OrdenCompra = () => {
  const [ordenes,           setOrdenes]           = useState([]);
  const [proveedores,       setProveedores]       = useState([]);
  const [filterValue,       setFilterValue]       = useState("");
  const [estadoFiltro,      setEstadoFiltro]      = useState("all");
  const [sortDesc,          setSortDesc]          = useState({ column: "fecha", direction: "descending" });
  const [page,              setPage]              = useState(1);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [notification,      setNotification]      = useState(null);
  const [mostrarAyuda,      setMostrarAyuda]      = useState(false);
  const [fechaDesde,        setFechaDesde]        = useState("");
  const [fechaHasta,        setFechaHasta]        = useState("");
  const [ordenAEliminar,    setOrdenAEliminar]    = useState(null);
  const [showConfirm,       setShowConfirm]       = useState(false);

  const estadoMenuRef = useRef(null);

  // ── Helper: obtener token ──────────────────────────────────
  const getToken = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Usuario no autenticado");
    return token;
  };

  // Función auxiliar para obtener fecha local YYYY-MM-DD
const getLocalDate = (utcDate) => {
  if (!utcDate) return "";
  const date = new Date(utcDate);
  // Ajustar a GMT-6 (Honduras)
  const offsetMs = -6 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + offsetMs);
  return localDate.toISOString().split('T')[0];
};


  // ── Carga inicial ──────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        loadingController.start();
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [resOrd, resProv] = await Promise.all([
          fetch(API_URL,      { headers }),
          fetch(API_PROV_URL, { headers })
        ]);

        if (!resOrd.ok)  throw new Error("Error al obtener órdenes");
        if (!resProv.ok) throw new Error("Error al obtener proveedores");

        const [dataOrd, dataProv] = await Promise.all([resOrd.json(), resProv.json()]);
        setOrdenes(dataOrd);
        setProveedores(dataProv.filter(p => p.estado === "ACTIVO"));
      } catch (err) {
        console.error(err);
        showNotification(err.message || "Error al cargar datos", "error");
      } finally {
        loadingController.stop();
      }
    };
    cargar();
  }, []);

  // Cierre dropdown al click fuera
  useEffect(() => {
    const fn = (e) => {
      if (estadoMenuRef.current && !estadoMenuRef.current.contains(e.target));
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Métricas + filtrado ────────────────────────────────────
  const { filteredItems, metrics } = useMemo(() => {
    let f = [...ordenes];
    if (filterValue) {
      const q = filterValue.toLowerCase();
      f = f.filter(o =>
        o.numero?.toLowerCase().includes(q) ||
        o.proveedor_id?.nombre?.toLowerCase().includes(q) ||
        o.proveedor_id?.empresa?.toLowerCase().includes(q) ||
        o.estado?.toLowerCase().includes(q)
      );
    }
    if (estadoFiltro !== "all") f = f.filter(o => o.estado === estadoFiltro);
   if (fechaDesde) {
  f = f.filter(o => getLocalDate(o.fecha) >= fechaDesde);
}
if (fechaHasta) {
  f = f.filter(o => getLocalDate(o.fecha) <= fechaHasta);
}
    return {
      filteredItems: f,
      metrics: {
        borrador: ordenes.filter(o => o.estado === "BORRADOR").length,
        enviada:  ordenes.filter(o => o.estado === "ENVIADA").length,
        recibida: ordenes.filter(o => o.estado === "RECIBIDA").length,
        cerrada:  ordenes.filter(o => o.estado === "CERRADA").length,
        total:    ordenes.length,
      }
    };
  }, [ordenes, filterValue, estadoFiltro, fechaDesde, fechaHasta]);

  // ── Ordenamiento + paginación ──────────────────────────────
  const sortedItems = useMemo(() => {
    if (!sortDesc.column) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let x, y;
      if (sortDesc.column === "total") {
        x = a.items?.reduce((s, i) => s + i.cantidad * i.costoUnit, 0) || 0;
        y = b.items?.reduce((s, i) => s + i.cantidad * i.costoUnit, 0) || 0;
      } else if (sortDesc.column === "proveedor") {
        x = a.proveedor_id?.nombre || "";
        y = b.proveedor_id?.nombre || "";
      } else {
        x = a[sortDesc.column];
        y = b[sortDesc.column];
      }
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sortDesc.direction === "descending" ? -c : c;
    });
  }, [filteredItems, sortDesc]);

  const pages        = Math.ceil(sortedItems.length / ROWS) || 1;
  const currentItems = useMemo(() => {
    const s = (page - 1) * ROWS;
    return sortedItems.slice(s, s + ROWS);
  }, [page, sortedItems]);

  const handleSort = (uid) => {
    const col = columns.find(c => c.uid === uid);
    if (!col?.sortable) return;
    setSortDesc(p => ({
      column:    uid,
      direction: p.column === uid && p.direction === "ascending" ? "descending" : "ascending"
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Helper: recargar lista completa con populate ───────────
  const recargarOrdenes = async (token) => {
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error("Error al recargar órdenes");
    return res.json();
  };

  // ── CRUD ───────────────────────────────────────────────────

  /**
   * FIX PRINCIPAL: ModalCrearOrden llama onCreate(datos, esFormData)
   *  - Si esFormData === true: datos ya es un FormData listo para enviar
   *  - Si esFormData === false: datos es un objeto plano → enviar como JSON
   */
  const handleCrearOrden = async (datos, esFormData) => {
    try {
      loadingController.start();
      const token = await getToken();

      let fetchOptions;
      if (esFormData) {
        // Multipart/form-data — NO poner Content-Type, el navegador lo añade con boundary
        fetchOptions = {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}` },
          body:    datos  // datos ya es FormData
        };
      } else {
        // JSON puro
        fetchOptions = {
          method:  "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(datos)
        };
      }

      const res = await fetch(API_URL, fetchOptions);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error al crear la orden");

      // Recargar para obtener populate de proveedor
      const nuevasOrdenes = await recargarOrdenes(token);
      setOrdenes(nuevasOrdenes);
      setMostrarModalCrear(false);
      showNotification(`Orden "${json.data?.numero || ""}" creada exitosamente`, "success");
    } catch (err) {
      console.error("❌ handleCrearOrden:", err);
      showNotification(err.message || "Error al crear la orden", "error");
    } finally {
      loadingController.stop();
    }
  };

  /**
   * FIX: Limpia campos que no deben ir en el PUT
   * (adjuntos, recepciones, _id, __v, timestamps Mongoose no tocar)
   */
  const handleEditarOrden = async (id, actualizado) => {
    try {
      loadingController.start();
      const token = await getToken();

      // Construir payload limpio: solo campos editables
      const payload = {
        numero:       actualizado.numero,
        estado:       actualizado.estado,
        fecha:        actualizado.fecha,
        items:        actualizado.items,
        proveedor_id: typeof actualizado.proveedor_id === "object"
                        ? actualizado.proveedor_id?._id
                        : actualizado.proveedor_id,
      };

      const res = await fetch(`${API_URL}/${id}`, {
        method:  "PUT",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error al actualizar");

      // FIX: El backend devuelve { data } con populate ya cargado
      const ordenActualizada = json.data;
      setOrdenes(p => p.map(o => (o._id === ordenActualizada._id ? ordenActualizada : o)));
      setOrdenSeleccionada(null);
      showNotification(`Orden "${ordenActualizada.numero}" actualizada exitosamente`, "success");
    } catch (err) {
      console.error("❌ handleEditarOrden:", err);
      showNotification(err.message || "Error al actualizar la orden", "error");
    } finally {
      loadingController.stop();
    }
  };

  const handleEliminarOrden = (id) => {
    const orden = ordenes.find(o => o._id === id);
    setOrdenAEliminar(orden);
    setShowConfirm(true);
  };

  const confirmarEliminacion = async () => {
    if (!ordenAEliminar) return;
    try {
      loadingController.start();
      const token = await getToken();
      const res = await fetch(`${API_URL}/${ordenAEliminar._id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || json.error || "Error al eliminar");
      setOrdenes(p => p.filter(o => o._id !== ordenAEliminar._id));
      // FIX: cerrar el modal de detalle si estaba abierto para esa orden
      if (ordenSeleccionada?._id === ordenAEliminar._id) setOrdenSeleccionada(null);
      showNotification(`Orden "${ordenAEliminar.numero}" eliminada exitosamente`, "success");
    } catch (err) {
      showNotification(err.message || "Error al eliminar la orden", "error");
    } finally {
      loadingController.stop();
      setShowConfirm(false);
      setOrdenAEliminar(null);
    }
  };

  // ── Excel ──────────────────────────────────────────────────
  const handleExportarExcel = () => {
    if (filteredItems.length === 0) { showNotification("No hay órdenes para exportar.", "error"); return; }
    const data = filteredItems.map((o, i) => ({
      "N°":        i + 1,
      "Número":    o.numero,
      "Proveedor": o.proveedor_id?.nombre || "—",
      "Empresa":   o.proveedor_id?.empresa || "—",
      "Fecha":     o.fecha ? new Date(o.fecha).toLocaleDateString("es-HN") : "—",
      "Ítems":     o.items?.length || 0,
      "Total (L.)":Number(o.items?.reduce((s, i) => s + i.cantidad * i.costoUnit, 0) || 0)
                     .toLocaleString("es-HN"),
      "Estado":    o.estado,
      "Creado por":o.creado_por_email || "—",
      "Creación":  o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleDateString("es-HN") : "—",
      "Actualizado por": o.actualizado_por_email || "—",
      "Actualización":   o.fecha_actualizacion
                           ? new Date(o.fecha_actualizacion).toLocaleDateString("es-HN")
                           : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A6" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.sheet_add_aoa(ws, [
      ["ESCUELA EXPERIMENTAL DE NIÑOS PARA LA MÚSICA"],
      ["SISTEMA INTEGRADO ADMINISTRATIVO MUSICAL - S.I.A.M."],
      [""], ["LISTA DE ÓRDENES DE COMPRA"], [""],
    ], { origin: "A1" });
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 11 } },
    ];
    ws["!cols"] = [{ wch: 5 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
                   { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
                   { wch: 24 }, { wch: 14 }, { wch: 24 }, { wch: 14 }];
    const fecha = new Date().toLocaleDateString("es-HN");
    XLSX.utils.book_append_sheet(wb, ws, "Ordenes");
    XLSX.writeFile(wb, `Ordenes_Compra_${fecha.replace(/\//g, "-")}.xlsx`);
  };

  // ── Helpers UI ─────────────────────────────────────────────
  const fmtCurrency = (v) =>
    new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2 }).format(v || 0);

  const fmtFecha = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  };

  const estadoBadgeClass = (e) => ({
    BORRADOR: "estado-badge estado-inactivo",
    ENVIADA:  "estado-badge estado-prestamo",
    RECIBIDA: "estado-badge estado-mantenimiento",
    CERRADA:  "estado-badge estado-activo",
  }[e] || "estado-badge");

  const pageNums = () => {
    const nums = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
    return nums;
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="bienes-app">

      {/* ── HEADER ── */}
      <motion.div
        className="mm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      >
        <div className="mm-hi">
          <div className="mm-ht">
            <motion.div
              className="mm-htitle"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <motion.span
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <ShoppingCart size={34} color="white" fill="white" />
              </motion.span>
              Órdenes de Compra
            </motion.div>
          </div>

          <motion.p className="mm-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Gestiona y controla todas las órdenes de compra de manera eficiente
          </motion.p>

          <motion.div className="mm-stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {[
              { ico: <ShoppingCart size={18} color="white" />, val: filteredItems.length,  lbl: filteredItems.length === ordenes.length ? "Total Órdenes" : "Órdenes filtradas" },
              { ico: <Send         size={18} color="white" />, val: metrics.enviada,       lbl: "Enviadas"  },
              { ico: <Package      size={18} color="white" />, val: metrics.recibida,      lbl: "Recibidas" },
              { ico: <DollarSign   size={18} color="white" />, val: `L. ${filteredItems.reduce((s, o) => s + (o.items?.reduce((a, i) => a + i.cantidad * i.costoUnit, 0) || 0), 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, lbl: "Valor Total" },
            ].map((s, i) => (
              <motion.div key={i} className="mm-stat" whileHover={{ scale: 1.04, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className="mm-stat-ico">{s.ico}</div>
                <div>
                  <div className="mm-stat-val">{s.val}</div>
                  <div className="mm-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── BARRA DE ACCIONES ── */}
      <div className="bienes-action-area">
        <div className="bienes-action-bar">
          <div className="bienes-search-wrapper">
            <span className="bienes-search-icon"><Search size={16} /></span>
            <input
              type="text"
              className="bienes-search-input"
              placeholder="Buscar por número, proveedor, estado..."
              value={filterValue}
              onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
            />
            {filterValue && (
              <button className="bienes-search-clear" onClick={() => setFilterValue("")}>×</button>
            )}
          </div>
          <div className="bienes-bar-buttons">
            <button style={S.btn("#E0D9F5", "#6C4FBF")} onClick={() => setMostrarAyuda(true)}>
              <HelpCircle size={15} /> Ayuda
            </button>
            <button style={S.btn("#27AE60")} onClick={handleExportarExcel}>
              <Download size={15} /> Excel
            </button>
            <button style={S.btn("#6C4FBF")} onClick={() => setMostrarModalCrear(true)}>
              <Plus size={15} /> Nueva Orden
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bienes-filters-bar">
          <div className="bienes-filter-group">
            <span className="bienes-filter-label"><Filter size={13} /> Estado:</span>
            <div className="bienes-filter-pills">
              {estadosOptions.map(op => (
                <button
                  key={op.uid}
                  className={`bienes-pill${estadoFiltro === op.uid ? " active" : ""}`}
                  onClick={() => { setEstadoFiltro(op.uid); setPage(1); }}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bienes-filter-group">
            <span className="bienes-filter-label">Fecha orden:</span>
            <div className="bienes-date-range">
              <input type="date" className="bienes-date-input" value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }} title="Desde" />
              <span className="bienes-date-sep">→</span>
              <input type="date" className="bienes-date-input" value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }} title="Hasta" />
              {(fechaDesde || fechaHasta) && (
                <button className="bienes-date-clear"
                  onClick={() => { setFechaDesde(""); setFechaHasta(""); setPage(1); }}>×</button>
              )}
            </div>
          </div>

          {(estadoFiltro !== "all" || fechaDesde || fechaHasta) && (
            <button className="bienes-clear-filters"
              onClick={() => { setEstadoFiltro("all"); setFechaDesde(""); setFechaHasta(""); setPage(1); }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── TABLA ── */}
      <div className="bienes-container">
        <div className="bienes-table-wrapper">
          <div className="bienes-results-info">
            <span>
              Mostrando <strong>{Math.min((page - 1) * ROWS + 1, sortedItems.length)}</strong>–<strong>{Math.min(page * ROWS, sortedItems.length)}</strong> de <strong>{sortedItems.length}</strong> órdenes
              {filterValue && <span className="filtrado-tag"> · filtrado de {ordenes.length}</span>}
            </span>
          </div>

          <div className="bienes-table-scroll">
            <table className="bienes-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.uid}
                      className={col.sortable ? "sortable" : ""}
                      onClick={() => handleSort(col.uid)}
                    >
                      {col.name}
                      {col.sortable && sortDesc.column === col.uid && (
                        <span className="sort-arrow">{sortDesc.direction === "ascending" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="bienes-no-results">
                      <div className="bienes-empty-state">
                        <ShoppingCart size={40} color="#ccc" />
                        <p>No se encontraron órdenes con los filtros actuales</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map(orden => {
                    const total = orden.items?.reduce((s, i) => s + i.cantidad * i.costoUnit, 0) || 0;
                    return (
                      <tr key={orden._id}>
                        <td className="bienes-td-codigo">
                          <span className="codigo-chip">{orden.numero}</span>
                        </td>
                        <td>
                          <div className="bienes-nombre-cell">
                            <div className="nombre">{orden.proveedor_id?.nombre || "Sin proveedor"}</div>
                            {orden.proveedor_id?.empresa && (
                              <div className="descripcion-preview">{orden.proveedor_id.empresa}</div>
                            )}
                          </div>
                        </td>
                        <td className="bienes-td-fecha">{formatFecha(orden.fecha)}</td>
                        <td>
                          <div className="bienes-asignado-cell">
                            <div className="asignado-nombre">{orden.items?.length || 0} ítem(s)</div>
                            <div className="asignado-tipo">
                              {orden.items?.reduce((s, i) => s + i.cantidad, 0) || 0} unidades
                            </div>
                          </div>
                        </td>
                        <td className="bienes-td-valor">{fmtCurrency(total)}</td>
                        <td>
                          <span className={estadoBadgeClass(orden.estado)}>{orden.estado}</span>
                        </td>
                        <td>
                          <div className="bienes-action-buttons">
                            <button
                              className="bienes-btn-icon edit"
                              title="Ver / Editar"
                              onClick={() => setOrdenSeleccionada(orden)}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              className="bienes-btn-icon delete"
                              title="Eliminar"
                              onClick={() => handleEliminarOrden(orden._id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="bienes-pagination">
            <div className="bienes-pagination-info">Página <strong>{page}</strong> de <strong>{pages}</strong></div>
            <div className="bienes-pagination-controls">
              <button className="bienes-page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="bienes-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {pageNums().map(n => (
                <button key={n} className={`bienes-page-btn${page === n ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="bienes-page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
              <button className="bienes-page-btn" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales CRUD ── */}
      {mostrarModalCrear && (
        <ModalCrearOrden
          onClose={() => setMostrarModalCrear(false)}
          onCreate={handleCrearOrden}
          proveedores={proveedores}
        />
      )}

      {ordenSeleccionada && (
        <ModalDetalleOrden
          orden={ordenSeleccionada}
          onClose={() => setOrdenSeleccionada(null)}
          onUpdate={handleEditarOrden}
          onDelete={handleEliminarOrden}
          proveedores={proveedores}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          message={`¿Seguro que deseas eliminar la orden "${ordenAEliminar?.numero}"?`}
          onConfirm={confirmarEliminacion}
          onCancel={() => { setShowConfirm(false); setOrdenAEliminar(null); }}
          visible={showConfirm}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ── Modal Ayuda ── */}
      {mostrarAyuda && (
        <div className="bienes-modal-overlay">
          <div className="bienes-modal sm">
            <div className="bienes-modal-header">
              <h3 className="bienes-modal-title"><ShoppingCart size={20} /> Ayuda – Órdenes de Compra</h3>
              <button className="bienes-modal-close" onClick={() => setMostrarAyuda(false)}>✕</button>
            </div>
            <div className="bienes-modal-body">
              <div className="bienes-help-section">
                <div className="bienes-help-title">Funcionalidades principales</div>
                <ul className="bienes-help-list">
                  <li><strong>Número autogenerado:</strong> Formato ORD-000001</li>
                  <li><strong>Proveedor:</strong> Selecciona de la lista de proveedores activos</li>
                  <li><strong>Ítems:</strong> Agrega y edita productos con cantidad y costo unitario</li>
                  <li><strong>PDF:</strong> Descarga la orden en formato PDF</li>
                  <li><strong>Auditoría:</strong> Registro de quién creó y modificó cada orden</li>
                  <li><strong>Excel:</strong> Exporta el listado completo con datos de auditoría</li>
                </ul>
              </div>
              <div className="bienes-help-section">
                <div className="bienes-help-title">Estados de órdenes</div>
                <div className="bienes-estados-grid">
                  {[
                    { label: "BORRADOR – En proceso de elaboración" },
                    { label: "ENVIADA – Enviada al proveedor"       },
                    { label: "RECIBIDA – Mercancía recibida"        },
                    { label: "CERRADA – Proceso finalizado"         },
                  ].map((s, i) => (
                    <div key={i} className="bienes-estado-item">{s.label}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bienes-modal-footer">
              <button style={S.btn("#6C4FBF")} onClick={() => setMostrarAyuda(false)}>
                Cerrar Ayuda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdenCompra;