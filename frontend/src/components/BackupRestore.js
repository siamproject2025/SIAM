import { useState } from "react";
import axios from "axios";
import { auth } from "../components/authentication/Auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiDownload, FiUpload, FiInfo, FiCheck, FiAlertCircle,
  FiDatabase, FiClock, FiLayers, FiFileText, FiShield,
  FiRefreshCw, FiX
} from "react-icons/fi";
import "../styles/BackupRestore.css";
import WithPermission from "./Permisos/WithPermission";

export default function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null); // 'backup' | 'restore' | 'info'
  const [notification, setNotification] = useState(null);
  const [infoBackup, setInfoBackup] = useState(null);
  const [progress, setProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(null);
// { percent: 0-100, message: "...", current: N, total: N }

  const API_URL = process.env.REACT_APP_API_URL + "/api/backup";

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");
    return await user.getIdToken();
  };

  // ── CREAR BACKUP ──────────────────────────────────────
const handleDescargarBackup = async () => {
  try {
    setLoading(true);
    setLoadingType("backup");
    setProgress(0);
    showNotification("⏳ Generando backup de la base de datos...", "info");

    const token = await getToken();

    const response = await fetch(`${API_URL}/crear`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    // Leer SSE igual que en restore
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let parsed;
        try { parsed = JSON.parse(line.slice(6)); } catch { continue; }

        if (parsed.type === "progress") {
          setProgress(parsed.percent);
        } else if (parsed.type === "done") {
          setProgress(100);

          // ✅ Convertir base64 a archivo y descargar
          const byteChars = atob(parsed.data);
          const byteArray = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "application/json" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", parsed.filename);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);

          showNotification(`✅ ${parsed.message} — ${parsed.total_documentos} documentos`, "success");
        } else if (parsed.type === "error") {
          throw new Error(parsed.message);
        }
      }
    }
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, "error");
  } finally {
    setLoading(false);
    setLoadingType(null);
    setTimeout(() => setProgress(0), 1000);
  }
};

  // ── EDITAR BACKUP ──────────────────────────────────────
  const handleRestaurarBackup = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.name.endsWith(".json")) {
    showNotification("❌ El archivo debe ser .json", "error");
    return;
  }

  setLoading(true);
  setLoadingType("restore");
  setRestoreProgress({ percent: 0, message: "Iniciando...", current: 0, total: 0 });

  try {
    const token = await getToken();
    const formData = new FormData();
    formData.append("backupFile", file);

    // Subir el archivo primero con fetch (SSE no soporta body en GET)
    const response = await fetch(`${API_URL}/restaurar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    // Leer el stream SSE manualmente
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // guarda línea incompleta

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let parsed;
        try { parsed = JSON.parse(line.slice(6)); } catch { continue; }

        if (parsed.type === "progress") {
          setRestoreProgress({
            percent: parsed.percent,
            message: parsed.message,
            current: parsed.current ?? 0,
            total: parsed.total ?? 0,
          });
        } else if (parsed.type === "done") {
          setRestoreProgress({ percent: 100, message: "¡Restauración completada!", current: parsed.colecciones_restauradas, total: parsed.colecciones_restauradas });
          showNotification(` ${parsed.message} — ${parsed.colecciones_restauradas} colecciones`, "success");
          setTimeout(() => { setRestoreProgress(null); window.location.reload(); }, 2500);
        } else if (parsed.type === "error") {
          throw new Error(parsed.message);
        }
      }
    }
  } catch (error) {
    showNotification(`❌ Error: ${error.message}`, "error");
    setRestoreProgress(null);
  } finally {
    setLoading(false);
    setLoadingType(null);
    event.target.value = "";
  }
};
  // ── OBTENER INFORMACIÓN ───────────────────────────────────
  const handleObtenerInfo = async () => {
    try {
      setLoading(true);
      setLoadingType("info");

      const token = await getToken();
      const response = await axios.get(`${API_URL}/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInfoBackup(response.data);
      showNotification("Información actualizada", "success");
    } catch (error) {
      showNotification(`❌ Error: ${error.response?.data?.error || error.message}`, "error");
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const totalDocs = infoBackup?.total_documentos ?? 0;
  const totalCols = infoBackup?.colecciones?.length ?? 0;

  return (
    <div className="br-root">

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <motion.div
        className="br-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
      >
        <div className="br-hi">
          <div className="br-ht">
            <motion.div
              className="br-htitle"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <motion.span
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <FiShield size={32} color="white" />
              </motion.span>
              Backup &amp; Restauración
            </motion.div>
          </div>

          <motion.p
            className="br-sub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Protege y recupera tu base de datos de forma segura
          </motion.p>

          {/* Stats del header */}
          <motion.div
            className="br-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {[
              { ico: <FiDatabase size={18} color="white" />, val: totalDocs || "—", lbl: "Total Docs" },
              { ico: <FiLayers size={18} color="white" />, val: totalCols || "—", lbl: "Colecciones" },
              {
                ico: <FiClock size={18} color="white" />,
                val: infoBackup ? new Date(infoBackup.timestamp).toLocaleDateString("es-HN") : "—",
                lbl: "Último escaneo"
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="br-stat"
                whileHover={{ scale: 1.04, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={handleObtenerInfo}
                title="Click para actualizar"
              >
                <div className="br-stat-ico">{s.ico}</div>
                <div>
                  <div className="br-stat-val">{s.val}</div>
                  <div className="br-stat-lbl">{s.lbl}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ══ NOTIFICACIÓN ════════════════════════════════════ */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`br-notif br-notif--${notification.type}`}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <span className="br-notif-ico">
              {notification.type === "success" && <FiCheck />}
              {notification.type === "error" && <FiAlertCircle />}
              {notification.type === "info" && <FiRefreshCw className={loading ? "spin" : ""} />}
            </span>
            {notification.message}
            <button className="br-notif-close" onClick={() => setNotification(null)}>
              <FiX size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ CONTENIDO ═══════════════════════════════════════ */}
      <div className="br-body">
        <div className="br-grid">

          {/* ── Card: Descargar ─────────────────────────── */}
          <motion.div
            className="br-card br-card--download"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(108,79,191,0.18)" }}
          >
            <div className="br-card-icon-wrap br-card-icon-wrap--purple">
              <FiDownload size={26} />
            </div>
            <h3 className="br-card-title">Descargar Backup</h3>
            <p className="br-card-desc">
              Exporta toda tu base de datos en formato JSON con soporte para tipos nativos de MongoDB.
            </p>

            {/* Barra de progreso */}
            <AnimatePresence>
              {loadingType === "backup" && (
                <motion.div
                  className="br-progress-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="br-progress-bar">
                    <motion.div
                      className="br-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                  <span className="br-progress-label">{progress}%</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <WithPermission requiredPermissions={["CREAR_RESTORE"]}>
            <motion.button
              className="br-btn br-btn--primary"
              onClick={handleDescargarBackup}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loadingType === "backup"
                ? <><FiRefreshCw className="spin" /> Generando...</>
                : <><FiDownload /> Descargar Backup</>
              }
            </motion.button>
            </WithPermission>
          </motion.div>

          {/* ── Card: Restaurar ─────────────────────────── */}
          
          <motion.div
            className="br-card br-card--restore"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(39,174,96,0.18)" }}
          >
            <div className="br-card-icon-wrap br-card-icon-wrap--green">
              <FiUpload size={26} />
            </div>
            <h3 className="br-card-title">Restaurar Backup</h3>
            <p className="br-card-desc">
              Sube un archivo <code>.json</code> generado previamente para restaurar toda la base de datos.
            </p>

            <div className="br-upload-zone">
              
              <FiFileText size={22} className="br-upload-ico" />
              <span>Arrastra un archivo o haz click</span>
              <WithPermission requiredPermissions={["ACTUALIZAR_RESTORE"]}>
              <label className={`br-btn br-btn--secondary ${loading ? "br-btn--disabled" : ""}`}>
                {loadingType === "restore"
                  ? <><FiRefreshCw className="spin" /> Restaurando...</>
                  : <><FiUpload /> Seleccionar archivo .json</>
                }
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestaurarBackup}
                  disabled={loading}
                  style={{ display: "none" }}
                />
              </label></WithPermission>
            </div>
            {/* Progreso de restauración */}
<AnimatePresence>
  {restoreProgress && (
    <motion.div
      className="br-restore-progress"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="br-restore-progress-header">
        <span className="br-restore-progress-msg">
          <FiRefreshCw className="spin" size={13} />
          {restoreProgress.message}
        </span>
        {restoreProgress.total > 0 && (
          <span className="br-restore-progress-counter">
            {restoreProgress.current}/{restoreProgress.total}
          </span>
        )}
      </div>
      <div className="br-progress-bar">
        <motion.div
          className="br-progress-fill br-progress-fill--green"
          initial={{ width: 0 }}
          animate={{ width: `${restoreProgress.percent}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>
      <span className="br-progress-label br-progress-label--green">
        {restoreProgress.percent}%
      </span>
    </motion.div>
  )}
</AnimatePresence>

            <p className="br-warning">
              ⚠️ Esta acción reemplazará todos los datos actuales.
            </p>
          </motion.div>

          {/* ── Card: Información ───────────────────────── */}
          <motion.div
            className="br-card br-card--info"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(23,162,184,0.18)" }}
          >
            <div className="br-card-icon-wrap br-card-icon-wrap--teal">
              <FiInfo size={26} />
            </div>
            <h3 className="br-card-title">Estado de la Base de Datos</h3>
            <p className="br-card-desc">
              Consulta el número de colecciones y documentos en tiempo real.
            </p>
            
            <motion.button
              className="br-btn br-btn--teal"
              onClick={handleObtenerInfo}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loadingType === "info"
                ? <><FiRefreshCw className="spin" /> Consultando...</>
                : <><FiDatabase /> Ver Estado</>
              }
            </motion.button>

            {/* Lista de colecciones */}
            <AnimatePresence>
              {infoBackup && (
                <motion.div
                  className="br-col-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="br-col-meta">
                    <FiClock size={12} /> {new Date(infoBackup.timestamp).toLocaleString("es-HN")}
                    &nbsp;·&nbsp; <strong>{infoBackup.total_documentos}</strong> docs en{" "}
                    <strong>{infoBackup.colecciones.length}</strong> colecciones
                  </p>
                  <div className="br-col-scroll">
                    {infoBackup.colecciones
                      .sort((a, b) => b.documentos - a.documentos)
                      .map((col, i) => (
                        <motion.div
                          key={col.nombre}
                          className="br-col-item"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <span className="br-col-name">
                            <FiDatabase size={11} /> {col.nombre}
                          </span>
                          <span className="br-col-badge">{col.documentos}</span>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </div>
  );
}