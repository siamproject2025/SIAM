// ============================================================
// GradosPage.jsx — Rediseño completo
//  • Header dinámico con stats reactivos a filtros
//  • Tabla estilo "Sistema de Bienes": checkboxes, badges, header morado
//  • Toolbar con filtros de estado y búsqueda
//  • Modal con pestañas dn-* (Datos | Auditoría), framer-motion
//  • Panel lateral de alumnos y drawer de detalle
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { auth } from "../../../components/authentication/Auth";
import "../../../styles/grados.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Book, X, Trash2, Users, Search, ChevronRight,
  AlertCircle, Clock, UserCheck, GraduationCap,
  LayoutGrid, Plus, Save, Filter, Download,
} from "lucide-react";
import {
  FiBook, FiInfo, FiFileText, FiEdit2,
  FiAward, FiCalendar, FiClock, FiCheckSquare,
} from "react-icons/fi";
import ConfirmDialog from "../../../components/ConfirmDialog/ConfirmDialog";
import WithPermission from "../../../components/Permisos/WithPermission";
import Notification from "../../../components/Notification";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API      = `${API_BASE}/api/grados`;

const GRADOS_BASE = ["Primero","Segundo","Tercero","Cuarto","Quinto","Sexto","Séptimo","Octavo","Noveno","Décimo"];
const SECCIONES   = ["A","B","C","D","E","F"];
const ESTADOS_FILTER = ["Todos", "Activo", "Inactivo"];

const initialForm = () => ({
  _id: null, grado: "", seccion: "A", descripcion: "",
  anio_academico: new Date().getFullYear(),
  aula: "", estado: "Activo",
  fecha_actualizacion: new Date().toISOString(),
  timestamp: new Date().toISOString(),
});

const gradoCompleto = (g, s) => (!g ? "" : s ? `${g} ${s}` : g);

