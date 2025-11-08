import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import '../screens/Landingpage/styles/Landing.css'; 

const App = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [flippedCards, setFlippedCards] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  
  const sectionRefs = {
    inicio: useRef(null),
    proposito: useRef(null),
    modulos: useRef(null),
    beneficios: useRef(null),
    contacto: useRef(null)
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
        icon: "👨‍🎓",
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
        icon: "👨‍🏫",
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
        icon: "📅",
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
        icon: "📚",
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
        icon: "🎻",
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
        icon: "🛒",
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
    <div className="app">
      {/* Navegación */}
      <nav className="navbar">
        <div className="nav-container">
          <motion.div 
            className="logo"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="logo-icon">🎵</span>
            <span className="logo-text">S.I.A.M.</span>
          </motion.div>
          
          <ul className="nav-menu">
            {['inicio', 'proposito', 'modulos', 'beneficios', 'contacto'].map((item) => (
              <li key={item} className="nav-item">
                <button 
                  className={`nav-link ${activeSection === item ? 'active' : ''}`}
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
      <section id="inicio" ref={sectionRefs.inicio} className="hero-section">
        <div className="hero-content">
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="title-line">S.I.A.M</span>
            <span className="title-line">Sistema Integrado</span>
            <span className="title-line">Administrativo Musical</span>
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Plataforma digital para la gestión académica, administrativa y operativa de escuelas de música
          </motion.p>
          
          <motion.button 
            className="cta-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('proposito')}
          >
            Descubre Más
          </motion.button>
        </div>
        
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="floating-elements">
            <div className="floating-element element-1">🎵</div>
            <div className="floating-element element-2">🎼</div>
            <div className="floating-element element-3">🎹</div>
            <div className="floating-element element-4">🎻</div>
          </div>
        </motion.div>
      </section>


      

      {/* Propósito Section */}
      <section id="proposito" ref={sectionRefs.proposito} className="section purpose">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Propósito del Sistema
          </motion.h2>
          
          <motion.div 
            className="purpose-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="purpose-text">
              <p>
                S.I.A.M. está diseñado para <span className="highlight">optimizar y automatizar</span> los procesos clave 
                de instituciones musicales, desde la matrícula hasta el inventario, mejorando la 
                <span className="highlight"> eficiencia, organización y comunicación interna</span>.
              </p>
              
              <div className="problems-grid">
                <h3>Problemas que Resuelve:</h3>
                <div className="problems-list">
                  <div className="problem-item">
                    <span className="problem-icon">📝</span>
                    <span>Procesos manuales de matrícula y seguimiento estudiantil</span>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">⏰</span>
                    <span>Desorganización en horarios y asignaciones</span>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">🎻</span>
                    <span>Control limitado de inventario de instrumentos y bienes</span>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">📦</span>
                    <span>Falta de trazabilidad en órdenes de compra y proveedores</span>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">💬</span>
                    <span>Comunicación institucional dispersa</span>
                  </div>
                  <div className="problem-item">
                    <span className="problem-icon">👥</span>
                    <span>Gestión ineficiente de personal y actividades</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="purpose-visual">
              <div className="visual-card">
                <div className="card-icon">🚀</div>
                <h4>Automatización</h4>
                <p>Automatiza procesos repetitivos para ahorrar tiempo y recursos</p>
              </div>
              <div className="visual-card">
                <div className="card-icon">📊</div>
                <h4>Organización</h4>
                <p>Centraliza toda la información institucional en un solo lugar</p>
              </div>
              <div className="visual-card">
                <div className="card-icon">🔗</div>
                <h4>Integración</h4>
                <p>Conecta todos los departamentos para una gestión unificada</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Módulos Section */}
      <section id="modulos" ref={sectionRefs.modulos} className="section modules">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Módulos Funcionales
          </motion.h2>
          
          <motion.p 
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Descubre todas las funcionalidades que S.I.A.M. ofrece para transformar la gestión de tu institución musical
          </motion.p>
          
          <div className="modules-grid">
            {modulosData.map((modulo, index) => (
              <motion.div
                key={modulo.id}
                className={`card-container ${flippedCards[modulo.id] ? 'flipped' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleCardClick(modulo.id)}
              >
                <div className="card">
                  <div className="card-front">
                    <div className="card-icon">{modulo.front.icon}</div>
                    <h3 className="card-title">{modulo.front.title}</h3>
                    <p className="card-description">{modulo.front.description}</p>
                    <div className="card-hint">Haz clic para más información</div>
                  </div>
                  <div className="card-back">
                    <h3 className="card-title">{modulo.back.title}</h3>
                    <ul className="card-features">
                      {modulo.back.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <div className="card-hint">Haz clic para volver</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section id="beneficios" ref={sectionRefs.beneficios} className="section benefits">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Beneficios Institucionales
          </motion.h2>
          
          <div className="benefits-content">
            <motion.div 
              className="benefits-stats"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="stat">
                <div className="stat-number">+70%</div>
                <div className="stat-label">Eficiencia en tareas administrativas</div>
              </div>
              <div className="stat">
                <div className="stat-number">100%</div>
                <div className="stat-label">Reducción de errores en procesos críticos</div>
              </div>
              <div className="stat">
                <div className="stat-number">24/7</div>
                <div className="stat-label">Acceso centralizado a información</div>
              </div>
              <div className="stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Estudiantes beneficiados</div>
              </div>
            </motion.div>
            
            <motion.div 
              className="benefits-list"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="benefit-item">
                <span className="benefit-icon">✅</span>
                <div className="benefit-text">
                  <h4>Comunicación fluida</h4>
                  <p>Entre docentes, estudiantes y padres</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✅</span>
                <div className="benefit-text">
                  <h4>Trazabilidad completa</h4>
                  <p>De bienes y actividades institucionales</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✅</span>
                <div className="benefit-text">
                  <h4>Gestión eficiente</h4>
                  <p>De personal, horarios y recursos</p>
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✅</span>
                <div className="benefit-text">
                  <h4>Automatización</h4>
                  <p>De 15+ procesos administrativos</p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Testimonio */}
          <motion.div 
            className="testimonial"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="testimonial-content">
              <p className="testimonial-text">
                "Sistema que mejora la eficiencia y la calidad del servicio educativo musical."
              </p>
              <div className="testimonial-author">
                <strong>Lic. Rosario de Fátima Mejía Aguilar</strong>
                <span>Directora, Escuela Experimental de Niños para la Música</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section faq">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Preguntas Frecuentes
          </motion.h2>
          
          <div className="faq-container">
            {faqData.map((item, index) => (
              <motion.div 
                key={index}
                className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="faq-question" onClick={() => toggleFaq(index)}>
                  <span>{item.question}</span>
                  <span className="faq-toggle">{activeFaq === index ? '−' : '+'}</span>
                </div>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" ref={sectionRefs.contacto} className="section contact">
        <div className="container">
          <motion.h2 
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            Contacto
          </motion.h2>
          
          <div className="contact-content">
            <motion.div 
              className="contact-info"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h4>Teléfono</h4>
                  <p>+504 9979-4964</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-details">
                  <h4>Correo Electrónico</h4>
                  <p>siamproject2025@gmail.com</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h4>Ubicación</h4>
                  <p>UNAH, Tegucigalpa, Honduras</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">👨‍💻</div>
                <div className="contact-details">
                  <h4>Desarrollado por</h4>
                  <p>Estudiantes de Ingeniería en Sistemas, UNAH</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="contact-form"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3>Envíanos un mensaje</h3>
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Nombre" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Correo electrónico" required />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Asunto" required />
                </div>
                <div className="form-group">
                  <textarea placeholder="Mensaje" rows="5" required></textarea>
                </div>
                <button type="submit" className="btn-primary">Enviar Mensaje</button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="logo-icon">🎵</span>
              <span className="logo-text">S.I.A.M.</span>
            </div>
            <p className="footer-text">
              Transformando la gestión de instituciones musicales mediante tecnología innovadora
            </p>
            <div className="footer-copy">
              &copy; {new Date().getFullYear()} S.I.A.M. - Todos los derechos reservados
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;