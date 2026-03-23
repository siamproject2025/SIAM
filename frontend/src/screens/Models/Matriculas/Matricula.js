// ============================================================
// App.jsx — Módulo de Matrícula y Expediente de Alumnos
//
// ENDPOINTS USADOS:
//   GET    /api/matriculas              → lista todos los alumnos
//   POST   /api/matriculas              → nuevo alumno + primera matrícula
//   GET    /api/matriculas/:id          → detalle
//   PUT    /api/matriculas/:id          → editar expediente (no toca historial)
//   DELETE /api/matriculas/:id          → eliminar
//   POST   /api/matriculas/:id/matricular    → NUEVO AÑO (usa $push, no sobreescribe)
//   PUT    /api/matriculas/:id/historial/:mid → editar entrada del historial
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserPlus, Calendar } from 'lucide-react';
import '../../../styles/Matriculas.css';
import StudentForm from '../../../components/StudentForm';
import Modal from '../../../components/Modal';
import Notification from '../../../components/Notification';
import { auth } from '../../../components/authentication/Auth';
import { loadingController } from '../../../api/loadingController';
import WithPermission from '../../../components/Permisos/WithPermission';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_URL    = process.env.REACT_APP_API_URL + '/api/matriculas';
const API_GRADOS = process.env.REACT_APP_API_URL + '/api/grados';
const CURRENT_YEAR = new Date().getFullYear();
const PER_PAGE     = 10;
const YEARS_OPT    = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('No estás autenticado. Por favor inicia sesión.');
    return user.getIdToken();
};

const buildFormData = (obj) => {
    const fd = new FormData();
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
    });
    return fd;
};

