// src/pages/GradosPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const emptyForm = {
  nombre: "",
  nivel: "",
  jornada: "",
  descripcion: "",
  activo: true,
};

export default function GradosPage() {
  const [grados, setGrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const isEditing = useMemo(() => Boolean(editId), [editId]);

  const fetchGrados = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/grados");
      setGrados(data?.grados || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrados();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      if (isEditing) {
        await api.put(`/grados/${editId}`, form);
      } else {
        await api.post("/grados", form);
      }
      await fetchGrados();
      resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (g) => {
    setForm({
      nombre: g.nombre || "",
      nivel: g.nivel || "",
      jornada: g.jornada || "",
      descripcion: g.descripcion || "",
      activo: typeof g.activo === "boolean" ? g.activo : true,
    });
    setEditId(g._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    const ok = window.confirm("¿Eliminar este grado?");
    if (!ok) return;
    try {
      setSaving(true);
      setError("");
      await api.delete(`/grados/${id}`);
      await fetchGrados();
      if (id === editId) resetForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Gestión de Grados</h2>

      {/* Alertas */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between">
          <span>{error}</span>
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* Formulario */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">
            {isEditing ? "Editar grado" : "Crear nuevo grado"}
          </h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Nombre *</label>
              <input
                name="nombre"
                className="form-control"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Nivel</label>
              <input
                name="nivel"
                className="form-control"
                value={form.nivel}
                onChange={handleChange}
                placeholder="Primaria / Secundaria…"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Jornada</label>
              <input
                name="jornada"
                className="form-control"
                value={form.jornada}
                onChange={handleChange}
                placeholder="Matutina / Vespertina…"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Descripción</label>
              <textarea
                name="descripcion"
                className="form-control"
                rows="2"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Notas adicionales…"
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  id="activo"
                  type="checkbox"
                  className="form-check-input"
                  name="activo"
                  checked={form.activo}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="activo">
                  Activo
                </label>
              </div>
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Guardando…"
                  : isEditing
                  ? "Actualizar"
                  : "Crear grado"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Tabla */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Listado</h5>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchGrados}
              disabled={loading || saving}
              title="Refrescar"
            >
              {loading ? "Cargando…" : "Refrescar"}
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Nivel</th>
                  <th>Jornada</th>
                  <th>Activo</th>
                  <th style={{ width: 160 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {grados.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      {loading ? "Cargando…" : "Sin registros"}
                    </td>
                  </tr>
                )}
                {grados.map((g) => (
                  <tr key={g._id}>
                    <td>{g.nombre}</td>
                    <td>{g.nivel || "-"}</td>
                    <td>{g.jornada || "-"}</td>
                    <td>
                      {typeof g.activo === "boolean" ? (g.activo ? "Sí" : "No") : "-"}
                    </td>
                    <td className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => onEdit(g)}
                        disabled={saving}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(g._id)}
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

