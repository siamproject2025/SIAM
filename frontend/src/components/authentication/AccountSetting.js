import React, { useState } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import Swal from 'sweetalert2';

const AccountSetting = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [newName, setNewName]   = useState(user?.displayName || '');
  const [cargando, setCargando] = useState(false);

  const toast = (icon, text) => Swal.fire({
    icon, text,
    timer: 2500,
    showConfirmButton: false,
    position: "top",
    toast: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast("error", "No hay un usuario activo."); return; }
    if (!newName.trim()) { toast("error", "El nombre no puede estar vacío."); return; }
    if (newName.trim() === user.displayName) { toast("info", "No hay cambios para guardar."); return; }

    setCargando(true);
    try {
      await updateProfile(user, { displayName: newName.trim() });
      toast("success", "Nombre actualizado correctamente.");
    } catch (err) {
      console.error(err);
      toast("error", "Error al actualizar el perfil.");
    } finally {
      setCargando(false);
    }
  };

  // Inicial del avatar
  const inicial = (newName || user?.email || "U")[0].toUpperCase();

  return (
    <div style={s.card}>

      {/* ── Encabezado ── */}
      <div style={s.cardHeader}>
        <div style={s.iconWrap}>👤</div>
        <div>
          <h2 style={s.cardTitulo}>Información del Perfil</h2>
          <p style={s.cardSub}>Actualiza tu nombre de usuario</p>
        </div>
      </div>

      <div style={s.divider} />

      {/* ── Avatar + info actual ── */}
      <div style={s.perfilRow}>
        <div style={s.avatar}>{inicial}</div>
        <div>
          <div style={s.perfilNombre}>{user?.displayName || "Sin nombre"}</div>
          <div style={s.perfilEmail}>{user?.email}</div>
          <div style={s.perfilBadge}>
            {user?.emailVerified
              ? <><span style={{ color: "#22c55e" }}>✓</span> Correo verificado</>
              : <><span style={{ color: "#f59e0b" }}>⚠</span> Correo no verificado</>
            }
          </div>
        </div>
      </div>

      <div style={s.divider} />

      {/* ── Formulario ── */}
      <form onSubmit={handleSubmit} autoComplete="off">

        <div style={s.fieldWrap}>
          <label style={s.label}>Nombre de usuario</label>
          <input
            style={s.input}
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Tu nombre de usuario"
            required
          />
        </div>

        <div style={s.fieldWrap}>
          <label style={s.label}>Correo electrónico</label>
          <div style={s.emailReadonly}>
            <span style={s.emailIcon}>📧</span>
            <span style={s.emailValue}>{user?.email}</span>
            <span style={s.emailLock} title="El correo no puede modificarse aquí">🔒</span>
          </div>
          <p style={s.emailHint}>
            El correo electrónico no puede modificarse desde aquí por razones de seguridad.
          </p>
        </div>

        <button
          type="submit"
          disabled={cargando || newName.trim() === (user?.displayName || '')}
          style={{
            ...s.btn,
            opacity: (cargando || newName.trim() === (user?.displayName || '')) ? 0.5 : 1,
            cursor:  (cargando || newName.trim() === (user?.displayName || '')) ? "not-allowed" : "pointer",
          }}
        >
          {cargando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {/* ── Info de cuenta ── */}
      <div style={s.infoBox}>
        <p style={s.infoLabel}>ℹ️ Información de la cuenta</p>
        <div style={s.infoRow}>
          <span style={s.infoKey}>Proveedor</span>
          <span style={s.infoVal}>
            {user?.providerData?.[0]?.providerId === "google.com" ? "🌐 Google" : "📧 Email/Contraseña"}
          </span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoKey}>UID</span>
          <span style={{ ...s.infoVal, fontFamily: "monospace", fontSize: "0.75rem" }}>
            {user?.uid?.substring(0, 16)}...
          </span>
        </div>
        <div style={s.infoRow}>
          <span style={s.infoKey}>Último acceso</span>
          <span style={s.infoVal}>
            {user?.metadata?.lastSignInTime
              ? new Date(user.metadata.lastSignInTime).toLocaleString("es-HN")
              : "—"}
          </span>
        </div>
      </div>

    </div>
  );
};

