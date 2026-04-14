// ============================================================
// BibliotecaTest.jsx — Rediseño completo
//  • Header idéntico al patrón mm-header (Sistema de Personal / Bienes)
//  • Modal con diseño dn-* igual a ModalCrearBien (pestañas, validación,
//    punto rojo animado, banner cambios sin guardar, framer-motion)
//  • Tabla y paginación con clases biblioteca-* alineadas a Bienes.css
// ============================================================
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import useUserRole from "./hooks/useUserRole";
import "../styles/Models/Biblioteca.css";
import { auth } from "../components/authentication/Auth";
import ConfirmDialog from "./ConfirmDialog/ConfirmDialog";
import { loadingController } from "../api/loadingController";
import {
  Clock, UserCheck,
  BookOpen, GraduationCap, Library, Globe, Info,
  Edit,
} from "lucide-react";
import {
  FiSearch, FiUpload, FiDownload, FiBook, FiX, FiFilter,
  FiFileText, FiAward, FiCalendar, FiBookOpen,
  FiTrash2, FiFile, FiArrowUp, FiArrowDown,
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
  FiAlertCircle, FiCheckCircle, FiInfo, FiUsers, FiEdit2,
  FiClock, FiPlus, FiSave, FiLoader,
} from "react-icons/fi";
import WithPermission from "./Permisos/WithPermission";

// ── Grados disponibles ────────────────────────────────────
const GRADOS = [
  "Primero",
  "Segundo",
  "Tercero",
  "Cuarto",
  "Quinto",
  "Sexto",
];

// ── Validación del modal ──────────────────────────────────
const validarLibro = (form, esEdicion) => {
  const e = {};
  if (!form.titulo?.trim())  e.titulo = "El título es obligatorio";
  if (!form.autor?.trim())   e.autor  = "El autor es obligatorio";
  if (!form.grado?.trim())   e.grado  = "El grado es obligatorio";
  if (!form.clase?.trim())   e.clase  = "La clase es obligatoria";
  if (!esEdicion && !form.archivo) e.archivo = "Selecciona un archivo PDF o EPUB";
  return e;
};

// Mapa campo → pestaña
const TAB_DE_CAMPO = {
  titulo: "datos", autor: "datos", grado: "datos", clase: "datos",
  archivo: "archivo",
};

