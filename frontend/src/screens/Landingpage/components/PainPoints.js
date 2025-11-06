import React from 'react';
import { motion } from 'motion/react';
import '../styles/PainPoints.css';

const painPoints = [
  { icon: '📄', title: 'Matrículas manuales', solution: 'Digitalización total' },
  { icon: '🎻', title: 'Inventario desorganizado', solution: 'Control inteligente de instrumentos' },
  { icon: '🕒', title: 'Horarios conflictivos', solution: 'Asignación sin errores' },
  { icon: '📢', title: 'Comunicación dispersa', solution: 'Mensajería centralizada' },
  { icon: '📊', title: 'Reportes tardíos', solution: 'Informes automáticos y precisos' },
];

const PainPoints = () => {
  return (
    <section className="painpoints-container">
      <h2 className="painpoints-title">¿Qué problemas resuelve S.I.A.M.?</h2>
      <div className="painpoints-grid">
        {painPoints.map((point, index) => (
          <motion.div
            key={index}
            className="painpoint-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="painpoint-icon">{point.icon}</div>
            <h3 className="painpoint-title">{point.title}</h3>
            <p className="painpoint-solution">{point.solution}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default PainPoints;