const iniciales = (n = "") => {
  const p = n.trim().split(" ").filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

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

// ── CSS inline ────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');

  /* ── Variables ── */
  :root {
    --gv-purple: #6C4FBF;
    --gv-purple-dark: #4e3a8a;
    --gv-purple-light: #9B59B6;
    --gv-purple-soft: #EDE9FF;
    --gv-purple-border: #C4B5E8;
    --gv-text-dark: #2D2250;
    --gv-text-mid: #4B5563;
    --gv-text-muted: #7A6FA0;
    --gv-bg: #F4F3FB;
    --gv-bg-card: #fff;
    --gv-border: #E0D9F5;
  }

  .mm-hi { position: relative; z-index: 1; }
  .mm-htitle {
    font-family: 'Poppins', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }
  .mm-sub { color: rgba(255,255,255,.8); font-size: .88rem; margin: 0 0 20px; }
  .mm-stats { display: flex; gap: 12px; flex-wrap: wrap; }
  .mm-stat {
    background: rgba(255,255,255,.15);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 14px;
    padding: 12px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 130px;
    cursor: default;
  }
  .mm-stat-ico {
    width: 36px; height: 36px;
    background: rgba(255,255,255,.15);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .mm-stat-val { font-family: 'Poppins', sans-serif; font-size: 1.3rem; font-weight: 800; color: #fff; line-height: 1; }
  .mm-stat-lbl { font-size: .7rem; color: rgba(255,255,255,.75); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; }

  /* ── FILTER CHIP ── */
  .gv-filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding: 16px 0 0;
  }
  .gv-filter-label {
    font-size: .78rem;
    font-weight: 700;
    color: var(--gv-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .gv-chip {
    padding: 6px 16px;
    border-radius: 20px;
    border: 1.5px solid var(--gv-border);
    background: #fff;
    font-size: .82rem;
    font-weight: 700;
    color: var(--gv-text-muted);
    cursor: pointer;
    transition: all .18s;
    font-family: inherit;
  }
  .gv-chip:hover { border-color: var(--gv-purple); color: var(--gv-purple); }
  .gv-chip.active {
    background: var(--gv-purple);
    border-color: var(--gv-purple);
    color: #fff;
    box-shadow: 0 4px 12px rgba(108,79,191,.3);
  }

  /* ── SEARCH BAR ── */
  .gv-search-wrap {
    flex: 1;
    max-width: 340px;
    position: relative;
    display: flex;
    align-items: center;
  }
  .gv-search-wrap svg { position: absolute; left: 12px; color: var(--gv-text-muted); pointer-events: none; }
  .gv-search-input {
    width: 100%;
    padding: 9px 12px 9px 36px;
    border: 1.5px solid var(--gv-border);
    border-radius: 10px;
    font-family: inherit;
    font-size: .86rem;
    color: var(--gv-text-dark);
    background: #fff;
    outline: none;
    transition: border-color .2s;
  }
  .gv-search-input:focus { border-color: var(--gv-purple); box-shadow: 0 0 0 3px rgba(108,79,191,.1); }

  /* ── TABLA ── */
  .gv-table-card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid var(--gv-border);
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(108,79,191,.07);
  }
  .gv-table-info {
    padding: 12px 20px;
    font-size: .83rem;
    color: var(--gv-text-muted);
    border-bottom: 1px solid var(--gv-border);
  }
  .gv-table-info strong { color: var(--gv-text-dark); }
  .gv-table { width: 100%; border-collapse: collapse; }
  .gv-table thead tr {
    background: linear-gradient(135deg, #6C4FBF, #9B59B6);
  }
  .gv-table thead th {
    padding: 13px 16px;
    font-size: .72rem;
    font-weight: 800;
    color: rgba(255,255,255,.9);
    text-transform: uppercase;
    letter-spacing: .07em;
    white-space: nowrap;
    border: none;
  }
  .gv-table thead th:first-child { border-radius: 0; padding-left: 20px; }
  .gv-table thead th.th-sort { cursor: pointer; user-select: none; }
  .gv-table thead th.th-sort:hover { color: #fff; }

  .gv-table tbody tr {
    border-bottom: 1px solid #F0EDF9;
    transition: background .15s;
  }
  .gv-table tbody tr:last-child { border-bottom: none; }
  .gv-table tbody tr:hover { background: #FAF9FF; }
  .gv-table tbody tr.selected { background: #F0ECFF; }
  .gv-table td {
    padding: 13px 16px;
    font-size: .87rem;
    color: var(--gv-text-dark);
    vertical-align: middle;
  }
  .gv-table td:first-child { padding-left: 20px; }

  /* Checkbox */
  .gv-checkbox {
    width: 17px; height: 17px;
    accent-color: var(--gv-purple);
    cursor: pointer;
  }

  /* Grado badge */
  .gv-grado-code {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    background: var(--gv-purple-soft);
    color: var(--gv-purple);
    border-radius: 6px;
    font-size: .74rem;
    font-weight: 800;
    font-family: 'Poppins', sans-serif;
    letter-spacing: .02em;
    margin-bottom: 3px;
  }
  .gv-grado-name { font-weight: 700; color: var(--gv-text-dark); }
  .gv-grado-desc { font-size: .74rem; color: var(--gv-text-muted); margin-top: 1px; }

  /* Sección badge */
  .gv-seccion-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px; height: 30px;
    border-radius: 8px;
    background: #EDE9FF;
    color: #6C4FBF;
    font-weight: 800;
    font-size: .88rem;
    font-family: 'Poppins', sans-serif;
  }

  /* Estado badges */
  .gv-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: .74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .04em;
  }
  .gv-badge::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .gv-badge-activo   { background: #D4F5E2; color: #1a7a40; }
  .gv-badge-inactivo { background: #FDE8E8; color: #b02a2a; }

  /* Alumnos btn */
  .gv-alumnos-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 8px;
    border: 1.5px solid var(--gv-border);
    background: var(--gv-purple-soft);
    color: var(--gv-purple);
    font-size: .8rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: all .18s;
  }
  .gv-alumnos-btn:hover {
    background: var(--gv-purple);
    color: #fff;
    border-color: var(--gv-purple);
  }

  /* Acciones — estilo bienes-btn-icon */
  .bienes-action-buttons { display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
  .bienes-btn-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: .82rem;
    font-weight: 700;
    transition: all .18s;
    flex-shrink: 0;
  }
  .bienes-btn-icon.edit { background: #EDE9FF; color: #6C4FBF; }
  .bienes-btn-icon.edit:hover { background: #6C4FBF; color: #fff; transform: scale(1.08); }
  .bienes-btn-icon.delete { background: #FDE8E8; color: #e74c3c; }
  .bienes-btn-icon.delete:hover { background: #e74c3c; color: #fff; transform: scale(1.08); }

  /* Paginación */
  .gv-pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid var(--gv-border);
    background: #FDFCFF;
  }
  .gv-pagination-info { font-size: .82rem; color: var(--gv-text-muted); }
  .gv-pagination-info strong { color: var(--gv-text-dark); }
  .gv-pagination-btns { display: flex; gap: 4px; align-items: center; }
  .gv-pg-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1.5px solid var(--gv-border);
    background: #fff;
    color: var(--gv-text-muted);
    font-size: .82rem;
    font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all .18s;
    font-family: inherit;
  }
  .gv-pg-btn:hover:not(:disabled) { border-color: var(--gv-purple); color: var(--gv-purple); }
  .gv-pg-btn.active { background: var(--gv-purple); border-color: var(--gv-purple); color: #fff; box-shadow: 0 4px 12px rgba(108,79,191,.3); }
  .gv-pg-btn:disabled { opacity: .35; cursor: not-allowed; }

  /* Toolbar */
  .gv-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    padding: 20px 0 16px;
  }
  .gv-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background: var(--gv-purple);
    color: #fff;
    font-size: .86rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(108,79,191,.35);
    transition: all .18s;
  }
  .gv-btn-primary:hover { background: var(--gv-purple-dark); transform: translateY(-1px); }
  .gv-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 18px;
    border-radius: 10px;
    border: 1.5px solid var(--gv-border);
    background: #fff;
    color: var(--gv-text-muted);
    font-size: .86rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: all .18s;
  }
  .gv-btn-secondary:hover { border-color: var(--gv-purple); color: var(--gv-purple); }

  /* Empty state */
  .gv-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--gv-text-muted);
  }
  .gv-empty p { font-size: .9rem; margin-top: 12px; }

  /* Loading skeleton */
  .gv-skeleton {
    background: linear-gradient(90deg, #f0ecff 25%, #e8e2f5 50%, #f0ecff 75%);
    background-size: 200% 100%;
    animation: skeleton 1.5s infinite;
    border-radius: 6px;
    height: 14px;
  }
  @keyframes skeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ══ Panel alumnos ══ */
  .ga-overlay { position:fixed;inset:0;background:rgba(30,20,60,.55);z-index:9999;display:flex;align-items:flex-start;justify-content:flex-end;backdrop-filter:blur(4px); }
  .ga-panel { width:420px;max-width:96vw;height:100vh;background:#F4F3FB;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(108,79,191,.18); }
  .ga-panel-header { background:linear-gradient(135deg,#6C4FBF,#9B59B6);padding:20px 22px 16px;flex-shrink:0;position:relative; }
  .ga-panel-header h2 { font-family:'Poppins',sans-serif;font-size:1rem;font-weight:800;color:#fff;margin:0 0 4px; }
  .ga-panel-header p  { font-size:.82rem;color:rgba(255,255,255,.8);margin:0; }
  .ga-panel-close { position:absolute;top:16px;right:16px;background:rgba(255,255,255,.2);border:none;border-radius:8px;color:#fff;cursor:pointer;padding:6px;display:flex; }
  .ga-panel-close:hover { background:rgba(255,255,255,.35); }
  .ga-search { padding:14px 16px 10px;flex-shrink:0;display:flex;align-items:center;gap:10px;background:#fff;border-bottom:1px solid #E0D9F5; }
  .ga-search input { flex:1;border:2px solid #E0D9F5;border-radius:10px;padding:8px 13px;font-family:inherit;font-size:.88rem;color:#2D2250;outline:none;background:#FAF9FF; }
  .ga-search input:focus { border-color:#6C4FBF; }
  .ga-list { flex:1;overflow-y:auto;padding:12px; }
  .ga-list::-webkit-scrollbar { width:4px; }
  .ga-list::-webkit-scrollbar-thumb { background:#C4B5E8;border-radius:4px; }
  .ga-card { background:#fff;border-radius:12px;border:1px solid #E0D9F5;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer;transition:all .18s; }
  .ga-card:hover { border-color:#6C4FBF;box-shadow:0 4px 16px rgba(108,79,191,.12);transform:translateX(3px); }
  .ga-avatar { width:40px;height:40px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#6C4FBF,#9B59B6);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.88rem;color:#fff; }
  .ga-card-name { font-weight:700;font-size:.9rem;color:#2D2250; }
  .ga-card-doc  { font-size:.76rem;color:#7A6FA0;margin-top:1px; }
  .ga-card-grade { margin-left:auto;display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;background:#EDE9FF;color:#6C4FBF;font-size:.73rem;font-weight:700;white-space:nowrap; }
  .ga-card-chevron { color:#C4B5E8;flex-shrink:0; }
  .ga-estado-activo   { background:#D4F5E2;color:#1a7a40; }
  .ga-estado-inactivo { background:#FDE8E8;color:#b02a2a; }
  .ga-drawer-overlay { position:fixed;inset:0;background:rgba(30,20,60,.4);z-index:10000;display:flex;align-items:flex-start;justify-content:flex-end; }
  .ga-drawer { width:380px;max-width:95vw;height:100vh;background:#fff;overflow-y:auto;box-shadow:-8px 0 40px rgba(0,0,0,.2);display:flex;flex-direction:column; }
  .ga-drawer::-webkit-scrollbar { width:4px; }
  .ga-drawer::-webkit-scrollbar-thumb { background:#C4B5E8;border-radius:4px; }
  .ga-drawer-header { background:linear-gradient(135deg,#6C4FBF,#9B59B6);padding:22px 20px;position:sticky;top:0;z-index:1;flex-shrink:0; }
  .ga-drawer-header h3 { font-family:'Poppins',sans-serif;font-size:1rem;font-weight:800;color:#fff;margin:0 0 2px; }
  .ga-drawer-header p  { font-size:.8rem;color:rgba(255,255,255,.8);margin:0; }
  .ga-drawer-body { padding:18px;flex:1; }
  .ga-section-title { font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6C4FBF;margin:16px 0 8px;padding-bottom:6px;border-bottom:2px solid #EDE9FF; }
  .ga-field-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px; }
  .ga-field-full { grid-column:1/-1; }
  .ga-field { background:#FAF9FF;border-radius:9px;padding:10px 13px;border:1px solid #E0D9F5; }
  .ga-field-label { font-size:.7rem;font-weight:700;color:#7A6FA0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px; }
  .ga-field-value { font-size:.86rem;font-weight:600;color:#2D2250; }
  .ga-close-drawer { display:flex;align-items:center;gap:6px;background:#EDE9FF;color:#6C4FBF;border:none;border-radius:10px;padding:10px 18px;font-weight:700;font-size:.87rem;cursor:pointer;margin:16px 18px;font-family:inherit; }
  .ga-close-drawer:hover { background:#6C4FBF;color:#fff; }
  .ga-empty { text-align:center;padding:40px 20px;color:#7A6FA0; }
  .ga-empty p { font-size:.88rem;margin-top:10px; }
  .ga-count-badge { display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.2);border-radius:20px;padding:3px 10px;font-size:.78rem;font-weight:700;color:#fff;margin-top:6px; }

  /* ══ Modal dn-* ══ */
  .dn-overlay { position:fixed;inset:0;background:rgba(30,20,60,.55);z-index:1100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px); }
  .dn-modal { background:#fff;border-radius:18px;width:560px;max-width:96vw;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(108,79,191,.22);overflow:hidden; }
  .dn-modal-header { background:linear-gradient(135deg,#6C4FBF,#9B59B6);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0; }
  .dn-modal-header h3 { color:#fff;font-family:'Poppins',sans-serif;font-size:1.05rem;font-weight:800;margin:0;display:flex;align-items:center;gap:8px; }
  .dn-modal-close { background:rgba(255,255,255,.2);border:none;border-radius:8px;color:#fff;cursor:pointer;padding:6px;display:flex;transition:background .2s; }
  .dn-modal-close:hover { background:rgba(255,255,255,.35); }
  .dn-unsaved-banner { background:#FEF3C7;border-bottom:2px solid #F59E0B;padding:8px 24px;font-size:.82rem;font-weight:700;color:#92400E;flex-shrink:0; }
  .dn-modal-tabs { display:flex;border-bottom:2px solid #EDE9FF;flex-shrink:0;padding:0 20px; }
  .dn-tab-btn { background:none;border:none;padding:13px 18px;font-size:.85rem;font-weight:700;color:#7A6FA0;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;display:flex;align-items:center;gap:6px;font-family:inherit;transition:color .2s; }
  .dn-tab-btn.active { color:white;border-bottom-color:#6C4FBF; }
  .dn-tab-btn.has-error { color:#e74c3c; }
  .dn-tab-error-dot { width:7px;height:7px;border-radius:50%;background:#e74c3c;display:inline-block;animation:pulse-dot 1.2s infinite; }
  @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
  .dn-tab-content { flex:1;overflow-y:auto;padding:20px 24px; }
  .dn-tab-content::-webkit-scrollbar { width:4px; }
  .dn-tab-content::-webkit-scrollbar-thumb { background:#C4B5E8;border-radius:4px; }
  .dn-form-section-title { font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6C4FBF;margin:0 0 14px;display:flex;align-items:center;gap:6px; }
  .dn-form-grid { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
  .dn-form-group { display:flex;flex-direction:column;gap:5px; }
  .dn-form-group.dn-full { grid-column:1/-1; }
  .dn-form-group label { font-size:.78rem;font-weight:700;color:#4B5563;display:flex;align-items:center;gap:4px; }
  .dn-form-group input, .dn-form-group select, .dn-form-group textarea {
    border:1.5px solid #E0D9F5;border-radius:9px;padding:9px 13px;font-size:.88rem;
    font-family:inherit;color:#2D2250;background:#FAF9FF;transition:border-color .2s;outline:none;
  }
  .dn-form-group input:focus, .dn-form-group select:focus, .dn-form-group textarea:focus { border-color:#6C4FBF;box-shadow:0 0 0 3px rgba(108,79,191,.1); }
  .dn-input-err { border-color:#e74c3c !important; }
  .dn-err-msg { font-size:.75rem;color:#e74c3c;font-weight:600; }
  .dn-field-error input, .dn-field-error select { border-color:#e74c3c; }
  .req { color:#e74c3c; }
  .dn-modal-footer { padding:16px 24px;background:#F9F7FF;border-top:1px solid #EDE9FF;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0; }
  .dn-audit-card { background:#FAF9FF;border:1px solid #E0D9F5;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:14px; }
  .dn-audit-row { display:flex;align-items:flex-start;gap:14px; }
  .dn-audit-ico { color:#6C4FBF;flex-shrink:0;margin-top:2px; }
  .dn-audit-label { font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#7A6FA0;margin-bottom:4px; }
  .dn-audit-val { font-size:.84rem;color:#2D2250; }
  .dn-audit-ids { display:flex;flex-wrap:wrap;gap:10px;padding-top:10px;border-top:1px solid #EDE9FF; }
  .dn-audit-ids small { background:#EDE9FF;color:#6C4FBF;border-radius:6px;padding:3px 9px;font-size:.74rem;font-weight:700; }
  .dn-preview { background:#F0ECFF;border:1px solid #C4B5E8;border-radius:8px;padding:10px 14px;font-size:.82rem;color:#6C4FBF;font-weight:700;display:flex;align-items:center;gap:8px;margin-top:4px; }
  .dn-preview-label { font-size:.72rem;color:#7A6FA0;font-weight:600;text-transform:uppercase;letter-spacing:.04em; }
  .gs-badge-info { display:inline-flex;align-items:center;gap:6px;background:#E8F4FD;color:#0c4a6e;padding:8px 14px;border-radius:8px;font-size:.82rem;border-left:3px solid #2980B9;margin-bottom:14px; }
`;

// ══════════════════════════════════════════════════════════
// Modal Crear / Editar Grado
// ══════════════════════════════════════════════════════════
const ModalGrado = ({ onClose, onSave, gradoEditando, loading }) => {
  const esEdicion = !!gradoEditando;

  const parsearGrado = (item) => {
    if (!item) return initialForm();
    let gradoBase = item.grado || "", seccion = item.seccion || "";
    if (!seccion && gradoBase) {
      const p = gradoBase.trim().split(" ");
      if (p.length >= 2 && SECCIONES.includes(p[p.length - 1].toUpperCase())) {
        seccion   = p[p.length - 1].toUpperCase();
        gradoBase = p.slice(0, -1).join(" ");
      }
    }
    return {
      ...item,
      grado: gradoBase, seccion: seccion || "A",
      fecha_actualizacion: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };
  };

  const [form,           setForm]           = useState(parsearGrado(gradoEditando));
  const [errores,        setErrores]        = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [tabActiva,      setTabActiva]      = useState("datos");
  const [hayCambios,     setHayCambios]     = useState(false);

  const TAB_DE_CAMPO = { grado: "datos", seccion: "datos", aula: "datos" };

  const limpiarError = (name) => {
    if (intentoGuardar && errores[name])
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setHayCambios(true);
    limpiarError(name);
  };

  const tabTieneError = (key) => Object.keys(errores).some(c => TAB_DE_CAMPO[c] === key);

  const validar = (f) => {
    const e = {};
    if (!f.grado?.trim())   e.grado   = "El grado es requerido.";
    if (!f.seccion?.trim()) e.seccion  = "La sección es requerida.";
    if (!f.aula?.trim())    e.aula     = "El aula es requerida.";
    return e;
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    setIntentoGuardar(true);
    const errs = validar(form);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActiva(TAB_DE_CAMPO[primer]);
      return;
    }
    setErrores({});
    onSave({
      ...form,
      grado: gradoCompleto(form.grado, form.seccion),
      anio_academico: Number(form.anio_academico),
      timestamp: new Date().toISOString(),
    });
  };

  const tabs = [
    { key: "datos",     label: "Datos",     ico: <FiFileText size={14} /> },
    { key: "auditoria", label: "Auditoría", ico: <FiClock    size={14} /> },
  ];

  const nombrePreview = gradoCompleto(form.grado, form.seccion);

  return (
    <motion.div
      className="dn-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="dn-modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 40 }}
        transition={{ type: "spring", damping: 22 }}
      >
        <div className="dn-modal-header">
          <h3>
            {esEdicion
              ? <><FiEdit2 size={18} /> Editar Grado</>
              : <><Plus size={18} /> Nuevo Grado</>}
          </h3>
          <button className="dn-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {hayCambios && (
          <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>
        )}

        <form onSubmit={handleGuardar} noValidate style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
          <div className="dn-modal-tabs">
            {tabs.map(t => (
              <button
                key={t.key} type="button"
                className={`dn-tab-btn${tabActiva === t.key ? " active" : ""}${tabTieneError(t.key) ? " has-error" : ""}`}
                onClick={() => setTabActiva(t.key)}
              >
                {t.ico} {t.label}
                {tabTieneError(t.key) && <span className="dn-tab-error-dot" />}
              </button>
            ))}
          </div>

          {tabActiva === "datos" && (
            <div className="dn-tab-content">
              <div className="gs-badge-info" style={{ marginBottom: 18 }}>
                <FiInfo size={13} />
                El <strong>Grado</strong> y la <strong>Sección</strong> se combinarán.
                {nombrePreview && <>&nbsp;→ <strong>{nombrePreview}</strong></>}
              </div>

              <div className="dn-form-section-title">
                <GraduationCap size={15} /> Identificación del Grado
              </div>
              <div className="dn-form-grid">
                <div className={`dn-form-group${errores.grado ? " dn-field-error" : ""}`}>
                  <label><Book size={12} /> Grado <span className="req">*</span></label>
                  <select name="grado" value={form.grado} onChange={handleChange} className={errores.grado ? "dn-input-err" : ""}>
                    <option value="">Seleccionar grado...</option>
                    {GRADOS_BASE.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errores.grado && <span className="dn-err-msg">{errores.grado}</span>}
                </div>

                <div className={`dn-form-group${errores.seccion ? " dn-field-error" : ""}`}>
                  <label><LayoutGrid size={12} /> Sección <span className="req">*</span></label>
                  <select name="seccion" value={form.seccion} onChange={handleChange} className={errores.seccion ? "dn-input-err" : ""}>
                    <option value="">Seleccionar...</option>
                    {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errores.seccion && <span className="dn-err-msg">{errores.seccion}</span>}
                </div>

                {nombrePreview && (
                  <div className="dn-form-group dn-full">
                    <div className="dn-preview">
                      <span className="dn-preview-label">Se guardará como:</span>
                      <strong style={{ fontSize: "1rem" }}>{nombrePreview}</strong>
                    </div>
                  </div>
                )}

                <div className="dn-form-group">
                  <label><FiCalendar size={12} /> Año Académico</label>
                  <input type="number" name="anio_academico" value={form.anio_academico} onChange={handleChange} min="1900" max="2100" />
                </div>

                <div className={`dn-form-group${errores.aula ? " dn-field-error" : ""}`}>
                  <label><FiBook size={12} /> Aula <span className="req">*</span></label>
                  <input name="aula" value={form.aula} onChange={handleChange} placeholder="Ej: Aula 101" className={errores.aula ? "dn-input-err" : ""} />
                  {errores.aula && <span className="dn-err-msg">{errores.aula}</span>}
                </div>

                <div className="dn-form-group dn-full">
                  <label><FiInfo size={12} /> Descripción (opcional)</label>
                  <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Ej: Grupo de instrumentos de viento" />
                </div>

                <div className="dn-form-group dn-full">
                  <label>Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tabActiva === "auditoria" && (
            <div className="dn-tab-content">
              <div className="dn-form-section-title">
                <UserCheck size={15} /> Auditoría del Grado
              </div>
              <div className="dn-audit-card">
                <div className="dn-audit-row">
                  <UserCheck size={16} className="dn-audit-ico" />
                  <div>
                    <div className="dn-audit-label">Creación</div>
                    <div className="dn-audit-val">
                      Creado por: <strong>{form.creado_por_email || form.creado_por || "N/D"}</strong>
                      &nbsp;·&nbsp;Fecha: <strong>{formatFecha(form.fecha_creacion || form.createdAt)}</strong>
                    </div>
                  </div>
                </div>
                {(form.actualizado_por || form.actualizado_por_email || form.updatedAt) && (
                  <div className="dn-audit-row">
                    <Clock size={16} className="dn-audit-ico" />
                    <div>
                      <div className="dn-audit-label">Última Actualización</div>
                      <div className="dn-audit-val">
                        Por: <strong>{form.actualizado_por_email || form.actualizado_por || "N/D"}</strong>
                        &nbsp;·&nbsp;<strong>{formatFecha(form.fecha_actualizacion_audit || form.fecha_actualizacion || form.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>
                )}
                <div className="dn-audit-ids">
                  <small>ID: <strong>{form._id || "—"}</strong></small>
                  <small>Estado: <strong>{form.estado || "N/D"}</strong></small>
                  <small>Año: <strong>{form.anio_academico || "N/D"}</strong></small>
                </div>
              </div>
              {!esEdicion && (
                <p style={{ fontSize:".8rem",color:"#9CA3AF",marginTop:16,textAlign:"center" }}>
                  La información de auditoría estará disponible una vez creado el grado.
                </p>
              )}
            </div>
          )}

          <div className="dn-modal-footer">
            <button type="button"
              style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",borderRadius:10,fontSize:".86rem",fontWeight:700,border:"none",cursor:"pointer",background:"#E0D9F5",color:"#6C4FBF",fontFamily:"inherit" }}
              onClick={onClose}
            >
              <X size={15} /> Cancelar
            </button>
            <button type="submit" disabled={loading}
              style={{ display:"inline-flex",alignItems:"center",gap:7,padding:"10px 20px",borderRadius:10,fontSize:".86rem",fontWeight:700,border:"none",cursor:"pointer",background:"#6C4FBF",color:"#fff",fontFamily:"inherit",opacity:loading?.6:1 }}
            >
              <Save size={15} /> {loading ? "Guardando..." : esEdicion ? "Guardar Cambios" : "Crear Grado"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════════════════════
export default function GradosPage() {
  const [items,        setItems]        = useState([]);
  const [gradosUnicos, setGradosUnicos] = useState([]);
  const [page,         setPage]         = useState(1);
  const [pages,        setPages]        = useState(1);
  const [total,        setTotal]        = useState(0);
  const [q,            setQ]            = useState("");
  const [searchInput,  setSearchInput]  = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [loading,      setLoading]      = useState(false);
  const [selected,     setSelected]     = useState(new Set());

  // Panel alumnos
  const [showAlumnosPanel,        setShowAlumnosPanel]        = useState(false);
  const [alumnosList,             setAlumnosList]             = useState([]);
  const [gradoNombreSeleccionado, setGradoNombreSeleccionado] = useState("");
  const [busquedaAlumnos,         setBusquedaAlumnos]         = useState("");
  const [alumnoDetalle,           setAlumnoDetalle]           = useState(null);

  const [showModal,    setShowModal]    = useState(false);
  const [gradoEditar,  setGradoEditar]  = useState(null);
  const [gradoAEliminar, setGradoAEliminar] = useState(null);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotif = (message, type = "success") => setNotification({ message, type });

  // Items filtrados localmente por estado
  const itemsFiltrados = useMemo(() => {
    let list = items;
    if (estadoFilter !== "Todos") list = list.filter(g => g.estado === estadoFilter);
    if (searchInput.trim()) {
      const t = searchInput.trim().toLowerCase();
      list = list.filter(g =>
        g.grado?.toLowerCase().includes(t) ||
        g.aula?.toLowerCase().includes(t) ||
        String(g.anio_academico).includes(t)
      );
    }
    // Filtro por primera palabra del grado (selector)
    if (q.trim()) {
      const qLower = q.trim().toLowerCase();
      list = list.filter(g => g.grado?.trim().split(" ")[0].toLowerCase() === qLower);
    }
    return list;
  }, [items, estadoFilter, searchInput, q]);

  // Stats dinámicos basados en itemsFiltrados
  const statsActivos   = itemsFiltrados.filter(g => g.estado === "Activo").length;
  const statsInactivos = itemsFiltrados.filter(g => g.estado === "Inactivo").length;
  const statsAlumnos   = itemsFiltrados.reduce((s, g) => s + (g.totalAlumnos || 0), 0);
  const statsTotal     = itemsFiltrados.length;

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page)); p.set("limit", "50");
    if (q) p.set("q", q); p.set("sort", "grado:asc");
    return p.toString();
  }, [page, q]);

  const fetchWithToken = async (url, options = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");
    const token = await user.getIdToken();
    const res = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Error");
    return data;
  };

  const fetchList = async (p = 1) => {
    try {
      setLoading(true); setPage(p);
      const data = await fetchWithToken(`${API}?${params}`);
      const itemsConAlumnos = await Promise.all(
        (data.items || []).map(async (grado) => {
          try {
            const resMat = await fetchWithToken(`${API_BASE}/api/matriculas?grado_a_matricular=${grado._id}`);
            return { ...grado, totalAlumnos: resMat.count || 0, listaAlumnos: resMat.data || [] };
          } catch {
            return { ...grado, totalAlumnos: 0, listaAlumnos: [] };
          }
        })
      );
      setItems(itemsConAlumnos);
      setTotal(data.total || 0); setPages(data.pages || 1);
      if (gradosUnicos.length === 0 && data.items)
        setGradosUnicos([...new Set(data.items.map(i => i.grado.trim().split(' ')[0]))].sort());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(page); }, [params]);

  const verAlumnos = (grado) => {
    setAlumnosList(grado.listaAlumnos || []);
    setGradoNombreSeleccionado(grado.grado);
    setBusquedaAlumnos("");
    setShowAlumnosPanel(true);
  };

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      const method = gradoEditar ? "PUT"  : "POST";
      const url    = gradoEditar ? `${API}/${gradoEditar._id}` : API;
      await fetchWithToken(url, { method, body: JSON.stringify(formData) });
      setShowModal(false); setGradoEditar(null);
      showNotif(gradoEditar ? "Grado actualizado exitosamente" : "Grado creado exitosamente");
      fetchList(page);
    } catch (err) {
      showNotif(err.message || "Error al guardar", "error");
    } finally { setLoading(false); }
  };

  const parsearGradoSeccion = (gradoStr) => {
    let gradoBase = gradoStr || "", seccion = "";
    const p = gradoBase.trim().split(" ");
    if (p.length >= 2 && SECCIONES.includes(p[p.length - 1].toUpperCase())) {
      seccion   = p[p.length - 1].toUpperCase();
      gradoBase = p.slice(0, -1).join(" ");
    }
    return { gradoBase, seccion };
  };

  const alumnosFiltrados = useMemo(() => {
    if (!busquedaAlumnos) return alumnosList;
    const t = busquedaAlumnos.toLowerCase();
    return alumnosList.filter(a =>
      a.nombre_completo?.toLowerCase().includes(t) ||
      a.id_documento?.toLowerCase().includes(t)
    );
  }, [alumnosList, busquedaAlumnos]);

  // Selección masiva
  const allIds = itemsFiltrados.map(g => g._id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };
  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Paginación local
  const PER_PAGE = 10;
  const [localPage, setLocalPage] = useState(1);
  useEffect(() => setLocalPage(1), [estadoFilter, searchInput]);
  const totalLocal = itemsFiltrados.length;
  const pagesLocal = Math.max(1, Math.ceil(totalLocal / PER_PAGE));
  const pageItems  = itemsFiltrados.slice((localPage - 1) * PER_PAGE, localPage * PER_PAGE);
  const desde = (localPage - 1) * PER_PAGE + 1;
  const hasta = Math.min(localPage * PER_PAGE, totalLocal);

  return (
    <>{/* ═══ HEADER DINÁMICO ══════════════════════════════════ */}
      <motion.div
        className="mm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      >
        <div className="mm-hi">
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
              <GraduationCap size={34} color="white" />
            </motion.span>
            Sistema de Grados y Secciones
          </motion.div>

          <motion.p className="mm-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {estadoFilter === "Todos"
              ? "Administra los grados académicos y sus secciones de manera independiente."
              : `Filtrando por: ${estadoFilter} · ${statsTotal} resultado${statsTotal !== 1 ? "s" : ""}`}
          </motion.p>

          <motion.div className="mm-stats" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            {[
              { ico: <GraduationCap size={18} color="white" />, val: statsTotal,    lbl: estadoFilter === "Todos" ? "Total Grados" : `${estadoFilter}s Filtrados` },
              { ico: <FiAward       size={18} color="white" />, val: statsActivos,   lbl: "Activos" },
              { ico: <FiBook        size={18} color="white" />, val: statsInactivos, lbl: "Inactivos" },
              { ico: <Users         size={18} color="white" />, val: statsAlumnos,   lbl: "Alumnos Matriculados" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="mm-stat"
                whileHover={{ scale: 1.04, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="mm-stat-ico">{s.ico}</div>
                <div>
                  <motion.div
                    key={s.val}
                    className="mm-stat-val"
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {s.val}
                  </motion.div>
                  <div className="mm-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    <div className="grados-container">
      <style>{CSS}</style>


      {/* ═══ TOOLBAR ════════════════════════════════════════════ */}
      <div className="container-fluid mt-3">
        <div className="gv-toolbar">
          {/* Botón nuevo */}
          <WithPermission requiredPermissions={["CREAR_GRADOS"]}>
            <motion.button
              className="gv-btn-primary"
              onClick={() => { setGradoEditar(null); setShowModal(true); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Plus size={16} /> Nuevo Grado
            </motion.button>
          </WithPermission>

          {/* Buscador */}
          <div className="gv-search-wrap">
            <Search size={15} />
            <input
              className="gv-search-input"
              placeholder="Buscar por grado, aula, año..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>

          {/* Filtro grado específico — solo primera palabra */}
          <select
            style={{
              padding: "9px 14px", borderRadius: 10, border: "1.5px solid #E0D9F5",
              fontSize: ".85rem", fontFamily: "inherit", color: "#4B5563",
              background: "#fff", outline: "none", cursor: "pointer",
            }}
            value={q}
            onChange={e => { setQ(e.target.value); fetchList(1); }}
          >
            <option value="">Todos los grados</option>
            {[...new Set(gradosUnicos.map(n => n.trim().split(" ")[0]))].sort().map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          {/* Chips estado */}
          <div className="gv-filter-bar" style={{ padding: 0, marginLeft: "auto" }}>
            <span className="gv-filter-label"><Filter size={12} /> ESTADO:</span>
            {ESTADOS_FILTER.map(e => (
              <button
                key={e}
                className={`gv-chip${estadoFilter === e ? " active" : ""}`}
                onClick={() => setEstadoFilter(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ TABLA ══════════════════════════════════════════════ */}
        <motion.div
          className="gv-table-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
        >
          <div className="gv-table-info">
            {loading
              ? "Cargando..."
              : totalLocal > 0
                ? <>Mostrando <strong>{desde}–{hasta}</strong> de <strong>{totalLocal}</strong> grado{totalLocal !== 1 ? "s" : ""}{estadoFilter !== "Todos" ? ` · ${estadoFilter}` : ""}</>
                : "Sin resultados"}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="gv-table">
              <thead>
                <tr>
                  <th>Grado</th>
                  <th>Sección</th>
                  <th>Año</th>
                  <th>Aula</th>
                  <th>Matriculados</th>
                  <th>F. Actualización</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && pageItems.length === 0 && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="gv-skeleton" style={{ width: "80%" }} /></td>
                      ))}
                    </tr>
                  ))
                )}

                {!loading && pageItems.map((g, idx) => {
                  const { gradoBase, seccion } = parsearGradoSeccion(g.grado);
                  return (
                    <motion.tr
                      key={g._id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <td>
                        <div className="gv-grado-code">{g.grado}</div>
                        {g.descripcion && <div className="gv-grado-desc">{g.descripcion}</div>}
                      </td>
                      <td>
                        {seccion
                          ? <span className="gv-seccion-badge">{seccion}</span>
                          : <span style={{ color: "#aaa", fontSize: ".8rem" }}>—</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: "#4B5563" }}>{g.anio_academico}</td>
                      <td style={{ fontWeight: 600, color: "#6C4FBF" }}>{g.aula || "—"}</td>
                      <td>
                        <button className="gv-alumnos-btn" onClick={() => verAlumnos(g)}>
                          <Users size={13} />
                          {g.totalAlumnos} Alumno{g.totalAlumnos !== 1 ? "s" : ""}
                        </button>
                      </td>
                      <td style={{ fontSize: ".8rem", color: "#7A6FA0" }}>
                        {formatFecha(g.updatedAt || g.fecha_actualizacion)}
                      </td>
                      <td>
                        <span className={`gv-badge ${g.estado === "Activo" ? "gv-badge-activo" : "gv-badge-inactivo"}`}>
                          {g.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="bienes-action-buttons">
                          <WithPermission requiredPermissions={["ACTUALIZAR_GRADOS"]}>
                            <button
                              className="bienes-btn-icon edit"
                              title="Editar"
                              onClick={() => { setGradoEditar(g); setShowModal(true); }}
                            >
                              <FiEdit2 size={15} />
                            </button>
                          </WithPermission>
                          {g.totalAlumnos === 0 && (
                            <WithPermission requiredPermissions={["ELIMINAR_GRADOS"]}>
                              <button
                                className="bienes-btn-icon delete"
                                title="Eliminar"
                                onClick={() => { setGradoAEliminar(g); setShowConfirm(true); }}
                              >
                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6M14 11v6"/>
                                  <path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            </WithPermission>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {!loading && pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="gv-empty">
                        <GraduationCap size={42} style={{ opacity: .2 }} />
                        <p>No se encontraron grados con los filtros aplicados.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="gv-pagination">
            <span className="gv-pagination-info">
              Página <strong>{localPage}</strong> de <strong>{pagesLocal}</strong>
            </span>
            <div className="gv-pagination-btns">
              <button className="gv-pg-btn" disabled={localPage <= 1} onClick={() => setLocalPage(1)}>«</button>
              <button className="gv-pg-btn" disabled={localPage <= 1} onClick={() => setLocalPage(p => p - 1)}>‹</button>
              {Array.from({ length: pagesLocal }, (_, i) => i + 1)
                .filter(n => n === 1 || n === pagesLocal || Math.abs(n - localPage) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "..." ? (
                    <span key={`e${i}`} style={{ padding: "0 4px", color: "#9CA3AF", fontSize: ".82rem" }}>…</span>
                  ) : (
                    <button
                      key={n}
                      className={`gv-pg-btn${localPage === n ? " active" : ""}`}
                      onClick={() => setLocalPage(n)}
                    >
                      {n}
                    </button>
                  )
                )}
              <button className="gv-pg-btn" disabled={localPage >= pagesLocal} onClick={() => setLocalPage(p => p + 1)}>›</button>
              <button className="gv-pg-btn" disabled={localPage >= pagesLocal} onClick={() => setLocalPage(pagesLocal)}>»</button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ PANEL LATERAL ALUMNOS ══════════════════════════════ */}
      <AnimatePresence>
        {showAlumnosPanel && (
          <motion.div
            className="ga-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowAlumnosPanel(false); setAlumnoDetalle(null); }}
          >
            <motion.div
              className="ga-panel"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="ga-panel-header">
                <h2>Alumnos matriculados</h2>
                <p>Grado: <strong>{gradoNombreSeleccionado}</strong></p>
                <div className="ga-count-badge">
                  <Users size={12} /> {alumnosFiltrados.length} de {alumnosList.length}
                </div>
                <button className="ga-panel-close" onClick={() => { setShowAlumnosPanel(false); setAlumnoDetalle(null); }}>
                  <X size={18} />
                </button>
              </div>

              <div className="ga-search">
                <Search size={15} color="#7A6FA0" />
                <input
                  placeholder="Buscar por nombre o documento..."
                  value={busquedaAlumnos}
                  onChange={e => setBusquedaAlumnos(e.target.value)}
                />
                {busquedaAlumnos && (
                  <button style={{ border:"none",background:"none",cursor:"pointer",color:"#7A6FA0" }} onClick={() => setBusquedaAlumnos("")}>×</button>
                )}
              </div>

              <div className="ga-list">
                {alumnosFiltrados.length === 0 ? (
                  <div className="ga-empty">
                    <AlertCircle size={36} style={{ opacity:.3 }} />
                    <p>{busquedaAlumnos ? "No hay alumnos con esa búsqueda." : "No hay alumnos matriculados en este grado."}</p>
                  </div>
                ) : alumnosFiltrados.map((al, idx) => (
                  <motion.div
                    key={al._id || idx}
                    className="ga-card"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                    onClick={() => setAlumnoDetalle(al)}
                  >
                    <div className="ga-avatar">{iniciales(al.nombre_completo)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ga-card-name" style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                        {al.nombre_completo}
                      </div>
                      <div className="ga-card-doc">Doc: {al.id_documento || "—"}</div>
                    </div>
                    <span className="ga-card-grade" style={{ flexShrink: 0 }}>
                      {al.edad ? `${al.edad} años` : gradoNombreSeleccionado}
                    </span>
                    <ChevronRight size={14} className="ga-card-chevron" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ DRAWER DETALLE ALUMNO ══════════════════════════════ */}
      <AnimatePresence>
        {alumnoDetalle && (
          <motion.div
            className="ga-drawer-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setAlumnoDetalle(null)}
          >
            <motion.div
              className="ga-drawer"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="ga-drawer-header">
                <div className="ga-avatar" style={{ width:48,height:48,fontSize:"1.1rem",marginBottom:8 }}>
                  {iniciales(alumnoDetalle.nombre_completo)}
                </div>
                <h3>{alumnoDetalle.nombre_completo}</h3>
                <p>{gradoNombreSeleccionado} · {alumnoDetalle.edad ? `${alumnoDetalle.edad} años` : ""}</p>
              </div>
              <div className="ga-drawer-body">
                <div className="ga-section-title">Datos Personales</div>
                <div className="ga-field-grid">
                  <div className="ga-field"><div className="ga-field-label">Documento</div><div className="ga-field-value">{alumnoDetalle.id_documento || "—"}</div></div>
                  <div className="ga-field"><div className="ga-field-label">Edad</div><div className="ga-field-value">{alumnoDetalle.edad ? `${alumnoDetalle.edad} años` : "—"}</div></div>
                  <div className="ga-field"><div className="ga-field-label">Género</div><div className="ga-field-value">{alumnoDetalle.genero || "—"}</div></div>
                  <div className="ga-field">
                    <div className="ga-field-label">Estado</div>
                    <div className="ga-field-value">
                      <span className={`ga-card-grade ${(alumnoDetalle.estado || "activo") === "activo" ? "ga-estado-activo" : "ga-estado-inactivo"}`}
                        style={{ fontSize:".78rem",padding:"3px 9px" }}>
                        {alumnoDetalle.estado || "activo"}
                      </span>
                    </div>
                  </div>
                  <div className="ga-field ga-field-full"><div className="ga-field-label">Dirección</div><div className="ga-field-value">{alumnoDetalle.residencia_direccion || "—"}</div></div>
                  {alumnoDetalle.telefono_alumno && (
                    <div className="ga-field"><div className="ga-field-label">Teléfono</div><div className="ga-field-value">{alumnoDetalle.telefono_alumno}</div></div>
                  )}
                </div>
                {alumnoDetalle.nombre_encargado && (<>
                  <div className="ga-section-title">Encargado</div>
                  <div className="ga-field-grid">
                    <div className="ga-field ga-field-full"><div className="ga-field-label">Nombre</div><div className="ga-field-value">{alumnoDetalle.nombre_encargado}</div></div>
                    <div className="ga-field"><div className="ga-field-label">Parentesco</div><div className="ga-field-value">{alumnoDetalle.parentesco_encargado || "—"}</div></div>
                    <div className="ga-field"><div className="ga-field-label">Teléfono</div><div className="ga-field-value">{alumnoDetalle.telefono_encargado || "—"}</div></div>
                    {alumnoDetalle.email_encargado && (
                      <div className="ga-field ga-field-full"><div className="ga-field-label">Email</div><div className="ga-field-value">{alumnoDetalle.email_encargado}</div></div>
                    )}
                  </div>
                </>)}
                {(alumnoDetalle.alergias || alumnoDetalle.enfermedades) && (<>
                  <div className="ga-section-title">Datos Médicos</div>
                  <div className="ga-field-grid">
                    {alumnoDetalle.alergias && <div className="ga-field"><div className="ga-field-label">Alergias</div><div className="ga-field-value">{alumnoDetalle.alergias}</div></div>}
                    {alumnoDetalle.enfermedades && <div className="ga-field"><div className="ga-field-label">Enfermedades</div><div className="ga-field-value">{alumnoDetalle.enfermedades}</div></div>}
                    <div className="ga-field"><div className="ga-field-label">Vacunas al día</div><div className="ga-field-value">{alumnoDetalle.vacunas_al_dia ? "Sí" : "No"}</div></div>
                  </div>
                </>)}
              </div>
              <button className="ga-close-drawer" onClick={() => setAlumnoDetalle(null)}>← Volver a la lista</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <ModalGrado
            onClose={() => { setShowModal(false); setGradoEditar(null); }}
            onSave={handleSave}
            gradoEditando={gradoEditar}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* ═══ CONFIRM ══════════════════════════════════════════════ */}
      <ConfirmDialog
        visible={showConfirm}
        message={`¿Seguro que deseas eliminar "${gradoAEliminar?.grado}"?`}
        onConfirm={async () => {
          try {
            await fetchWithToken(`${API}/${gradoAEliminar._id}`, { method: "DELETE" });
            showNotif(`"${gradoAEliminar.grado}" eliminado correctamente`);
          } catch (err) {
            showNotif(err.message || "Error al eliminar", "error");
          }
          setShowConfirm(false);
          fetchList(page);
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* ═══ NOTIFICACIONES ══════════════════════════════════════ */}
      <AnimatePresence>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div></>
  );
}