import React from 'react';
import { motion } from 'motion/react';
import '../styles/Testimonial.css';

const Testimonial = () => {
  return (
    <section className="testimonial-container">
      <motion.img
        src="/rosario-mejia.jpg" // Reemplaza con la ruta real de la imagen
        alt="Lic. Rosario de Fátima Mejía Aguilar"
        className="testimonial-image"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      />
      <motion.div
        className="testimonial-text"
        initial={{ opacity: 0, x: 40 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <p className="testimonial-quote">
          “S.I.A.M. ha transformado la forma en que gestionamos nuestra escuela musical.”
        </p>
        <p className="testimonial-author">
          — Lic. Rosario de Fátima Mejía Aguilar, Directora
        </p>
      </motion.div>
    </section>
  );
};

export default Testimonial;
