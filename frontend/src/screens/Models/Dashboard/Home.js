import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, PieChart, Pie, Legend, LineChart, Line
} from "recharts";
import { auth } from "../../../components/authentication/Auth";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import {
  Users, ShoppingCart, Package, BookOpen, Calendar,
  TrendingUp, Download, UserCheck, Award, AlertCircle,
  DollarSign, Activity, Loader2, RotateCcw
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../styles/Home.css";
import imageLogo from "../../../assets/login.png";

const API_URL = process.env.REACT_APP_API_URL;
const COLORS = ["#7c6ff7", "#4a7cf5", "#9b5ff5", "#d95f91", "#2baa8a", "#e07d35"];

/* ── Utilidades de fecha GMT-6 (Honduras) ── */
const toHN = (date) => {
  const d = new Date(date);
  const hnOffset = -360;
  const localOffset = d.getTimezoneOffset();
  const diff = (localOffset - hnOffset) * 60 * 1000;
  return new Date(d.getTime() + diff);
};

const startOfDayHN = (date) => {
  const d = toHN(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDayHN = (date) => {
  const d = toHN(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const parseDate = (val) => {
  if (!val) return null;
  if (val.$date) return new Date(val.$date);
  return new Date(val);
};

/* ── Utilidad segura para arrays ── */
const safe = (arr) => (Array.isArray(arr) ? arr : []);
const safeLen = (arr) => safe(arr).length;

const extractData = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  for (const k of ["data", "items", "results", "datos", "registros", "users"]) {
    if (Array.isArray(res[k])) return res[k];
  }
  return [];
};

/* ── Calcular monto total de una orden de compra ── */
const montoOrden = (compra) =>
  safe(compra?.items).reduce((s, i) => s + (i.cantidad || 0) * (i.costoUnit || 0), 0);

/* ── Nombre del mes en español ── */
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

/* ── Parsear fecha manual dd/MM/yyyy ── */
const parseDateManual = (str) => {
  if (!str) return null;
  const parts = str.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const d = new Date(`${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export default function Home() {
  const [rawData, setRawData] = useState({
    compras: [], bienes: [], libros: [], actividades: [],
    alumnos: [], donaciones: [], personal: [], directiva: [],
    proveedores: [], grados: [], horarios: []
  });
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [exportType, setExportType] = useState(null);

  /* Rango por defecto: primer día del mes actual hasta hoy, en GMT-6 */
  const getDefaultInicio = () =>
    startOfDayHN(new Date(new Date().getFullYear(), 0, 1));
  const getDefaultFin = () => endOfDayHN(new Date());

  const [fechaInicio, setFechaInicio] = useState(getDefaultInicio);
  const [fechaFin, setFechaFin]       = useState(getDefaultFin);

  /* ── Reset fechas al mes actual ── */
  const resetFechas = () => {
    setFechaInicio(getDefaultInicio());
    setFechaFin(getDefaultFin());
  };

  /* ── Carga de datos ── */
  useEffect(() => {
    const fetch = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const h = { Authorization: `Bearer ${token}` };

        const rs = await Promise.allSettled([
          axios.get(`${API_URL}/api/compras`,    { headers: h }),
          axios.get(`${API_URL}/api/bienes`,     { headers: h }),
          axios.get(`${API_URL}/api/biblioteca`, { headers: h }),
          axios.get(`${API_URL}/api/actividades`,{ headers: h }),
          axios.get(`${API_URL}/api/matriculas`, { headers: h }),
          axios.get(`${API_URL}/api/donaciones`, { headers: h }),
          axios.get(`${API_URL}/api/personal`,   { headers: h }),
          axios.get(`${API_URL}/api/directiva`,  { headers: h }),
          axios.get(`${API_URL}/api/proveedores`,{ headers: h }),
          axios.get(`${API_URL}/api/grados`,     { headers: h }),
          axios.get(`${API_URL}/api/horario`,    { headers: h }),
        ]);

        const ok = (r) => r.status === "fulfilled" ? extractData(r.value.data) : [];
        setRawData({
          compras:     ok(rs[0]),
          bienes:      ok(rs[1]),
          libros:      ok(rs[2]),
          actividades: ok(rs[3]),
          alumnos:     ok(rs[4]),
          donaciones:  ok(rs[5]),
          personal:    ok(rs[6]),
          directiva:   ok(rs[7]),
          proveedores: ok(rs[8]),
          grados:      ok(rs[9]),
          horarios:    ok(rs[10]),
        });
      } catch (e) {
        console.error("Error en Home:", e);
      } finally {
        setCargando(false);
      }
    };
    fetch();
  }, []);

  /* ── Filtro por rango de fecha en GMT-6 ── */
  const enRango = useCallback((item, campo) => {
    const raw = item?.[campo];
    if (!raw) return false;
    const fecha = parseDate(raw);
    if (!fecha) return false;
    const hn = toHN(fecha);
    return hn >= fechaInicio && hn <= fechaFin;
  }, [fechaInicio, fechaFin]);

  /* ── Derivados filtrados ── */
  const alumnosFiltrados    = safe(rawData.alumnos).filter(a => enRango(a, "fecha_matricula"));
  const comprasFiltradas    = safe(rawData.compras).filter(c => enRango(c, "fecha"));
  const donacionesFiltradas = safe(rawData.donaciones).filter(d => enRango(d, "fecha"));
  const bienesFiltrados     = safe(rawData.bienes).filter(b => enRango(b, "fechaIngreso"));
  const actividadesFiltradas= safe(rawData.actividades).filter(a => enRango(a, "fecha"));

  /* ── KPIs ── */
  const totalAlumnos   = safeLen(rawData.alumnos);
  const alumnosPeriodo = alumnosFiltrados.length;
  const pctAlumnos     = totalAlumnos ? Math.round((alumnosPeriodo / totalAlumnos) * 100) : 0;

  const todoPersonal   = [...safe(rawData.personal), ...safe(rawData.directiva)];
  const totalPersonal  = todoPersonal.length;
  const personalActivo = todoPersonal.filter(p => p?.estado?.toLowerCase() === "activo").length;
  const pctPersonal    = totalPersonal ? Math.round((personalActivo / totalPersonal) * 100) : 0;

  const totalCompras          = safeLen(rawData.compras);
  const comprasPeriodo        = comprasFiltradas.length;
  const montoComprasPeriodo   = comprasFiltradas.reduce((s, c) => s + montoOrden(c), 0);
  const montoComprasTotal     = safe(rawData.compras).reduce((s, c) => s + montoOrden(c), 0);

  const totalBienes   = safeLen(rawData.bienes);
  const bienesActivos = safe(rawData.bienes).filter(b =>
    ["activo","disponible"].includes(b?.estado?.toLowerCase())
  ).length;
  const bienesPeriodo = bienesFiltrados.length;

  const totalDonaciones   = safeLen(rawData.donaciones);
  const donacionesPeriodo = donacionesFiltradas.length;

  const totalLibros       = safeLen(rawData.libros);
  const librosDisponibles = safe(rawData.libros).filter(l => l?.disponible).length;
  const librosPrestados   = totalLibros - librosDisponibles;

  const totalProveedores   = safeLen(rawData.proveedores);
  const proveedoresActivos = safe(rawData.proveedores).filter(p =>
    p?.estado?.toLowerCase() === "activo"
  ).length;

  /* ── Datos para gráficas ── */
  const bienesPorEstado = [...new Set(safe(rawData.bienes).map(b => b?.estado).filter(Boolean))]
    .map(e => ({ name: e, value: safe(rawData.bienes).filter(b => b?.estado === e).length }));

  const comprasPorEstado = [...new Set(safe(rawData.compras).map(c => c?.estado).filter(Boolean))]
    .map(e => ({ name: e, value: safe(rawData.compras).filter(c => c?.estado === e).length }));

  const tendenciaMap = alumnosFiltrados.reduce((acc, a) => {
    const d = parseDate(a.fecha_matricula);
    if (!d) return acc;
    const key = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const dataTendencia = Object.entries(tendenciaMap).map(([mes, matriculas]) => ({ mes, matriculas }));

  const ahoraHN = toHN(new Date());
  const actividadesProximas = safe(rawData.actividades)
    .filter(a => { const f = parseDate(a?.fecha); return f && toHN(f) >= ahoraHN; })
    .sort((a, b) => parseDate(a.fecha) - parseDate(b.fecha))
    .slice(0, 5);

  /* ── Nombre del grado ── */
  const nombreGrado = (id) => {
    if (!id) return "—";
    const gId = id?.$oid || id;
    const g = safe(rawData.grados).find(g => (g._id?.$oid || g._id) === gId);
    return g?.grado || g?.nombre || "—";
  };

  /* ── Helpers de formato ── */
  const fmt = (n) => new Intl.NumberFormat("es-HN", {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n);
  const fmtDate = (val) => {
    const d = parseDate(val);
    if (!d) return "—";
    return toHN(d).toLocaleDateString("es-HN");
  };

  /* ── Datos a exportar ── */
  const getExportPayload = () => ({
    rows: [
      { "Indicador": "Estudiantes en el período",   "Valor": alumnosPeriodo },
      { "Indicador": "Total estudiantes",           "Valor": totalAlumnos },
      { "Indicador": "Personal activo",             "Valor": personalActivo },
      { "Indicador": "Total personal",              "Valor": totalPersonal },
      { "Indicador": "Compras en el período",       "Valor": comprasPeriodo },
      { "Indicador": "Monto compras período (L.)",  "Valor": fmt(montoComprasPeriodo) },
      { "Indicador": "Total órdenes de compra",     "Valor": totalCompras },
      { "Indicador": "Monto compras total (L.)",    "Valor": fmt(montoComprasTotal) },
      { "Indicador": "Bienes ingresados período",   "Valor": bienesPeriodo },
      { "Indicador": "Total bienes",                "Valor": totalBienes },
      { "Indicador": "Bienes activos",              "Valor": bienesActivos },
      { "Indicador": "Total libros",                "Valor": totalLibros },
      { "Indicador": "Libros disponibles",          "Valor": librosDisponibles },
      { "Indicador": "Libros prestados",            "Valor": librosPrestados },
      { "Indicador": "Total donaciones",            "Valor": totalDonaciones },
      { "Indicador": "Donaciones en el período",    "Valor": donacionesPeriodo },
      { "Indicador": "Proveedores activos",         "Valor": proveedoresActivos },
      { "Indicador": "Total proveedores",           "Valor": totalProveedores },
    ],
    title: "Resumen_Dashboard",
    label: "Resumen general del dashboard",
  });

  /* ── Export Excel ── */
  const handleExcel = async () => {
    try {
      setExportando(true); setExportType("excel");
      await new Promise(r => setTimeout(r, 400));
      const { rows, title } = getExportPayload();
      if (!rows.length) { alert("No hay datos en el período seleccionado."); return; }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos");

      const colWidths = Object.keys(rows[0]).map(k => ({
        wch: Math.max(k.length, ...rows.map(r => String(r[k] ?? "").length)) + 2,
      }));
      ws["!cols"] = colWidths;

      XLSX.writeFile(wb, `${title}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Error al exportar a Excel: " + e.message);
    } finally {
      setExportando(false); setExportType(null);
    }
  };

  /* ── Export PDF ── */
  const handlePDF = async () => {
    try {
      setExportando(true); setExportType("pdf");
      await new Promise(r => setTimeout(r, 400));
      const { rows, title, label } = getExportPayload();
      if (!rows.length) { alert("No hay datos en el período seleccionado."); return; }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const PW = doc.internal.pageSize.width;
      const PH = doc.internal.pageSize.height;
      const ML = 14;
      const MR = PW - 14;
      let y = 0;

      doc.setFillColor(124, 111, 247);
      doc.rect(0, 0, PW, 38, "F");
      doc.setFillColor(74, 124, 245);
      doc.rect(PW - 70, 0, 70, 38, "F");

      try {
        const img = new Image();
        img.src = imageLogo;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        const imgData = canvas.toDataURL("image/png");
        const ratio = img.naturalWidth / img.naturalHeight;
        const logoH = 28;
        const logoW = logoH * ratio;
        doc.addImage(imgData, "PNG", ML, 5, logoW, logoH);
        y = ML + logoW + 6;
      } catch {
        y = ML + 6;
      }

      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Escuela experimental de niños para la música", ML + 34, 13);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 215, 255);
      doc.text(label, ML + 34, 20);

      doc.setFontSize(9);
      doc.setTextColor(200, 195, 255);
      doc.text(
        `Período: ${fechaInicio.toLocaleDateString("es-HN")} – ${fechaFin.toLocaleDateString("es-HN")}`,
        ML + 34, 27
      );
      doc.text(
        `Generado: ${new Date().toLocaleString("es-HN", { timeZone: "America/Tegucigalpa" })}`,
        ML + 34, 33
      );

      y = 44;
      doc.setDrawColor(200, 195, 255);
      doc.setLineWidth(0.3);
      doc.line(ML, y, MR, y);
      y += 6;

      const headers = Object.keys(rows[0]);
      const colW = (MR - ML) / headers.length;
      const rowH = 7;

      const drawHeader = () => {
        doc.setFillColor(240, 237, 255);
        doc.rect(ML, y, MR - ML, rowH, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 60, 180);
        headers.forEach((h, i) => {
          doc.text(String(h), ML + i * colW + 2, y + 5);
        });
        y += rowH;
        doc.setDrawColor(180, 170, 240);
        doc.line(ML, y, MR, y);
        y += 1;
      };

      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      rows.forEach((row, ri) => {
        if (y + rowH > PH - 14) {
          doc.addPage();
          doc.setFillColor(124, 111, 247);
          doc.rect(0, 0, PW, 10, "F");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text("Escuela experimental de niños para la música  —  " + label, ML, 7);
          y = 16;
          drawHeader();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
        }

        if (ri % 2 === 0) {
          doc.setFillColor(250, 249, 255);
          doc.rect(ML, y, MR - ML, rowH, "F");
        }

        doc.setTextColor(50, 50, 50);
        headers.forEach((h, i) => {
          const val = String(row[h] ?? "");
          const maxCh = Math.floor(colW / 1.8);
          const txt = val.length > maxCh ? val.slice(0, maxCh - 2) + "…" : val;
          doc.text(txt, ML + i * colW + 2, y + 5);
        });

        doc.setDrawColor(235, 232, 255);
        doc.line(ML, y + rowH, MR, y + rowH);
        y += rowH;
      });

      const pages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 243, 255);
        doc.rect(0, PH - 10, PW, 10, "F");
        doc.setFontSize(8);
        doc.setTextColor(130, 120, 180);
        doc.setFont("helvetica", "normal");
        doc.text("Escuela experimental de niños para la música", ML, PH - 4);
        doc.text(`Página ${i} de ${pages}`, MR - 20, PH - 4);
      }

      doc.save(`${title}_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Error al exportar a PDF: " + e.message);
    } finally {
      setExportando(false); setExportType(null);
    }
  };

  /* ── Saludo según hora en Honduras ── */
  const horaHN = new Date().toLocaleString("es-HN", {
    timeZone: "America/Tegucigalpa", hour: "numeric", hour12: false
  });
  const h = parseInt(horaHN);
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  if (cargando) return (
    <div className="home-loader">
      <div className="home-loader-ring" />
      <p>Cargando dashboard...</p>
    </div>
  );

  /* ── KPI Cards config ── */
  const kpis = [
    {
      icon: Users,
      label: "Estudiantes matriculados",
      value: alumnosPeriodo,
      sub: `${totalAlumnos} registrados en total`,
      tag: alumnosPeriodo > 0 ? `${pctAlumnos}% del total` : "Sin matrículas en el período",
      color: "#7c6ff7",
      bg: "#f3f0ff",
    },
    {
      icon: UserCheck,
      label: "Personal activo",
      value: `${personalActivo}/${totalPersonal}`,
      sub: `${safeLen(rawData.directiva)} directivos · ${safeLen(rawData.personal)} docentes`,
      tag: `${pctPersonal}% activos`,
      color: "#4a7cf5",
      bg: "#eef3ff",
    },
    {
      icon: ShoppingCart,
      label: "Órdenes de compra",
      value: comprasPeriodo,
      sub: `L. ${fmt(montoComprasPeriodo)} monto en período`,
      tag: `${totalCompras} órdenes en total`,
      color: "#9b5ff5",
      bg: "#f6f0ff",
    },
    {
      icon: Package,
      label: "Bienes ingresados",
      value: bienesPeriodo,
      sub: `${totalBienes} registrados · ${bienesActivos} activos`,
      tag: `L. ${fmt(safe(rawData.bienes).reduce((s,b)=>s+(b.valor||0),0))} valor total`,
      color: "#2baa8a",
      bg: "#edfaf5",
    },
    {
      icon: BookOpen,
      label: "Biblioteca",
      value: totalLibros,
      sub: `${librosDisponibles} disponibles · ${librosPrestados} prestados`,
      tag: `${totalLibros ? Math.round((librosDisponibles/totalLibros)*100) : 0}% disponibilidad`,
      color: "#e07d35",
      bg: "#fff5ed",
    },
    {
      icon: Award,
      label: "Proveedores",
      value: proveedoresActivos,
      sub: `de ${totalProveedores} registrados`,
      tag: `${totalProveedores ? Math.round((proveedoresActivos/totalProveedores)*100) : 0}% activos`,
      color: "#d95f91",
      bg: "#fff0f6",
    },
  ];

  return (
    <div className="home-wrap">

      {/* ── Overlay de exportación ── */}
      {exportando && (
        <div className="home-export-overlay">
          <div className="home-export-modal">
            <Loader2 size={36} className="home-export-spin" color="#7c6ff7" />
            <p>Generando {exportType === "excel" ? "Excel" : "PDF"}…</p>
            <small>Por favor espere</small>
          </div>
        </div>
      )}

      {/* ── Header institucional ── */}
      <div className="home-header">
        <div className="home-header-left">
          <div className="home-logo-wrap">
            <img src={imageLogo} alt="Logo escuela" className="home-logo" />
          </div>
          <div>
            <p className="home-school-name">Escuela experimental de niños para la música</p>
            <h1 className="home-title">
              {saludo} — <span className="home-title-accent">Panel de Control</span>
            </h1>
            <p className="home-date">
              {new Date().toLocaleDateString("es-HN", {
                timeZone: "America/Tegucigalpa",
                weekday: "long", day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="home-controls">
          <div className="home-daterange">
            <Calendar size={14} color="#7c6ff7" />
            <DatePicker
              selected={fechaInicio}
              onChange={(d) => d && setFechaInicio(startOfDayHN(d))}
              onChangeRaw={(e) => {
                const parsed = parseDateManual(e.target.value);
                if (parsed) setFechaInicio(startOfDayHN(parsed));
              }}
              selectsStart
              startDate={fechaInicio}
              endDate={fechaFin}
              maxDate={new Date()}
              className="home-datepicker"
              dateFormat="dd/MM/yyyy"
              placeholderText="Desde"
            />
            <span className="home-datesep">→</span>
            <DatePicker
              selected={fechaFin}
              onChange={(d) => {
                if (!d) return;
                // Si la fecha elegida es anterior a fechaInicio, ajustar fechaInicio
                const fin = endOfDayHN(d);
                if (fin < fechaInicio) setFechaInicio(startOfDayHN(d));
                setFechaFin(fin);
              }}
              onChangeRaw={(e) => {
                const parsed = parseDateManual(e.target.value);
                if (parsed) setFechaFin(endOfDayHN(parsed));
              }}
              selectsEnd
              startDate={fechaInicio}
              endDate={fechaFin}
              maxDate={new Date()}
              className="home-datepicker"
              dateFormat="dd/MM/yyyy"
              placeholderText="Hasta"
            />
            <button
              className="home-btn-reset"
              onClick={resetFechas}
              title="Restablecer al inicio del año"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="home-export-row">
            <button
              className="home-btn home-btn-excel"
              onClick={handleExcel}
              disabled={exportando}
            >
              <Download size={14} /> Excel
            </button>
            <button
              className="home-btn home-btn-pdf"
              onClick={handlePDF}
              disabled={exportando}
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="home-kpi-grid">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div
              key={i}
              className="home-kpi-card"
              style={{
                "--kpi-color": k.color,
                "--kpi-bg": k.bg,
                animationDelay: `${i * 0.07}s`
              }}
            >
              <div className="home-kpi-icon">
                <Icon size={22} color={k.color} strokeWidth={1.8} />
              </div>
              <div className="home-kpi-body">
                <span className="home-kpi-label">{k.label}</span>
                <div className="home-kpi-value">{k.value}</div>
                <span className="home-kpi-sub">{k.sub}</span>
              </div>
              <span className="home-kpi-tag">{k.tag}</span>
            </div>
          );
        })}
      </div>

      {/* ── Gráficas ── */}
      <div className="home-charts-grid">
        {bienesPorEstado.length > 0 && (
          <div className="home-chart-card">
            <div className="home-chart-header">
              <h3>Bienes por estado</h3>
              <Package size={16} color="#7c6ff7" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={bienesPorEstado}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                >
                  {bienesPorEstado.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {comprasPorEstado.length > 0 && (
          <div className="home-chart-card">
            <div className="home-chart-header">
              <h3>Órdenes de compra por estado</h3>
              <ShoppingCart size={16} color="#7c6ff7" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comprasPorEstado} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edfb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {comprasPorEstado.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {dataTendencia.length > 0 && (
          <div className="home-chart-card home-chart-full">
            <div className="home-chart-header">
              <h3>Tendencia de matrículas en el período</h3>
              <TrendingUp size={16} color="#7c6ff7" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dataTendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0edfb" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="matriculas"
                  stroke="#7c6ff7"
                  strokeWidth={2.5}
                  dot={{ fill: "#7c6ff7", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Tablas ── */}
      <div className="home-tables-grid">
        {actividadesProximas.length > 0 && (
          <div className="home-table-card">
            <div className="home-table-header">
              <h3>Próximas actividades</h3>
              <Calendar size={15} color="#7c6ff7" />
            </div>
            <table className="home-table">
              <thead>
                <tr><th>Actividad</th><th>Fecha</th><th>Lugar</th></tr>
              </thead>
              <tbody>
                {actividadesProximas.map(a => (
                  <tr key={a._id}>
                    <td>{a.nombre}</td>
                    <td>{fmtDate(a.fecha)}</td>
                    <td>{a.lugar || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {safe(rawData.compras).length > 0 && (
          <div className="home-table-card">
            <div className="home-table-header">
              <h3>Últimas órdenes de compra</h3>
              <ShoppingCart size={15} color="#7c6ff7" />
            </div>
            <table className="home-table">
              <thead>
                <tr><th>Número</th><th>Estado</th><th>Monto</th><th>Fecha</th></tr>
              </thead>
              <tbody>
                {safe(rawData.compras).slice(0, 6).map(c => (
                  <tr key={c._id}>
                    <td>{c.numero}</td>
                    <td>
                      <span className={`home-badge home-badge-${c.estado?.toLowerCase()}`}>
                        {c.estado}
                      </span>
                    </td>
                    <td>L. {fmt(montoOrden(c))}</td>
                    <td>{fmtDate(c.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {safe(rawData.libros).length > 0 && (
          <div className="home-table-card">
            <div className="home-table-header">
              <h3>Biblioteca — últimos libros</h3>
              <BookOpen size={15} color="#7c6ff7" />
            </div>
            <table className="home-table">
              <thead>
                <tr><th>Título</th><th>Autor</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {safe(rawData.libros).slice(0, 6).map(l => (
                  <tr key={l._id}>
                    <td>{l.titulo}</td>
                    <td>{l.autor || "—"}</td>
                    <td>
                      <span className={`home-badge ${l.disponible ? "home-badge-activo" : "home-badge-borrador"}`}>
                        {l.disponible ? "Disponible" : "Prestado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sin datos */}
      {!totalAlumnos && !totalCompras && !totalBienes && (
        <div className="home-empty">
          <AlertCircle size={28} color="#b0acd4" />
          <p>No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
}