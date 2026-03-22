import React, { useState } from 'react';
import { IoShieldOutline, IoPersonOutline } from 'react-icons/io5';
import { getAuth } from 'firebase/auth';
import ChangePasswordLogueado from './ChangePasswordLogueado';
import AccountSetting from './AccountSetting';

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const auth = getAuth();
  const user = auth.currentUser;

  const renderContent = () => {
    switch (activeTab) {
      case 'security': return <ChangePasswordLogueado />;
      case 'profile':
      default:         return <AccountSetting />;
    }
  };

  return (
    <div style={s.root}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.headerIcon}>⚙️</div>
          <div>
            <h1 style={s.titulo}>Configuración de Cuenta</h1>
            <p style={s.subtitulo}>Administra tu perfil y seguridad</p>
          </div>
        </div>
        {/* Info del usuario actual */}
        <div style={s.userBadge}>
          <div style={s.avatarSmall}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div style={s.userBadgeName}>{user?.displayName || "Usuario"}</div>
            <div style={s.userBadgeEmail}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div style={s.layout}>

        {/* Sidebar */}
        <div style={s.sidebar}>
          <p style={s.sidebarLabel}>Navegación</p>

          <button
            style={{ ...s.tab, ...(activeTab === 'profile' ? s.tabActive : {}) }}
            onClick={() => setActiveTab('profile')}
          >
            <IoPersonOutline size={18} />
            <span>Información del Perfil</span>
            {activeTab === 'profile' && <div style={s.tabIndicator} />}
          </button>

          <button
            style={{ ...s.tab, ...(activeTab === 'security' ? s.tabActive : {}) }}
            onClick={() => setActiveTab('security')}
          >
            <IoShieldOutline size={18} />
            <span>Seguridad</span>
            {activeTab === 'security' && <div style={s.tabIndicator} />}
          </button>

          {/* Info de sesión */}
          <div style={s.sessionInfo}>
            <p style={s.sessionLabel}>Sesión activa</p>
            <div style={s.sessionDot} />
            <p style={s.sessionText}>En línea ahora</p>
          </div>
        </div>

        {/* Contenido */}
        <div style={s.content}>
          {renderContent()}
        </div>

      </div>
    </div>
  );
};

const s = {
  root: {
    minHeight:  "100vh",
    background: "#0f1117",
    color:      "#e8eaf0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding:    "32px 28px",
    boxSizing:  "border-box",
  },
  header: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   32,
    flexWrap:       "wrap",
    gap:            16,
  },
  headerLeft: {
    display:    "flex",
    alignItems: "center",
    gap:        16,
  },
  headerIcon: {
    fontSize:     28,
    background:   "#4f8ef715",
    border:       "1px solid #4f8ef733",
    borderRadius: 12,
    width:        52,
    height:       52,
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
  },
  titulo:    { fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  subtitulo: { color: "#6b7280", fontSize: "0.85rem", margin: 0 },
  userBadge: {
    display:      "flex",
    alignItems:   "center",
    gap:          12,
    background:   "#1a1d27",
    border:       "1px solid #2e3352",
    borderRadius: 12,
    padding:      "10px 16px",
  },
  avatarSmall: {
    width:          40,
    height:         40,
    borderRadius:   "50%",
    background:     "linear-gradient(135deg, #4f8ef7, #22c55e)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontWeight:     700,
    fontSize:       "1rem",
    color:          "#fff",
    flexShrink:     0,
  },
  userBadgeName:  { color: "#e8eaf0", fontWeight: 600, fontSize: "0.88rem" },
  userBadgeEmail: { color: "#6b7280", fontSize: "0.78rem" },
  layout: {
    display: "flex",
    gap:     24,
    alignItems: "flex-start",
  },
  sidebar: {
    width:        220,
    flexShrink:   0,
    background:   "#1a1d27",
    border:       "1px solid #2e3352",
    borderRadius: 14,
    padding:      "20px 14px",
  },
  sidebarLabel: {
    fontSize:      "0.7rem",
    color:         "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight:    600,
    margin:        "0 0 12px 6px",
  },
  tab: {
    display:      "flex",
    alignItems:   "center",
    gap:          10,
    width:        "100%",
    background:   "none",
    border:       "none",
    color:        "#6b7280",
    borderRadius: 8,
    padding:      "10px 12px",
    cursor:       "pointer",
    fontSize:     "0.87rem",
    fontWeight:   500,
    textAlign:    "left",
    transition:   "all 0.15s",
    position:     "relative",
    marginBottom: 4,
  },
  tabActive: {
    background: "#4f8ef715",
    color:      "#4f8ef7",
    fontWeight: 600,
    border:     "1px solid #4f8ef722",
  },
  tabIndicator: {
    position:     "absolute",
    right:        10,
    width:        6,
    height:       6,
    borderRadius: "50%",
    background:   "#4f8ef7",
  },
  sessionInfo: {
    marginTop:  24,
    paddingTop: 16,
    borderTop:  "1px solid #2e3352",
  },
  sessionLabel: {
    fontSize:      "0.68rem",
    color:         "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    margin:        "0 0 8px",
  },
  sessionDot: {
    display:      "inline-block",
    width:        8,
    height:       8,
    borderRadius: "50%",
    background:   "#22c55e",
    marginRight:  6,
    boxShadow:    "0 0 6px #22c55e88",
  },
  sessionText: {
    display:    "inline",
    fontSize:   "0.78rem",
    color:      "#22c55e",
    fontWeight: 500,
  },
  content: {
    flex:   1,
    minWidth: 0,
  },
};

export default AccountSettings;