// ── Íconos ───────────────────────────────────────────────────
const IcoEdit   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>;
const IcoEye    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoDL     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoBooks  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IcoPlus   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ── CSS ──────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Poppins:wght@700;800&display=swap');
  .mm-wrap{font-family:'Nunito',sans-serif;background:#F4F3FB;min-height:100vh;}
  .mm-header{background:linear-gradient(135deg,#6C4FBF 0%,#9B59B6 100%);padding:28px 36px 36px;position:relative;overflow:hidden;}
  .mm-header::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/svg%3E");pointer-events:none;}
  .mm-hi{position:relative;z-index:1;}
  .mm-ht{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
  .mm-htitle{font-family:'Poppins',sans-serif;font-size:1.65rem;font-weight:800;color:#fff;display:flex;align-items:center;gap:12px;}
  .mm-sub{color:rgba(255,255,255,.8);font-size:.9rem;margin-bottom:22px;}
  .mm-stats{display:flex;gap:14px;flex-wrap:wrap;}
  .mm-stat{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:12px;padding:11px 18px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(6px);min-width:130px;}
  .mm-stat-ico{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:#fff;}
  .mm-stat-val{font-size:1.35rem;font-weight:800;color:#fff;line-height:1;}
  .mm-stat-lbl{font-size:.7rem;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.05em;}
  .mm-btn-grados{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:9px;color:#fff;font-size:.85rem;font-weight:700;cursor:pointer;transition:background .2s;font-family:inherit;}
  .mm-btn-grados:hover{background:rgba(255,255,255,.28);}
  .mm-tabs{display:flex;padding:0 36px;background:#4B3090;}
  .mm-tab{padding:13px 22px;font-size:.87rem;font-weight:700;cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,.6);border-bottom:3px solid transparent;transition:all .2s;font-family:inherit;display:flex;align-items:center;gap:7px;}
  .mm-tab:hover{color:#fff;}
  .mm-tab.active{color:#fff;border-bottom-color:#fff;}
  .mm-body{padding:24px 36px;}
  .mm-toolbar{display:flex;gap:12px;align-items:center;margin-bottom:20px;flex-wrap:wrap;}
  .mm-sw{flex:1;min-width:220px;display:flex;align-items:center;gap:10px;background:#fff;border:2px solid #E0D9F5;border-radius:10px;padding:9px 14px;transition:border-color .2s;}
  .mm-sw:focus-within{border-color:#6C4FBF;}
  .mm-sw input{border:none;outline:none;flex:1;font-size:.9rem;font-family:inherit;color:#2D2250;background:transparent;}
  .mm-sw input::placeholder{color:#7A6FA0;}
  .mm-fsel{padding:8px 12px;border-radius:8px;border:2px solid #E0D9F5;font-family:inherit;font-size:.85rem;color:#2D2250;background:#fff;cursor:pointer;outline:none;}
  .mm-fsel:focus{border-color:#6C4FBF;}
  .mm-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;font-size:.86rem;font-weight:700;border:none;cursor:pointer;font-family:inherit;transition:all .18s;}
  .mm-primary{background:#6C4FBF;color:#fff;}.mm-primary:hover{background:#4B3090;}
  .mm-danger{background:#E74C3C;color:#fff;}.mm-danger:hover{background:#c0392b;}
  .mm-success{background:#27AE60;color:#fff;}.mm-success:hover{background:#1e8449;}
  .mm-ghost{background:#E0D9F5;color:#6C4FBF;}.mm-ghost:hover{background:#6C4FBF;color:#fff;}
  .mm-orange{background:#F39C12;color:#fff;}.mm-orange:hover{background:#d68910;}
  .mm-tw{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 16px rgba(108,79,191,.08);border:1px solid #E0D9F5;}
  .mm-tbl{width:100%;border-collapse:collapse;}
  .mm-tbl thead{background:linear-gradient(135deg,#6C4FBF,#9B59B6);}
  .mm-tbl thead th{padding:12px 15px;text-align:left;font-size:.76rem;font-weight:700;color:rgba(255,255,255,.9);text-transform:uppercase;letter-spacing:.07em;white-space:nowrap;}
  .mm-tbl tbody tr{border-bottom:1px solid #E0D9F5;transition:background .15s;}
  .mm-tbl tbody tr:last-child{border-bottom:none;}
  .mm-tbl tbody tr:hover{background:#F8F5FF;}
  .mm-tbl td{padding:12px 15px;font-size:.875rem;vertical-align:middle;}
  .mm-np{font-weight:700;color:#2D2250;}
  .mm-ns{font-size:.78rem;color:#7A6FA0;margin-top:2px;}
  .mm-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:.74rem;font-weight:700;}
  .bg-purple{background:#EDE9FF;color:#6C4FBF;}
  .bg-green{background:#D4F5E2;color:#1a7a40;}
  .bg-red{background:#FDE8E8;color:#b02a2a;}
  .bg-orange{background:#FFF3E0;color:#b45309;}
  .bg-gray{background:#F0F0F0;color:#555;}
  .mm-ybadge{background:#6C4FBF;color:#fff;border-radius:6px;padding:2px 8px;font-size:.73rem;font-weight:800;display:inline-block;cursor:default;}
  .mm-ib{width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
  .ib-view{background:#E8F4FD;color:#2980B9;}.ib-view:hover{background:#2980B9;color:#fff;}
  .ib-edit{background:#EDE9FF;color:#6C4FBF;}.ib-edit:hover{background:#6C4FBF;color:#fff;}
  .ib-del{background:#FDE8E8;color:#E74C3C;}.ib-del:hover{background:#E74C3C;color:#fff;}
  .ib-remat{background:#D4F5E2;color:#1a7a40;}.ib-remat:hover{background:#1a7a40;color:#fff;}
  .ib-baja{background:#FFF3E0;color:#b45309;}.ib-baja:hover{background:#b45309;color:#fff;}
  .ib-activo{background:#D4F5E2;color:#1a7a40;}.ib-activo:hover{background:#1a7a40;color:#fff;}
  .mm-ir{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;}
  .mm-cnt{font-size:.82rem;color:#7A6FA0;}
  .mm-pag{display:flex;gap:6px;justify-content:center;padding:18px 0;flex-wrap:wrap;}
  .mm-pb{width:32px;height:32px;border-radius:8px;border:2px solid #E0D9F5;background:transparent;cursor:pointer;font-size:.84rem;font-weight:700;color:#7A6FA0;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;}
  .mm-pb:hover{border-color:#6C4FBF;color:#6C4FBF;}
  .mm-pb.active{background:#6C4FBF;border-color:#6C4FBF;color:#fff;}
  .mm-pb:disabled{opacity:.35;cursor:not-allowed;}
  .mm-empty{text-align:center;padding:52px 20px;color:#7A6FA0;}
  .mm-spin{width:36px;height:36px;border:3px solid #E0D9F5;border-top-color:#6C4FBF;border-radius:50%;animation:mmSp .7s linear infinite;margin:0 auto 12px;}
  @keyframes mmSp{to{transform:rotate(360deg);}}
  .mm-ab{display:flex;gap:6px;}
  .mm-dg{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px;}
  .mm-di{background:#FAF9FF;border-radius:10px;padding:10px 14px;border:1px solid #E0D9F5;}
  .mm-dl{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#7A6FA0;margin-bottom:3px;}
  .mm-dv{font-size:.88rem;font-weight:600;color:#2D2250;}
  .mm-st{display:flex;align-items:center;gap:8px;font-family:'Poppins',sans-serif;font-size:.9rem;font-weight:700;color:#6C4FBF;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #E0D9F5;margin-top:16px;}
  .mm-err-banner{display:flex;gap:10px;align-items:center;background:#FDE8E8;border:1px solid #f5c6cb;border-radius:10px;padding:12px 18px;margin-bottom:18px;color:#7a1010;font-size:.9rem;}
  .mm-info-box{display:flex;gap:10px;padding:10px 14px;border-radius:9px;margin-bottom:12px;font-size:.84rem;background:#E8F4FD;border-left:4px solid #2980B9;color:#0c4a6e;}
  .mm-warn-box{padding:10px 14px;border-radius:9px;margin-top:6px;font-size:.82rem;background:#FFF3E0;border-left:4px solid #F39C12;color:#713f12;}
  .mm-remat-card{background:#F0ECFF;border:2px solid #C4B5E8;border-radius:12px;padding:14px 18px;margin-bottom:16px;}
  .mm-remat-title{font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:700;color:#6C4FBF;margin-bottom:10px;}
  .mm-remat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
  .mm-remat-item{background:#fff;border-radius:8px;padding:8px 12px;border:1px solid #D6CCEF;}
  .mm-remat-lbl{font-size:.7rem;font-weight:700;color:#7A6FA0;text-transform:uppercase;margin-bottom:2px;}
  .mm-remat-val{font-size:.86rem;font-weight:600;color:#2D2250;}
  .mm-hist-row{display:flex;align-items:center;gap:10px;background:#FAF9FF;border-radius:10px;padding:10px 14px;border:1px solid #E0D9F5;margin-bottom:6px;flex-wrap:wrap;}
  .mm-hist-meta{margin-left:auto;font-size:.76rem;color:#7A6FA0;}
  .mm-audit{background:#FAF9FF;border-radius:10px;padding:10px 14px;margin-top:10px;font-size:.82rem;color:#7A6FA0;border-left:3px solid #C4B5E8;}
  @media(max-width:700px){.mm-header{padding:18px 14px 22px;}.mm-body{padding:14px;}.mm-tabs{padding:0 8px;}.mm-stats{gap:8px;}}
`;

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
function App() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab]               = useState('alumnos');
    const [students, setStudents]                 = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [loading, setLoading]                   = useState(false);
    const [error, setError]                       = useState(null);
    const [notification, setNotification]         = useState(null);
    const [grados, setGrados]                     = useState([]);

    // Modales
    const [showCreateModal, setShowCreateModal]   = useState(false);
    const [showEditModal, setShowEditModal]       = useState(false);
    const [editingStudent, setEditingStudent]     = useState(null);
    const [showDetailModal, setShowDetailModal]   = useState(false);
    const [detailStudent, setDetailStudent]       = useState(null);
    const [showRematModal, setShowRematModal]     = useState(false);
    const [rematAlumno, setRematAlumno]           = useState(null);
    const [editingHistEntry, setEditingHistEntry] = useState(null); // {alumno, entrada}

    // Filtros
    const [search, setSearch]             = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterGrado, setFilterGrado]   = useState('');
    const [filterAnio, setFilterAnio]     = useState('');
    const [page, setPage]                 = useState(1);

    // ── Grados ──────────────────────────────────────────────
    const fetchGrados = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(API_GRADOS, { headers: { Authorization: `Bearer ${token}` } });
            setGrados(res.data.items.map(i => ({ _id: i._id, nombre: i.grado })));
        } catch {
            setGrados([
                {_id:'1',nombre:'Primer Grado'},{_id:'2',nombre:'Segundo Grado'},
                {_id:'3',nombre:'Tercer Grado'},{_id:'4',nombre:'Cuarto Grado'},
                {_id:'5',nombre:'Quinto Grado'},{_id:'6',nombre:'Sexto Grado'},
            ]);
        }
    };

    const getNombreGrado = (id) => grados.find(x => x._id === id)?.nombre || id || 'N/A';

    // ── Fetch alumnos ────────────────────────────────────────
    const fetchStudents = async () => {
        setLoading(true); setError(null);
        try {
            loadingController.start();
            const token = await getToken();
            const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
            const data = await res.json();
            setStudents(Array.isArray(data.data) ? data.data : []);
        } catch (err) {
            setError('Error al cargar los estudiantes: ' + err.message);
            setStudents([]);
        } finally { setLoading(false); loadingController.stop(); }
    };

    useEffect(() => { fetchStudents(); fetchGrados(); }, []);

    // ── Stats ────────────────────────────────────────────────
    const totalEstudiantes   = students.length;
    const estudiantesActivos = students.filter(s => (s.estado||'activo') === 'activo').length;
    const estudiantesNuevos  = students.filter(s => {
        const f = new Date(s.fecha_matricula || s.fechaRegistro);
        return f > new Date(Date.now() - 30*24*60*60*1000);
    }).length;
    const uniqueAnios = [...new Set(
        students.flatMap(s => {
            const delHist = (s.historial_matriculas||[]).map(m => m.anio_matricula);
            const actual  = s.anio_matricula || (s.fecha_matricula ? new Date(s.fecha_matricula).getFullYear() : null);
            return [...delHist, actual].filter(Boolean);
        })
    )].sort((a,b) => b-a);

    const uniqueGrades = [...new Set(students.map(s => s.grado_a_matricular).filter(Boolean))];

    // ── CREATE ───────────────────────────────────────────────
    const createStudent = async (studentData) => {
        try {
            loadingController.start();
            const token = await getToken();
            const user  = auth.currentUser;
            const fd = buildFormData({ ...studentData, creado_por: user?.email || 'sistema' });
            const res = await fetch(API_URL, {
                method: 'POST', body: fd,
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error al crear la matrícula');
            setShowCreateModal(false);
            fetchStudents();
            setNotification({ message: result.message || 'Estudiante matriculado exitosamente', type: 'success' });
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally { loadingController.stop(); }
    };

    // ── UPDATE expediente (no toca historial) ────────────────
    const updateStudent = async (studentData) => {
        try {
            loadingController.start();
            const token = await getToken();
            const user  = auth.currentUser;
            // Eliminar historial para que el controlador no lo sobreescriba
            const { historial_matriculas, ...dataLimpia } = studentData;
            const fd = buildFormData({ ...dataLimpia, actualizado_por: user?.email || 'sistema' });
            const res = await fetch(`${API_URL}/${editingStudent._id}`, {
                method: 'PUT', body: fd,
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error al actualizar');
            setShowEditModal(false); setEditingStudent(null);
            fetchStudents();
            setNotification({ message: result.message || 'Estudiante actualizado exitosamente', type: 'success' });
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally { loadingController.stop(); }
    };

    // ── REMATRICULAR — POST /:id/matricular ($push, no sobreescribe) ──
    const crearNuevoAnio = async (matData) => {
        try {
            loadingController.start();
            const token = await getToken();
            const user  = auth.currentUser;
            const payload = {
                anio_matricula:     matData.anio_matricula,
                grado_a_matricular: matData.grado_a_matricular,
                estado_matricula:   matData.estado_matricula || 'activa',
                notas:              matData.notas || '',
                realizado_por:      user?.email || 'sistema',
            };
            const res = await fetch(`${API_URL}/${rematAlumno._id}/matricular`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error al registrar la matrícula');
            setShowRematModal(false); setRematAlumno(null);
            fetchStudents();
            setNotification({ message: result.message || 'Año de matrícula registrado exitosamente', type: 'success' });
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally { loadingController.stop(); }
    };

    // ── Editar entrada del historial ─────────────────────────
    const editarEntradaHistorial = async (matData) => {
        const { alumno, entrada } = editingHistEntry;
        try {
            loadingController.start();
            const token = await getToken();
            const res = await fetch(`${API_URL}/${alumno._id}/historial/${entrada._id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado_matricula: matData.estado_matricula, notas: matData.notas }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error al actualizar');
            setEditingHistEntry(null);
            fetchStudents();
            setNotification({ message: 'Entrada del historial actualizada', type: 'success' });
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally { loadingController.stop(); }
    };

    // ── DELETE ───────────────────────────────────────────────
    const deleteStudent = async (student) => {
        if (!student?._id) { setNotification({ message: 'ID no válido', type: 'error' }); return; }
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/${student._id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchStudents();
                setSelectedStudents(prev => prev.filter(id => id !== student._id));
                if (showEditModal) { setShowEditModal(false); setEditingStudent(null); }
                setNotification({ message: 'Estudiante eliminado exitosamente', type: 'success' });
            } else {
                const r = await res.json();
                throw new Error(r.message || 'Error al eliminar');
            }
        } catch (err) { setNotification({ message: err.message, type: 'error' }); }
    };

    const deleteSelectedStudents = async () => {
        if (selectedStudents.length === 0) {
            setNotification({ message: 'Seleccione al menos un estudiante', type: 'error' }); return;
        }
        const conf = await Swal.fire({
            title: '¿Confirmar eliminación?',
            text: `¿Eliminar ${selectedStudents.length} estudiante(s) seleccionados?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#E74C3C', cancelButtonColor: '#6C4FBF',
            confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        });
        if (!conf.isConfirmed) return;
        try {
            const token = await getToken();
            await Promise.all(selectedStudents.map(id =>
                fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            ));
            setSelectedStudents([]); fetchStudents();
            setNotification({ message: 'Estudiantes eliminados exitosamente', type: 'success' });
        } catch (err) { setNotification({ message: err.message, type: 'error' }); }
    };

    // ── Cambiar estado activo/inactivo via PUT ───────────────
    const cambiarEstado = async (student, nuevoEstado) => {
        const accion = nuevoEstado === 'inactivo' ? 'dar de baja' : 'reactivar';
        const conf = await Swal.fire({
            title: nuevoEstado === 'inactivo' ? '¿Dar de baja?' : '¿Reactivar alumno?',
            text: `¿Deseas ${accion} a "${student.nombre_completo}"?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: nuevoEstado === 'inactivo' ? '#F39C12' : '#27AE60',
            cancelButtonColor: '#6C4FBF',
            confirmButtonText: 'Sí', cancelButtonText: 'Cancelar',
        });
        if (!conf.isConfirmed) return;
        try {
            loadingController.start();
            const token = await getToken();
            const { historial_matriculas, imagen, foto_preview, ...resto } = student;
            const fd = buildFormData({ ...resto, estado: nuevoEstado });
            const res = await fetch(`${API_URL}/${student._id}`, {
                method: 'PUT', body: fd, headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Error al cambiar estado');
            fetchStudents();
            setNotification({ message: result.message || `Alumno ${nuevoEstado === 'inactivo' ? 'dado de baja' : 'reactivado'} exitosamente`, type: 'success' });
        } catch (err) {
            setNotification({ message: err.message, type: 'error' });
        } finally { loadingController.stop(); }
    };

    // ── Filtrado ─────────────────────────────────────────────
    const filtered = useMemo(() => {
        let r = students;
        if (search) {
            const t = search.toLowerCase();
            r = r.filter(s =>
                s.nombre_completo?.toLowerCase().includes(t) ||
                s.id_documento?.toLowerCase().includes(t) ||
                s.nombre_encargado?.toLowerCase().includes(t) ||
                s.telefono_encargado?.toLowerCase().includes(t)
            );
        }
        if (filterEstado) r = r.filter(s => (s.estado||'activo') === filterEstado);
        if (filterGrado)  r = r.filter(s => s.grado_a_matricular === filterGrado);
        if (filterAnio) {
            r = r.filter(s => {
                const anios = (s.historial_matriculas||[]).map(m => m.anio_matricula?.toString());
                const actual = (s.anio_matricula || (s.fecha_matricula ? new Date(s.fecha_matricula).getFullYear() : null))?.toString();
                return anios.includes(filterAnio) || actual === filterAnio;
            });
        }
        return r;
    }, [students, search, filterEstado, filterGrado, filterAnio]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const pageItems  = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

    const handleDeleteClick = (s) => {
        Swal.fire({
            title: '¿Confirmar eliminación?',
            text: `¿Eliminar a "${s.nombre_completo}"? No podrás revertirlo.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#E74C3C', cancelButtonColor: '#6C4FBF',
            confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
        }).then(r => { if (r.isConfirmed) deleteStudent(s); });
    };

    const handleTabChange = (t) => {
        setActiveTab(t); setSearch(''); setPage(1);
        setFilterEstado(''); setFilterGrado(''); setFilterAnio('');
    };

    // ── Descargas ────────────────────────────────────────────
    const downloadPDF = () => {
        const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:[250,350] });
        try { doc.addImage('/Logo1.png','PNG',15,10,25,25); } catch(e){}
        doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(108,79,191);
        doc.text('Escuela Experimental de Niños para la Música',210,20,{align:'center'});
        doc.setFontSize(12); doc.setTextColor(60,60,60);
        doc.text('Reporte Completo de Estudiantes',210,28,{align:'center'});
        doc.setDrawColor(108,79,191); doc.line(14,33,410,33);
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,80,80);
        doc.text(`Total: ${filtered.length}  |  Fecha: ${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'})}`,14,40);
        autoTable(doc,{
            startY:46,
            head:[['Nombre','Documento','Edad','Grado Actual','Años Cursados','Encargado','Tel. Enc.','Estado']],
            body: filtered.map(s=>[
                s.nombre_completo||'N/A', s.id_documento||'N/A', s.edad||'N/A',
                getNombreGrado(s.grado_a_matricular),
                (s.historial_matriculas||[]).map(m=>m.anio_matricula).sort((a,b)=>a-b).join(', ')||s.anio_matricula||'N/A',
                s.nombre_encargado||'N/A', s.telefono_encargado||'N/A', s.estado||'activo',
            ]),
            theme:'striped', styles:{fontSize:7,cellPadding:1.5},
            headStyles:{fillColor:[108,79,191],textColor:255,fontStyle:'bold',fontSize:8},
            alternateRowStyles:{fillColor:[245,242,255]},
            margin:{left:8,right:8},
        });
        doc.save(`reporte_estudiantes_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadXLSX = () => {
        const wb = XLSX.utils.book_new();
        const data = filtered.map(s=>({
            'Nombre':s.nombre_completo||'N/A','Documento':s.id_documento||'N/A',
            'Edad':s.edad||'N/A','Género':s.genero||'N/A','Estado':s.estado||'activo',
            'Grado Actual':getNombreGrado(s.grado_a_matricular),
            'Años Cursados':(s.historial_matriculas||[]).map(m=>m.anio_matricula).sort((a,b)=>a-b).join(', ')||s.anio_matricula||'N/A',
            'Alergias':s.alergias||'Ninguna','Enfermedades':s.enfermedades||'Ninguna',
            'Encargado':s.nombre_encargado||'N/A','Parentesco':s.parentesco_encargado||'N/A',
            'Tel. Encargado':s.telefono_encargado||'N/A',
            'Registrado por':s.creado_por||'N/A',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = Array(14).fill({wch:22});
        XLSX.utils.book_append_sheet(wb,ws,'Estudiantes');
        XLSX.writeFile(wb,`estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // ── Render ───────────────────────────────────────────────
    return (
        <div className="mm-wrap">
            <style>{CSS}</style>

            {/* HEADER */}
            <motion.div className="mm-header"
                initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
                transition={{duration:0.5,type:'spring',stiffness:120}}>
                <div className="mm-hi">
                    <div className="mm-ht">
                        <motion.div className="mm-htitle"
                            initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{delay:0.15}}>
                            <motion.span initial={{rotate:-180,scale:0}} animate={{rotate:0,scale:1}}
                                transition={{type:'spring',stiffness:200,delay:0.2}}>
                                <Users size={34} color="white" fill="white"/>
                            </motion.span>
                            Gestión de Estudiantes
                        </motion.div>
                        <motion.button className="mm-btn-grados" onClick={()=>navigate('/grados')}
                            initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} transition={{delay:0.25}}
                            whileHover={{scale:1.04}} whileTap={{scale:0.96}}>
                            <IcoBooks/> Grados
                        </motion.button>
                    </div>
                    <motion.p className="mm-sub" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}>
                        Administra y supervisa el registro de estudiantes de manera eficiente.
                    </motion.p>
                    <motion.div className="mm-stats"
                        initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}>
                        {[
                            {ico:<Users size={18} color="white"/>,     val:totalEstudiantes,   lbl:'Total Estudiantes'},
                            {ico:<UserCheck size={18} color="white"/>, val:estudiantesActivos, lbl:'Activos'},
                            {ico:<UserPlus size={18} color="white"/>,  val:estudiantesNuevos,  lbl:'Nuevos (30 días)'},
                            {ico:<Calendar size={18} color="white"/>,  val:uniqueAnios[0]||'—',lbl:'Año en Curso'},
                        ].map((s,i)=>(
                            <motion.div key={i} className="mm-stat"
                                whileHover={{scale:1.04,y:-2}} transition={{type:'spring',stiffness:300}}>
                                <div className="mm-stat-ico">{s.ico}</div>
                                <div><div className="mm-stat-val">{s.val}</div><div className="mm-stat-lbl">{s.lbl}</div></div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* TABS */}
            <div className="mm-tabs">
                <button className={`mm-tab${activeTab==='alumnos'?' active':''}`}
                    onClick={()=>handleTabChange('alumnos')}>
                    <Users size={15}/> Alumnos
                </button>
                <button className={`mm-tab${activeTab==='historial'?' active':''}`}
                    onClick={()=>handleTabChange('historial')}>
                    <Calendar size={15}/> Historial por Año
                </button>
            </div>

            <div className="mm-body">
                {error && (
                    <div className="mm-err-banner">
                        <i className="fas fa-exclamation-triangle"/> {error}
                        <button onClick={fetchStudents} className="mm-btn mm-ghost"
                            style={{marginLeft:'auto',padding:'6px 14px',fontSize:'.82rem'}}>Reintentar</button>
                    </div>
                )}

                <AnimatePresence mode="wait">

                    {/* ══════ TAB: ALUMNOS ══════ */}
                    {activeTab === 'alumnos' && (
                        <motion.div key="alumnos"
                            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                            exit={{opacity:0,y:-10}} transition={{duration:0.2}}>

                            <div className="mm-toolbar">
                                <div className="mm-sw">
                                    <IcoSearch/>
                                    <input placeholder="Buscar por nombre, documento, encargado..."
                                        value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
                                    {search&&<button style={{border:'none',background:'none',cursor:'pointer',color:'#7A6FA0',fontSize:'1.1rem'}}
                                        onClick={()=>{setSearch('');setPage(1);}}>×</button>}
                                </div>
                                <select className="mm-fsel" value={filterEstado} onChange={e=>{setFilterEstado(e.target.value);setPage(1);}}>
                                    <option value="">Todos los estados</option>
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                                {filtered.length>0&&<>
                                    <button className="mm-btn mm-success" onClick={downloadPDF}><IcoDL/> PDF</button>
                                    <button className="mm-btn mm-success" onClick={downloadXLSX}><IcoDL/> Excel</button>
                                </>}
                                <WithPermission requiredPermissions={['CREAR_MATRICULA']}>
                                    <button className="mm-btn mm-primary" onClick={()=>setShowCreateModal(true)}>
                                        <i className="fas fa-plus"/> Nueva Matrícula
                                    </button>
                                </WithPermission>
                                <WithPermission requiredPermissions={['ELIMINAR_MATRICULA']}>
                                    <button className="mm-btn mm-danger" onClick={deleteSelectedStudents}>
                                        <i className="fas fa-trash"/> Eliminar ({selectedStudents.length})
                                    </button>
                                </WithPermission>
                            </div>

                            <div className="mm-ir">
                                <span className="mm-cnt">
                                    {filtered.length===0?'0':`${Math.min((page-1)*PER_PAGE+1,filtered.length)}–${Math.min(page*PER_PAGE,filtered.length)}`} de {filtered.length} estudiantes
                                    {students.length!==filtered.length?` (filtrados de ${students.length})`:''}
                                </span>
                                {(search||filterEstado)&&(
                                    <button className="mm-btn mm-ghost" style={{padding:'6px 12px',fontSize:'.8rem'}}
                                        onClick={()=>{setSearch('');setFilterEstado('');setPage(1);}}>× Limpiar</button>
                                )}
                            </div>

                            {loading ? (
                                <div className="mm-empty"><div className="mm-spin"/><p>Cargando estudiantes...</p></div>
                            ) : students.length===0 ? (
                                <div className="mm-empty">
                                    <i className="fas fa-users fa-3x" style={{opacity:.2,marginBottom:14,display:'block'}}/>
                                    <h4 style={{marginBottom:6}}>No hay estudiantes matriculados</h4>
                                    <p>Comience agregando un nuevo estudiante</p>
                                </div>
                            ) : (
                                <div className="mm-tw">
                                    <table className="mm-tbl">
                                        <thead>
                                            <tr>
                                                <th style={{width:40}}>
                                                    <input type="checkbox"
                                                        checked={pageItems.length>0&&selectedStudents.length===pageItems.length}
                                                        onChange={()=>{
                                                            if(selectedStudents.length===pageItems.length) setSelectedStudents([]);
                                                            else setSelectedStudents(pageItems.map(s=>s._id));
                                                        }}/>
                                                </th>
                                                {['Nombre Completo','Documento','Grado Actual','Años Cursados','Encargado','Estado','Acciones'].map(h=>(
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageItems.length===0 ? (
                                                <tr><td colSpan={8} style={{textAlign:'center',padding:'40px',color:'#7A6FA0'}}>
                                                    No se encontraron estudiantes
                                                </td></tr>
                                            ) : pageItems.map(s => {
                                                const hist = [...(s.historial_matriculas||[])].sort((a,b)=>a.anio_matricula-b.anio_matricula);
                                                return (
                                                    <tr key={s._id} className={selectedStudents.includes(s._id)?'selected':''}>
                                                        <td>
                                                            <input type="checkbox" checked={selectedStudents.includes(s._id)}
                                                                onChange={()=>setSelectedStudents(prev=>
                                                                    prev.includes(s._id)?prev.filter(id=>id!==s._id):[...prev,s._id])}/>
                                                        </td>
                                                        <td>
                                                            <div className="mm-np">{s.nombre_completo}</div>
                                                            <div className="mm-ns">{s.edad} años · {s.genero}</div>
                                                        </td>
                                                        <td>{s.id_documento}</td>
                                                        <td>
                                                            <span className="mm-badge bg-purple">
                                                                {getNombreGrado(s.grado_a_matricular)}
                                                            </span>
                                                            {s.anio_matricula && (
                                                                <span className="mm-ybadge" style={{marginLeft:6,fontSize:'.68rem'}}>
                                                                    {s.anio_matricula}
                                                                </span>
                                                            )}
                                                        </td>
                                                        {/* Años cursados del historial */}
                                                        <td>
                                                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                                                {hist.length > 0 ? hist.map(m => (
                                                                    <span key={m._id||m.anio_matricula}
                                                                        className="mm-ybadge"
                                                                        style={{
                                                                            fontSize:'.68rem',
                                                                            cursor:'pointer',
                                                                            background: m.estado_matricula==='retirado'?'#E74C3C':
                                                                                        m.estado_matricula==='prematricula'?'#F39C12':'#6C4FBF'
                                                                        }}
                                                                        title={`${getNombreGrado(m.grado_a_matricular||m.grado)} · ${m.estado_matricula||'activa'} · ${m.realizado_por||''}`}
                                                                        onClick={()=>setEditingHistEntry({alumno:s,entrada:m})}>
                                                                        {m.anio_matricula}
                                                                    </span>
                                                                )) : (
                                                                    <span style={{fontSize:'.78rem',color:'#7A6FA0'}}>
                                                                        {s.anio_matricula||'—'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="mm-np">{s.nombre_encargado}</div>
                                                            <div className="mm-ns">{s.parentesco_encargado}</div>
                                                        </td>
                                                        <td>
                                                            <span className={`mm-badge ${(s.estado||'activo')==='activo'?'bg-green':'bg-red'}`}>
                                                                {s.estado||'activo'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="mm-ab">
                                                                <button className="mm-ib ib-view" title="Ver expediente"
                                                                    onClick={()=>{setDetailStudent(s);setShowDetailModal(true);}}>
                                                                    <IcoEye/>
                                                                </button>
                                                                <WithPermission requiredPermissions={['ACTUALIZAR_MATRICULA']}>
                                                                    <button className="mm-ib ib-edit" title="Editar expediente"
                                                                        onClick={()=>{setEditingStudent(s);setShowEditModal(true);}}>
                                                                        <IcoEdit/>
                                                                    </button>
                                                                </WithPermission>
                                                                {/* Botón rematricular — agrega al historial sin sobreescribir */}
                                                                <WithPermission requiredPermissions={['CREAR_MATRICULA']}>
                                                                    <button className="mm-ib ib-remat"
                                                                        title="Registrar nuevo año de matrícula (no sobreescribe)"
                                                                        onClick={()=>{setRematAlumno(s);setShowRematModal(true);}}>
                                                                        <IcoPlus/>
                                                                    </button>
                                                                </WithPermission>
                                                                {/* Dar de baja / reactivar */}
                                                                <WithPermission requiredPermissions={['ACTUALIZAR_MATRICULA']}>
                                                                    {(s.estado||'activo')==='activo' ? (
                                                                        <button className="mm-ib ib-baja" title="Dar de baja"
                                                                            onClick={()=>cambiarEstado(s,'inactivo')}>
                                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                                                        </button>
                                                                    ) : (
                                                                        <button className="mm-ib ib-activo" title="Reactivar alumno"
                                                                            onClick={()=>cambiarEstado(s,'activo')}>
                                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                                                                        </button>
                                                                    )}
                                                                </WithPermission>
                                                                <WithPermission requiredPermissions={['ELIMINAR_MATRICULA']}>
                                                                    <button className="mm-ib ib-del" title="Eliminar"
                                                                        onClick={()=>handleDeleteClick(s)}>
                                                                        <IcoTrash/>
                                                                    </button>
                                                                </WithPermission>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages>1&&(
                                <div className="mm-pag">
                                    <button className="mm-pb" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
                                    {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                                        <button key={p} className={`mm-pb${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
                                    ))}
                                    <button className="mm-pb" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}>›</button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ══════ TAB: HISTORIAL POR AÑO ══════ */}
                    {activeTab === 'historial' && (
                        <motion.div key="historial"
                            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                            exit={{opacity:0,y:-10}} transition={{duration:0.2}}>

                            <div className="mm-info-box">
                                📋 Muestra todos los alumnos con sus años cursados.
                                Los badges de colores indican el estado de cada año:
                                <strong style={{color:'#6C4FBF'}}> morado</strong> = activa,
                                <strong style={{color:'#F39C12'}}> naranja</strong> = prematrícula,
                                <strong style={{color:'#E74C3C'}}> rojo</strong> = retirado.
                                Haz clic en un año para editar esa entrada.
                            </div>

                            <div className="mm-toolbar">
                                <div className="mm-sw">
                                    <IcoSearch/>
                                    <input placeholder="Buscar por nombre, documento..."
                                        value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
                                    {search&&<button style={{border:'none',background:'none',cursor:'pointer',color:'#7A6FA0',fontSize:'1.1rem'}}
                                        onClick={()=>{setSearch('');setPage(1);}}>×</button>}
                                </div>
                                <select className="mm-fsel" value={filterAnio} onChange={e=>{setFilterAnio(e.target.value);setPage(1);}}>
                                    <option value="">Todos los años</option>
                                    {uniqueAnios.map(y=><option key={y} value={y}>{y}{y===CURRENT_YEAR+1?' (Prematrícula)':''}</option>)}
                                </select>
                                <select className="mm-fsel" value={filterGrado} onChange={e=>{setFilterGrado(e.target.value);setPage(1);}}>
                                    <option value="">Todos los grados</option>
                                    {uniqueGrades.map(g=><option key={g} value={g}>{getNombreGrado(g)}</option>)}
                                </select>
                                {(search||filterAnio||filterGrado)&&(
                                    <button className="mm-btn mm-ghost" style={{padding:'8px 14px',fontSize:'.84rem'}}
                                        onClick={()=>{setSearch('');setFilterAnio('');setFilterGrado('');setPage(1);}}>× Limpiar</button>
                                )}
                            </div>

                            <div className="mm-ir">
                                <span className="mm-cnt">{filtered.length} alumnos encontrados</span>
                            </div>

                            {loading ? (
                                <div className="mm-empty"><div className="mm-spin"/><p>Cargando...</p></div>
                            ) : (
                                <div className="mm-tw">
                                    <table className="mm-tbl">
                                        <thead>
                                            <tr>
                                                {['Alumno','Documento','Historial Completo de Años Cursados','Grado Actual','Estado','Ver'].map(h=>(
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pageItems.length===0 ? (
                                                <tr><td colSpan={6} style={{textAlign:'center',padding:'40px',color:'#7A6FA0'}}>
                                                    No se encontraron resultados
                                                </td></tr>
                                            ) : pageItems.map(s => {
                                                const hist = [...(s.historial_matriculas||[])].sort((a,b)=>a.anio_matricula-b.anio_matricula);
                                                return (
                                                    <tr key={s._id}>
                                                        <td>
                                                            <div className="mm-np">{s.nombre_completo}</div>
                                                            <div className="mm-ns">{s.edad} años · {s.genero}</div>
                                                        </td>
                                                        <td>{s.id_documento}</td>
                                                        {/* Historial completo — cada badge es un año distinto */}
                                                        <td>
                                                            {hist.length > 0 ? (
                                                                <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                                                                    {hist.map((m,i) => (
                                                                        <div key={m._id||i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                                                                            <span
                                                                                className="mm-ybadge"
                                                                                style={{
                                                                                    cursor:'pointer',
                                                                                    background: m.estado_matricula==='retirado'?'#E74C3C':
                                                                                                m.estado_matricula==='prematricula'?'#F39C12':
                                                                                                m.estado_matricula==='completada'?'#27AE60':'#6C4FBF',
                                                                                    fontSize:'.75rem',padding:'3px 9px',
                                                                                }}
                                                                                title={`Haz clic para editar esta entrada`}
                                                                                onClick={()=>setEditingHistEntry({alumno:s,entrada:m})}>
                                                                                {m.anio_matricula}
                                                                            </span>
                                                                            <span style={{fontSize:'.66rem',color:'#7A6FA0',textAlign:'center',maxWidth:60,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                                                                {getNombreGrado(m.grado_a_matricular||m.grado)?.split(' ').slice(0,2).join(' ')}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span style={{fontSize:'.8rem',color:'#7A6FA0'}}>
                                                                    {s.anio_matricula ? (
                                                                        <span className="mm-ybadge">{s.anio_matricula}</span>
                                                                    ) : 'Sin historial'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="mm-badge bg-purple">{getNombreGrado(s.grado_a_matricular)}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`mm-badge ${(s.estado||'activo')==='activo'?'bg-green':'bg-red'}`}>
                                                                {s.estado||'activo'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="mm-ib ib-view"
                                                                onClick={()=>{setDetailStudent(s);setShowDetailModal(true);}}>
                                                                <IcoEye/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages>1&&(
                                <div className="mm-pag">
                                    <button className="mm-pb" onClick={()=>setPage(p=>p-1)} disabled={page===1}>‹</button>
                                    {Array.from({length:totalPages},(_,i)=>i+1).map(p=>(
                                        <button key={p} className={`mm-pb${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
                                    ))}
                                    <button className="mm-pb" onClick={()=>setPage(p=>p+1)} disabled={page===totalPages}>›</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Modales ── */}
            <AnimatePresence>
                {showCreateModal&&(
                    <Modal key="crear" isOpen={showCreateModal} onClose={()=>setShowCreateModal(false)} title="Nueva Matrícula">
                        <StudentForm onSubmit={createStudent} onCancel={()=>setShowCreateModal(false)}/>
                    </Modal>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showEditModal&&editingStudent&&(
                    <Modal key="editar" isOpen={showEditModal}
                        onClose={()=>{setShowEditModal(false);setEditingStudent(null);}} title="Editar Expediente del Alumno">
                        <StudentForm student={editingStudent} onSubmit={updateStudent} isEdit
                            onCancel={()=>{setShowEditModal(false);setEditingStudent(null);}}
                            onDelete={()=>handleDeleteClick(editingStudent)}/>
                    </Modal>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showDetailModal&&detailStudent&&(
                    <Modal key="detalle" isOpen={showDetailModal}
                        onClose={()=>{setShowDetailModal(false);setDetailStudent(null);}} title="Expediente del Estudiante">
                        <AlumnoDetail alumno={detailStudent} getNombreGrado={getNombreGrado}
                            onClose={()=>{setShowDetailModal(false);setDetailStudent(null);}}/>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Modal: Registrar nuevo año (usa $push — NO sobreescribe) */}
            <AnimatePresence>
                {showRematModal&&rematAlumno&&(
                    <Modal key="remat" isOpen={showRematModal}
                        onClose={()=>{setShowRematModal(false);setRematAlumno(null);}}
                        title="Registrar Nuevo Año de Matrícula">
                        <RematForm alumno={rematAlumno} grados={grados}
                            onSubmit={crearNuevoAnio}
                            onCancel={()=>{setShowRematModal(false);setRematAlumno(null);}}/>
                    </Modal>
                )}
            </AnimatePresence>

            {/* Modal: Editar entrada del historial */}
            <AnimatePresence>
                {editingHistEntry&&(
                    <Modal key="hist-edit" isOpen={!!editingHistEntry}
                        onClose={()=>setEditingHistEntry(null)}
                        title={`Editar Matrícula ${editingHistEntry.entrada.anio_matricula}`}>
                        <HistEntradaForm
                            entrada={editingHistEntry.entrada}
                            alumno={editingHistEntry.alumno}
                            getNombreGrado={getNombreGrado}
                            onSubmit={editarEntradaHistorial}
                            onCancel={()=>setEditingHistEntry(null)}/>
                    </Modal>
                )}
            </AnimatePresence>

            {notification&&(
                <Notification message={notification.message} type={notification.type}
                    onClose={()=>setNotification(null)} duration={4000}/>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Formulario: Nuevo año de matrícula (usa POST /:id/matricular)
// No sobreescribe — el backend hace $push al historial
// ─────────────────────────────────────────────────────────────
function RematForm({ alumno, grados, onSubmit, onCancel }) {
    const hist = [...(alumno.historial_matriculas||[])].sort((a,b)=>a.anio_matricula-b.anio_matricula);
    const [fd, setFd]   = useState({ grado_a_matricular: alumno.grado_a_matricular||'', anio_matricula: CURRENT_YEAR+1, estado_matricula: 'activa', notas: '' });
    const [errs, setErrs] = useState({});

    const handle = (e) => {
        const {name,value} = e.target;
        setFd(p=>({...p,[name]:name==='anio_matricula'?parseInt(value):value}));
        if(errs[name]) setErrs(p=>{const n={...p};delete n[name];return n;});
    };

    const validate = () => {
        const e = {};
        if(!fd.grado_a_matricular) e.grado_a_matricular = 'Seleccione un grado';
        if(!fd.anio_matricula)     e.anio_matricula     = 'Seleccione el año';
        setErrs(e);
        return Object.keys(e).length === 0;
    };

    const fStyle = (err) => ({ padding:'10px 13px', border:`2px solid ${err?'#E74C3C':'#E0D9F5'}`, borderRadius:9, fontFamily:'inherit', fontSize:'.9rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%' });

    return (
        <form onSubmit={e=>{e.preventDefault();if(validate())onSubmit(fd);}}>
            {/* Datos del alumno */}
            <div className="mm-remat-card">
                <div className="mm-remat-title">👤 Alumno: {alumno.nombre_completo}</div>
                <div className="mm-remat-grid">
                    <div className="mm-remat-item"><div className="mm-remat-lbl">Documento</div><div className="mm-remat-val">{alumno.id_documento}</div></div>
                    <div className="mm-remat-item"><div className="mm-remat-lbl">Estado</div>
                        <div className="mm-remat-val">
                            <span className={`mm-badge ${(alumno.estado||'activo')==='activo'?'bg-green':'bg-red'}`} style={{fontSize:'.75rem'}}>{alumno.estado||'activo'}</span>
                        </div>
                    </div>
                </div>

                {/* Historial previo visible para contexto */}
                {hist.length > 0 && (
                    <div style={{marginTop:12}}>
                        <div style={{fontSize:'.73rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em',marginBottom:6}}>
                            Años ya registrados (no se sobreescribirán):
                        </div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                            {hist.map(m=>(
                                <div key={m._id||m.anio_matricula} style={{textAlign:'center'}}>
                                    <span className="mm-ybadge" style={{fontSize:'.72rem',background:'#27AE60'}}>
                                        {m.anio_matricula}
                                    </span>
                                    <div style={{fontSize:'.65rem',color:'#7A6FA0',marginTop:2}}>
                                        {grados.find(g=>g._id===m.grado_a_matricular)?.nombre?.split(' ').slice(0,2).join(' ')||''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mm-info-box">
                ℹ Se agregará una nueva entrada al historial. Los años anteriores
                quedan <strong>intactos en la base de datos</strong>.
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:16}}>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:'.77rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em'}}>
                        Año de Matrícula <span style={{color:'#E74C3C'}}>*</span>
                    </label>
                    <select style={fStyle(errs.anio_matricula)} name="anio_matricula" value={fd.anio_matricula} onChange={handle}>
                        {YEARS_OPT.map(y=>(
                            <option key={y} value={y}>
                                {y}{y===CURRENT_YEAR+1?' — Prematrícula':y===CURRENT_YEAR?' — Año actual':''}
                            </option>
                        ))}
                    </select>
                    {errs.anio_matricula&&<span style={{fontSize:'.73rem',color:'#E74C3C',fontWeight:600}}>{errs.anio_matricula}</span>}
                    {fd.anio_matricula===CURRENT_YEAR+1&&(
                        <div className="mm-warn-box">⚠ Prematrícula para {CURRENT_YEAR+1}. Se registrará ahora y estará activa el próximo año.</div>
                    )}
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:'.77rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em'}}>
                        Grado <span style={{color:'#E74C3C'}}>*</span>
                    </label>
                    <select style={fStyle(errs.grado_a_matricular)} name="grado_a_matricular" value={fd.grado_a_matricular} onChange={handle}>
                        <option value="">Seleccionar grado...</option>
                        {grados.map(g=><option key={g._id} value={g._id}>{g.nombre}</option>)}
                    </select>
                    {errs.grado_a_matricular&&<span style={{fontSize:'.73rem',color:'#E74C3C',fontWeight:600}}>{errs.grado_a_matricular}</span>}
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:'.77rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em'}}>Estado</label>
                    <select style={fStyle(false)} name="estado_matricula" value={fd.estado_matricula} onChange={handle}>
                        <option value="activa">Activa</option>
                        <option value="prematricula">Prematrícula</option>
                        <option value="completada">Completada</option>
                        <option value="retirado">Retirado</option>
                    </select>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:'.77rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em'}}>Notas / Observaciones</label>
                    <textarea style={{...fStyle(false),resize:'vertical',minHeight:58}} name="notas" value={fd.notas} onChange={handle} placeholder="Ej: Promovido de 3er grado..."/>
                </div>
            </div>

            <div className="mm-audit">
                🔒 Se registrará con: <strong>{auth.currentUser?.email||'sistema'}</strong> · {new Date().toLocaleDateString('es-ES')}
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:16,borderTop:'1px solid #E0D9F5',marginTop:14}}>
                <button type="button" className="mm-btn mm-ghost" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="mm-btn mm-primary">✓ Registrar Matrícula</button>
            </div>
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Formulario: Editar una entrada del historial
// ─────────────────────────────────────────────────────────────
function HistEntradaForm({ entrada, alumno, getNombreGrado, onSubmit, onCancel }) {
    const [fd, setFd] = useState({ estado_matricula: entrada.estado_matricula||'activa', notas: entrada.notas||'' });
    const handle = (e) => setFd(p=>({...p,[e.target.name]:e.target.value}));
    const fStyle = { padding:'10px 13px', border:'2px solid #E0D9F5', borderRadius:9, fontFamily:'inherit', fontSize:'.9rem', color:'#2D2250', background:'#FAF9FF', outline:'none', width:'100%' };

    return (
        <form onSubmit={e=>{e.preventDefault();onSubmit(fd);}}>
            <div className="mm-remat-card">
                <div className="mm-remat-title">📋 Entrada del historial</div>
                <div className="mm-remat-grid">
                    <div className="mm-remat-item"><div className="mm-remat-lbl">Alumno</div><div className="mm-remat-val">{alumno.nombre_completo}</div></div>
                    <div className="mm-remat-item"><div className="mm-remat-lbl">Año</div><div className="mm-remat-val"><span className="mm-ybadge">{entrada.anio_matricula}</span></div></div>
                    <div className="mm-remat-item"><div className="mm-remat-lbl">Grado</div><div className="mm-remat-val">{getNombreGrado(entrada.grado_a_matricular||entrada.grado)}</div></div>
                    <div className="mm-remat-item"><div className="mm-remat-lbl">Registrado por</div><div className="mm-remat-val">{entrada.realizado_por||'sistema'}</div></div>
                </div>
            </div>
            <div className="mm-info-box">ℹ Solo puedes cambiar el estado y las notas. El año y grado no se modifican para preservar la integridad del historial.</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:16}}>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:'.77rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em'}}>Estado de esta matrícula</label>
                    <select style={fStyle} name="estado_matricula" value={fd.estado_matricula} onChange={handle}>
                        <option value="activa">Activa</option>
                        <option value="prematricula">Prematrícula</option>
                        <option value="completada">Completada</option>
                        <option value="retirado">Retirado</option>
                    </select>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    <label style={{fontSize:'.77rem',fontWeight:700,color:'#7A6FA0',textTransform:'uppercase',letterSpacing:'.04em'}}>Notas / Observaciones</label>
                    <textarea style={{...fStyle,resize:'vertical',minHeight:58}} name="notas" value={fd.notas} onChange={handle} placeholder="Observaciones del período..."/>
                </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:16,borderTop:'1px solid #E0D9F5',marginTop:14}}>
                <button type="button" className="mm-btn mm-ghost" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="mm-btn mm-primary">✓ Guardar Cambios</button>
            </div>
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Expediente (solo lectura) con historial completo
// ─────────────────────────────────────────────────────────────
function AlumnoDetail({ alumno: a, onClose, getNombreGrado }) {
    const DI = ({ lbl, val, full }) => (
        <div className="mm-di" style={full?{gridColumn:'1/-1'}:{}}>
            <div className="mm-dl">{lbl}</div>
            <div className="mm-dv">{val||'No especificado'}</div>
        </div>
    );
    const hist = [...(a.historial_matriculas||[])].sort((a,b)=>a.anio_matricula-b.anio_matricula);
    const badgeBg = (est) => ({activa:'#6C4FBF',prematricula:'#F39C12',completada:'#27AE60',retirado:'#E74C3C'}[est]||'#6C4FBF');

    return (
        <div>
            <div className="mm-dg">
                <DI lbl="Nombre Completo"     val={a.nombre_completo}/>
                <DI lbl="Documento"           val={a.id_documento}/>
                <DI lbl="Fecha Nacimiento"    val={a.fecha_nacimiento?new Date(a.fecha_nacimiento).toLocaleDateString('es-ES'):''}/>
                <DI lbl="Edad / Género"       val={`${a.edad} años · ${a.genero}`}/>
                <DI lbl="Grado Actual"        val={getNombreGrado(a.grado_a_matricular)}/>
                <DI lbl="Estado"              val={<span className={`mm-badge ${(a.estado||'activo')==='activo'?'bg-green':'bg-red'}`}>{a.estado||'activo'}</span>}/>
                <DI lbl="Teléfono del Alumno" val={a.telefono_alumno}/>
                <DI lbl="Dirección"           val={a.residencia_direccion} full/>
            </div>

            {(a.alergias||a.enfermedades||a.medicamentos||a.pediatra)&&(<>
                <div className="mm-st">🏥 Datos Médicos</div>
                <div className="mm-dg">
                    <DI lbl="Alergias"      val={a.alergias||'Ninguna'}/>
                    <DI lbl="Enfermedades"  val={a.enfermedades||'Ninguna'}/>
                    <DI lbl="Medicamentos"  val={a.medicamentos||'Ninguno'}/>
                    <DI lbl="Pediatra"      val={a.pediatra}/>
                    <DI lbl="Vacunas al día" val={<span className={`mm-badge ${a.vacunas_al_dia?'bg-green':'bg-orange'}`}>{a.vacunas_al_dia?'Sí':'No'}</span>}/>
                </div>
            </>)}

            <div className="mm-st">👨‍👩‍👦 Encargado</div>
            <div className="mm-dg">
                <DI lbl="Nombre"              val={a.nombre_encargado}/>
                <DI lbl="Parentesco"          val={a.parentesco_encargado}/>
                <DI lbl="Documento"           val={a.id_documento_encargado}/>
                <DI lbl="Teléfono Encargado"  val={a.telefono_encargado}/>
                <DI lbl="Email"               val={a.email_encargado} full/>
            </div>

            {/* Historial completo de matrículas */}
            <div className="mm-st">📋 Historial de Matrículas</div>
            {hist.length > 0 ? (
                hist.map((m,i) => (
                    <div key={m._id||i} className="mm-hist-row">
                        <span className="mm-ybadge" style={{background:badgeBg(m.estado_matricula)}}>{m.anio_matricula}</span>
                        <span style={{fontWeight:700}}>{getNombreGrado(m.grado_a_matricular||m.grado)}</span>
                        <span className="mm-badge" style={{background:'#F0F0F0',color:'#555',fontSize:'.73rem'}}>{m.estado_matricula||'activa'}</span>
                        {m.notas && <span style={{fontSize:'.78rem',color:'#7A6FA0',fontStyle:'italic'}}>"{m.notas}"</span>}
                        <span className="mm-hist-meta">{m.fecha_matricula?new Date(m.fecha_matricula).toLocaleDateString('es-ES'):''} · {m.realizado_por||'sistema'}</span>
                    </div>
                ))
            ) : (
                <div style={{color:'#7A6FA0',fontSize:'.88rem',padding:'8px 0'}}>
                    {a.anio_matricula ? (
                        <div className="mm-hist-row">
                            <span className="mm-ybadge">{a.anio_matricula}</span>
                            <span style={{fontWeight:700}}>{getNombreGrado(a.grado_a_matricular)}</span>
                            <span className="mm-hist-meta">{a.fecha_matricula?new Date(a.fecha_matricula).toLocaleDateString('es-ES'):''} · {a.creado_por||'sistema'}</span>
                        </div>
                    ) : 'Sin historial registrado'}
                </div>
            )}

            <div className="mm-st">🔒 Auditoría</div>
            <div className="mm-dg">
                <DI lbl="Registrado por" val={a.creado_por||'No registrado'}/>
                <DI lbl="Fecha Matrícula" val={a.fecha_matricula?new Date(a.fecha_matricula).toLocaleDateString('es-ES'):'—'}/>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
                <button className="mm-btn mm-ghost" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
}

export default App;