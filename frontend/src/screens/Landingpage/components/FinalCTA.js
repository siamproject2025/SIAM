import React from 'react';
import { motion } from 'motion/react';
import '../styles/FinalCTA.css';

const FinalCTA = () => {
  return (
    <section className="finalcta-container">
      <motion.h2
        className="finalcta-title"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Solicita acceso institucional
      </motion.h2>

      <motion.p
        className="finalcta-text"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        Descubre cómo S.I.A.M. puede transformar tu escuela musical.
      </motion.p>

      <motion.button
        className="finalcta-button"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
      >
        Solicita acceso institucional
      </motion.button>

      <div className="finalcta-contact">
        <p>📞 +504 9979-4964</p>
        <p>📧 siamproject2025@gmail.com</p>
        <p>📍 UNAH, Tegucigalpa, Honduras</p>
      </div>
    </section>
  );
};

export default FinalCTA;
