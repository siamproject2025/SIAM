// ============================================================
// Bienes.js — Módulo de Gestión de Bienes / Activos
// CORRECCIONES:
// #1 — Campo asignado_a + tipo_asignacion
// #2 — fecha_entrada y fecha_salida
// #3 — Código autogenerado (sin campo manual)
// #4 — Categorías paramétricas desde API
// ============================================================
import React, { useEffect, useState, useMemo, useRef } from "react";
import ModalCrearBien from "./ModalCrearBien";
import ModalDetalleBien from "./ModalDetalleBien";
import Notification from "../../../components/Notification";
import * as XLSX from "xlsx";
import "../../../styles/Models/Bienes.css";
import { auth } from "../../../components/authentication/Auth";
import { loadingController } from "../../../api/loadingController";
import { motion, AnimatePresence } from 'framer-motion';
import {
   DollarSign, Search, HelpCircle, Plus,
  CheckCircle, Wrench, XCircle, Share2, Edit,
  Filter, Download, Trash2,
  Package, 
  UserPlus
} from 'lucide-react';
import WithPermission from "../../../components/Permisos/WithPermission";

const API_URL        = process.env.REACT_APP_API_URL + "/api/bienes";
const API_CATALOGOS  = process.env.REACT_APP_API_URL + "/api/catalogos";

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const S = {
  sec:   { marginBottom: 24 },
  title: { display:'flex', alignItems:'center', gap:8, fontFamily:'Poppins,sans-serif', fontSize:'.88rem', fontWeight:700, color:'#6C4FBF', marginBottom:12, paddingBottom:8, borderBottom:'2px solid #E0D9F5' },
  grid:  { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:13 },
  full:  { gridColumn:'1/-1' },
  field: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:'.77rem', fontWeight:700, color:'#7A6FA0', textTransform:'uppercase', letterSpacing:'.04em' },
  req:   { color:'#E74C3C' },
  inp:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:e?'#FFF8F8':'#FAF9FF', outline:'none', width:'100%', transition:'border-color .2s' }),
  inpRO: { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#6C4FBF', fontWeight:700, background:'#F0ECFF', outline:'none', width:'100%' },
  sel:   (e) => ({ padding:'9px 12px', border:`2px solid ${e?'#E74C3C':'#E0D9F5'}`, borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%' }),
  ta:    { padding:'9px 12px', border:'2px solid #E0D9F5', borderRadius:8, fontFamily:'inherit', fontSize:'.88rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%', resize:'vertical', minHeight:90 },
  errMsg:{ fontSize:'.73rem', color:'#E74C3C', fontWeight:600 },
  banner:{ display:'flex', gap:10, alignItems:'flex-start', padding:'11px 14px', borderRadius:10, marginBottom:14, fontSize:'.85rem', background:'#FDE8E8', borderLeft:'4px solid #E74C3C', color:'#7a1010' },
  info:  { display:'flex', gap:10, alignItems:'flex-start', padding:'10px 14px', borderRadius:9, marginBottom:12, fontSize:'.84rem', background:'#E8F4FD', borderLeft:'4px solid #2980B9', color:'#0c4a6e' },
  foot:  { display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid #E0D9F5', marginTop:8 },
  btn:   (bg, col='#fff') => ({ display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, fontSize:'.86rem', fontWeight:700, border:'none', cursor:'pointer', background:bg, color:col, fontFamily:'inherit', transition:'all .18s' }),
  upload:{ border:'2px dashed #C4B5E8', borderRadius:12, padding:'26px 20px', textAlign:'center', background:'#FAF9FF' },
  card:  { background:'#F4F3FB', border:'1px solid #E0D9F5', borderRadius:12, padding:'14px 16px', marginBottom:12, position:'relative' },
  cardTitle: { fontFamily:'Poppins,sans-serif', fontSize:'.82rem', fontWeight:700, color:'#6C4FBF', marginBottom:10, display:'flex', alignItems:'center', gap:6 },
  delBtn:{ position:'absolute', top:10, right:10, background:'#FDE8E8', color:'#E74C3C', border:'none', borderRadius:7, padding:'5px 8px', cursor:'pointer', fontSize:'.8rem', fontWeight:700, display:'flex', alignItems:'center', gap:4 },
};

const columns = [
  { name: "CÓDIGO",     uid: "codigo",        sortable: true  },
  { name: "NOMBRE",     uid: "nombre",        sortable: true  },
  { name: "CATEGORÍA",  uid: "categoria",     sortable: true  },
  { name: "ASIGNADO A", uid: "asignado_a",    sortable: false },
  { name: "VALOR",      uid: "valor",         sortable: true  },
  { name: "F. ENTRADA", uid: "fecha_entrada", sortable: true  },
  { name: "ESTADO",     uid: "estado",        sortable: true  },
  { name: "ACCIONES",   uid: "acciones",      sortable: false },
];

const estadosOptions = [
  { name: "Todos",         uid: "all"          },
  { name: "Activo",        uid: "ACTIVO"       },
  { name: "Mantenimiento", uid: "MANTENIMIENTO"},
  { name: "Inactivo",      uid: "INACTIVO"     },
  { name: "Préstamo",      uid: "PRESTAMO"     },
];

const ROWS = 15;

const Bienes = () => {
  const [bienes,               setBienes]               = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [bienSeleccionado,     setBienSeleccionado]     = useState(null);
  const [filterValue,          setFilterValue]          = useState("");
  const [estadoFiltro,         setEstadoFiltro]         = useState("all");
  const [categoriaFiltro,      setCategoriaFiltro]      = useState("all");
  const [sortDesc,             setSortDesc]             = useState({ column: "codigo", direction: "ascending" });
  const [page,                 setPage]                 = useState(1);
  const [mostrarModalCrear,    setMostrarModalCrear]    = useState(false);
  const [notification,         setNotification]         = useState(null);
  const [showEstadoMenu,       setShowEstadoMenu]       = useState(false);
  const [showCategoriaMenu,    setShowCategoriaMenu]    = useState(false);
  const [mostrarAyuda,         setMostrarAyuda]         = useState(false);
  const [fechaDesde,           setFechaDesde]           = useState("");
  const [fechaHasta,           setFechaHasta]           = useState("");
  const [bienesSeleccionados,  setBienesSeleccionados]  = useState([]);
  // Junto a los demás useState
const [tiposAsignacion, setTiposAsignacion] = useState([]);

  const estadoMenuRef    = useRef(null);
  const categoriaMenuRef = useRef(null);

  // ── Carga inicial ─────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      try {
        loadingController.start();
        const token = await auth.currentUser?.getIdToken(true);
        const res   = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Error al obtener bienes");
        setBienes(await res.json());
      } catch (err) { console.error(err); }
      finally { loadingController.stop(); }
    };
    cargar();
  }, []);

  useEffect(() => {
  const cargarCatalogos = async () => {
    try {

      const resCat = await fetch(`${API_CATALOGOS}/bienes/categoria`);
      
      // Si el backend devuelve un 404 o 500, forzamos el error
      if (!resCat.ok) {
        throw new Error(`Error HTTP: ${resCat.status} - ${resCat.statusText}`);
      }

      const dataCat = await resCat.json();

      // Adaptación: Verificamos si el backend devuelve un array directo o un objeto con .data
      const categoriasArray = Array.isArray(dataCat) ? dataCat : dataCat.data;

      // Si dataCat.ok no existe (porque tu backend no lo manda), omitimos esa validación
      if (categoriasArray && categoriasArray.length > 0) {
        setCategoriasDisponibles(
          categoriasArray.map(item => ({
            valor:    item.valor,
            etiqueta: item.etiqueta || item.valor,
          }))
        );
      }

      // ── Tipos de asignación ──────────────────────────────
      const resTipo = await fetch(`${API_CATALOGOS}/bienes/tipo_asignacion`);
      if (!resTipo.ok) throw new Error(`Error HTTP (Tipos): ${resTipo.status}`);
      
      const dataTipo = await resTipo.json();
      const tiposArray = Array.isArray(dataTipo) ? dataTipo : dataTipo.data;

      if (tiposArray && tiposArray.length > 0) {
        setTiposAsignacion(
          tiposArray.map(item => ({
            valor:    item.valor,
            etiqueta: item.etiqueta || item.valor,
          }))
        );
      }
      
    } catch (err) {
      // AQUÍ VERÁS EXACTAMENTE QUÉ ESTÁ FALLANDO
      
      setCategoriasDisponibles([
        { _id: "EQUIPO_COMPUTO",   nombre: "Equipo de Cómputo",  grupo: "General" },
        { _id: "MOBILIARIO",       nombre: "Mobiliario",         grupo: "General" },
        // ... resto de tu fallback
      ]);
      setTiposAsignacion([
        { valor: "Persona",     etiqueta: "Persona"     },
        { valor: "Área",        etiqueta: "Área"        },
        // ... resto de tu fallback
      ]);
    }
  };

  cargarCatalogos();
}, []);

  const getLocalDate = (utcDate) => {
  if (!utcDate) return "";
  const date = new Date(utcDate);
  // Ajustar a GMT-6 (Honduras)
  const offsetMs = -6 * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + offsetMs);
  return localDate.toISOString().split('T')[0];
};

  // Cierre de dropdowns al click fuera
  useEffect(() => {
    const fn = (e) => {
      if (estadoMenuRef.current    && !estadoMenuRef.current.contains(e.target))    setShowEstadoMenu(false);
      if (categoriaMenuRef.current && !categoriaMenuRef.current.contains(e.target)) setShowCategoriaMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ── Métricas + filtrado ───────────────────────────────────
  const { filteredItems, metrics } = useMemo(() => {
    let f = [...bienes];
    if (filterValue) {
      const q = filterValue.toLowerCase();
      f = f.filter((b) =>
        b.codigo?.toLowerCase().includes(q)      ||
        b.nombre?.toLowerCase().includes(q)      ||
        b.categoria?.toLowerCase().includes(q)   ||
        b.descripcion?.toLowerCase().includes(q) ||
        b.asignado_a?.toLowerCase().includes(q)
      );
    }
    if (estadoFiltro !== "all") f = f.filter((b) => b.estado?.toUpperCase() === estadoFiltro);
    if (categoriaFiltro !== "all") f = f.filter((b) => b.categoria === categoriaFiltro);
    if (fechaDesde) f = f.filter((b) => { const s = (b.fechaIngreso || b.fecha_creacion || "").slice(0,10); return s >= fechaDesde; });
    if (fechaHasta) f = f.filter((b) => { const s = (b.fechaIngreso || b.fecha_creacion || "").slice(0,10); return s <= fechaHasta; });

    return {
      filteredItems: f,
      metrics: {
        activos:      bienes.filter((b) => b.estado?.toUpperCase() === "ACTIVO").length,
        mantenimiento:bienes.filter((b) => b.estado?.toUpperCase() === "MANTENIMIENTO").length,
        inactivos:    bienes.filter((b) => b.estado?.toUpperCase() === "INACTIVO").length,
        prestados:    bienes.filter((b) => b.estado?.toUpperCase() === "PRESTAMO").length,
        total:        bienes.length,
      },
    };
  }, [bienes, filterValue, estadoFiltro, categoriaFiltro, fechaDesde, fechaHasta]);

  const valorTotal = bienes.reduce((s, b) => s + (parseFloat(b.valor) || 0), 0);

  // ── Ordenamiento + paginación ─────────────────────────────
  const sortedItems = useMemo(() => {
    if (!sortDesc.column) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      let x = sortDesc.column === "valor" ? Number(a.valor) || 0 : a[sortDesc.column];
      let y = sortDesc.column === "valor" ? Number(b.valor) || 0 : b[sortDesc.column];
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
    const col = columns.find((c) => c.uid === uid);
    if (!col?.sortable) return;
    setSortDesc((p) => ({
      column: uid,
      direction: p.column === uid && p.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── CRUD ──────────────────────────────────────────────────
  const handleCrearBien = async (nuevo) => {
    try {
      loadingController.start();
      if (!nuevo.nombre?.trim())             { showNotification("El nombre es obligatorio", "error");      return; }
      if (!nuevo.categoria)                  { showNotification("Seleccione una categoría", "error");      return; }
      if (!nuevo.estado)                     { showNotification("Seleccione un estado", "error");          return; }
      if (!nuevo.valor || nuevo.valor <= 0)  { showNotification("El valor debe ser mayor a 0", "error");  return; }

      const token = await auth.currentUser?.getIdToken(true);
      const fd = new FormData();
      for (const k in nuevo) {
        if (k === "imagen" && nuevo[k]) fd.append("imagen", nuevo[k]);
        else if (k !== "foto_preview")  fd.append(k, nuevo[k]);
      }
      const res = await fetch(API_URL, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      const { data } = await res.json();
      setBienes((p) => [...p, data]);
      setMostrarModalCrear(false);
      showNotification(`Bien "${data.nombre}" creado exitosamente`, "success");
    } catch (err) { showNotification(err.message || "Error al crear el bien", "error"); }
    finally { loadingController.stop(); }
  };

 const handleEditarBien = async (id, actualizado) => {
  try {
    loadingController.start();


    let datosParaValidar = actualizado;
    
    if (actualizado instanceof FormData) {
      datosParaValidar = Object.fromEntries(actualizado);
    }

    if (!datosParaValidar.nombre?.toString().trim()) {
      showNotification("El nombre es obligatorio", "error");
      loadingController.stop();
      return;
    }
    if (!datosParaValidar.categoria) {
      showNotification("Seleccione una categoría", "error");
      loadingController.stop();
      return;
    }
    if (!datosParaValidar.estado) {
      showNotification("Seleccione un estado", "error");
      loadingController.stop();
      return;
    }
    if (!datosParaValidar.valor || parseFloat(datosParaValidar.valor) <= 0) {
      showNotification("El valor debe ser mayor a 0", "error");
      loadingController.stop();
      return;
    }

    const token = await auth.currentUser?.getIdToken(true);
    
    // Determinar si es FormData o JSON
    let body;
    let headers = { Authorization: `Bearer ${token}` };

    if (actualizado instanceof FormData) {
      body = actualizado;
    } else {
      body = JSON.stringify(actualizado);
      headers['Content-Type'] = 'application/json';
    }


    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers,
      body
    });

    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.message);
    }

    const { data } = await res.json();
    setBienes((p) => p.map((b) => (b._id === data._id ? data : b)));
    setBienSeleccionado(null);
    showNotification(`Bien "${data.nombre}" actualizado exitosamente`, "success");
  } catch (err) {
    showNotification(err.message || "Error al editar el bien", "error");
  } finally {
    loadingController.stop();
  }
};

  const handleEliminarBien = async (id) => {
    const nombre = bienes.find((b) => b._id === id)?.nombre;
    try {
      loadingController.start();
      const token = await auth.currentUser?.getIdToken(true);
      const res   = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
      setBienes((p) => p.filter((b) => b._id !== id));
      setBienSeleccionado(null);
      showNotification(`Bien "${nombre}" eliminado exitosamente`, "success");
    } catch (err) { showNotification(err.message || "Error al eliminar el bien", "error"); }
    finally { loadingController.stop(); }
  };

  // ── Excel ─────────────────────────────────────────────────
  const handleExportarExcel = () => {
    if (filteredItems.length === 0) { showNotification("No hay bienes para exportar.", "error"); return; }
    const data = filteredItems.map((b, i) => ({
      "N°": i + 1, Código: b.codigo, Nombre: b.nombre, Categoría: b.categoria,
      "Asignado A": b.asignado_a || "—", Descripción: b.descripcion,
      "Valor (Lps)": Number(b.valor).toLocaleString("es-HN"),
      "Fecha Entrada": b.fecha_entrada ? fmtFechaLocal(b.fecha_entrada) : "—",
      "Fecha Salida":  b.fecha_salida  ? fmtFechaLocal(b.fecha_salida)  : "—",
      Estado: b.estado,
    }));
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A6" });
    const wb = XLSX.utils.book_new();
    XLSX.utils.sheet_add_aoa(ws, [
      ["ESCUELA EXPERIMENTAL DE NIÑOS PARA LA MÚSICA"],
      ["SISTEMA INTEGRADO ADMINISTRATIVO MUSICAL - S.I.A.M."],
      [""], ["LISTA DE BIENES"], [""],
    ], { origin: "A1" });
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } },
    ];
    ws["!cols"] = [{ wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 35 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    const fecha = new Date().toLocaleDateString("es-HN");
    XLSX.utils.book_append_sheet(wb, ws, "Bienes");
    XLSX.writeFile(wb, `Lista_de_Bienes_${fecha.replace(/\//g, "-")}.xlsx`);
  };

  // ── Helpers UI ────────────────────────────────────────────
  const fmtCurrency = (v) =>
    new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2 }).format(v || 0);

  // Parsea fechas ISO sin desplazamiento de zona horaria (UTC-6 Honduras)
  // "2026-03-12T00:00:00.000Z" -> toma solo YYYY-MM-DD y lo muestra tal cual
  const fmtFechaLocal = (isoStr) => {
    if (!isoStr || isoStr === "null") return "—";
    const part = (typeof isoStr === "string" ? isoStr : new Date(isoStr).toISOString()).slice(0, 10);
    const [y, m, d] = part.split("-");
    return `${d}/${m}/${y}`;
  };

  const estadoBadgeClass = (e) => ({
    ACTIVO: "estado-badge estado-activo",
    MANTENIMIENTO: "estado-badge estado-mantenimiento",
    INACTIVO: "estado-badge estado-inactivo",
    PRESTAMO: "estado-badge estado-prestamo",
  }[e] || "estado-badge");

  const pageNums = () => {
    const nums = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
    return nums;
  };

  const statPills = [
    { label: "En Uso",        value: metrics.activos,       filter: "ACTIVO"        },
    { label: "Mantenimiento", value: metrics.mantenimiento, filter: "MANTENIMIENTO" },
    { label: "Inactivos",     value: metrics.inactivos,     filter: "INACTIVO"      },
    { label: "Prestados",     value: metrics.prestados,     filter: "PRESTAMO"      },
    { label: "Total",         value: metrics.total,         filter: "all"           },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="bienes-app">

     {/* HEADER - Estilo Gestión de Estudiantes */}
      {/* HEADER - EXACTAMENTE IGUAL AL DE GESTIÓN DE ESTUDIANTES */}
        <motion.div 
    className="mm-header"
    initial={{opacity:0, y:-20}} 
    animate={{opacity:1, y:0}}
    transition={{duration:0.5, type:'spring', stiffness:120}}
  >
    <div className="mm-hi">
      <div className="mm-ht">
        <motion.div 
          className="mm-htitle"
          initial={{opacity:0, x:-30}} 
          animate={{opacity:1, x:0}} 
          transition={{delay:0.15}}
        >
          <motion.span 
            initial={{rotate:-180, scale:0}} 
            animate={{rotate:0, scale:1}}
            transition={{type:'spring', stiffness:200, delay:0.2}}
          >
            <Package size={34} color="white" fill="white"/>
          </motion.span>
          Sistema de Bienes
        </motion.div>
        
        {/* Botón Grados - si no lo necesitas, puedes comentarlo */}
        {/* <motion.button className="mm-btn-grados" onClick={()=>navigate('/grados')}
          initial={{opacity:0, x:30}} animate={{opacity:1, x:0}} transition={{delay:0.25}}
          whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
          <IcoBooks/> Grados
        </motion.button> */}
      </div>
      
      <motion.p 
        className="mm-sub" 
        initial={{opacity:0}} 
        animate={{opacity:1}} 
        transition={{delay:0.3}}
      >
        Gestiona y controla todos tus bienes de manera eficiente
      </motion.p>
      
      <motion.div 
        className="mm-stats"
        initial={{opacity:0, y:16}} 
        animate={{opacity:1, y:0}} 
        transition={{delay:0.35}}
      >
        {[
          {ico:<Package size={18} color="white"/>, val:filteredItems.length, lbl: filteredItems.length === bienes.length ? 'Total Bienes' : `Bienes filtrados`},
          {ico:<CheckCircle size={18} color="white"/>, val:filteredItems.filter(b => b.estado?.toUpperCase() === 'ACTIVO').length, lbl:'Activos'},
          {ico:<UserPlus size={18} color="white"/>, val:filteredItems.filter(b => {
            const treintaDias = new Date();
            treintaDias.setDate(treintaDias.getDate() - 30);
            return new Date(b.fecha_creacion || b.createdAt) > treintaDias;
          }).length, lbl:'Nuevos (30 días)'},
          {ico:<DollarSign size={18} color="white"/>, val:`L. ${filteredItems.reduce((total, b) => total + (parseFloat(b.valor) || 0), 0).toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})}`, lbl:'Valor Total'},
        ].map((s,i)=>(
          <motion.div key={i} className="mm-stat"
            whileHover={{scale:1.04, y:-2}} transition={{type:'spring', stiffness:300}}>
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
        {/* Fila 1: búsqueda + botones principales */}
        <div className="bienes-action-bar">
          <div className="bienes-search-wrapper">
            <span className="bienes-search-icon"><Search size={16} /></span>
            <input
              type="text"
              className="bienes-search-input"
              placeholder="Buscar por código, nombre, categoría, asignado a..."
              value={filterValue}
              onChange={(e) => { setFilterValue(e.target.value); setPage(1); }}
            />
            {filterValue && (
              <button className="bienes-search-clear" onClick={() => setFilterValue("")}>×</button>
            )}
          </div>
          <div className="bienes-bar-buttons">
            {bienesSeleccionados.length > 0 && (
              <button
               type="button" style={S.btn('#E74C3C')}
                onClick={() => {
                  
                    bienesSeleccionados.forEach(id => handleEliminarBien(id));
                    setBienesSeleccionados([]);
                 
                }}
              >
                <Trash2 size={15} /> Eliminar ({bienesSeleccionados.length})
              </button>
            )}
            <button style={S.btn('#E0D9F5','#6C4FBF')} onClick={() => setMostrarAyuda(true)}>
              <HelpCircle size={15} /> Ayuda
            </button>
            <button style={S.btn('#27AE60')} onClick={handleExportarExcel}>
              <Download size={15} /> Excel
            </button>
              <WithPermission requiredPermissions={["CREAR_BIENES"]}>
            <button style={S.btn('#6C4FBF')} onClick={() => setMostrarModalCrear(true)}>
              <Plus size={15} /> Nuevo Bien
            </button>
            </WithPermission>
          </div>
        </div>

        {/* Fila 2: filtros de estado, categoría y fechas */}
        <div className="bienes-filters-bar">
          {/* Filtro Estado — pills */}
          <div className="bienes-filter-group">
            <span className="bienes-filter-label"><Filter size={13}/> Estado:</span>
            <div className="bienes-filter-pills">
              {estadosOptions.map((op) => (
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

          {/* Filtro Categoría — dropdown mejorado */}
          <div className="bienes-filter-group">
            <span className="bienes-filter-label">Categoría:</span>
            <div className="bienes-dropdown-wrapper" ref={categoriaMenuRef}>
              <button
                className={`bienes-filter-select${categoriaFiltro !== "all" ? " has-value" : ""}`}
                onClick={() => setShowCategoriaMenu(!showCategoriaMenu)}
              >
                {categoriaFiltro === "all"
                  ? "Todas las categorías"
                  : categoriasDisponibles.find(c => c.valor === categoriaFiltro)?.etiqueta || categoriaFiltro}
                <ChevronDown />
              </button>
              {showCategoriaMenu && (
                <div className="bienes-dropdown-menu scrollable">
                  <div
                    className={`bienes-dropdown-item${categoriaFiltro === "all" ? " active" : ""}`}
                    onClick={() => { setCategoriaFiltro("all"); setShowCategoriaMenu(false); setPage(1); }}
                  >
                    {categoriaFiltro === "all" && <span className="chk">✓</span>} Todas
                  </div>
                  {categoriasDisponibles.map((cat) => (
                    <div
                      key={cat.valor}
                      className={`bienes-dropdown-item${categoriaFiltro === cat.valor ? " active" : ""}`}
                      onClick={() => { setCategoriaFiltro(cat.valor); setShowCategoriaMenu(false); setPage(1); }}
                    >
                      {categoriaFiltro === cat.valor && <span className="chk">✓</span>} {cat.etiqueta}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filtro de fechas */}
          <div className="bienes-filter-group">
            <span className="bienes-filter-label">Fecha entrada:</span>
            <div className="bienes-date-range">
              <input
                type="date"
                className="bienes-date-input"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
                title="Desde"
              />
              <span className="bienes-date-sep">→</span>
              <input
                type="date"
                className="bienes-date-input"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
                title="Hasta"
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  className="bienes-date-clear"
                  onClick={() => { setFechaDesde(""); setFechaHasta(""); setPage(1); }}
                  title="Limpiar fechas"
                >×</button>
              )}
            </div>
          </div>

          {/* Contador activo de filtros */}
          {(estadoFiltro !== "all" || categoriaFiltro !== "all" || fechaDesde || fechaHasta) && (
            <button
              className="bienes-clear-filters"
              onClick={() => { setEstadoFiltro("all"); setCategoriaFiltro("all"); setFechaDesde(""); setFechaHasta(""); setPage(1); }}
            >
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
              Mostrando <strong>{Math.min((page - 1) * ROWS + 1, sortedItems.length)}</strong>–<strong>{Math.min(page * ROWS, sortedItems.length)}</strong> de <strong>{sortedItems.length}</strong> bienes
              {filterValue && <span className="filtrado-tag"> · filtrado de {bienes.length}</span>}
            </span>
            {bienesSeleccionados.length > 0 && (
              <span className="seleccionados-info">{bienesSeleccionados.length} seleccionado(s)</span>
            )}
          </div>

          <div className="bienes-table-scroll">
            <table className="bienes-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>
                    <input
                      type="checkbox"
                      className="bienes-checkbox"
                      checked={currentItems.length > 0 && currentItems.every(b => bienesSeleccionados.includes(b._id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBienesSeleccionados(prev => [...new Set([...prev, ...currentItems.map(b => b._id)])]);
                        } else {
                          setBienesSeleccionados(prev => prev.filter(id => !currentItems.map(b => b._id).includes(id)));
                        }
                      }}
                    />
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.uid}
                      className={`${col.sortable ? "sortable" : ""}${col.uid === "valor" ? " th-right" : ""}`}
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
                    <td colSpan={columns.length + 1} className="bienes-no-results">
                      <div className="bienes-empty-state">
                        <Package size={40} color="#ccc" />
                        <p>No se encontraron bienes con los filtros actuales</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((bien) => (
                    <tr key={bien._id} className={bienesSeleccionados.includes(bien._id) ? "row-selected" : ""}>
                      <td>
                        <input
                          type="checkbox"
                          className="bienes-checkbox"
                          checked={bienesSeleccionados.includes(bien._id)}
                          onChange={(e) => {
                            if (e.target.checked) setBienesSeleccionados(p => [...p, bien._id]);
                            else setBienesSeleccionados(p => p.filter(id => id !== bien._id));
                          }}
                        />
                      </td>
                      <td className="bienes-td-codigo">
                        <span className="codigo-chip">{bien.codigo}</span>
                      </td>

                      <td>
                        <div className="bienes-nombre-cell">
                          <div className="nombre">{bien.nombre}</div>
                          {bien.descripcion && (
                            <div className="descripcion-preview">
                              {bien.descripcion.slice(0, 45)}{bien.descripcion.length > 45 ? "…" : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="bienes-categoria-badge">{bien.categoria?.replace(/_/g, " ")}</span>
                      </td>

                      <td>
                        {bien.asignado_a ? (
                          <div className="bienes-asignado-cell">
                            <div className="asignado-nombre">{bien.asignado_a}</div>
                            {bien.tipo_asignacion && (
                              <div className="asignado-tipo">{bien.tipo_asignacion}</div>
                            )}
                          </div>
                        ) : (
                          <span className="bienes-sin-asignar">—</span>
                        )}
                      </td>

                      <td className="bienes-td-valor">{fmtCurrency(bien.valor)}</td>

                      <td className="bienes-td-fecha">
                        {bien.fechaIngreso
                          ? fmtFechaLocal(bien.fechaIngreso)
                          : bien.fecha_entrada
                          ? fmtFechaLocal(bien.fecha_entrada)
                          : "—"}
                      </td>

                      <td>
                        <span className={estadoBadgeClass(bien.estado)}>{bien.estado}</span>
                      </td>

                      <td>
                        <div className="bienes-action-buttons">
                          
                          <WithPermission requiredPermissions={["ACTUALIZAR_BIENES"]}>
                          <button
                            className="bienes-btn-icon edit"
                            title="Editar"
                            onClick={() => setBienSeleccionado(bien)}
                          >
                            <Edit size={15} />
                          </button>
                          </WithPermission>
                            <WithPermission requiredPermissions={["ELIMINAR_BIENES"]}>
                          <button
                            className="bienes-btn-icon delete"
                            title="Eliminar"
                            onClick={() => {
                              if (window.confirm(`¿Eliminar "${bien.nombre}"?`)) handleEliminarBien(bien._id);
                            }}
                          >
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                          </WithPermission>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="bienes-pagination">
            <div className="bienes-pagination-info">Página <strong>{page}</strong> de <strong>{pages}</strong></div>
            <div className="bienes-pagination-controls">
              <button className="bienes-page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
              <button className="bienes-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {pageNums().map((n) => (
                <button key={n} className={`bienes-page-btn${page === n ? " active" : ""}`} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="bienes-page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
              <button className="bienes-page-btn" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Modales CRUD ── */}
      {mostrarModalCrear && (
        <ModalCrearBien
  onClose={() => setMostrarModalCrear(false)}
  onCreate={handleCrearBien}
  categoriasDisponibles={categoriasDisponibles}
  tiposAsignacionDisponibles={tiposAsignacion}   // ← nuevo
/>
      )}

      {bienSeleccionado && (
        <ModalDetalleBien
  bien={bienSeleccionado}
  onClose={() => setBienSeleccionado(null)}
  onUpdate={handleEditarBien}
  onDelete={handleEliminarBien}
  categoriasDisponibles={categoriasDisponibles}
  tiposAsignacionDisponibles={tiposAsignacion}   // ← nuevo
/>
      )}

      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      {/* ── Modal Ayuda ── */}
      {mostrarAyuda && (
        <div className="bienes-modal-overlay">
          <div className="bienes-modal sm">
            <div className="bienes-modal-header">
              <h3 className="bienes-modal-title"><Package size={20} /> Ayuda – Sistema de Bienes</h3>
              <button className="bienes-modal-close" onClick={() => setMostrarAyuda(false)}>✕</button>
            </div>
            <div className="bienes-modal-body">

              <div className="bienes-help-section">
                <div className="bienes-help-title"> Funcionalidades principales</div>
                <ul className="bienes-help-list">
                  <li><strong>Código autogenerado:</strong> Formato BIEN-YYYY-XXXX, sin ingreso manual</li>
                  <li><strong>Asignación:</strong> Registra persona, aula o departamento responsable</li>
                  <li><strong>Fechas:</strong> Controla la antigüedad con fecha de entrada y salida</li>
                  <li><strong>Categorías dinámicas:</strong> Administrables desde la API</li>
                  <li><strong>Filtros:</strong> Por estado, categoría y búsqueda libre</li>
                  <li><strong>Exportar Excel:</strong> Incluye todos los campos del inventario</li>
                </ul>
              </div>

              <div className="bienes-help-section">
                <div className="bienes-help-title"> Estados de bienes</div>
                <div className="bienes-estados-grid">
                  {[
                    { icon: <CheckCircle size={14} color="var(--bienes-success)" />, label: "ACTIVO – En uso y disponible"    },
                    { icon: <Wrench      size={14} color="var(--bienes-warning)" />, label: "MANTENIMIENTO – En reparación"   },
                    { icon: <XCircle     size={14} color="var(--bienes-danger)"  />, label: "INACTIVO – No disponible"        },
                    { icon: <Share2      size={14} color="var(--bienes-info)"    />, label: "PRÉSTAMO – Prestado a terceros"  },
                  ].map((s, i) => (
                    <div key={i} className="bienes-estado-item">{s.icon} {s.label}</div>
                  ))}
                </div>
              </div>

            </div>
            <div className="bienes-modal-footer">
              <button className="bienes-btn bienes-btn-primary" onClick={() => setMostrarAyuda(false)}>
                Cerrar Ayuda
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Bienes;