const s = {
  card: {
    background:   "#ffffff",
    border:       "1px solid #ddd6fe",
    borderRadius: 14,
    padding:      "28px 32px",
    fontFamily:   "'DM Sans', 'Segoe UI', sans-serif",
  },
  cardHeader: {
    display:      "flex",
    alignItems:   "center",
    gap:          14,
    marginBottom: 20,
  },
  iconWrap: {
    fontSize:       22,
    background:     "#ede9fe",
    border:         "1px solid #c4b5fd",
    borderRadius:   10,
    width:          44,
    height:         44,
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    flexShrink:     0,
  },
  cardTitulo: { fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#1e1b4b" },
  cardSub:    { color: "#6b7280", fontSize: "0.82rem", margin: 0 },
  divider:    { height: 1, background: "#ddd6fe", margin: "20px 0" },
  perfilRow: {
    display:      "flex",
    alignItems:   "center",
    gap:          16,
    marginBottom: 4,
  },
  avatar: {
    width:          56,
    height:         56,
    borderRadius:   "50%",
    background:     "linear-gradient(135deg, #6366f1, #8b5cf6)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     800,
    fontSize:       "1.4rem",
    color:          "#fff",
    flexShrink:     0,
    boxShadow:      "0 4px 16px rgba(99,102,241,0.25)",
  },
  perfilNombre: { color: "#1e1b4b", fontWeight: 700, fontSize: "1rem" },
  perfilEmail:  { color: "#6b7280", fontSize: "0.82rem", marginTop: 2 },
  perfilBadge:  { fontSize: "0.75rem", color: "#7c3aed", marginTop: 4 },
  fieldWrap:    { marginBottom: 20 },
  label: {
    color:         "#7c3aed",
    fontSize:      "0.78rem",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    display:       "block",
    marginBottom:  6,
    fontWeight:    600,
  },
  input: {
    width:        "100%",
    background:   "#f5f3ff",
    border:       "1px solid #ddd6fe",
    borderRadius: 8,
    padding:      "11px 14px",
    color:        "#1e1b4b",
    fontSize:     "0.9rem",
    outline:      "none",
    boxSizing:    "border-box",
    transition:   "border-color 0.15s",
  },
  emailReadonly: {
    display:      "flex",
    alignItems:   "center",
    gap:          10,
    background:   "#f5f3ff",
    border:       "1px solid #ddd6fe",
    borderRadius: 8,
    padding:      "11px 14px",
    opacity:      0.7,
  },
  emailIcon:  { fontSize: "0.9rem" },
  emailValue: { color: "#7c3aed", fontSize: "0.88rem", flex: 1 },
  emailLock:  { fontSize: "0.85rem" },
  emailHint:  { color: "#6b7280", fontSize: "0.75rem", marginTop: 6 },
  btn: {
    background:   "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color:        "#fff",
    border:       "none",
    borderRadius: 8,
    padding:      "12px 24px",
    fontWeight:   700,
    fontSize:     "0.9rem",
    transition:   "opacity 0.15s",
    width:        "100%",
  },
  infoBox: {
    marginTop:    24,
    background:   "#f5f3ff",
    border:       "1px solid #ddd6fe",
    borderRadius: 10,
    padding:      "14px 16px",
  },
  infoLabel: {
    fontSize:      "0.75rem",
    color:         "#7c3aed",
    fontWeight:    600,
    margin:        "0 0 10px",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
  },
  infoRow: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    padding:        "6px 0",
    borderBottom:   "1px solid #ede9fe",
  },
  infoKey: { color: "#6b7280", fontSize: "0.8rem" },
  infoVal: { color: "#5b21b6", fontSize: "0.8rem", fontWeight: 500 },
};

export default AccountSetting;