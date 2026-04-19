import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, animate } from 'framer-motion';
import axios from 'axios';
import '../styles/Landingpage/landing.css';
import {
  Music, User, Users, Calendar, BookOpen, ShoppingCart,
  Rocket, BarChart3, Link as LinkIcon, Clock, Package,
  MessageCircle, Users2, Phone, Mail, MapPin, Code,
  CheckCircle, TrendingUp, Shield, Zap, Guitar
} from "lucide-react";
import ImgLanding from "../assets/ImgLanding.jpg";
import { PARAMS_KEY, DEFAULTS } from './Parametros';

const API_URL = process.env.REACT_APP_API_URL + "/api/parametros";

// ── Hex a RGB ─────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '106, 17, 203';
};

// ── Hook para leer parámetros con fallback ────────────────────
function useParametros() {
  const [params, setParams] = useState(() => {
    try {
      const s = localStorage.getItem(PARAMS_KEY);
      const parsed = s ? JSON.parse(s) : {};
      const merged = { ...DEFAULTS, ...parsed };
      if (!Array.isArray(merged.faq)) merged.faq = [...DEFAULTS.faq];
      return merged;
    } catch { return { ...DEFAULTS }; }
  });

  useEffect(() => {
    axios.get(API_URL)
      .then(res => {
        const merged = { ...DEFAULTS, ...res.data };
        if (!Array.isArray(merged.faq)) merged.faq = [...DEFAULTS.faq];
        setParams(merged);
        localStorage.setItem(PARAMS_KEY, JSON.stringify(merged));
      })
      .catch(() => {});

    const handler = (e) => {
      if (e.key === PARAMS_KEY) {
        try {
          const s = e.newValue;
          if (s) {
            const merged = { ...DEFAULTS, ...JSON.parse(s) };
            if (!Array.isArray(merged.faq)) merged.faq = [...DEFAULTS.faq];
            setParams(merged);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return params;
}

// ── Número animado ────────────────────────────────────────────
const AnimatedNumber = ({ to, suffix = '', duration = 1.5 }) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const controls = animate(count, parseInt(to) || 0, {
      duration,
      onUpdate(latest) {
        setDisplay(suffix === '/7' ? '24/7' : `${Math.round(latest)}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [to, suffix, duration]);
  return <div className="stat-number landing-stat-number">{display}</div>;
};

// ============================================================
const App = () => {
  const P = useParametros();

  // ── Aplicar colores dinámicos desde MongoDB ───────────────
  useEffect(() => {
    const root = document.documentElement;
    const primary   = P.color_primario   || '#6a11cb';
    const secondary = P.color_secundario || '#2575fc';

    root.style.setProperty('--primary-color',   primary);
    root.style.setProperty('--secondary-color',  secondary);
    root.style.setProperty('--primary-rgb',   hexToRgb(primary));
    root.style.setProperty('--secondary-rgb', hexToRgb(secondary));
  }, [P.color_primario, P.color_secundario]);

  const [activeFaq,    setActiveFaq]    = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [activeSection,setActiveSection]= useState('inicio');
  const navigate = useNavigate();

  const sectionRefs = {
    inicio:     useRef(null),
    proposito:  useRef(null),
    modulos:    useRef(null),
    beneficios: useRef(null),
    contacto:   useRef(null),
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.5 }
    );
    Object.values(sectionRefs).forEach(r => { if (r.current) observer.observe(r.current); });
    return () => Object.values(sectionRefs).forEach(r => { if (r.current) observer.unobserve(r.current); });
  }, []);

  const modulosData = [
    { id:1, front:{ title:"Gestión de Estudiantes",  icon:<User size={32}/>,         description:"Matrícula digital y expedientes completos" },         back:{ title:"Gestión de Estudiantes",  features:["Matrícula digital","Expedientes completos","Información de contacto","Historial académico","Seguimiento personalizado"] } },
    { id:2, front:{ title:"Gestión de Personal",      icon:<Users size={32}/>,        description:"Registro completo de empleados y estados" },            back:{ title:"Gestión de Personal",      features:["Registro de empleados","Control de vacaciones y licencias","Gestión de cargos y salarios","Estados laborales","Información administrativa"] } },
    { id:3, front:{ title:"Horarios Académicos",      icon:<Calendar size={32}/>,     description:"Programación inteligente sin conflictos" },             back:{ title:"Horarios Académicos",      features:["Programación por grado","Asignación de aulas","Asignación de docentes","Prevención de conflictos","Visualización clara"] } },
    { id:4, front:{ title:"Biblioteca Digital",       icon:<BookOpen size={32}/>,     description:"Recursos educativos en formato digital" },              back:{ title:"Biblioteca Digital",       features:["Subida de libros PDF","Edición de contenido","Descarga segura","Categorización por autor","Búsqueda avanzada"] } },
    { id:5, front:{ title:"Inventario de Bienes",     icon:<Guitar size={32}/>,       description:"Control completo de instrumentos y activos" },          back:{ title:"Inventario de Bienes",     features:["Registro de activos","Sistema de préstamos","Control de mantenimiento","Valoración económica","Trazabilidad completa"] } },
    { id:6, front:{ title:"Órdenes de Compra",        icon:<ShoppingCart size={32}/>, description:"Gestión completa del proceso de compras" },             back:{ title:"Órdenes de Compra",        features:["Generación de órdenes","Envío a proveedores","Recepción de productos","Seguimiento detallado","Cálculo de valores"] } },
  ];

  const faqData = Array.isArray(P?.faq) ? P.faq : DEFAULTS.faq;
  const handleCardClick = id => setFlippedCards(p => ({ ...p, [id]: !p[id] }));
  const toggleFaq       = i  => setActiveFaq(activeFaq === i ? null : i);
  const scrollToSection = id => { sectionRefs[id].current.scrollIntoView({ behavior:'smooth' }); setActiveSection(id); };

  return (
    <div className="app landing-app">

      {/* Navegación */}
      <nav className="navbar landing-navbar">
        <div className="nav-container landing-nav-container">
          <motion.div className="logo landing-logo"
            initial={{ opacity:0, x:-50 }} animate={{ opacity:1, x:0 }} transition={{ duration:.5 }}>
            <span className="logo-icon landing-logo-icon"><Music size={20}/></span>
            <span className="logo-text landing-logo-text">{P.siglas}</span>
          </motion.div>
          <ul className="nav-menu landing-nav-menu">
            {['inicio','proposito','modulos','beneficios','contacto'].map(item => (
              <li key={item} className="nav-item landing-nav-item">
                <button className={`nav-link landing-nav-link${activeSection===item?' active':''}`}
                  onClick={()=>scrollToSection(item)}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section id="inicio" ref={sectionRefs.inicio} className="hero-section landing-hero-section">
        <div className="hero-content landing-hero-content">
          <motion.h1 className="hero-title landing-hero-title"
            initial={{ opacity:0, y:50 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7 }}>
            <span className="title-line landing-title-line">{P.siglas}</span>
            <span className="title-line landing-title-line">{P.slogan.split(' ').slice(0,2).join(' ')}</span>
            <span className="title-line landing-title-line">{P.slogan.split(' ').slice(2).join(' ')}</span>
          </motion.h1>
          <motion.p className="hero-subtitle landing-hero-subtitle"
            initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:.7, delay:.2 }}>
            {P.descripcion_hero}
          </motion.p>
          <motion.button className="cta-button landing-cta-button"
            initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }} transition={{ duration:.5, delay:.4 }}
            whileHover={{ scale:1.05 }} whileTap={{ scale:.95 }}
            onClick={()=>navigate('/login')}>
            Iniciar sesión
          </motion.button>
        </div>
        <motion.div className="hero-visual landing-hero-visual"
          initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} transition={{ duration:.7, delay:.3 }}>
          <div className="imgLanding"><img src={ImgLanding} alt={P.nombre_institucion}/></div>
        </motion.div>
      </section>

      {/* Propósito */}
      <section id="proposito" ref={sectionRefs.proposito} className="section purpose landing-purpose">
        <div className="container landing-container">
          <motion.h2 className="section-title landing-section-title"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
            Propósito del Sistema
          </motion.h2>
          <motion.div className="purpose-content landing-purpose-content"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5, delay:.2 }} viewport={{ once:true }}>
            <div className="purpose-text landing-purpose-text">
              <p>
                <strong>{P.siglas}</strong> está diseñado para{' '}
                <span className="highlight landing-highlight">optimizar y automatizar</span> los procesos clave
                de instituciones musicales, mejorando la
                <span className="highlight landing-highlight"> eficiencia, organización y comunicación interna</span>.
              </p>
              <div className="problems-grid landing-problems-grid">
                <h3>Problemas que Resuelve:</h3>
                <div className="problems-list landing-problems-list">
                  {[
                    { icon:<User size={20}/>,         text:"Procesos manuales de matrícula y seguimiento estudiantil" },
                    { icon:<Clock size={20}/>,         text:"Desorganización en horarios y asignaciones" },
                    { icon:<Guitar size={20}/>,        text:"Control limitado de inventario de instrumentos y bienes" },
                    { icon:<Package size={20}/>,       text:"Falta de trazabilidad en órdenes de compra y proveedores" },
                    { icon:<MessageCircle size={20}/>, text:"Comunicación institucional dispersa" },
                    { icon:<Users2 size={20}/>,        text:"Gestión ineficiente de personal y actividades" },
                  ].map((p,i)=>(
                    <div key={i} className="problem-item landing-problem-item">
                      <span className="problem-icon landing-problem-icon">{p.icon}</span>
                      <span>{p.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="purpose-visual landing-purpose-visual">
              {[
                { icon:<Rocket size={32}/>,   title:"Automatización", desc:"Automatiza procesos repetitivos para ahorrar tiempo y recursos" },
                { icon:<BarChart3 size={32}/>, title:"Organización",   desc:"Centraliza toda la información institucional en un solo lugar" },
                { icon:<LinkIcon size={32}/>,  title:"Integración",    desc:"Conecta todos los departamentos para una gestión unificada" },
              ].map((c,i)=>(
                <div key={i} className="visual-card landing-visual-card">
                  <div className="card-icon landing-card-icon">{c.icon}</div>
                  <h4>{c.title}</h4><p>{c.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Módulos */}
      <section id="modulos" ref={sectionRefs.modulos} className="section modules landing-modules">
        <div className="container landing-container">
          <motion.h2 className="section-title landing-section-title"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
            Módulos Funcionales
          </motion.h2>
          <motion.p className="section-subtitle landing-section-subtitle"
            initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5, delay:.1 }} viewport={{ once:true }}>
            Descubre todas las funcionalidades que {P.siglas} ofrece para transformar la gestión de tu institución musical
          </motion.p>
          <div className="modules-grid landing-modules-grid">
            {modulosData.map((modulo, index) => (
              <motion.div key={modulo.id}
                className={`card-container landing-card-container${flippedCards[modulo.id]?' flipped':''}`}
                initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
                transition={{ duration:.5, delay:index*.1 }} viewport={{ once:true }}
                onClick={()=>handleCardClick(modulo.id)}>
                <div className="card landing-card">
                  <div className="card-front landing-card-front">
                    <div className="card-icon landing-card-icon">{modulo.front.icon}</div>
                    <h3 className="card-title landing-card-title">{modulo.front.title}</h3>
                    <p className="card-description landing-card-description">{modulo.front.description}</p>
                    <div className="card-hint landing-card-hint">Haz clic para más información</div>
                  </div>
                  <div className="card-back landing-card-back">
                    <h3 className="card-title landing-card-title">{modulo.back.title}</h3>
                    <ul className="card-features landing-card-features">
                      {modulo.back.features.map((f,i)=><li key={i}>{f}</li>)}
                    </ul>
                    <div className="card-hint landing-card-hint">Haz clic para volver</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section id="beneficios" ref={sectionRefs.beneficios} className="section benefits landing-benefits">
        <div className="container landing-container">
          <motion.h2 className="section-title landing-section-title"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
            Beneficios Institucionales
          </motion.h2>
          <div className="benefits-content landing-benefits-content">
            <motion.div className="benefits-stats landing-benefits-stats"
              initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
              <div className="stat landing-stat"><AnimatedNumber to={P.stat_eficiencia} suffix="%"/><div className="stat-label landing-stat-label">Eficiencia en tareas administrativas</div></div>
              <div className="stat landing-stat"><AnimatedNumber to={P.stat_reduccion}  suffix="%"/><div className="stat-label landing-stat-label">Reducción de errores en procesos críticos</div></div>
              <div className="stat landing-stat"><AnimatedNumber to={P.stat_acceso}     suffix="/7"/><div className="stat-label landing-stat-label">Acceso centralizado a información</div></div>
              <div className="stat landing-stat"><AnimatedNumber to={P.stat_estudiantes} suffix="+"/><div className="stat-label landing-stat-label">Estudiantes beneficiados</div></div>
            </motion.div>
            <motion.div className="benefits-list landing-benefits-list"
              initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
              {[
                { icon:<MessageCircle size={24}/>, title:"Comunicación fluida",   desc:"Entre docentes, estudiantes y padres" },
                { icon:<Shield size={24}/>,        title:"Trazabilidad completa", desc:"De bienes y actividades institucionales" },
                { icon:<TrendingUp size={24}/>,    title:"Gestión eficiente",     desc:"De personal, horarios y recursos" },
                { icon:<Zap size={24}/>,           title:"Automatización",        desc:"De 15+ procesos administrativos" },
              ].map((b,i)=>(
                <div key={i} className="benefit-item landing-benefit-item">
                  <span className="benefit-icon landing-benefit-icon">{b.icon}</span>
                  <div className="benefit-text landing-benefit-text"><h4>{b.title}</h4><p>{b.desc}</p></div>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div className="testimonial landing-testimonial"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5, delay:.2 }} viewport={{ once:true }}>
            <div className="testimonial-content landing-testimonial-content">
              <p className="testimonial-text landing-testimonial-text">"{P.testimonio}"</p>
              <div className="testimonial-author landing-testimonial-author">
                <strong>{P.directora}</strong>
                <span>{P.cargo_directora}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section faq landing-faq">
        <div className="container landing-container">
          <motion.h2 className="section-title landing-section-title"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
            Preguntas Frecuentes
          </motion.h2>
          <div className="faq-container landing-faq-container">
            {faqData.filter(f=>f.question).map((item,index)=>(
              <motion.div key={index}
                className={`faq-item landing-faq-item${activeFaq===index?' active':''}`}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
                transition={{ duration:.3, delay:index*.1 }} viewport={{ once:true }}>
                <div className="faq-question landing-faq-question" onClick={()=>toggleFaq(index)}>
                  <span>{item.question}</span>
                  <span className="faq-toggle landing-faq-toggle">{activeFaq===index?'−':'+'}</span>
                </div>
                <div className="faq-answer landing-faq-answer"><p>{item.answer}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" ref={sectionRefs.contacto} className="section contact landing-contact">
        <div className="container landing-container">
          <motion.h2 className="section-title landing-section-title"
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
            Contacto
          </motion.h2>
          <div className="contact-content landing-contact-content">
            <motion.div className="contact-info landing-contact-info"
              initial={{ opacity:0, x:-50 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
              {[
                { icon:<Phone size={24}/>,  title:"Teléfono",           value:P.telefono },
                { icon:<Mail size={24}/>,   title:"Correo Electrónico", value:P.correo },
                { icon:<MapPin size={24}/>, title:"Ubicación",          value:P.direccion },
                { icon:<Code size={24}/>,   title:"Desarrollado por",   value:P.desarrollado_por },
              ].map((c,i)=>(
                <div key={i} className="contact-item landing-contact-item">
                  <div className="contact-icon landing-contact-icon">{c.icon}</div>
                  <div className="contact-details landing-contact-details"><h4>{c.title}</h4><p>{c.value}</p></div>
                </div>
              ))}
            </motion.div>
            <motion.div className="mapa-contacto landing-mapa-contacto"
              initial={{ opacity:0, x:50 }} whileInView={{ opacity:1, x:0 }} transition={{ duration:.5 }} viewport={{ once:true }}>
              <h3>Ubicación Institucional</h3>
              <p className="mapa-descripcion landing-mapa-descripcion">{P.direccion}</p>
              <div className="mapa-embed landing-mapa-embed">
                <iframe title={`Mapa ${P.siglas}`} src={P.mapa_embed_url} width="100%" height="400" allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default App;