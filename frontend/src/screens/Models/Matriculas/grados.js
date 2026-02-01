import { useEffect, useState } from "react";
import { auth } from "../../../components/authentication/Auth";
import "../../../styles/grados.css"; 
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trash2, Users, Search, AlignLeft, X } from "lucide-react";
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API = `${API_BASE}/api/grados`;

export default function GradosPage() {
  const [items, setItems] = useState([]);
  const [gradosUnicos, setGradosUnicos] = useState([]); // Para el nuevo filtro de nombres
  const [page, setPage] = useState(1);
  const [q, setQ] = useState(""); 
  const [loading, setLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    grado: "", descripcion: "", anio_academico: 2026, aula: "", estado: "Activo"
  });

  const [gradoAEliminar, setGradoAEliminar] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchWithToken = async (url) => {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    return res.json();
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ page, limit: 10, q });
      const data = await fetchWithToken(`${API}?${queryParams}`);
      
      const itemsConConteo = await Promise.all(
        (data.items || []).map(async (grado) => {
          try {
            const resMat = await fetchWithToken(`${API_BASE}/api/matriculas?grado_a_matricular=${grado._id}`);
            return { ...grado, totalAlumnos: resMat.count || 0 };
          } catch {
            return { ...grado, totalAlumnos: 0 };
          }
        })
      );
      setItems(itemsConConteo);

      // Cargar la lista para el filtro de nombres (solo si está vacía)
      if (gradosUnicos.length === 0) {
        const all = await fetchWithToken(`${API}?limit=100`);
        const nombres = [...new Set(all.items.map(i => i.grado))].sort();
        setGradosUnicos(nombres);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [page, q]);

  const handleSave = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/${form._id}` : API;
      await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setShowModal(false);
      fetchList();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="grados-container">
      {/* HEADER */}
      <header className="grados-header">
        <div className="container-fluid px-5">
            <div className="d-flex align-items-center gap-3">
                <Calendar size={40} />
                <div>
                    <h1 className="grados-title">Creación y gestión de grados.</h1>
                    <p className="mb-0 opacity-75">Crea tus grados y gestiona tus espacios físicos.</p>
                </div>
            </div>
        </div>
      </header>

      <div className="container-fluid px-5">
        <button className="grados-btn-primary mb-4" onClick={() => { 
          setForm({grado:"", descripcion:"", anio_academico:2026, aula:"", estado:"Activo"}); 
          setEditing(false); setShowModal(true); 
        }}>
          + Nuevo Grado
        </button>

        {/* FILTROS ACTUALIZADOS: Filtro de Nombres en lugar de Estado */}
        <div className="grados-filters-card">
          <div className="grados-filters-body">
            <div className="row g-3">
              <div className="col-md-9">
                <label className="grados-form-label">Filtrar por Nombre de Grado:</label>
                <select 
                  className="grados-form-select w-100" 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)}
                >
                  <option value="">Todos los grados registrados</option>
                  {gradosUnicos.map(nombre => (
                    <option key={nombre} value={nombre}>{nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button className="grados-btn-search" onClick={fetchList}>
                   <Search size={18} className="me-2" /> Actualizar Lista
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA */}
        <div className="grados-table-card">
          <table className="grados-table">
            <thead>
              <tr>
                <th>Grado</th>
                <th>Año</th>
                <th>Aula</th>
                <th>Matriculados</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <tr key={g._id}>
                  <td className="fw-bold">{g.grado}</td>
                  <td>{g.anio_academico}</td>
                  <td>{g.aula}</td>
                  <td>
                    <span className="grados-badge-active bg-primary text-white d-inline-flex align-items-center gap-2">
                       <Users size={14} /> {g.totalAlumnos} Alumnos
                    </span>
                  </td>
                  <td>
                    <span className={g.estado === 'Activo' ? 'grados-badge-active' : 'grados-badge-inactive'}>
                      {g.estado}
                    </span>
                  </td>
                  <td className="text-center">
                    <button className="grados-btn-edit" onClick={() => { setForm(g); setEditing(true); setShowModal(true); }}>
                      Editar
                    </button>
                    {g.totalAlumnos === 0 && (
                      <button className="grados-btn-deactivate" onClick={() => { setGradoAEliminar(g); setShowConfirm(true); }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="grados-modal-overlay">
            <motion.div className="grados-modal-content" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="grados-modal-header d-flex justify-content-between align-items-center">
                <h2 className="grados-modal-title">{editing ? "Editar" : "Nuevo"} Grado</h2>
                <button className="grados-modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
              </div>
              <div className="grados-modal-body">
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="grados-form-label">Nombre del Grado</label>
                    <input className="grados-modal-input" value={form.grado} onChange={e => setForm({...form, grado: e.target.value})} />
                  </div>
                  <div className="col-md-4">
                    <label className="grados-form-label">Año</label>
                    <input type="number" className="grados-modal-input" value={form.anio_academico} onChange={e => setForm({...form, anio_academico: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="grados-form-label">Aula</label>
                    <input className="grados-modal-input" value={form.aula} onChange={e => setForm({...form, aula: e.target.value})} />
                  </div>
                  <div className="col-md-6">
                    <label className="grados-form-label">Estado</label>
                    <select className="grados-modal-input" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="grados-form-label">Descripción</label>
                    <textarea className="grados-modal-input" rows="3" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}></textarea>
                  </div>
                </div>
              </div>
              <div className="grados-modal-footer d-flex justify-content-end">
                <button className="grados-modal-btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="grados-modal-btn-save" onClick={handleSave}>Guardar Registro</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        visible={showConfirm}
        onConfirm={async () => {
          const token = await auth.currentUser.getIdToken();
          await fetch(`${API}/${gradoAEliminar._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
          setShowConfirm(false); fetchList();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}