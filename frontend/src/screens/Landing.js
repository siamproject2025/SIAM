import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, animate } from 'framer-motion';
import '../styles/Landingpage/landing.css';
import { 
  Music, 
  User, 
  Users, 
  Calendar, 
  BookOpen, 
  ShoppingCart, 
  Rocket, 
  BarChart3, 
  Link as LinkIcon,
  Clock,
  Package,
  MessageCircle,
  Users2,
  Phone,
  Mail,
  MapPin,
  Code,
  CheckCircle,
  TrendingUp,
  Shield,
  Zap,
  Guitar
} from "lucide-react";
import ImgLanding from "../assets/ImgLanding.jpg"

const App = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const navigate = useNavigate();

  
  const sectionRefs = {
    inicio: useRef(null),
    proposito: useRef(null),
    modulos: useRef(null),
    beneficios: useRef(null),
    contacto: useRef(null)
  };

 
//Efecto de contador
const AnimatedNumber = ({ to, suffix = '', duration = 1.5 }) => {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const controls = animate(count, to, {
      duration,
      onUpdate(latest) {
        const formatted =
          suffix === '%' || suffix === '+'
            ? `${Math.round(latest)}${suffix}`
            : suffix === '/7'
            ? `24/7`
            : `${Math.round(latest)}${suffix}`;
        setDisplay(formatted);
      },
    });

    return () => controls.stop();
  }, [to, suffix, duration]);

  return <div className="stat-number landing-stat-number">{display}</div>;
};

  // Efecto para animaciones al hacer scroll
  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveSection(id);
          }
        });
      },
      { threshold: 0.5 }
    );

    Object.values(sectionRefs).forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      Object.values(sectionRefs).forEach(ref => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  // Datos para las tarjetas giratorias de módulos
  const modulosData = [
    {
      id: 1,
      front: {
        title: "Gestión de Estudiantes",
        icon: <User size={32} />,
        description: "Matrícula digital y expedientes completos"
      },
      back: {
        title: "Gestión de Estudiantes",
        features: [
          "Matrícula digital",
          "Expedientes completos",
          "Información de contacto",
          "Historial académico",
          "Seguimiento personalizado"
        ]
      }
    },
    {
      id: 2,
      front: {
        title: "Gestión de Personal",
        icon: <Users size={32} />,
        description: "Registro completo de empleados y estados"
      },
      back: {
        title: "Gestión de Personal",
        features: [
          "Registro de empleados",
          "Control de vacaciones y licencias",
          "Gestión de cargos y salarios",
          "Estados laborales",
          "Información administrativa"
        ]
      }
    },
    {
      id: 3,
      front: {
        title: "Horarios Académicos",
        icon: <Calendar size={32} />,
        description: "Programación inteligente sin conflictos"
      },
      back: {
        title: "Horarios Académicos",
        features: [
          "Programación por grado",
          "Asignación de aulas",
          "Asignación de docentes",
          "Prevención de conflictos",
          "Visualización clara"
        ]
      }
    },
    {
      id: 4,
      front: {
        title: "Biblioteca Digital",
        icon: <BookOpen size={32} />,
        description: "Recursos educativos en formato digital"
      },
      back: {
        title: "Biblioteca Digital",
        features: [
          "Subida de libros PDF",
          "Edición de contenido",
          "Descarga segura",
          "Categorización por autor",
          "Búsqueda avanzada"
        ]
      }
    },
    {
      id: 5,
      front: {
        title: "Inventario de Bienes",
        icon: <Guitar size={32} />,
        description: "Control completo de instrumentos y activos"
      },
      back: {
        title: "Inventario de Bienes",
        features: [
          "Registro de activos",
          "Sistema de préstamos",
          "Control de mantenimiento",
          "Valoración económica",
          "Trazabilidad completa"
        ]
      }
    },
    {
      id: 6,
      front: {
        title: "Órdenes de Compra",
        icon: <ShoppingCart size={32} />,
        description: "Gestión completa del proceso de compras"
      },
      back: {
        title: "Órdenes de Compra",
        features: [
          "Generación de órdenes",
          "Envío a proveedores",
          "Recepción de productos",
          "Seguimiento detallado",
          "Cálculo de valores"
        ]
      }
    }
  ];

  // Datos para las preguntas frecuentes
  const faqData = [
    {
      question: "¿Qué es S.I.A.M.?",
      answer: "S.I.A.M. es un Sistema Integrado Administrativo Musical diseñado para optimizar y automatizar los procesos clave de instituciones musicales, desde la matrícula hasta el control de inventario."
    },
    {
      question: "¿Qué problemas resuelve S.I.A.M.?",
      answer: "Resuelve problemas como procesos manuales de matrícula, desorganización en horarios, control limitado de inventario, falta de trazabilidad en compras y comunicación institucional dispersa."
    },
    {
      question: "¿Qué tecnologías utiliza S.I.A.M.?",
      answer: "Utiliza React y JavaScript en el frontend, Express.js en el backend, MongoDB como base de datos y APIs privadas seguras para integración."
    },
    {
      question: "¿Cómo mejora la eficiencia institucional?",
      answer: "Aumenta en más del 70% la eficiencia en tareas administrativas, reduce errores en procesos críticos y proporciona acceso centralizado a información 24/7."
    },
    {
      question: "¿Quién puede utilizar S.I.A.M.?",
      answer: "Está diseñado para escuelas de música, conservatorios y cualquier institución educativa musical que necesite gestionar sus procesos administrativos y académicos."
    }
  ];

  // Función para manejar el clic en las tarjetas giratorias
  const handleCardClick = (id) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Función para alternar las preguntas frecuentes
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Función para navegar a una sección
  const scrollToSection = (sectionId) => {
    sectionRefs[sectionId].current.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(sectionId);
  };

  return (
    <div className="app landing-app">
      {/* Navegación */}
      <nav className="navbar landing-navbar">
        <div className="nav-container landing-nav-container">
          <motion.div 
            className="logo landing-logo"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="logo-icon landing-logo-icon"><Music size={20} /></span>
            <span className="logo-text landing-logo-text">S.I.A.M.</span>
          </motion.div>
          
          <ul className="nav-menu landing-nav-menu">
            {['inicio', 'proposito', 'modulos', 'beneficios', 'contacto'].map((item) => (
              <li key={item} className="nav-item landing-nav-item">
                <button 
                  className={`nav-link landing-nav-link ${activeSection === item ? 'active' : ''}`}
                  onClick={() => scrollToSection(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

     {/* Sección Hero */}
      <section id="inicio" ref={sectionRefs.inicio} className="hero-section landing-hero-section">
        <div className="hero-content landing-hero-content">
          <motion.h1 
            className="hero-title landing-hero-title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="title-line landing-title-line">S.I.A.M</span>
            <span className="title-line landing-title-line">Sistema Integrado</span>
            <span className="title-line landing-title-line">Administrativo Musical</span>
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle landing-hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Plataforma digital para la gestión académica, administrativa y operativa de escuelas de música
          </motion.p>
          
          <motion.button 
            className="cta-button landing-cta-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </motion.button>
        </div>
        
        <motion.div 
          className="hero-visual landing-hero-visual"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className='imgLanding'>
          <img src={ImgLanding}></img>
          </div>
        </motion.div>
      </section>

      {/* Propósito Section */}
      <section id="proposito" ref={sectionRefs.proposito} className="section purpose landing-purpose">
        <div className="container landing-container">
          <motion.h2 
            className="section-title landing-section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Propósito del Sistema
          </motion.h2>
          
          <motion.div 
            className="purpose-content landing-purpose-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="purpose-text landing-purpose-text">
              <p>
                S.I.A.M. está diseñado para <span className="highlight landing-highlight">optimizar y automatizar</span> los procesos clave 
                de instituciones musicales, desde la matrícula hasta el inventario, mejorando la 
                <span className="highlight landing-highlight"> eficiencia, organización y comunicación interna</span>.
              </p>
              
              <div className="problems-grid landing-problems-grid">
                <h3>Problemas que Resuelve:</h3>
                <div className="problems-list landing-problems-list">
                  <div className="problem-item landing-problem-item">
                    <span className="problem-icon landing-problem-icon"><User size={20} /></span>
                    <span>Procesos manuales de matrícula y seguimiento estudiantil</span>
                  </div>
                  <div className="problem-item landing-problem-item">
                    <span className="problem-icon landing-problem-icon"><Clock size={20} /></span>
                    <span>Desorganización en horarios y asignaciones</span>
                  </div>
                  <div className="problem-item landing-problem-item">
                    <span className="problem-icon landing-problem-icon"><Guitar size={20} /></span>
                    <span>Control limitado de inventario de instrumentos y bienes</span>
                  </div>
                  <div className="problem-item landing-problem-item">
                    <span className="problem-icon landing-problem-icon"><Package size={20} /></span>
                    <span>Falta de trazabilidad en órdenes de compra y proveedores</span>
                  </div>
                  <div className="problem-item landing-problem-item">
                    <span className="problem-icon landing-problem-icon"><MessageCircle size={20} /></span>
                    <span>Comunicación institucional dispersa</span>
                  </div>
                  <div className="problem-item landing-problem-item">
                    <span className="problem-icon landing-problem-icon"><Users2 size={20} /></span>
                    <span>Gestión ineficiente de personal y actividades</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="purpose-visual landing-purpose-visual">
              <div className="visual-card landing-visual-card">
                <div className="card-icon landing-card-icon"><Rocket size={32} /></div>
                <h4>Automatización</h4>
                <p>Automatiza procesos repetitivos para ahorrar tiempo y recursos</p>
              </div>
              <div className="visual-card landing-visual-card">
                <div className="card-icon landing-card-icon"><BarChart3 size={32} /></div>
                <h4>Organización</h4>
                <p>Centraliza toda la información institucional en un solo lugar</p>
              </div>
              <div className="visual-card landing-visual-card">
                <div className="card-icon landing-card-icon"><LinkIcon size={32} /></div>
                <h4>Integración</h4>
                <p>Conecta todos los departamentos para una gestión unificada</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Módulos Section */}
      <section id="modulos" ref={sectionRefs.modulos} className="section modules landing-modules">
        <div className="container landing-container">
          <motion.h2 
            className="section-title landing-section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Módulos Funcionales
          </motion.h2>
          
          <motion.p 
            className="section-subtitle landing-section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Descubre todas las funcionalidades que S.I.A.M. ofrece para transformar la gestión de tu institución musical
          </motion.p>
          
          <div className="modules-grid landing-modules-grid">
            {modulosData.map((modulo, index) => (
              <motion.div
                key={modulo.id}
                className={`card-container landing-card-container ${flippedCards[modulo.id] ? 'flipped' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleCardClick(modulo.id)}
              >
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
                      {modulo.back.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <div className="card-hint landing-card-hint">Haz clic para volver</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section id="beneficios" ref={sectionRefs.beneficios} className="section benefits landing-benefits">
        <div className="container landing-container">
          <motion.h2 
            className="section-title landing-section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Beneficios Institucionales
          </motion.h2>
          
          <div className="benefits-content landing-benefits-content">
            <motion.div 
              className="benefits-stats landing-benefits-stats"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="stat landing-stat">
                <AnimatedNumber to={70} suffix="%" />
                <div className="stat-label landing-stat-label">Eficiencia en tareas administrativas</div>
              </div>
              <div className="stat landing-stat">
                <AnimatedNumber to={100} suffix="%" />
                <div className="stat-label landing-stat-label">Reducción de errores en procesos críticos</div>
              </div>
              <div className="stat landing-stat">
                <AnimatedNumber to={24} suffix="/7" />
                <div className="stat-label landing-stat-label">Acceso centralizado a información</div>
              </div>
              <div className="stat landing-stat">
                <AnimatedNumber to={500} suffix="+" />
                <div className="stat-label landing-stat-label">Estudiantes beneficiados</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="benefits-list landing-benefits-list"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="benefit-item landing-benefit-item">
                <span className="benefit-icon landing-benefit-icon"><MessageCircle size={24} /></span>
                <div className="benefit-text landing-benefit-text">
                  <h4>Comunicación fluida</h4>
                  <p>Entre docentes, estudiantes y padres</p>
                </div>
              </div>
              <div className="benefit-item landing-benefit-item">
                <span className="benefit-icon landing-benefit-icon"><Shield size={24} /></span>
                <div className="benefit-text landing-benefit-text">
                  <h4>Trazabilidad completa</h4>
                  <p>De bienes y actividades institucionales</p>
                </div>
              </div>
              <div className="benefit-item landing-benefit-item">
                <span className="benefit-icon landing-benefit-icon"><TrendingUp size={24} /></span>
                <div className="benefit-text landing-benefit-text">
                  <h4>Gestión eficiente</h4>
                  <p>De personal, horarios y recursos</p>
                </div>
              </div>
              <div className="benefit-item landing-benefit-item">
                <span className="benefit-icon landing-benefit-icon"><Zap size={24} /></span>
                <div className="benefit-text landing-benefit-text">
                  <h4>Automatización</h4>
                  <p>De 15+ procesos administrativos</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Testimonio */}
          <motion.div 
            className="testimonial landing-testimonial"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="testimonial-content landing-testimonial-content">
              <p className="testimonial-text landing-testimonial-text">
                "Sistema que mejora la eficiencia y la calidad del servicio educativo musical."
              </p>
              <div className="testimonial-author landing-testimonial-author">
                <strong>Lic. Rosario de Fátima Mejía Aguilar</strong>
                <span>Directora, Escuela Experimental de Niños para la Música</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section faq landing-faq">
        <div className="container landing-container">
          <motion.h2 
            className="section-title landing-section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Preguntas Frecuentes
          </motion.h2>
          
          <div className="faq-container landing-faq-container">
            {faqData.map((item, index) => (
              <motion.div 
                key={index}
                className={`faq-item landing-faq-item ${activeFaq === index ? 'active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="faq-question landing-faq-question" onClick={() => toggleFaq(index)}>
                  <span>{item.question}</span>
                  <span className="faq-toggle landing-faq-toggle">{activeFaq === index ? '−' : '+'}</span>
                </div>
                <div className="faq-answer landing-faq-answer">
                  <p>{item.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" ref={sectionRefs.contacto} className="section contact landing-contact">
        <div className="container landing-container">
          <motion.h2 
            className="section-title landing-section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Contacto
          </motion.h2>
          
          <div className="contact-content landing-contact-content">
            <motion.div 
              className="contact-info landing-contact-info"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="contact-item landing-contact-item">
                <div className="contact-icon landing-contact-icon"><Phone size={24} /></div>
                <div className="contact-details landing-contact-details">
                  <h4>Teléfono</h4>
                  <p>+504 8797-1675</p>
                </div>
              </div>
              
              <div className="contact-item landing-contact-item">
                <div className="contact-icon landing-contact-icon"><Mail size={24} /></div>
                <div className="contact-details landing-contact-details">
                  <h4>Correo Electrónico</h4>
                  <p>esc.experimentalmusica@gmail.com</p>
                </div>
              </div>
              
              <div className="contact-item landing-contact-item">
                <div className="contact-icon landing-contact-icon"><MapPin size={24} /></div>
                <div className="contact-details landing-contact-details">
                  <h4>Ubicación</h4>
                  <p>Colonia Hato de Enmedio, sector 2 Contiguo a la Iglesia de los Santos de los Últimos Días, Tegucigalpa, Honduras</p>
                </div>
              </div>
              
              <div className="contact-item landing-contact-item">
                <div className="contact-icon landing-contact-icon"><Code size={24} /></div>
                <div className="contact-details landing-contact-details">
                  <h4>Desarrollado por</h4>
                  <p>Estudiantes de Informática Administrativa, UNAH</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="mapa-contacto landing-mapa-contacto"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>Ubicación Institucional</h3>
              <p className="mapa-descripcion landing-mapa-descripcion">
                Colonia Hato de Enmedio, sector 2, contiguo a la Iglesia de los Santos de los Últimos Días, Tegucigalpa, Honduras
              </p>
              <div className="mapa-embed landing-mapa-embed">
                <iframe
                  title="Mapa S.I.A.M."
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3931.562882243273!2d-87.1767392!3d14.0727637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f6fbcd070775acd%3A0x30d484aaca34d4cf!2sEscuela%20Experimental%20De%20Ni%C3%B1os%20Para%20La%20M%C3%BAsica!5e0!3m2!1ses!2shn!4v1699999999999"
                  width="100%"
                  height="400"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;