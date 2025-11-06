import React from 'react';
import { motion } from 'motion/react';
import '../styles/ModulesGrid.css';

const modules = [
  { icon: '👨‍🏫', title: 'Gestión de Personal' },
  { icon: '🎒', title: 'Gestión de Estudiantes' },
  { icon: '🗓️', title: 'Horarios Académicos' },
  { icon: '📚', title: 'Biblioteca Digital' },
  { icon: '🎺', title: 'Inventario Musical' },
  { icon: '🏢', title: 'Proveedores' },
  { icon: '📦', title: 'Órdenes de Compra' },
  { icon: '📆', title: 'Actividades y Calendario' },
  { icon: '🔐', title: 'Roles y Usuarios' },
];

const ModulesGrid = () => {
  return (
    <section className="modules-container">
      <h2 className="modules-title">Módulos del Sistema</h2>
      <div className="modules-grid">
        {modules.map((mod, index) => (
          <motion.div
            key={index}
            className="module-card"
            initial={{ rotateY: 90, opacity: 0 }}
            whileInView={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="module-icon">{mod.icon}</div>
            <h3 className="module-title">{mod.title}</h3>
            <button className="module-button">Ver más</button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ModulesGrid;
