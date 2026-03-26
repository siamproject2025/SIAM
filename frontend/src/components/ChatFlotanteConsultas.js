// ============================================================
// ChatFlotanteConsultas.jsx
// CAMBIOS:
// 1. Colores del sistema (morado/violeta) en lugar del rojo
// 2. Se oculta automáticamente cuando el cursor se aleja
//    de la esquina inferior derecha (proximity detection)
// 3. Efecto de pulse suave cuando está inactivo
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import QuestionList from './QuestionList';
import { MessageSquare, X } from 'lucide-react';
import useUserRole from './hooks/useUserRole';
import '../styles/ChatFlotanteConsultas.css';

const ROLES_PERMITIDOS = ["PADRE", "ADMIN", "DOCENTE"];

// ── CSS inline para el botón y panel ─────────────────────────
const CSS = `
  /* ── Botón flotante ── */
  .cf-btn {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9000;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity .35s ease, transform .3s ease, box-shadow .3s ease;
    background: linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%);
    box-shadow: 0 4px 20px rgba(108, 79, 191, .4);
    color: #fff;
  }

  /* Visible por defecto (cerca de la esquina) */
  .cf-btn.visible {
    opacity: 1;
    transform: scale(1);
    pointer-events: all;
  }

  /* Cuando el cursor está lejos: casi invisible */
  .cf-btn.hidden-far {
    opacity: 0.12;
    transform: scale(0.82);
    pointer-events: all; /* sigue siendo clickeable */
  }

  .cf-btn:hover {
    opacity: 1 !important;
    transform: scale(1.1) !important;
    box-shadow: 0 8px 28px rgba(108, 79, 191, .5) !important;
  }

  /* Pulse cuando está cerrado y visible */
  .cf-btn.pulse::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid rgba(108, 79, 191, .5);
    animation: cf-pulse 2.2s ease-out infinite;
  }

  @keyframes cf-pulse {
    0%   { transform: scale(1);   opacity: .7; }
    70%  { transform: scale(1.35); opacity: 0;  }
    100% { transform: scale(1.35); opacity: 0;  }
  }

  /* Notif badge */
  .cf-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #E74C3C;
    border: 2px solid #fff;
  }

  /* ── Panel ── */
  .cf-panel {
    position: fixed;
    bottom: 90px;
    right: 28px;
    z-index: 8999;
    width: 360px;
    max-width: calc(100vw - 40px);
    max-height: 520px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 12px 48px rgba(108, 79, 191, .22), 0 2px 8px rgba(0,0,0,.08);
    border: 1.5px solid #E0D9F5;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: opacity .28s ease, transform .28s ease;
  }

  .cf-panel.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: all;
  }

  .cf-panel.hidden {
    opacity: 0;
    transform: translateY(14px) scale(.97);
    pointer-events: none;
  }

  /* Header del panel */
  .cf-panel-header {
    background: linear-gradient(135deg, #6C4FBF 0%, #9B59B6 100%);
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .cf-panel-header h3 {
    color: #fff;
    font-size: .95rem;
    font-weight: 800;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Nunito', sans-serif;
  }

  .cf-close-btn {
    background: rgba(255,255,255,.2);
    border: none;
    border-radius: 8px;
    color: #fff;
    cursor: pointer;
    padding: 5px;
    display: flex;
    align-items: center;
    transition: background .18s;
  }
  .cf-close-btn:hover { background: rgba(255,255,255,.35); }

  .cf-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }
  .cf-panel-content::-webkit-scrollbar { width: 4px; }
  .cf-panel-content::-webkit-scrollbar-thumb { background: #C4B5E8; border-radius: 4px; }

  @media (max-width: 480px) {
    .cf-panel { right: 12px; bottom: 80px; width: calc(100vw - 24px); }
    .cf-btn   { right: 16px; bottom: 20px; }
  }
`;

// ── Zona de proximidad (px desde la esquina) ─────────────────
const PROXIMITY_RADIUS = 180;

const ChatFlotanteConsultas = () => {
  const [isOpen, setIsOpen]         = useState(false);
  const [isNear, setIsNear]         = useState(false);
  const [hasActivity, setHasActivity] = useState(false);
  const { userRole, cargando }      = useUserRole();
  const btnRef                      = useRef(null);

  // ── Detectar proximidad del cursor a la esquina ──────────
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const distX = window.innerWidth  - clientX;
      const distY = window.innerHeight - clientY;
      const dist  = Math.sqrt(distX * distX + distY * distY);
      setIsNear(dist < PROXIMITY_RADIUS);
    };

    // En móvil siempre visible
    const isMobile = window.innerWidth < 768;
    if (isMobile) { setIsNear(true); return; }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Mostrar brevemente al montar
  useEffect(() => {
    setIsNear(true);
    const t = setTimeout(() => setIsNear(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (cargando || !ROLES_PERMITIDOS.includes(userRole)) return null;

  const canAnswer = userRole === "ADMIN" || userRole === "DOCENTE";
  const canAsk    = userRole === "PADRE";

  const btnClass = [
    "cf-btn",
    (isNear || isOpen) ? "visible" : "hidden-far",
    !isOpen ? "pulse" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <style>{CSS}</style>

      {/* Panel */}
      <div className={`cf-panel ${isOpen ? "visible" : "hidden"}`}>
        <div className="cf-panel-header">
          <h3><MessageSquare size={16}/> Consultas</h3>
          <button className="cf-close-btn" onClick={() => setIsOpen(false)}>
            <X size={16}/>
          </button>
        </div>
        <div className="cf-panel-content">
          <QuestionList canAnswer={canAnswer} canAsk={canAsk}/>
        </div>
      </div>

      {/* Botón flotante */}
      <button
        ref={btnRef}
        className={btnClass}
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? "Cerrar Consultas" : "Abrir Consultas"}
      >
        {isOpen ? <X size={24}/> : <MessageSquare size={24}/>}
      </button>
    </>
  );
};

export default ChatFlotanteConsultas;