// ── Spinner inline ────────────────────────────────────────
const SpinnerInline = () => (
  <span style={{
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.35)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </span>
);

// ── Modal Crear / Editar Libro ────────────────────────────
const ModalLibro = ({ onClose, onSave, libroEditando }) => {
  const formVacio = () => ({
    titulo: "", autor: "", autor_corporativo: "", anio_publicacion: "",
    ciudad: "", editorial: "", edicion: "", isbn: "",
    grado: "", clase: "", observacion: "", archivo: null,
  });

  const [form,           setForm]           = useState(libroEditando
    ? { ...formVacio(), ...libroEditando, archivo: null }
    : formVacio());
  const [errores,        setErrores]        = useState({});
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [tabActiva,      setTabActiva]      = useState("datos");
  const [hayCambios,     setHayCambios]     = useState(false);
  const [guardando,      setGuardando]      = useState(false); // ← protección envíos múltiples
  const fileInputRef = useRef(null);

  const limpiarError = (name) => {
    if (intentoGuardar && errores[name]) {
      setErrores(p => { const n = { ...p }; delete n[name]; return n; });
    }
  };

  // ── Helper fecha ──────────────────────────────────────────────
  const formatFecha = (fecha) => {
    if (!fecha || fecha === "null") return "No registrado";
    const s = typeof fecha === "string" ? fecha : new Date(fecha).toISOString();
    const datePart = s.slice(0, 10);
    const [y, m, d] = datePart.split("-");
    if (s.includes("T")) {
      const timePart = s.slice(11, 16);
      return `${d}/${m}/${y} ${timePart}`;
    }
    return `${d}/${m}/${y}`;
  };

  const tabTieneError = (key) =>
    Object.keys(errores).some(c => TAB_DE_CAMPO[c] === key);

  const clsGrupo = (campo) => errores[campo] ? " dn-field-error" : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setHayCambios(true);
    limpiarError(name);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "epub"].includes(ext)) {
      setErrores(p => ({ ...p, archivo: "Solo se permiten archivos PDF o EPUB" }));
      return;
    }
    setForm(p => ({ ...p, archivo: file }));
    setHayCambios(true);
    limpiarError("archivo");
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    // ── Evitar doble envío ──
    if (guardando) return;

    setIntentoGuardar(true);
    const errs = validarLibro(form, !!libroEditando);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      const primer = Object.keys(errs)[0];
      if (TAB_DE_CAMPO[primer]) setTabActiva(TAB_DE_CAMPO[primer]);
      return;
    }

    setErrores({});
    setGuardando(true);
    try {
      await onSave(form);
    } finally {
      // Si onSave lanza error, liberamos el botón para que el usuario pueda reintentar
      setGuardando(false);
    }
  };

  const tabs = [
    { key: "datos",     label: "Datos",     ico: <FiFileText size={14} /> },
    { key: "archivo",   label: "Archivo",   ico: <FiUpload   size={14} /> },
    { key: "auditoria", label: "Auditoría", ico: <FiClock    size={14} /> },
  ];

  return (
    <motion.div
      className="dn-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="dn-modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 40 }}
        transition={{ type: "spring", damping: 22 }}
      >
        {/* Header */}
        <div className="dn-modal-header">
          <h3>
            {libroEditando
              ? <><FiEdit2 size={18} /> Editar Libro</>
              : <><FiPlus size={18} /> Subir Nuevo Libro</>}
          </h3>
          <button className="dn-modal-close" onClick={onClose} disabled={guardando}><FiX size={18} /></button>
        </div>

        {/* Banner cambios sin guardar */}
        {hayCambios && !guardando && (
          <div className="dn-unsaved-banner">⚠️ Tienes cambios sin guardar</div>
        )}

        {/* Banner guardando */}
        {guardando && (
          <div className="dn-unsaved-banner" style={{ background: "linear-gradient(90deg,#6C4FBF,#9B59B6)", color: "#fff", gap: 10, display: "flex", alignItems: "center" }}>
            <SpinnerInline /> Guardando, por favor espera...
          </div>
        )}

        <form
          onSubmit={handleGuardar}
          noValidate
          style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}
        >
          {/* Pestañas */}
          <div className="dn-modal-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                type="button"
                className={`dn-tab-btn${tabActiva === t.key ? " active" : ""}${tabTieneError(t.key) ? " has-error" : ""}`}
                onClick={() => setTabActiva(t.key)}
                disabled={guardando}
              >
                {t.ico} {t.label}
                {tabTieneError(t.key) && (
                  <span className="dn-tab-error-dot" aria-label="campos requeridos" />
                )}
              </button>
            ))}
          </div>

          {/* ══ TAB: Datos ══ */}
          {tabActiva === "datos" && (
            <div className="dn-tab-content">

              {/* ── Identificación del Recurso ── */}
              <div className="dn-form-section-title">
                <BookOpen size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Identificación del Recurso
              </div>
              <div className="dn-form-grid">

                {/* Título */}
                <div className={`dn-form-group dn-full${clsGrupo("titulo")}`}>
                  <label><FiBook size={12} /> Título <span className="req">*</span></label>
                  <input
                    name="titulo"
                    value={form.titulo}
                    onChange={handleChange}
                    placeholder="Título completo de la obra"
                    className={errores.titulo ? "dn-input-err" : ""}
                    disabled={guardando}
                  />
                  {errores.titulo && <span className="dn-err-msg">{errores.titulo}</span>}
                </div>

                {/* Autor */}
                <div className={`dn-form-group${clsGrupo("autor")}`}>
                  <label><FiUsers size={12} /> Autor(es) <span className="req">*</span></label>
                  <input
                    name="autor"
                    value={form.autor}
                    onChange={handleChange}
                    placeholder="Apellido, Nombre"
                    className={errores.autor ? "dn-input-err" : ""}
                    disabled={guardando}
                  />
                  {errores.autor && <span className="dn-err-msg">{errores.autor}</span>}
                </div>

                {/* Autor corporativo */}
                <div className="dn-form-group">
                  <label><FiUsers size={12} /> Autor corporativo</label>
                  <input
                    name="autor_corporativo"
                    value={form.autor_corporativo}
                    onChange={handleChange}
                    placeholder="Ej: UNESCO, OPS"
                    disabled={guardando}
                  />
                </div>

                {/* Año */}
                <div className="dn-form-group">
                  <label><FiCalendar size={12} /> Año de publicación</label>
                  <input
                    type="number"
                    name="anio_publicacion"
                    value={form.anio_publicacion}
                    onChange={handleChange}
                    placeholder="Ej: 2023"
                    min="1800"
                    max={new Date().getFullYear() + 1}
                    disabled={guardando}
                  />
                </div>

                {/* Edición */}
                <div className="dn-form-group">
                  <label>Edición</label>
                  <input
                    name="edicion"
                    value={form.edicion}
                    onChange={handleChange}
                    placeholder="Ej: 3ra edición"
                    disabled={guardando}
                  />
                </div>

                {/* Editorial */}
                <div className="dn-form-group">
                  <label>Editorial</label>
                  <input
                    name="editorial"
                    value={form.editorial}
                    onChange={handleChange}
                    placeholder="Nombre de la editorial"
                    disabled={guardando}
                  />
                </div>

                {/* Ciudad */}
                <div className="dn-form-group">
                  <label>
                    <Globe size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Ciudad de publicación
                  </label>
                  <input
                    name="ciudad"
                    value={form.ciudad}
                    onChange={handleChange}
                    placeholder="Ej: Tegucigalpa, Honduras"
                    disabled={guardando}
                  />
                </div>

                {/* ISBN */}
                <div className="dn-form-group">
                  <label>ISBN / ISSN</label>
                  <input
                    name="isbn"
                    value={form.isbn}
                    onChange={handleChange}
                    placeholder="978-..."
                    disabled={guardando}
                  />
                </div>
              </div>

              {/* ── Clasificación Académica ── */}
              <div className="dn-form-section-title" style={{ marginTop: 20 }}>
                <GraduationCap size={15} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Clasificación Académica
              </div>
              <div className="dn-form-grid">

                {/* Grado — listbox */}
                <div className={`dn-form-group${clsGrupo("grado")}`}>
                  <label>
                    <Library size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    Grado <span className="req">*</span>
                  </label>
                  <select
                    name="grado"
                    value={form.grado}
                    onChange={handleChange}
                    className={errores.grado ? "dn-input-err" : ""}
                    disabled={guardando}
                  >
                    <option value="">— Selecciona un grado —</option>
                    {GRADOS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errores.grado && <span className="dn-err-msg">{errores.grado}</span>}
                </div>

                {/* Clase */}
                <div className={`dn-form-group${clsGrupo("clase")}`}>
                  <label>Clase <span className="req">*</span></label>
                  <input
                    name="clase"
                    value={form.clase}
                    onChange={handleChange}
                    placeholder="Ej: Matemática"
                    className={errores.clase ? "dn-input-err" : ""}
                    disabled={guardando}
                  />
                  {errores.clase && <span className="dn-err-msg">{errores.clase}</span>}
                </div>

                {/* Observación */}
                <div className="dn-form-group dn-full">
                  <label><Info size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> Observación</label>
                  <textarea
                    name="observacion"
                    value={form.observacion}
                    onChange={handleChange}
                    placeholder="Notas adicionales, resumen, recomendaciones..."
                    maxLength={1000}
                    rows={3}
                    disabled={guardando}
                  />
                  <small className="dn-char">{(form.observacion || "").length}/1000</small>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: Archivo ══ */}
          {tabActiva === "archivo" && (
            <div className="dn-tab-content">
              <div className="dn-form-section-title">
                <FiUpload size={13} /> Archivo del Libro (PDF / EPUB)
              </div>

              {/* ── Tarjeta: archivo actual guardado en Drive ── */}
              {libroEditando?.archivoUrl && !form.archivo && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "linear-gradient(135deg, #f3f0ff 0%, #ede8ff 100%)",
                  border: "1.5px solid #c4b5f4",
                  borderRadius: 14, padding: "18px 22px", marginBottom: 18,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                    background: (libroEditando.extension || "").toLowerCase() === "epub"
                      ? "linear-gradient(135deg, #f39c12, #e67e22)"
                      : "linear-gradient(135deg, #e74c3c, #c0392b)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}>
                    <FiFileText size={24} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{
                        background: (libroEditando.extension || "").toLowerCase() === "epub" ? "#f39c12" : "#e74c3c",
                        color: "white", fontSize: ".68rem", fontWeight: 700,
                        padding: "2px 8px", borderRadius: 20, letterSpacing: ".04em",
                      }}>
                        {(libroEditando.extension || "ARCHIVO").toUpperCase()}
                      </span>
                      <span style={{ color: "#5a3fa0", fontWeight: 600, fontSize: ".88rem" }}>
                        Archivo actual
                      </span>
                    </div>
                    <div style={{
                      fontSize: ".78rem", color: "#7A6FA0",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {(libroEditando.nombreArchivo || "Archivo en Google Drive")
                        .replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, "")}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                      <a
                        href={libroEditando.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 6,
                          padding: "7px 16px", borderRadius: 8, fontSize: ".82rem",
                          fontWeight: 700, textDecoration: "none",
                          background: "#6C4FBF", color: "white",
                          boxShadow: "0 2px 8px rgba(108,79,191,.25)",
                        }}
                      >
                        <FiBookOpen size={14} /> Abrir archivo
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Zona de subida ── */}
              <div className="dn-upload-area">
                {form.archivo ? (
                  <div className="dn-preview-wrap">
                    <FiFileText size={48} color="#6C4FBF" />
                    <div className="dn-file-selected" style={{ justifyContent: "center", marginTop: 10 }}>
                      <FiCheckCircle size={14} /> {form.archivo.name}
                    </div>
                    <div className="dn-preview-actions" style={{ marginTop: 14 }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.epub"
                        onChange={handleFile}
                        style={{ display: "none" }}
                        id="lib-archivo-replace"
                        disabled={guardando}
                      />
                      <label
                        htmlFor="lib-archivo-replace"
                        className="dn-btn-secondary"
                        style={{ pointerEvents: guardando ? "none" : "auto", opacity: guardando ? 0.5 : 1 }}
                      >
                        <FiUpload size={14} /> Cambiar archivo
                      </label>
                      <button
                        type="button"
                        className="dn-btn-danger-sm"
                        disabled={guardando}
                        onClick={() => { setForm(p => ({ ...p, archivo: null })); setHayCambios(true); }}
                      >
                        <FiX size={14} /> Quitar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dn-upload-empty">
                    <FiUpload size={42} color="#9b59b6" style={{ marginBottom: "0.75rem" }} />
                    <p>
                      {libroEditando?.archivoUrl
                        ? "¿Deseas reemplazar el archivo actual?"
                        : "Arrastra un archivo o haz clic para seleccionar"}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.epub"
                      onChange={handleFile}
                      style={{ display: "none" }}
                      id="lib-archivo-upload"
                      disabled={guardando}
                    />
                    <label
                      htmlFor="lib-archivo-upload"
                      className="dn-btn-primary-sm"
                      style={{ pointerEvents: guardando ? "none" : "auto", opacity: guardando ? 0.5 : 1 }}
                    >
                      <FiUpload size={15} />
                      {libroEditando?.archivoUrl ? "Reemplazar archivo" : "Seleccionar archivo"}
                    </label>
                    <small>PDF o EPUB</small>
                    {errores.archivo && (
                      <span className="dn-err-msg" style={{ display: "block", marginTop: 8 }}>
                        {errores.archivo}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: Auditoría ══ */}
          {tabActiva === "auditoria" && (
            <div className="dn-tab-content">
              <div className="dn-form-section-title">Auditoría del Libro</div>
              <div className="dn-audit-card">
                <div className="dn-audit-row">
                  <UserCheck size={16} className="dn-audit-ico" />
                  <div>
                    <div className="dn-audit-label">Creación</div>
                    <div className="dn-audit-val">
                      Creado por:{" "}
                      <strong>{form.creado_por_email || form.creado_por || "N/D"}</strong>
                      &nbsp;·&nbsp;
                      Fecha registro:{" "}
                      <strong>{formatFecha(form.fecha_creacion || form.createdAt)}</strong>
                    </div>
                  </div>
                </div>
                {(form.actualizado_por || form.actualizado_por_email || form.updatedAt) && (
                  <div className="dn-audit-row">
                    <Clock size={16} className="dn-audit-ico" />
                    <div>
                      <div className="dn-audit-label">Última Actualización</div>
                      <div className="dn-audit-val">
                        Por:{" "}
                        <strong>{form.actualizado_por_email || form.actualizado_por || "N/D"}</strong>
                        &nbsp;·&nbsp;
                        <strong>{formatFecha(form.fecha_actualizacion || form.updatedAt)}</strong>
                      </div>
                    </div>
                  </div>
                )}
                <div className="dn-audit-ids">
                  <small>ID del libro: <strong>{form._id}</strong></small>
                  {form.extension && <small>Formato: <strong>{form.extension.toUpperCase()}</strong></small>}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="dn-modal-footer">
            <button
              type="button"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
                fontWeight: 700, border: "none",
                cursor: guardando ? "not-allowed" : "pointer",
                background: "#E0D9F5", color: "#6C4FBF", fontFamily: "inherit",
                opacity: guardando ? 0.6 : 1,
              }}
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 10, fontSize: ".86rem",
                fontWeight: 700, border: "none",
                cursor: guardando ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #6C4FBF, #9B59B6)",
                color: "#fff", fontFamily: "inherit",
                opacity: guardando ? 0.8 : 1,
                minWidth: 120,
              }}
              disabled={guardando}
            >
              {guardando ? (
                <><SpinnerInline /> Guardando...</>
              ) : (
                libroEditando ? "Guardar cambios" : "Subir libro"
              )}
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
export default function BibliotecaTest() {
  const { userRole, cargando } = useUserRole();

  const [libros,         setLibros]         = useState([]);
  const [filterValue,    setFilterValue]    = useState("");
  const [tipoFiltro,     setTipoFiltro]     = useState("todos");
  const [filtroGrado,    setFiltroGrado]    = useState("");
  const [filtroClase,    setFiltroClase]    = useState("");
  const [filtroAutor,    setFiltroAutor]    = useState("");
  const [filtroEdit,     setFiltroEdit]     = useState("");
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [sortDescriptor, setSortDescriptor] = useState({ column: "fecha", direction: "descending" });
  const [page,           setPage]           = useState(1);
  const [rowsPerPage,    setRowsPerPage]    = useState(10);
  const [mostrarModal,   setMostrarModal]   = useState(false);
  const [libroEditando,  setLibroEditando]  = useState(null);
  const [notification,   setNotification]   = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [libroAEliminar, setLibroAEliminar] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL + "/api/biblioteca";

  const cargarLibros = async () => {
    setLoading(true);
    try {
      loadingController.start();
      const user = auth.currentUser;
      if (!user) throw new Error("No autenticado");
      const token = await user.getIdToken(true);
      const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setLibros(res.data);
    } catch (err) {
      showNotif(err.message || "Error al cargar libros", "error");
    } finally { setLoading(false); loadingController.stop(); }
  };

  useEffect(() => { if (!cargando) cargarLibros(); }, [cargando]);

  const showNotif = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Guardar (crear / editar) — retorna promesa para que ModalLibro maneje guardando ──
  const handleSave = async (form) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");
    const token = await user.getIdToken(true);
    const fd = new FormData();

    ["titulo", "autor", "autor_corporativo", "anio_publicacion", "ciudad",
     "editorial", "edicion", "isbn", "grado", "clase", "observacion"].forEach(k => {
      if (form[k]) fd.append(k, form[k]);
    });
    if (form.archivo) fd.append("archivo", form.archivo);

    if (libroEditando) {
      await axios.put(`${API_URL}/${libroEditando._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      showNotif("Libro actualizado exitosamente", "success");
    } else {
      await axios.post(API_URL, fd, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      showNotif("Libro subido exitosamente", "success");
    }

    setMostrarModal(false);
    setLibroEditando(null);
    cargarLibros();
  };

  const confirmarEliminacion = async () => {
    setShowConfirm(false);
    if (!libroAEliminar) return;
    try {
      loadingController.start();
      const token = await auth.currentUser.getIdToken(true);
      await axios.delete(`${API_URL}/${libroAEliminar._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cargarLibros();
      showNotif(`"${libroAEliminar.titulo}" eliminado`, "success");
      setLibroAEliminar(null);
    } catch (err) { showNotif("No se pudo eliminar", "error"); }
    finally { loadingController.stop(); }
  };

  // ── Filtros ────────────────────────────────────────────
  const gradosUnicos      = useMemo(() => [...new Set(libros.map(l => l.grado).filter(Boolean))].sort(), [libros]);
  const clasesUnicas      = useMemo(() => [...new Set(libros.map(l => l.clase).filter(Boolean))].sort(), [libros]);
  const editorialesUnicas = useMemo(() => [...new Set(libros.map(l => l.editorial).filter(Boolean))].sort(), [libros]);

  const filteredItems = useMemo(() => {
    let r = [...libros];
    if (filterValue) {
      const t = filterValue.toLowerCase();
      r = r.filter(l =>
        l.titulo?.toLowerCase().includes(t) ||
        l.autor?.toLowerCase().includes(t) ||
        l.autor_corporativo?.toLowerCase().includes(t) ||
        l.grado?.toLowerCase().includes(t) ||
        l.clase?.toLowerCase().includes(t) ||
        l.editorial?.toLowerCase().includes(t)
      );
    }
    if (tipoFiltro !== "todos") {
      r = r.filter(l => (l.extension || "").toLowerCase() === tipoFiltro.toLowerCase());
    }
    if (filtroGrado) r = r.filter(l => l.grado === filtroGrado);
    if (filtroClase) r = r.filter(l => l.clase === filtroClase);
    if (filtroAutor) r = r.filter(l =>
      l.autor?.toLowerCase().includes(filtroAutor.toLowerCase()) ||
      l.autor_corporativo?.toLowerCase().includes(filtroAutor.toLowerCase())
    );
    if (filtroEdit) r = r.filter(l =>
      l.editorial?.toLowerCase().includes(filtroEdit.toLowerCase())
    );
    return r;
  }, [libros, filterValue, tipoFiltro, filtroGrado, filtroClase, filtroAutor, filtroEdit]);

  const sortedItems = useMemo(() => (
    [...filteredItems].sort((a, b) => {
      let fa = sortDescriptor.column === "fecha" ? new Date(a.fechaCreacion) : a[sortDescriptor.column];
      let fb = sortDescriptor.column === "fecha" ? new Date(b.fechaCreacion) : b[sortDescriptor.column];
      const cmp = fa < fb ? -1 : fa > fb ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    })
  ), [filteredItems, sortDescriptor]);

  const pages = Math.ceil(sortedItems.length / rowsPerPage) || 1;
  const items = useMemo(() =>
    sortedItems.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [page, sortedItems, rowsPerPage]
  );

  const handleSort = (col) => setSortDescriptor(p => ({
    column: col,
    direction: p.column === col && p.direction === "ascending" ? "descending" : "ascending",
  }));

  const getSortIcon = (col) => {
    if (sortDescriptor.column !== col) return null;
    return sortDescriptor.direction === "ascending"
      ? <FiArrowUp className="sort-icon" />
      : <FiArrowDown className="sort-icon" />;
  };

  const hayFiltrosActivos =
    filterValue || tipoFiltro !== "todos" || filtroGrado || filtroClase || filtroAutor || filtroEdit;

  const hayFiltrosAvanzados = filtroGrado || filtroClase || filtroAutor || filtroEdit;

  const limpiarFiltrosAvanzados = () => {
    setFiltroGrado(""); setFiltroClase(""); setFiltroAutor(""); setFiltroEdit("");
  };

  const totalLibros     = libros.length;
  const librosPDF       = libros.filter(l => (l.extension || "").toLowerCase() === "pdf").length;
  const librosEPUB      = libros.filter(l => (l.extension || "").toLowerCase() === "epub").length;
  const librosRecientes = libros.filter(
    l => new Date(l.fechaCreacion) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  const statPrincipalVal = hayFiltrosActivos ? filteredItems.length : totalLibros;
  const statPrincipalLbl = hayFiltrosActivos ? "Libros filtrados" : "Total Libros";

  if (cargando) return (
    <div className="biblioteca-loading">
      <FiBook size={40} /><p>Cargando biblioteca...</p>
    </div>
  );

  return (
    <div className="biblioteca-app">

      {/* ═══ HEADER ═══════════════════════════════════════════ */}
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
                <FiBook size={34} color="white" />
              </motion.span>
              Biblioteca Digital
            </motion.div>
          </div>

          <motion.p
            className="mm-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Gestiona tu colección de libros con formato de referencia APA
          </motion.p>

          <motion.div
            className="mm-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {[
              { ico: <FiBook size={18} color="white" />,     val: statPrincipalVal, lbl: statPrincipalLbl },
              { ico: <FiFileText size={18} color="white" />, val: librosPDF,         lbl: "Libros PDF" },
              { ico: <FiBookOpen size={18} color="white" />, val: librosEPUB,        lbl: "Libros EPUB" },
              { ico: <FiAward size={18} color="white" />,    val: librosRecientes,   lbl: "Recientes (30 días)" },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="mm-stat"
                whileHover={{ scale: 1.04, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
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

      {/* ═══ BARRA DE ACCIONES ════════════════════════════════ */}
      <div className="biblioteca-action-area">

        <div className="biblioteca-action-bar">
          <div className="biblioteca-search-wrapper">
            <span className="biblioteca-search-icon"><FiSearch size={16} /></span>
            <input
              type="text"
              className="biblioteca-search-input"
              placeholder="Buscar por título, autor, editorial, grado, clase..."
              value={filterValue}
              onChange={e => { setFilterValue(e.target.value); setPage(1); }}
            />
            {filterValue && (
              <button className="biblioteca-search-clear" onClick={() => setFilterValue("")}>
                <FiX size={14} />
              </button>
            )}
          </div>

          <div className="biblioteca-bar-buttons">
            <button
              className={`biblioteca-btn-advanced${mostrarFiltrosAvanzados || hayFiltrosAvanzados ? " active" : ""}`}
              onClick={() => setMostrarFiltrosAvanzados(p => !p)}
            >
              <FiFilter size={14} />
              Filtros avanzados
              {hayFiltrosAvanzados && ` (${[filtroGrado, filtroClase, filtroAutor, filtroEdit].filter(Boolean).length})`}
            </button>

            <WithPermission requiredPermissions={["CREAR_BIBLIOTECA"]}>
              <motion.button
                className="biblioteca-btn biblioteca-btn-primary"
                onClick={() => { setLibroEditando(null); setMostrarModal(true); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <FiUpload size={16} /> Subir Libro
              </motion.button>
            </WithPermission>
          </div>
        </div>

        <div className="biblioteca-filters-bar">
          <div className="biblioteca-filter-group">
            <span className="biblioteca-filter-label"><FiFilter size={12} /> Formato:</span>
            <div className="biblioteca-filter-pills">
              {[
                { val: "todos", label: "Todos" },
                { val: "pdf",   label: "PDF" },
                { val: "epub",  label: "EPUB" },
              ].map(p => (
                <button
                  key={p.val}
                  className={`biblioteca-pill${tipoFiltro === p.val ? " active" : ""}`}
                  onClick={() => { setTipoFiltro(p.val); setPage(1); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {hayFiltrosAvanzados && (
            <button
              className="biblioteca-pill"
              style={{ borderColor: "#e74c3c", color: "#e74c3c" }}
              onClick={limpiarFiltrosAvanzados}
            >
              <FiX size={11} /> Limpiar filtros
            </button>
          )}
        </div>

        <AnimatePresence>
          {mostrarFiltrosAvanzados && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div className="biblioteca-advanced-filters">
                <div className="biblioteca-adv-field">
                  <label>Grado</label>
                  <select className="biblioteca-adv-select" value={filtroGrado} onChange={e => { setFiltroGrado(e.target.value); setPage(1); }}>
                    <option value="">Todos</option>
                    {gradosUnicos.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="biblioteca-adv-field">
                  <label>Clase</label>
                  <select className="biblioteca-adv-select" value={filtroClase} onChange={e => { setFiltroClase(e.target.value); setPage(1); }}>
                    <option value="">Todas</option>
                    {clasesUnicas.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="biblioteca-adv-field">
                  <label>Editorial</label>
                  <select className="biblioteca-adv-select" value={filtroEdit} onChange={e => { setFiltroEdit(e.target.value); setPage(1); }}>
                    <option value="">Todas</option>
                    {editorialesUnicas.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="biblioteca-adv-field">
                  <label>Autor</label>
                  <input
                    className="biblioteca-adv-input"
                    placeholder="Buscar autor..."
                    value={filtroAutor}
                    onChange={e => { setFiltroAutor(e.target.value); setPage(1); }}
                  />
                </div>
                {hayFiltrosAvanzados && (
                  <button className="biblioteca-clear-advanced" onClick={limpiarFiltrosAvanzados}>
                    × Limpiar filtros avanzados
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ TABLA ════════════════════════════════════════════ */}
      <div className="biblioteca-container-body">
        <div className="biblioteca-table-wrapper">

          <div className="biblioteca-results-info">
            <span>
              Mostrando <strong>{items.length}</strong> de <strong>{sortedItems.length}</strong> libros
              {hayFiltrosActivos && ` (filtrados de ${libros.length})`}
            </span>
            <div className="biblioteca-rows-select">
              <span>Filas:</span>
              <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </div>
          </div>

          <div className="biblioteca-table-scroll">
            {loading ? (
              <div className="biblioteca-loading">
                <FiBook size={40} /><p>Cargando libros...</p>
              </div>
            ) : (
              <table className="biblioteca-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("titulo")} className="sortable">
                      <div className="th-content">TÍTULO {getSortIcon("titulo")}</div>
                    </th>
                    <th onClick={() => handleSort("autor")} className="sortable">
                      <div className="th-content">AUTOR {getSortIcon("autor")}</div>
                    </th>
                    <th onClick={() => handleSort("anio_publicacion")} className="sortable">
                      <div className="th-content">AÑO {getSortIcon("anio_publicacion")}</div>
                    </th>
                    <th onClick={() => handleSort("editorial")} className="sortable">
                      <div className="th-content">EDITORIAL {getSortIcon("editorial")}</div>
                    </th>
                    <th onClick={() => handleSort("grado")} className="sortable">
                      <div className="th-content">GRADO {getSortIcon("grado")}</div>
                    </th>
                    <th onClick={() => handleSort("clase")} className="sortable">
                      <div className="th-content">CLASE {getSortIcon("clase")}</div>
                    </th>
                    <th className="th-center">
                      <div className="th-content" style={{ justifyContent: "center" }}>
                        <FiFileText size={13} /> FORMATO
                      </div>
                    </th>
                    <th className="th-center">
                      <div className="th-content" style={{ justifyContent: "center" }}>ACCIONES</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <div className="biblioteca-empty-state">
                          <FiBook size={40} style={{ opacity: 0.3 }} />
                          <p style={{ fontWeight: 600, margin: 0 }}>No se encontraron libros</p>
                          <small>Ajusta los filtros o sube un nuevo libro</small>
                        </div>
                      </td>
                    </tr>
                  ) : items.map(libro => (
                    <tr key={libro._id}>
                      <td className="bib-titulo-cell">
                        <div className="titulo-wrapper">
                          <span className="file-icon-wrap">
                            {libro.archivoUrl ? <FiFileText size={18} /> : <FiFile size={18} />}
                          </span>
                          <div>
                            <span className="titulo-text">{libro.titulo}</span>
                            {libro.isbn && <span className="isbn-text">ISBN: {libro.isbn}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="bib-autor-cell">
                        <div className="autor-principal">{libro.autor}</div>
                        {libro.autor_corporativo && (
                          <div className="autor-corp">{libro.autor_corporativo}</div>
                        )}
                      </td>
                      <td className="bib-anio">
                        {libro.anio_publicacion || <span style={{ color: "#aaa" }}>—</span>}
                      </td>
                      <td className="bib-editorial-cell">
                        <div className="editorial-nombre">{libro.editorial || "—"}</div>
                        {libro.ciudad && <div className="editorial-ciudad">{libro.ciudad}</div>}
                      </td>
                      <td><span className="bib-grado-badge">{libro.grado}</span></td>
                      <td><span className="bib-clase-badge">{libro.clase}</span></td>
                      <td style={{ textAlign: "center" }}>
                        {libro.extension
                          ? <span className={`formato-badge ${libro.extension.toLowerCase() === "epub" ? "epub" : "pdf"}`}>
                              {libro.extension.toUpperCase()}
                            </span>
                          : <span className="formato-badge sin-archivo">
                              <FiAlertCircle size={10} /> N/A
                            </span>
                        }
                      </td>
                      <td>
                        <div className="bib-action-buttons">
                          {libro.archivoUrl && (
                            <a
                              href={libro.archivoUrl}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bib-btn-icon download"
                              title="Descargar"
                            >
                              <FiDownload size={14} />
                            </a>
                          )}
                          <WithPermission requiredPermissions={["ACTUALIZAR_BIBLIOTECA"]}>
                            <button
                              className="bienes-btn-icon edit"
                              title="Editar metadatos"
                              onClick={() => { setLibroEditando(libro); setMostrarModal(true); }}
                            >
                              <Edit size={15} />
                            </button>
                          </WithPermission>
                          <WithPermission requiredPermissions={["ELIMINAR_BIBLIOTECA"]}>
                            <button
                              className="bienes-btn-icon delete"
                              title="Eliminar"
                              onClick={() => { setLibroAEliminar(libro); setShowConfirm(true); }}
                            >
                              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </WithPermission>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {sortedItems.length > 0 && (
            <div className="biblioteca-pagination">
              <div className="biblioteca-pagination-info">
                <FiInfo size={13} />
                Mostrando{" "}
                <strong>&nbsp;{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, sortedItems.length)}&nbsp;</strong>
                de <strong>&nbsp;{sortedItems.length}</strong>
              </div>
              <div className="biblioteca-pagination-controls">
                <button className="biblioteca-page-btn" onClick={() => setPage(1)} disabled={page === 1}><FiChevronsLeft size={14} /></button>
                <button className="biblioteca-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><FiChevronLeft size={14} /></button>
                <span className="biblioteca-pages-text">Página {page} de {pages}</span>
                <button className="biblioteca-page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><FiChevronRight size={14} /></button>
                <button className="biblioteca-page-btn" onClick={() => setPage(pages)} disabled={page === pages}><FiChevronsRight size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODAL ════════════════════════════════════════════ */}
      <AnimatePresence>
        {mostrarModal && (
          <ModalLibro
            onClose={() => { setMostrarModal(false); setLibroEditando(null); }}
            onSave={handleSave}
            libroEditando={libroEditando}
          />
        )}
      </AnimatePresence>

      {/* ═══ NOTIFICACIONES ════════════════════════════════════ */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification notification-${notification.type}`}
            initial={{ opacity: 0, y: -50, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 100 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <span>
              {notification.type === "success" ? <FiCheckCircle size={18} /> :
               notification.type === "error"   ? <FiAlertCircle size={18} /> :
               <FiInfo size={18} />}
            </span>
            <span>{notification.message}</span>
            <button className="notification-close" onClick={() => setNotification(null)}>
              <FiX size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CONFIRM DIALOG ════════════════════════════════════ */}
      {showConfirm && (
        <ConfirmDialog
          message={`¿Seguro que deseas eliminar "${libroAEliminar?.titulo}"?`}
          onConfirm={confirmarEliminacion}
          onCancel={() => setShowConfirm(false)}
          visible={showConfirm}
        />
      )}
    </div>
  );
}