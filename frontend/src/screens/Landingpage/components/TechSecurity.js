import React from 'react';
import { motion } from 'motion/react';
import '../styles/TechSecurity.css';

const techItems = [
  { icon: '⚙️', label: 'React, Express, MongoDB' },
  { icon: '🔐', label: 'Encriptación de datos' },
  { icon: '🧑‍💼', label: 'Accesos por roles' },
  { icon: '☁️', label: 'Respaldos automáticos' },
  { icon: '📱', label: 'Acceso multiplataforma' },
];

const TechSecurity = () => {
  return (
    <section className="tech-container">
      <h2 className="tech-title">Tecnologías y Seguridad</h2>
      <div className="tech-grid">
        {techItems.map((item, index) => (
          <motion.div
            key={index}
            className="tech-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="tech-icon">{item.icon}</div>
            <p className="tech-label">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default TechSecurity;
