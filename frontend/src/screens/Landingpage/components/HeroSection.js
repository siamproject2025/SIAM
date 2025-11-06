import React from 'react';
import { motion } from 'motion/react';
import '../styles/HeroSection.css';

const HeroSection = () => {
  return (
    <motion.section
      className="hero-container"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className="hero-title">Transforma tu escuela de música con S.I.A.M.</h1>
      <p className="hero-subtitle">
        Gestión académica, administrativa y musical en una sola plataforma.
      </p>
      <div className="hero-buttons">
        <button className="cta-button">Solicita una demo</button>
        <button className="cta-button secondary">Explorar módulos</button>
      </div>
      <div className="hero-visual">
        {/* Reemplaza con una ilustración o video real */}
        <video autoPlay muted loop className="hero-video">
          <source src="/demo-siam.mp4" type="video/mp4" />
        </video>
      </div>
    </motion.section>
  );
};

export default HeroSection;
