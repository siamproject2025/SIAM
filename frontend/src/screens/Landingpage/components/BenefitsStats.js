import React from 'react';
import { motion } from 'motion/react';
import '../styles/BenefitsStats.css';

const stats = [
  { value: '+70%', label: 'Eficiencia administrativa' },
  { value: '500+', label: 'Estudiantes beneficiados' },
  { value: '200+', label: 'Instrumentos gestionados' },
  { value: '15+', label: 'Procesos automatizados' },
];

const BenefitsStats = () => {
  return (
    <section className="benefits-container">
      <h2 className="benefits-title">Beneficios Clave</h2>
      <div className="benefits-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="benefit-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="benefit-value">{stat.value}</div>
            <p className="benefit-label">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsStats;

