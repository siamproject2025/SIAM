// src/pages/grados/GradosIndex.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import gradosApi from "../../services/gradosApi";

export default function GradosIndex() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [anio, setAnio] = useState("");
  const [sortBy, setSortBy] = useState("anio_desc"); // anio_desc | anio_asc | grado_asc | grado_desc

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const navigate = useNavigate();

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await gradosApi.listar();
      const lista = Array.isArray(data) ? data : (data?.items || data?.data || data?.grados || []);
      setItems(lista);
      setError("");
      console.log("[GradosIndex] registros:", lista.length);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la lista.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const aniosDisponibles = useMemo(() => {
    const set = new Set(items.map(g => Number(g?.anio_academico)).filter(Boolean));
    return Array.from(set).sort((a,b)=>b-a);
  }, [items]);

  const filtrados = useMemo(() => {
    let data = [...items];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter(g =>
        (g?.grado || "").toLowerCase().includes(s) ||
        (g?.descripcion || "").toLowerCase().includes(s)
      );
    }
    if (estado !== "Todos") {
      data = data.filter(g => (g?.estado || "").toLowerCase() === estado.toLowerCase());
    }
    if (anio) {
      data = data.filter(g => Number(g?.anio_academico) === Number(anio));
    }

    switch (sortBy) {
      case "anio_asc":   data.sort((a,b)=> Number(a?.anio_academico)-Number(b?.anio_academico)); break;
      case "grado_asc":  data.sort((a,b)=> (a?.grado||"").localeCompare(b?.grado||"")); break;
      case "grado_desc": data.sort((a,b)=> (b?.grado||"").localeCompare(a?.grado||"")); break;
      default:           data.sort((a,b)=> Number(b?.anio_academico)-Number(a?.anio_academico));
    }

    return data;
  }, [items, q, estado, anio, sortBy]);

  // paginación
  const total = filtrados.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = filtrados.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [q, estado, anio, sortBy]);

  const onDelete = async (id) => {
    if (!window.confirm("¿Desactivar este grado?")) return;
    try {
      await gradosApi.eliminar(id); // soft delete → estado Inactivo
      await cargar();
    } catch (e) {
      console.error(e);
      alert("No se pudo desactivar.");
    }
  };

  const onRestore = async (id) => {
    try {
      await gradosApi.restaurar(id);
      await cargar();
    } catch (e) {
      console.error(e);
      alert("No se pudo restaurar.");
    }
  };

  if (cargando) return <p className="m-3">Cargando…</p>;
  if (error) return <p className="m-3 text-danger">{error}</p>;

  return (
    <div className="container p-3">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Grados</h3>
        <div className="d-flex gap-2">
          <Link to="/grados/nuevo" className="btn btn-primary">Nuevo</Link>
          <button className="btn btn-outline-secondary" onClick={cargar} title="Recargar">↻</button>
        </div>
      </div>

      {/* Controles */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <input className="form-control" placeholder="Buscar grado/descripcion…"
                 value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={estado} onChange={(e)=>setEstado(e.target.value)}>
            <option>Todos</option><option>Activo</option><option>Inactivo</option>
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={anio} onChange={(e)=>setAnio(e.target.value)}>
            <option value="">Todos los años</option>
            {aniosDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="col-12 col-md-2">
          <select className="form-select" value={sortBy} onChange={(e)=>setSortBy(e.target.value)}>
            <option value="anio_desc">Año ↓</option>
            <option value="anio_asc">Año ↑</option>
            <option value="grado_asc">Grado A→Z</option>
            <option value="grado_desc">Grado Z→A</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {visible.length === 0 ? (
        <p className="text-muted">No hay registros con los filtros actuales.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-striped align-middle">
            <thead>
              <tr>
                <th>Grado</th>
                <th style={{width:120}}>Año</th>
                <th style={{width:120}}>Estado</th>
                <th style={{width:120}}>Créditos</th>
                <th style={{width:140}}>Horas/Sem.</th>
                <th style={{width:220}}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(g => (
                <tr key={g?._id || `${g?.grado}-${g?.anio_academico}`}>
                  <td>
                    <div className="fw-semibold">{g?.grado}</div>
                    {g?.descripcion && <div className="text-muted small">{g.descripcion}</div>}
                  </td>
                  <td>{g?.anio_academico ?? "-"}</td>
                  <td>
                    <span className={`badge ${g?.estado === "Activo" ? "bg-success" : "bg-secondary"}`}>
                      {g?.estado || "-"}
                    </span>
                  </td>
                  <td>{g?.total_creditos ?? "-"}</td>
                  <td>{g?.total_horas_semanales ?? "-"}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-2"
                            onClick={() => navigate(`/grados/${g?._id}/editar`)}
                            disabled={!g?._id}>
                      Editar
                    </button>
                    {g?.estado === "Inactivo" ? (
                      <button className="btn btn-sm btn-outline-success"
                              onClick={() => onRestore(g._id)} disabled={!g?._id}>
                        Restaurar
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(g._id)} disabled={!g?._id}>
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">
          Mostrando {visible.length ? start + 1 : 0}–{Math.min(start + pageSize, total)} de {total}
        </div>
        <div className="btn-group">
          <button className="btn btn-sm btn-outline-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}>
            « Anterior
          </button>
          <span className="btn btn-sm btn-outline-secondary disabled">
            Página {currentPage} / {totalPages}
          </span>
          <button className="btn btn-sm btn-outline-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}>
            Siguiente »
          </button>
        </div>
      </div>
    </div>
  );
}

