import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Users, 
  Calendar, 
  Shield, 
  BookOpen, 
  Settings,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Github,
  Linkedin,
  ExternalLink
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';

import '../styles/Landingpage/landing.css';

// === COMPONENTE PRINCIPAL LANDING PAGE S.I.A.M. ===
const LandingPage = () => {
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Efecto para detectar scroll y cambiar navbar
  useEffect(() => {
    //Verificacion si hay usuario logeado
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      if (token && userData) {
        setUser({...JSON.parse(userData)});
       } else {
        setUser( null);
       }
      };
      checkAuthStatus();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
    
    }, []);

    const scrlltoSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    };

  return (
    <div className="landing-page">
      {/* === 1. HEADER/NAVEGACIÓN === */}
      <nav className={`navbar-custom ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="container-custom">
          <div className="d-flex justify-content-between align-items-center">
            {/* Logo */}
            <a href="#inicio" className="logo">
              <Music size={24} />
              S.I.A.M.
            </a>

            {/* Menú de navegación */}
            <ul className="nav-menu d-none d-lg-flex">
              <li><a href="#inicio" className="nav-link-custom">Inicio</a></li>
              <li><a href="#caracteristicas" className="nav-link-custom">Características</a></li>
              <li><a href="#beneficios" className="nav-link-custom">Beneficios</a></li>
              <li><a href="#modulos" className="nav-link-custom">Módulos</a></li>
              <li><a href="#contacto" className="nav-link-custom">Contacto</a></li>
            </ul>

            {/* Botones de acción */}
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={() => navigate('/login')}>Iniciar Sesión</button>
              <button className="btn btn-primary" onClick={()=> navigate('/#')}>Registro</button>
            </div>
          </div>
        </div>
      </nav>

      {/* === 2. HERO SECTION === */}
      <section id="inicio" className="hero-section">
        <div className="container-custom">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="hero-content animate-fade-in-up">
                <h1 className="hero-title">
                  S.I.A.M. - Sistema Integrado 
                  <span className="text-gradient"> Administrativo Musical</span>
                </h1>
                <p className="hero-subtitle">
                  Transforme la gestión de su institución musical con tecnología moderna
                </p>
                <p className="hero-description">
                  Solución integral diseñada específicamente para automatizar procesos 
                  administrativos, académicos y de inventario en instituciones musicales.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <button className="btn btn-light btn-lg">
                    Conocer el Sistema
                    <ExternalLink className="ms-2" size={20} />
                  </button>
                  <button className="btn btn-outline-light btn-lg">
                    Empezamos?
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              {/* Imagen del mockup o estudiantes */}
              <div className="hero-image">
                <img 
                  src="https://images.pexels.com/photos/45243/saxophone-music-gold-gloss-45243.jpeg?_gl=1*1ox7gv2*_ga*MTY4MDAyMzg4Ni4xNzU0MjAzOTUx*_ga_8JE65Q40S6*czE3NTkwNDA3OTMkbzgkZzEkdDE3NTkwNDA4MzMkajIwJGwwJGgw" 
                  alt="Estudiantes de música" 
                  className="img-fluid rounded-3 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === 3. PROBLEMA/NECESIDAD === */}
      <section className="section problem-section">
        <div className="container-custom">
          <h2 className="section-title">
            ¿Su escuela de música enfrenta estos desafíos?
          </h2>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <ul className="problem-list">
                <li className="problem-item">
                  <AlertCircle className="problem-icon" size={24} />
                  <span>Gestión manual de matrículas y documentos</span>
                </li>
                <li className="problem-item">
                  <AlertCircle className="problem-icon" size={24} />
                  <span>Control deficiente de inventario de instrumentos</span>
                </li>
                <li className="problem-item">
                  <AlertCircle className="problem-icon" size={24} />
                  <span>Horarios desorganizados y conflictos de programación</span>
                </li>
                <li className="problem-item">
                  <AlertCircle className="problem-icon" size={24} />
                  <span>Falta de comunicación centralizada</span>
                </li>
                <li className="problem-item">
                  <AlertCircle className="problem-icon" size={24} />
                  <span>Reportes administrativos tardíos y errores</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* === 4. SOLUCIÓN - CARACTERÍSTICAS PRINCIPALES === */}
      <section id="caracteristicas" className="section">
        <div className="container-custom">
          <h2 className="section-title">
            Una solución completa para instituciones musicales
          </h2>
          <p className="section-subtitle">
            Módulos especializados diseñados para cubrir todas las necesidades 
            administrativas y académicas de su escuela de música.
          </p>

          <div className="features-grid">
            {/* Gestión Académica */}
            <div className="feature-card">
              <div className="feature-icon">
                <BookOpen size={30} />
              </div>
              <h3 className="feature-title">Gestión Académica</h3>
              <p className="feature-description">
                Matrícula digital automatizada, seguimiento detallado del progreso estudiantil 
                y gestión integral de expedientes académicos.
              </p>
            </div>

            {/* Control de Inventario */}
            <div className="feature-card">
              <div className="feature-icon">
                <Music size={30} />
              </div>
              <h3 className="feature-title">Control de Inventario</h3>
              <p className="feature-description">
                Gestión completa de instrumentos musicales, control de préstamos, 
                programación de mantenimiento y seguimiento de estado.
              </p>
            </div>

            {/* Administración de Horarios */}
            <div className="feature-card">
              <div className="feature-icon">
                <Calendar size={30} />
              </div>
              <h3 className="feature-title">Administración de Horarios</h3>
              <p className="feature-description">
                Asignación inteligente de horarios, prevención automática de conflictos 
                y optimización del uso de aulas y recursos.
              </p>
            </div>

            {/* Comunicación Interna */}
            <div className="feature-card">
              <div className="feature-icon">
                <Users size={30} />
              </div>
              <h3 className="feature-title">Comunicación Interna</h3>
              <p className="feature-description">
                Sistema integrado de notificaciones, calendario institucional 
                y comunicación directa entre personal, estudiantes y padres.
              </p>
            </div>

            {/* Seguridad de Datos */}
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={30} />
              </div>
              <h3 className="feature-title">Seguridad de Datos</h3>
              <p className="feature-description">
                Control granular de acceso por roles, encriptación de datos 
                y respaldos automáticos para máxima protección.
              </p>
            </div>

            {/* Configuración Avanzada */}
            <div className="feature-card">
              <div className="feature-icon">
                <Settings size={30} />
              </div>
              <h3 className="feature-title">Configuración Avanzada</h3>
              <p className="feature-description">
                Sistema altamente personalizable que se adapta a los procesos 
                específicos de su institución musical.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === 5. BENEFICIOS CLAVE === */}
      <section id="beneficios" className="section benefits-section">
        <div className="container-custom">
          <h2 className="section-title text-white">
            Beneficios que transformarán su institución
          </h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-number">70%</div>
              <h3>Eficiencia</h3>
              <p>Reducción del tiempo administrativo mediante automatización inteligente</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">100%</div>
              <h3>Precisión</h3>
              <p>Eliminación completa de errores manuales en procesos críticos</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-number">∞</div>
              <h3>Organización</h3>
              <p>Centralización total de información institucional accesible 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* === 6. MÓDULOS DEL SISTEMA (DETALLADO) === */}
      <section id="modulos" className="section">
        <div className="container-custom">
          <h2 className="section-title">Módulos Especializados del Sistema</h2>
          
          <div className="features-grid">
            {modulosData.map((modulo, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <modulo.icon size={30} />
                </div>
                <h3 className="feature-title">{modulo.titulo}</h3>
                <p className="feature-description">{modulo.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === 7. CASOS DE USO/TESTIMONIOS === */}
      <section className="section testimonial-section">
        <div className="container-custom">
          <h2 className="section-title">
            Diseñado para la Escuela Experimental de Niños para la Música
          </h2>
          
          <div className="testimonial-card">
            <blockquote className="testimonial-quote">
              "Este sistema representa el futuro de la gestión educativa musical. 
              Nos permitirá brindar un servicio más eficiente y de calidad a nuestros 
              estudiantes y sus familias."
            </blockquote>
            <div className="testimonial-author">Lic. Rosario de Fátima Mejía Aguilar</div>
            <div className="testimonial-position">Directora - Escuela Experimental de Niños para la Música</div>
          </div>

          {/* Estadísticas del proyecto */}
          <div className="row mt-5 text-center">
            <div className="col-md-4">
              <div className="h2 text-primary">500+</div>
              <p>Estudiantes Beneficiados</p>
            </div>
            <div className="col-md-4">
              <div className="h2 text-primary">200+</div>
              <p>Instrumentos Gestionados</p>
            </div>
            <div className="col-md-4">
              <div className="h2 text-primary">15+</div>
              <p>Procesos Automatizados</p>
            </div>
          </div>
        </div>
      </section>

      {/* === 8. TECNOLOGÍA Y SEGURIDAD === */}
      <section className="section">
        <div className="container-custom">
          <h2 className="section-title">Tecnología de Vanguardia y Máxima Seguridad</h2>
          
          <div className="row">
            <div className="col-lg-6 mb-4">
              <h3 className="h4 mb-3">Stack Tecnológico</h3>
              <div className="tech-grid">
                <div className="tech-item">
                  <div className="tech-logo">
                    <span className="fw-bold">R</span>
                  </div>
                  <div>React</div>
                </div>
                <div className="tech-item">
                  <div className="tech-logo">
                    <span className="fw-bold">R</span>
                  </div>
                  <div>React</div>
                </div>
                <div className="tech-item">
                  <div className="tech-logo">
                    <span className="fw-bold">JS</span>
                  </div>
                  <div>Javascript</div>
                </div>
                <div className="tech-item">
                  <div className="tech-logo">
                    <span className="fw-bold">DB</span>
                  </div>
                  <div>Mongo</div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <h3 className="h4 mb-3">Características de Seguridad</h3>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <CheckCircle className="text-success me-2" size={20} />
                  Encriptación end-to-end de datos sensibles
                </li>
                <li className="mb-2">
                  <CheckCircle className="text-success me-2" size={20} />
                  Control de acceso basado en roles (RBAC)
                </li>
                <li className="mb-2">
                  <CheckCircle className="text-success me-2" size={20} />
                  Respaldos automáticos diarios
                </li>
                <li className="mb-2">
                  <CheckCircle className="text-success me-2" size={20} />
                  Acceso web responsivo multiplataforma
                </li>
                <li className="mb-2">
                  <CheckCircle className="text-success me-2" size={20} />
                  Cumplimiento de estándares de seguridad
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* === 9. CALL TO ACTION FINAL === */}
      <section id="contacto" className="section cta-section">
        <div className="container-custom">
          <h2 className="section-title text-white">
            ¿Listo para modernizar su escuela de música?
          </h2>
          
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <form className="cta-form">
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label text-white">Nombre Completo</label>
                      <input 
                        type="text" 
                        className="form-control-custom" 
                        placeholder="Su nombre completo"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label text-white">Email Institucional</label>
                      <input 
                        type="email" 
                        className="form-control-custom" 
                        placeholder="email@institucion.edu"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label text-white">Institución</label>
                  <input 
                    type="text" 
                    className="form-control-custom" 
                    placeholder="Nombre de su institución musical"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label text-white">Mensaje</label>
                  <textarea 
                    className="form-control-custom" 
                    rows={4}
                    placeholder="Cuéntenos sobre sus necesidades específicas..."
                  ></textarea>
                </div>
                
                <button type="submit" className="btn btn-warning btn-lg w-100">
                  Solicitar Propuesta Personalizada
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* === 10. FOOTER === */}
      <footer className="footer">
        <div className="container-custom">
          <div className="footer-grid">
            {/* Información del proyecto */}
            <div className="footer-section">
              <h3>S.I.A.M.</h3>
              <p>
                Sistema desarrollado por estudiantes de Ingeniería en Sistemas 
                de la Universidad Nacional Autónoma de Honduras (UNAH).
              </p>
              <div className="d-flex gap-3">
                <Github size={20} />
                <Linkedin size={20} />
              </div>
            </div>
            
            {/* Enlaces útiles */}
            <div className="footer-section">
              <h3>Enlaces</h3>
              <a href="#inicio" className="footer-link">Inicio</a>
              <a href="#caracteristicas" className="footer-link">Características</a>
              <a href="#modulos" className="footer-link">Módulos</a>
              <a href="#contacto" className="footer-link">Contacto</a>
            </div>
            
            {/* Contacto */}
            <div className="footer-section">
              <h3>Contacto</h3>
              <div className="d-flex align-items-center mb-2">
                <Phone size={16} className="me-2" />
                <span>+504 9979-4964</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <Mail size={16} className="me-2" />
                <span>siamproject2025@gmail.com</span>
              </div>
              <div className="d-flex align-items-center">
                <MapPin size={16} className="me-2" />
                <span>UNAH, Tegucigalpa, Honduras</span>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} S.I.A.M. - Universidad Nacional Autónoma de Honduras. 
              Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// === DATOS DE MÓDULOS ===
const modulosData = [
  {
    titulo: "Gestión de Personal",
    descripcion: "Administración completa de expedientes de docentes, horarios laborales y evaluaciones de desempeño.",
    icon: Users
  },
  {
    titulo: "Admisiones y Matrícula",
    descripcion: "Proceso digital de inscripción, documentación automática y seguimiento de solicitudes.",
    icon: BookOpen
  },
  {
    titulo: "Horarios y Aulas",
    descripcion: "Programación inteligente que evita conflictos y optimiza el uso de espacios físicos.",
    icon: Calendar
  },
  {
    titulo: "Inventario Musical",
    descripcion: "Control detallado de instrumentos, partituras, equipos de audio y material pedagógico.",
    icon: Music
  },
  {
    titulo: "Biblioteca Virtual",
    descripcion: "Gestión digital de partituras, métodos de enseñanza y recursos multimedia.",
    icon: BookOpen
  },
  {
    titulo: "Seguridad y Usuarios",
    descripcion: "Control granular de permisos, auditoría de acciones y protección de datos institucionales.",
    icon: Shield
  }
];

export default LandingPage;