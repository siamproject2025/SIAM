import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import "..//..//styles/Donaciones.css"
import { 
  Apple,
  Music,
  Headphones,
  Armchair,
  Laptop,
  Video,
  Pill,
  BookOpen,
  GraduationCap,
  Package,
  Search,
  HelpCircle,
  Plus,
  Warehouse,
  Calendar,
  Hash,
  Edit,
  Trash2, Users,
  X,
  Save,
  Check,
  ImagePlus,
  Upload,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Heart,
  Gift,
<<<<<<< HEAD
  HandHeart,
  Filter,
  Mic2,
  Guitar,
  Piano,
  Monitor,
  Camera,
  Stethoscope,
  Pencil,
  BookMarked
=======
  HandHeart
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/donaciones';

// Estilos CSS integrados mejorados
<<<<<<< HEAD
const styles = `
  * {
    box-sizing: border-box;
  }

  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes iconBounce {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-5px) rotate(-10deg); }
    50% { transform: translateY(0) rotate(0deg); }
    75% { transform: translateY(-5px) rotate(10deg); }
  }

  @keyframes floatAndFade {
    0% {
      opacity: 0;
      transform: translateY(100px) rotate(0deg) scale(0.5);
    }
    25% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
      transform: translateY(-50px) rotate(180deg) scale(1);
    }
    75% {
      opacity: 0.3;
    }
    100% {
      opacity: 0;
      transform: translateY(-200px) rotate(360deg) scale(0.5);
    }
  }

  @keyframes floatAndFade2 {
    0% {
      opacity: 0;
      transform: translateY(80px) rotate(0deg) scale(0.3);
    }
    30% {
      opacity: 0.4;
    }
    60% {
      opacity: 0.7;
      transform: translateY(-80px) rotate(-180deg) scale(1.2);
    }
    80% {
      opacity: 0.2;
    }
    100% {
      opacity: 0;
      transform: translateY(-180px) rotate(-360deg) scale(0.3);
    }
  }

  @keyframes floatAndFade3 {
    0% {
      opacity: 0;
      transform: translateY(120px) rotate(45deg) scale(0.4);
    }
    20% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
      transform: translateY(-60px) rotate(225deg) scale(1.1);
    }
    85% {
      opacity: 0.25;
    }
    100% {
      opacity: 0;
      transform: translateY(-220px) rotate(405deg) scale(0.4);
    }
  }

  @keyframes floatAndFade4 {
    0% {
      opacity: 0;
      transform: translateY(90px) rotate(-45deg) scale(0.6);
    }
    35% {
      opacity: 0.55;
    }
    65% {
      opacity: 0.75;
      transform: translateY(-70px) rotate(135deg) scale(1.15);
    }
    90% {
      opacity: 0.15;
    }
    100% {
      opacity: 0;
      transform: translateY(-190px) rotate(315deg) scale(0.6);
    }
  }

  @keyframes floatAndFade5 {
    0% {
      opacity: 0;
      transform: translateY(110px) rotate(90deg) scale(0.45);
    }
    40% {
      opacity: 0.65;
    }
    70% {
      opacity: 0.85;
      transform: translateY(-90px) rotate(-90deg) scale(1.3);
    }
    95% {
      opacity: 0.1;
    }
    100% {
      opacity: 0;
      transform: translateY(-210px) rotate(-270deg) scale(0.45);
    }
  }

  @keyframes rotateAndPulse {
    0%, 100% {
      transform: rotate(0deg) scale(1);
      opacity: 0.6;
    }
    25% {
      transform: rotate(90deg) scale(1.1);
      opacity: 0.8;
    }
    50% {
      transform: rotate(180deg) scale(0.9);
      opacity: 0.5;
    }
    75% {
      transform: rotate(270deg) scale(1.15);
      opacity: 0.7;
    }
  }

  @keyframes gentleFloat {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.4;
    }
    50% {
      transform: translateY(-15px) rotate(5deg);
      opacity: 0.7;
    }
  }

  .floating-icons-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  .floating-icon {
    position: absolute;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0.25;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }

  /* Animaciones para los primeros 30 iconos */
  .floating-icon:nth-child(1) { animation: floatAndFade 12s infinite; animation-delay: 0s; }
  .floating-icon:nth-child(2) { animation: floatAndFade2 15s infinite; animation-delay: 2s; }
  .floating-icon:nth-child(3) { animation: floatAndFade3 10s infinite; animation-delay: 4s; }
  .floating-icon:nth-child(4) { animation: floatAndFade4 14s infinite; animation-delay: 1s; }
  .floating-icon:nth-child(5) { animation: floatAndFade5 13s infinite; animation-delay: 3s; }
  .floating-icon:nth-child(6) { animation: floatAndFade 16s infinite; animation-delay: 5s; }
  .floating-icon:nth-child(7) { animation: floatAndFade2 11s infinite; animation-delay: 6s; }
  .floating-icon:nth-child(8) { animation: floatAndFade3 17s infinite; animation-delay: 2.5s; }
  .floating-icon:nth-child(9) { animation: floatAndFade4 12.5s infinite; animation-delay: 4.5s; }
  .floating-icon:nth-child(10) { animation: floatAndFade5 15.5s infinite; animation-delay: 1.5s; }
  .floating-icon:nth-child(11) { animation: floatAndFade 13.5s infinite; animation-delay: 3.5s; }
  .floating-icon:nth-child(12) { animation: floatAndFade2 14.5s infinite; animation-delay: 5.5s; }
  .floating-icon:nth-child(13) { animation: floatAndFade3 11.5s infinite; animation-delay: 0.5s; }
  .floating-icon:nth-child(14) { animation: floatAndFade4 16.5s infinite; animation-delay: 2s; }
  .floating-icon:nth-child(15) { animation: floatAndFade5 10.5s infinite; animation-delay: 4s; }
  .floating-icon:nth-child(16) { animation: floatAndFade 15s infinite; animation-delay: 1s; }
  .floating-icon:nth-child(17) { animation: floatAndFade2 12s infinite; animation-delay: 3s; }
  .floating-icon:nth-child(18) { animation: floatAndFade3 14s infinite; animation-delay: 5s; }
  .floating-icon:nth-child(19) { animation: floatAndFade4 11s infinite; animation-delay: 0s; }
  .floating-icon:nth-child(20) { animation: floatAndFade5 13s infinite; animation-delay: 2s; }
  .floating-icon:nth-child(21) { animation: floatAndFade 14.5s infinite; animation-delay: 4s; }
  .floating-icon:nth-child(22) { animation: floatAndFade2 11.5s infinite; animation-delay: 1.5s; }
  .floating-icon:nth-child(23) { animation: floatAndFade3 15.5s infinite; animation-delay: 3.5s; }
  .floating-icon:nth-child(24) { animation: floatAndFade4 13.5s infinite; animation-delay: 5.5s; }
  .floating-icon:nth-child(25) { animation: floatAndFade5 16.5s infinite; animation-delay: 0.5s; }
  .floating-icon:nth-child(26) { animation: floatAndFade 10.5s infinite; animation-delay: 2.5s; }
  .floating-icon:nth-child(27) { animation: floatAndFade2 13.5s infinite; animation-delay: 4.5s; }
  .floating-icon:nth-child(28) { animation: floatAndFade3 12.5s infinite; animation-delay: 1s; }
  .floating-icon:nth-child(29) { animation: floatAndFade4 15s infinite; animation-delay: 3s; }
  .floating-icon:nth-child(30) { animation: floatAndFade5 14s infinite; animation-delay: 5s; }

  /* Iconos decorativos fijos en el header */
  .header-decoration-icon {
    position: absolute;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0.3;
    pointer-events: none;
    z-index: 0;
  }

  .header-decoration-icon.pulse {
    animation: rotateAndPulse 8s ease-in-out infinite;
  }

  .header-decoration-icon.float {
    animation: gentleFloat 6s ease-in-out infinite;
  }

  .header-decoration-icon:nth-child(1) { animation-delay: 0s; }
  .header-decoration-icon:nth-child(2) { animation-delay: 1s; }
  .header-decoration-icon:nth-child(3) { animation-delay: 2s; }
  .header-decoration-icon:nth-child(4) { animation-delay: 3s; }
  .header-decoration-icon:nth-child(5) { animation-delay: 4s; }
  .header-decoration-icon:nth-child(6) { animation-delay: 0.5s; }
  .header-decoration-icon:nth-child(7) { animation-delay: 1.5s; }
  .header-decoration-icon:nth-child(8) { animation-delay: 2.5s; }

  .btn-nueva-donacion .icon-animated {
    display: inline-block;
    animation: iconBounce 3s ease-in-out infinite;
  }

  .bien-container {
    padding: 2rem 1.5rem 100px 1.5rem;
    max-width: none;
    margin: 0 auto;
    width: 100%;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .bien-header {
  margin-top: 0.1rem;
    margin-bottom: 0;
    width: 100%;
    max-width: 100%;
    background: white;
    padding: 3rem 2rem 2rem 2rem;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }

  .bien-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(102, 126, 234, 0.1), transparent);
    animation: shimmer 3s infinite;
  }

  .bien-header h2 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
    font-weight: 800;
    letter-spacing: -1px;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 1rem;
  }

  .bien-header h2::before {
    content: '✨';
    animation: float 3s ease-in-out infinite;
  }

  .bien-header p {
    color: #666;
    font-size: 1.1rem;
    position: relative;
    z-index: 1;
  }

  .bien-busqueda-bar {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
    align-items: center;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .search-container {
    flex: 1;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #667eea;
    z-index: 1;
    animation: pulse 2s ease-in-out infinite;
  }

  .bien-busqueda {
    flex: 1;
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 3px solid transparent;
    border-radius: 15px;
    font-size: 1rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
    position: relative;
  }

  .bien-busqueda:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
    transform: translateY(-2px);
  }

  .bien-busqueda::placeholder {
    color: #999;
    font-style: italic;
  }

  .btn-ayuda {
    padding: 1rem 1.8rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-size: 200% 200%;
    color: white;
    border: none;
    border-radius: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
  }

  .btn-ayuda::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .btn-ayuda:hover::before {
    width: 300px;
    height: 300px;
  }

  .btn-ayuda:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    animation: gradient 2s ease infinite;
  }

  .btn-ayuda:active {
    transform: translateY(-1px) scale(1.02);
  }

  .btn-nueva-donacion {
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    background-size: 200% 200%;
    color: white;
    border: none;
    border-radius: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    font-size: 1rem;
  }

  .btn-nueva-donacion:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
    animation: gradient 2s ease infinite;
  }

  .btn-filtros {
    padding: 1rem 1.8rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-size: 200% 200%;
    color: white;
    border: none;
    border-radius: 15px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
  }

  .btn-filtros::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .btn-filtros:hover::before {
    width: 300px;
    height: 300px;
  }

  .btn-filtros:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    animation: gradient 2s ease infinite;
  }

  .btn-filtros:active {
    transform: translateY(-1px) scale(1.02);
  }

  .bien-categorias-container {
    margin-top: 0;
    width: 203%;
    max-width: 203%;
  }

  .bien-categoria-section {
    margin-bottom: 2rem;
    width: 100%;
    max-width: 100%;
    margin-top: 1rem;
  }

  .bien-categoria-header {
    margin-bottom: 0;
    width: 100%;
    max-width: 100%;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 15px 15px 0 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    border-bottom: 3px solid #f0f0f0;
  }

  .bien-subtitulo {
    font-size: 1.3rem;
    color: #333;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-weight: 700;
    margin: 0;
  }

  .bien-vacio {
    text-align: center;
    padding: 4rem;
    color: #999;
    font-size: 1.2rem;
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  }

  .tabla-donaciones {
    width: 100%;
    max-width: 100%;
    background: white;
    border-radius: 0 0 15px 15px;
    overflow: hidden;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    min-height: 500px;
    max-height: calc(100vh - 320px);
    display: flex;
    flex-direction: column;
    margin-bottom: 2rem;
  }

  .tabla-header {
    display: grid;
    grid-template-columns: 80px 1fr 140px 150px 120px 100px;
    gap: 1rem;
    padding: 1.2rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 700;
    font-size: 0.95rem;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 10;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tabla-body {
    flex: 1;
    overflow-y: auto;
  }

  .tabla-body::-webkit-scrollbar {
    width: 8px;
  }

  .tabla-body::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .tabla-body::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
  }

  .tabla-fila {
    display: grid;
    grid-template-columns: 80px 1fr 140px 150px 120px 100px;
    gap: 1rem;
    padding: 1.3rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .tabla-fila::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }

  .tabla-fila:hover {
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, rgba(255, 255, 255, 1) 100%);
    transform: translateX(8px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .tabla-fila:hover::before {
    transform: scaleY(1);
  }

  .tabla-fila:last-child {
    border-bottom: none;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 2rem;
  }

  .modal-content {
    background: white;
    border-radius: 20px;
    padding: 2.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }

  .modal-content::-webkit-scrollbar {
    width: 8px;
  }

  .modal-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }

  .modal-content::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 10px;
  }

  .modal-title {
    font-size: 1.8rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-weight: 800;
  }

  .form-group {
    margin-bottom: 1.3rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.6rem;
    color: #333;
    font-weight: 700;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .form-group label span {
    color: #f44336;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.9rem;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    font-family: inherit;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
  }

  .form-group textarea {
    resize: vertical;
    min-height: 100px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  .form-grid-full {
    grid-column: 1 / -1;
  }

  .foto-upload-area {
    border: 3px dashed #e0e0e0;
    border-radius: 15px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    background: #fafafa;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .foto-upload-area:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
    transform: scale(1.02);
  }

  .foto-upload-area.has-image {
    border-style: solid;
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.05);
  }

  .foto-preview {
    max-width: 100%;
    max-height: 250px;
    border-radius: 12px;
    margin-bottom: 1rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  }

  .btn-upload-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    font-size: 0.95rem;
  }

  .btn-upload-label:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #f0f0f0;
  }

  .btn-eliminar,
  .btn-cancelar,
  .btn-guardar,
  .btn-cerrar {
    padding: 0.8rem 1.5rem;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    font-size: 0.95rem;
  }

  .btn-eliminar {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    color: white;
  }

  .btn-eliminar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
  }

  .btn-cancelar {
    background: #e0e0e0;
    color: #333;
  }

  .btn-cancelar:hover {
    background: #d0d0d0;
    transform: translateY(-2px);
  }

  .btn-guardar {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
  }

  .btn-guardar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  }

  .btn-cerrar {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .btn-cerrar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .badge-almacen {
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.85rem;
    display: inline-block;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .badge-cantidad {
    font-weight: 700;
    font-size: 1.1rem;
    color: #4CAF50;
  }

  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    min-width: 300px;
  }

  .notification.success {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
  }

  .notification.error {
    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
    color: white;
  }

  .help-section {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    padding: 1.5rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border-left: 4px solid #667eea;
  }

  .help-section h4 {
    color: #667eea;
    margin-bottom: 0.8rem;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
  }

  .help-section p, .help-section ul {
    font-size: 0.95rem;
    line-height: 1.6;
    color: #555;
  }

  .help-section ul {
    margin-left: 1.5rem;
    margin-top: 0.5rem;
  }

  .help-section li {
    margin-bottom: 0.5rem;
  }

  .help-section li strong {
    color: #667eea;
  }

  @media (max-width: 768px) {
    .tabla-header,
    .tabla-fila {
      grid-template-columns: 60px 1fr 100px 80px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .modal-actions {
      flex-direction: column;
    }

    .bien-header h2 {
      font-size: 1.8rem;
    }

    .bien-busqueda-bar {
      flex-direction: column;
    }
  }
`;
=======

>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77

const Donaciones = () => {
  const [donaciones, setDonaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
<<<<<<< HEAD
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [notification, setNotification] = useState(null);
  const [almacenes, setAlmacenes] = useState([
    { id: 1, nombre: 'Almacén 1', color: '#FF6B6B' },
    { id: 2, nombre: 'Almacén 2', color: '#4ECDC4' },
    { id: 12, nombre: 'Almacén 12', color: '#45B7D1' },
    { id: 23, nombre: 'Almacén 23', color: '#FFA07A' },
    { id: 40, nombre: 'Almacén 40', color: '#98D8C8' }
  ]);
=======
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [notification, setNotification] = useState(null);
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
  const [formData, setFormData] = useState({
    tipo_donacion: '',
    cantidad_donacion: '',
    descripcion: '',
    observaciones: '',
    id_almacen: '',
    fecha: new Date().toISOString().split('T')[0],
    foto: null,
    foto_preview: null
  });

  // Cargar donaciones al montar
  useEffect(() => {
    cargarDonaciones();
  }, );

  // Recargar cada 30 segundos para mantener sincronización
  useEffect(() => {
    const interval = setInterval(() => {
      cargarDonaciones();
    }, 30000);

    return () => clearInterval(interval);
  }, );

  const cargarDonaciones = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al cargar donaciones');
      const result = await response.json();
      
      // El backend devuelve { success: true, data: [...] }
      if (result.success && Array.isArray(result.data)) {
        setDonaciones(result.data);
      } else if (Array.isArray(result)) {
        // Por si acaso el backend devuelve directamente el array
        setDonaciones(result);
      } else {
        console.error('Formato de respuesta inesperado:', result);
        setDonaciones([]);
      }
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion('Error al cargar las donaciones', 'error');
      setDonaciones([]);
    }
  };
  // Calcular estadísticas
  const totalDonaciones = donaciones.length;
  const totalCantidad = donaciones.reduce((sum, d) => sum + (parseFloat(d.cantidad_donacion) || 0), 0);
  const tiposUnicos = [...new Set(donaciones.map(d => d.tipo_donacion))].length;

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ message: mensaje, type: tipo });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('La imagen no debe superar 5MB', 'error');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Solo se permiten imágenes', 'error');
        return;
      }

      setFormData(prev => ({
        ...prev,
        foto: file,
        foto_preview: URL.createObjectURL(file)
      }));
    }
  };

  const eliminarFoto = () => {
    if (formData.foto_preview) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    setFormData(prev => ({
      ...prev,
      foto: null,
      foto_preview: null
    }));
  };

  const handleSubmitNueva = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validaciones
    if (!formData.tipo_donacion || !formData.cantidad_donacion || !formData.id_almacen) {
      mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const datosEnviar = {
        tipo_donacion: formData.tipo_donacion,
        cantidad_donacion: parseInt(formData.cantidad_donacion),
        descripcion: formData.descripcion,
        observaciones: formData.observaciones,
        id_almacen: parseInt(formData.id_almacen),
        fecha: new Date().toISOString(),
<<<<<<< HEAD
        fecha_ingreso: new Date().toISOString(),
        foto: formData.foto || null
=======
        fecha_ingreso: new Date().toISOString()
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnviar)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear donación');
      }

      const result = await response.json();
      
      mostrarNotificacion('¡Donación registrada exitosamente!', 'success');
      handleCloseModals();
      await cargarDonaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message || 'Error al guardar la donación', 'error');
    }
  };

  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!donacionSeleccionada) return;

    // Validaciones
    if (!formData.tipo_donacion || !formData.cantidad_donacion || !formData.id_almacen) {
      mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      const datosEnviar = {
        tipo_donacion: formData.tipo_donacion,
        cantidad_donacion: parseInt(formData.cantidad_donacion),
        descripcion: formData.descripcion,
        observaciones: formData.observaciones,
        id_almacen: parseInt(formData.id_almacen),
<<<<<<< HEAD
        fecha: formData.fecha || new Date().toISOString(),
        foto: formData.foto || null
=======
        fecha: formData.fecha || new Date().toISOString()
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
      };

      const response = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnviar)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar donación');
      }

      mostrarNotificacion('¡Donación actualizada exitosamente!', 'success');
      handleCloseModals();
      await cargarDonaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message || 'Error al actualizar la donación', 'error');
    }
  };

  const handleEliminarDonacion = async () => {
    if (!donacionSeleccionada) return;

    if (!window.confirm('¿Estás seguro de que deseas eliminar esta donación?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${donacionSeleccionada.id_donacion}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar donación');
      }

      mostrarNotificacion('Donación eliminada exitosamente', 'success');
      handleCloseModals();
      await cargarDonaciones();
    } catch (error) {
      console.error('Error:', error);
      mostrarNotificacion(error.message || 'Error al eliminar la donación', 'error');
    }
  };

  const handleCloseModals = () => {
    setMostrarModal(false);
    setMostrarModalEditar(false);
    setDonacionSeleccionada(null);
    
    // Limpiar preview
    if (formData.foto_preview) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    
    setFormData({
      tipo_donacion: '',
      cantidad_donacion: '',
      descripcion: '',
      observaciones: '',
      id_almacen: '',
      fecha: new Date().toISOString().split('T')[0],
      foto: null,
      foto_preview: null
    });
  };

  const handleFilaClick = (donacion) => {
    setDonacionSeleccionada(donacion);
    
    // Cargar datos en el formulario con los nombres correctos
    setFormData({
      tipo_donacion: donacion.tipo_donacion || '',
      cantidad_donacion: donacion.cantidad_donacion || '',
      descripcion: donacion.descripcion || '',
      observaciones: donacion.observaciones || '',
      id_almacen: donacion.id_almacen || '',
      fecha: donacion.fecha ? new Date(donacion.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      foto: null,
      foto_preview: donacion.foto ? `http://localhost:5000${donacion.foto}` : null
    });
    
    setMostrarModalEditar(true);
  };

  const handleNuevaDonacion = () => {
    setFormData({
      tipo_donacion: '',
      cantidad_donacion: '',
      descripcion: '',
      observaciones: '',
      id_almacen: '',
      fecha: new Date().toISOString().split('T')[0],
      foto: null,
      foto_preview: null
    });
    setMostrarModal(true);
  };

  const getIconoTipo = (tipo_donacion) => {
    const iconos = {
      'Alimentos': <Apple size={20} />,
<<<<<<< HEAD
      'Instrumentos musicales': <Music size={20} />,
      'Accesorios musicales': <Headphones size={20} />,
      'Enseres': <Armchair size={20} />,
      'Tecnología': <Laptop size={20} />,
      'Material audiovisual': <Video size={20} />,
      'Medicamentos': <Pill size={20} />,
      'Material didáctico': <BookOpen size={20} />,
      'Útiles escolares': <GraduationCap size={20} />,
      'Otros': <Package size={20} />
=======
      'Vestimenta': <Shirt size={20} />,
      'Medicina': <Pill size={20} />,
      'Enseres': <Armchair size={20} />,
      'Bebidas': <Wine size={20} />,
      'Útiles escolares': <Book size={20} />,
      'Productos de higiene': <Droplet size={20} />,
      'Otro': <Package size={20} />
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
    };
    return iconos[tipo_donacion] || <Package size={20} />;
  };

  const getColorAlmacen = (id_almacen) => {
<<<<<<< HEAD
    const almacen = almacenes.find(a => a.id === id_almacen);
    return almacen ? almacen.color : '#95A5A6';
  };

  const getNombreAlmacen = (id_almacen) => {
    const almacen = almacenes.find(a => a.id === id_almacen);
    return almacen ? almacen.nombre : `Almacén ${id_almacen}`;
=======
    const colores = {
      1: '#FF6B6B',
      2: '#4ECDC4',
      12: '#45B7D1',
      23: '#FFA07A',
      40: '#98D8C8'
    };
    return colores[id_almacen] || '#95A5A6';
  };

  const getNombreAlmacen = (id_almacen) => {
    const nombres = {
      1: 'Almacén 1',
      2: 'Almacén 2',
      12: 'Almacén 12',
      23: 'Almacén 23',
      40: 'Almacén 40'
    };
    return nombres[id_almacen] || `Almacén ${id_almacen}`;
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
  };

  const donacionesFiltradas = Array.isArray(donaciones) ? donaciones.filter(donacion => {
    const searchLower = busqueda.toLowerCase();
    const almacenNombre = getNombreAlmacen(donacion.id_almacen);
    return (
      donacion.tipo_donacion?.toLowerCase().includes(searchLower) ||
      donacion.descripcion?.toLowerCase().includes(searchLower) ||
      almacenNombre.toLowerCase().includes(searchLower) ||
      donacion.cantidad_donacion?.toString().includes(searchLower)
    );
  }) : [];

  return (
    <>
<<<<<<< HEAD
      <style>{styles}</style>
      <div className="bien-container">
        {/* Iconos flotantes de fondo - 30 iconos */}
        <div className="floating-icons-background">
          <div className="floating-icon" style={{ left: '5%', top: '10%' }}><Apple size={80} /></div>
          <div className="floating-icon" style={{ left: '15%', top: '25%' }}><Music size={75} /></div>
          <div className="floating-icon" style={{ left: '25%', top: '15%' }}><Headphones size={75} /></div>
          <div className="floating-icon" style={{ left: '35%', top: '30%' }}><Laptop size={70} /></div>
          <div className="floating-icon" style={{ left: '45%', top: '20%' }}><Video size={78} /></div>
          <div className="floating-icon" style={{ left: '55%', top: '35%' }}><Pill size={72} /></div>
          <div className="floating-icon" style={{ left: '65%', top: '25%' }}><BookOpen size={76} /></div>
          <div className="floating-icon" style={{ left: '75%', top: '40%' }}><GraduationCap size={82} /></div>
          <div className="floating-icon" style={{ left: '85%', top: '30%' }}><Package size={74} /></div>
          <div className="floating-icon" style={{ left: '95%', top: '45%' }}><Guitar size={80} /></div>
          
          <div className="floating-icon" style={{ left: '10%', top: '50%' }}><Piano size={73} /></div>
          <div className="floating-icon" style={{ left: '20%', top: '65%' }}><Armchair size={77} /></div>
          <div className="floating-icon" style={{ left: '30%', top: '55%' }}><Monitor size={71} /></div>
          <div className="floating-icon" style={{ left: '40%', top: '70%' }}><Camera size={79} /></div>
          <div className="floating-icon" style={{ left: '50%', top: '60%' }}><Stethoscope size={76} /></div>
          <div className="floating-icon" style={{ left: '60%', top: '75%' }}><Pencil size={74} /></div>
          <div className="floating-icon" style={{ left: '70%', top: '65%' }}><BookMarked size={81} /></div>
          <div className="floating-icon" style={{ left: '80%', top: '80%' }}><Apple size={75} /></div>
          <div className="floating-icon" style={{ left: '90%', top: '70%' }}><Mic2 size={78} /></div>
          
          <div className="floating-icon" style={{ left: '8%', top: '85%' }}><Music size={72} /></div>
          <div className="floating-icon" style={{ left: '18%', top: '95%' }}><Headphones size={76} /></div>
          <div className="floating-icon" style={{ left: '28%', top: '90%' }}><Laptop size={80} /></div>
          <div className="floating-icon" style={{ left: '38%', top: '5%' }}><Video size={74} /></div>
          <div className="floating-icon" style={{ left: '48%', top: '95%' }}><Pill size={74} /></div>
          <div className="floating-icon" style={{ left: '58%', top: '5%' }}><BookOpen size={73} /></div>
          <div className="floating-icon" style={{ left: '68%', top: '90%' }}><GraduationCap size={79} /></div>
          <div className="floating-icon" style={{ left: '78%', top: '10%' }}><Guitar size={75} /></div>
          <div className="floating-icon" style={{ left: '88%', top: '95%' }}><Piano size={82} /></div>
          <div className="floating-icon" style={{ left: '12%', top: '40%' }}><Camera size={78} /></div>
          <div className="floating-icon" style={{ left: '92%', top: '55%' }}><Package size={76} /></div>
        </div>

        <motion.div 
          className="bien-header"
          initial={{ opacity: 0, y: -20 }}
=======
      
      <div className="donacion-container">
         <motion.div 
          className="donacion-header"
          initial={{ opacity: 0, y: -30 }}
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
<<<<<<< HEAD
          {/* Iconos decorativos fijos en el header */}
          <div className="header-decoration-icon pulse" style={{ top: '10px', left: '20px' }}>
            <Music size={35} />
          </div>
          <div className="header-decoration-icon float" style={{ top: '15px', right: '30px' }}>
            <Guitar size={32} />
          </div>
          <div className="header-decoration-icon pulse" style={{ top: '80px', left: '50px' }}>
            <Laptop size={28} />
          </div>
          <div className="header-decoration-icon float" style={{ top: '70px', right: '60px' }}>
            <Video size={30} />
          </div>
          <div className="header-decoration-icon pulse" style={{ bottom: '80px', left: '30px' }}>
            <Apple size={33} />
          </div>
          <div className="header-decoration-icon float" style={{ bottom: '90px', right: '40px' }}>
            <Pill size={29} />
          </div>
          <div className="header-decoration-icon pulse" style={{ bottom: '20px', left: '70px' }}>
            <BookOpen size={31} />
          </div>
          <div className="header-decoration-icon float" style={{ bottom: '30px', right: '80px' }}>
            <GraduationCap size={27} />
          </div>
          <div className="header-decoration-icon pulse" style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }}>
            <Headphones size={26} />
          </div>
          <div className="header-decoration-icon float" style={{ top: '50%', right: '15px', transform: 'translateY(-50%)' }}>
            <Camera size={28} />
          </div>
          <div className="header-decoration-icon pulse" style={{ top: '40px', left: '45%' }}>
            <Armchair size={24} />
          </div>
          <div className="header-decoration-icon float" style={{ bottom: '50px', right: '48%' }}>
            <Package size={25} />
          </div>

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Sistema de Donaciones
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Gestiona y controla todas las donaciones recibidas
          </motion.p>

          <div className="bien-busqueda-bar">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <motion.input
                type="text"
=======
          <motion.div
            className="header-gradient"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <div className="header-content">
              <motion.h2
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                >
                  <Heart size={36} fill="white" color="white" />
                </motion.div>
                Sistema de Donaciones
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  style={{ marginLeft: 'auto' }}
                >
                  <Gift size={32} color="white" />
                </motion.div>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Gestiona y controla todas las donaciones recibidas con amor y eficiencia
              </motion.p>

              <motion.div 
                className="header-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="stat-icon">
                    <Package size={20} color="white" />
                  </div>
                  <div className="stat-text">
                    <div className="stat-value">{totalDonaciones}</div>
                    <div className="stat-label">Total Donaciones</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                >
                  <div className="stat-icon">
                    <Users size={20} color="white" />
                  </div>
                  <div className="stat-text">
                    <div className="stat-value">{totalCantidad}</div>
                    <div className="stat-label">Cantidad Total</div>
                  </div>
                </motion.div>

                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                >
                  <div className="stat-icon">
                    <Hash size={20} color="white" />
                  </div>
                  <div className="stat-text">
                    <div className="stat-value">{tiposUnicos}</div>
                    <div className="stat-label">Tipos Diferentes</div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="floating-icons"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <motion.div 
                  className="floating-icon"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Shirt size={20} color="white" />
                </motion.div>
                <motion.div 
                  className="floating-icon"
                  animate={{ 
                    y: [0, -15, 0],
                    rotate: [0, -8, 8, 0]
                  }}
                  transition={{ 
                    duration: 3.5, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  <Apple size={20} color="white" />
                </motion.div>
                <motion.div 
                  className="floating-icon"
                  animate={{ 
                    y: [0, -12, 0],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 4.2, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  <Book size={20} color="white" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="donacion-busqueda-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ marginTop: '2rem' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
              >
                <Search size={18} />
              </motion.div>
              <input
                type="text"
                className="donacion-busqueda"
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                placeholder="Buscar por tipo, descripción, almacén o cantidad..."
                className="bien-busqueda"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
<<<<<<< HEAD
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                whileFocus={{ scale: 1.02 }}
              />
            </div>
            
            <motion.button 
              className="btn-ayuda" 
              onClick={() => setMostrarAyuda(true)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <HelpCircle size={18} />
              <span>Ayuda</span>
            </motion.button>

            <motion.button 
              className="btn-filtros" 
              onClick={() => setMostrarFiltros(true)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter size={18} />
              <span>Filtros</span>
            </motion.button>

            <motion.button 
              className="btn-nueva-donacion" 
              onClick={handleNuevaDonacion}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="icon-animated">
                <Plus size={20} />
              </span>
              <span>Nueva Donación</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="bien-categorias-container">
          {donacionesFiltradas.length === 0 ? (
            <motion.div 
              className="bien-vacio"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
=======
              />
            </div>
            <motion.button 
              className="btn-ayuda" 
              onClick={() => setMostrarAyuda(true)} 
              title="Ver ayuda"
              whileHover={{ scale: 1.08, boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <HelpCircle size={18} />
              </motion.div>
              Ayuda
            </motion.button>
            <motion.button 
              className="btn-ayuda" 
              onClick={() => setMostrarModal(true)} 
              title="Registrar nueva donación"
              whileHover={{ 
                scale: 1.08, 
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.4)",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Plus size={18} />
              </motion.div>
              Nueva Donación
            </motion.button>
          </motion.div>
        </motion.div>


        <div className="donacion-categorias-container">
          {donacionesFiltradas.length === 0 ? (
            <motion.div 
               className="donacion-categorias-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
            >
              <Package size={60} color="#ccc" style={{ marginBottom: '1rem' }} />
              <p>No se encontraron donaciones</p>
            </motion.div>
          ) : (
            <motion.div 
<<<<<<< HEAD
              className="bien-categoria-section"
=======
              
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
<<<<<<< HEAD
              <div className="bien-categoria-header">
                <h3 className="bien-subtitulo">
=======
              <div className="donacion-categoria-header">
                <h3 className="donacion-subtitulo">
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                  <Package size={24} />
                  <span>Todas las Donaciones ({donacionesFiltradas.length})</span>
                </h3>
              </div>

              <motion.div 
                className="tabla-donaciones"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="tabla-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Hash size={14} />
                    ID
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Package size={14} />
                    TIPO & DESCRIPCIÓN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Warehouse size={14} />
                    ALMACÉN
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} />
                    FECHA
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Hash size={14} />
                    CANTIDAD
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Edit size={14} style={{ display: 'inline' }} />
                  </div>
                </div>

                <div className="tabla-body">
                  <AnimatePresence>
                    {donacionesFiltradas.map((donacion, idx) => (
                      <motion.div
                        key={donacion._id || donacion.id_donacion}
                        className="tabla-fila"
                        onClick={() => handleFilaClick(donacion)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div style={{ 
                          fontWeight: '700', 
                          color: '#667eea',
                          fontSize: '0.9rem'
                        }}>
                          #{donacion.id_donacion || idx + 1}
                        </div>
                        
                        <div>
                          <div style={{ 
                            fontWeight: '600', 
                            marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.95rem'
                          }}>
                            {getIconoTipo(donacion.tipo_donacion)}
                            {donacion.tipo_donacion}
                          </div>
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#666',
                            fontStyle: 'italic'
                          }}>
                            {donacion.descripcion || 'Sin descripción'}
                          </div>
                        </div>

                        <div>
                          <span 
                            className="badge-almacen"
                            style={{ 
                              background: getColorAlmacen(donacion.id_almacen),
                              color: 'white'
                            }}
                          >
                            {getNombreAlmacen(donacion.id_almacen)}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#555' }}>
                          {new Date(donacion.fecha).toLocaleDateString('es-ES')}
                        </div>

                        <div className="badge-cantidad">
                          {donacion.cantidad_donacion}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            style={{ display: 'inline-block' }}
                          >
                            <Edit size={18} color="#667eea" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Modal Nueva Donación */}
        <AnimatePresence>
          {mostrarModal && (
            <motion.div 
              className="modal-overlay" 
              onClick={handleCloseModals}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content" 
                style={{ minWidth: '520px', maxWidth: '550px' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title">
                  <Plus size={24} />
                  Nueva Donación
                </h3>
                
                <form onSubmit={handleSubmitNueva}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Tipo de Donación <span>*</span>
                      </label>
                      <select 
                        name="tipo_donacion" 
                        value={formData.tipo_donacion} 
                        onChange={handleInputChange}
                        required
                      >
<<<<<<< HEAD
                                                <option value="">Seleccionar tipo</option>
                        <option value="Alimentos">Alimentos</option>
                        <option value="Instrumentos musicales">Instrumentos musicales</option>
                        <option value="Accesorios musicales">Accesorios musicales</option>
                        <option value="Enseres">Enseres</option>
                        <option value="Tecnología">Tecnología</option>
                        <option value="Material audiovisual">Material audiovisual</option>
                        <option value="Medicamentos">Medicamentos</option>
                        <option value="Material didáctico">Material didáctico</option>
                        <option value="Útiles escolares">Útiles escolares</option>
                        <option value="Otros">Otros</option>
=======
                        <option value="">Seleccionar tipo</option>
                        <option value="Alimentos">Alimentos</option>
                        <option value="Instrumentos musicales ">Instrumentos Musicales</option>
                        <option value="Medicina">Medicina</option>
                        <option value="Enseres">Enseres</option>
                        <option value="Accesiorios Musicales:">Accesorios Musicales </option>
                        <option value="Útiles escolares">Utiles Escolares</option>
                        <option value="Material Audiovisual">Mateial Audiovisual</option>
                        <option value="Material Didactico">Material Didactico</option>
                        <option value="Productos de higiene">Productos de Higiene</option>
                        <option value="Otro">Otro</option>
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Cantidad <span>*</span>
                      </label>
                      <input 
                        type="number" 
                        name="cantidad_donacion" 
                        value={formData.cantidad_donacion} 
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Ingrese la cantidad"
                        required
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Descripción</label>
                      <textarea 
                        name="descripcion" 
                        value={formData.descripcion} 
                        onChange={handleInputChange}
                        placeholder="Describe la donación..."
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Observaciones</label>
                      <textarea 
                        name="observaciones" 
                        value={formData.observaciones} 
                        onChange={handleInputChange}
                        placeholder="Notas adicionales..."
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Almacén <span>*</span>
                      </label>
                      <select 
                        name="id_almacen" 
                        value={formData.id_almacen} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar almacén</option>
<<<<<<< HEAD
                        {almacenes.map(almacen => (
                          <option key={almacen.id} value={almacen.id}>
                            {almacen.nombre}
                          </option>
                        ))}
=======
                        <option value="1">Almacén 1</option>
                        <option value="2">Almacén 2</option>
                        <option value="12">Almacén 12</option>
                        <option value="23">Almacén 23</option>
                        <option value="40">Almacén 40</option>
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                      </select>
                    </div>

                    <div className="form-group form-grid-full">
                      <label>
                        <ImagePlus size={16} />
                        Foto de la Donación
                      </label>
                      <div className={`foto-upload-area ${formData.foto_preview ? 'has-image' : ''}`}>
                        {formData.foto_preview ? (
                          <div>
                            <img 
                              src={formData.foto_preview} 
                              alt="Preview" 
                              className="foto-preview"
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <motion.button
                                type="button"
                                onClick={eliminarFoto}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-eliminar"
                              >
                                <Trash2 size={16} />
                                Eliminar foto
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload size={40} color="#667eea" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1rem' }}>
                              Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFotoChange}
                              style={{ display: 'none' }}
                              id="foto-upload-nueva"
                            />
                            <label htmlFor="foto-upload-nueva" className="btn-upload-label">
                              <ImagePlus size={18} />
                              Seleccionar imagen
                            </label>
                            <small style={{ display: 'block', marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                              Formatos: JPG, PNG, GIF. Máximo 5MB
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <motion.button 
                      type="button" 
                      className="btn-cancelar" 
                      onClick={handleCloseModals}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                      Cancelar
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      className="btn-guardar"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save size={16} />
                      Guardar Donación
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Editar Donación */}
        <AnimatePresence>
          {mostrarModalEditar && donacionSeleccionada && (
            <motion.div 
              className="modal-overlay" 
              onClick={handleCloseModals}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content" 
                style={{ minWidth: '520px', maxWidth: '550px' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title">
                  <Edit size={24} />
                  Editar Donación
                </h3>
                
                <form onSubmit={handleSubmitEditar}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        Tipo de Donación <span>*</span>
                      </label>
                      <select 
                        name="tipo_donacion" 
                        value={formData.tipo_donacion} 
                        onChange={handleInputChange}
                        required
                      >
<<<<<<< HEAD
                                                <option value="">Seleccionar tipo</option>
                        <option value="Alimentos">Alimentos</option>
                        <option value="Instrumentos musicales">Instrumentos musicales</option>
                        <option value="Accesorios musicales">Accesorios musicales</option>
                        <option value="Enseres">Enseres</option>
                        <option value="Tecnología">Tecnología</option>
                        <option value="Material audiovisual">Material audiovisual</option>
                        <option value="Medicamentos">Medicamentos</option>
                        <option value="Material didáctico">Material didáctico</option>
                        <option value="Útiles escolares">Útiles escolares</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Cantidad <span>*</span>
                      </label>
                      <input 
                        type="number" 
                        name="cantidad_donacion" 
                        value={formData.cantidad_donacion} 
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Descripción</label>
                      <textarea 
                        name="descripcion" 
                        value={formData.descripcion} 
                        onChange={handleInputChange}
                        placeholder="Describe la donación..."
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Observaciones</label>
                      <textarea 
                        name="observaciones" 
                        value={formData.observaciones} 
                        onChange={handleInputChange}
                        placeholder="Notas adicionales..."
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Almacén <span>*</span>
                      </label>
                      <select 
                        name="id_almacen" 
                        value={formData.id_almacen} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar almacén</option>
                        {almacenes.map(almacen => (
                          <option key={almacen.id} value={almacen.id}>
                            {almacen.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

=======
                        <option value="">Seleccionar tipo</option>
                        <option value="Alimentos">Alimentos</option>
                        <option value="Instrumentos musicales ">Instrumentos Musicales</option>
                        <option value="Medicina">Medicina</option>
                        <option value="Enseres">Enseres</option>
                        <option value="Accesiorios Musicales:">Accesorios Musicales </option>
                        <option value="Útiles escolares">Utiles Escolares</option>
                        <option value="Material Audiovisual">Mateial Audiovisual</option>
                        <option value="Material Didactico">Material Didactico</option>
                        <option value="Productos de higiene">Productos de Higiene</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>
                        Cantidad <span>*</span>
                      </label>
                      <input 
                        type="number" 
                        name="cantidad_donacion" 
                        value={formData.cantidad_donacion} 
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Descripción</label>
                      <textarea 
                        name="descripcion" 
                        value={formData.descripcion} 
                        onChange={handleInputChange}
                        placeholder="Describe la donación..."
                      />
                    </div>

                    <div className="form-group form-grid-full">
                      <label>Observaciones</label>
                      <textarea 
                        name="observaciones" 
                        value={formData.observaciones} 
                        onChange={handleInputChange}
                        placeholder="Notas adicionales..."
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        Almacén <span>*</span>
                      </label>
                      <select 
                        name="id_almacen" 
                        value={formData.id_almacen} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Seleccionar almacén</option>
                        <option value="1">Almacén 1</option>
                        <option value="2">Almacén 2</option>
                        <option value="12">Almacén 12</option>
                        <option value="23">Almacén 23</option>
                        <option value="40">Almacén 40</option>
                      </select>
                    </div>

>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                    <div className="form-group form-grid-full">
                      <label>
                        <ImagePlus size={16} />
                        Foto de la Donación
                      </label>
                      <div className={`foto-upload-area ${formData.foto_preview ? 'has-image' : ''}`}>
                        {formData.foto_preview ? (
                          <div>
                            <img 
                              src={formData.foto_preview} 
                              alt="Preview" 
                              className="foto-preview"
                            />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                              <motion.button
                                type="button"
                                onClick={eliminarFoto}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="btn-eliminar"
                              >
                                <Trash2 size={16} />
                                Eliminar foto
                              </motion.button>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFotoChange}
                                style={{ display: 'none' }}
                                id="foto-upload-editar-replace"
                              />
                              <label 
                                htmlFor="foto-upload-editar-replace"
                                className="btn-upload-label"
                              >
                                <Upload size={16} />
                                Cambiar foto
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Upload size={40} color="#667eea" style={{ marginBottom: '1rem' }} />
                            <p style={{ color: '#666', marginBottom: '1rem' }}>
                              Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFotoChange}
                              style={{ display: 'none' }}
                              id="foto-upload-editar"
                            />
                            <label 
                              htmlFor="foto-upload-editar"
                              className="btn-upload-label"
                            >
                              <ImagePlus size={18} />
                              Seleccionar imagen
                            </label>
                            <small style={{ display: 'block', marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                              Formatos: JPG, PNG, GIF. Máximo 5MB
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <motion.button 
                      type="button" 
                      className="btn-eliminar" 
                      onClick={handleEliminarDonacion}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </motion.button>
                    <motion.button 
                      type="button" 
                      className="btn-cancelar" 
                      onClick={handleCloseModals}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X size={16} />
                      Cancelar
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      className="btn-guardar"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save size={16} />
                      Guardar Cambios
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notificaciones */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className={`notification ${notification.type}`}
              initial={{ opacity: 0, y: -50, x: 100 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -50, x: 100 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {notification.type === 'success' ? (
                <CheckCircle size={24} />
              ) : (
                <AlertCircle size={24} />
              )}
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Ayuda Mejorado */}
        <AnimatePresence>
          {mostrarAyuda && (
            <motion.div 
              className="modal-overlay" 
              onClick={() => setMostrarAyuda(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal-content" 
                style={{ maxWidth: '580px', maxHeight: '85vh' }}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, rotateX: 90 }}
                animate={{ scale: 1, rotateX: 0 }}
                exit={{ scale: 0.8, rotateX: 90 }}
                transition={{ type: "spring", damping: 20 }}
              >
                <h3 className="modal-title">
                  <Sparkles size={24} />
                  Guía de Uso - Sistema de Donaciones
                </h3>
                
                <div className="help-section">
                  <h4>
                    <Search size={18} />
                    Búsqueda Inteligente
                  </h4>
                  <p>Utiliza la barra de búsqueda para filtrar donaciones por tipo, descripción, almacén o cantidad. Los resultados se actualizan en tiempo real.</p>
                </div>

                <div className="help-section">
                  <h4>
                    <Package size={18} />
                    Tipos de Donación Disponibles
                  </h4>
                  <ul>
                    <li><strong>Alimentos:</strong> </li>
                    <li><strong>Instrumentos musicales:</strong> </li>
<<<<<<< HEAD
                    <li><strong>Medicamentos:</strong> </li>
=======
                    <li><strong>Medicina:</strong> </li>
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                    <li><strong>Enseres:</strong> </li>
                    <li><strong>Accesiorios Musuicales:</strong> </li>
                    <li><strong>Útiles escolares:</strong> </li>
                    <li><strong>Productos de higiene:</strong> </li>
<<<<<<< HEAD
                    <li><strong>Material audiovisual:</strong> </li>
=======
                    <li><strong>Material Audiovisual:</strong> </li>
>>>>>>> 0d1b97ac5b6365cf363ae6a1dfacc29bc05eae77
                    <li><strong>Material didactico:</strong> </li>
                    <li><strong>Otro:</strong> </li>
                  </ul>
                </div>

                <div className="help-section">
                  <h4>
                    <Sparkles size={18} />
                    Funciones Principales
                  </h4>
                  <ul>
                    <li><strong>Agregar:</strong> Clic en "Nueva Donación" para registrar</li>
                    <li><strong>Editar:</strong> Clic en cualquier fila para ver/editar detalles</li>
                    <li><strong>Eliminar:</strong> Dentro del modal de edición</li>
                    <li><strong>Fotos:</strong> Adjunta imágenes de hasta 5MB</li>
                    <li><strong>Auto-guardado:</strong> La fecha se registra automáticamente</li>
                    <li><strong>Sincronización:</strong> Los datos se actualizan cada 30 segundos</li>
                  </ul>
                </div>

                <div className="help-section">
                  <h4>
                    <Warehouse size={18} />
                    Almacenes Disponibles
                  </h4>
                  <p>Selecciona el almacén donde se almacenará la donación. Cada almacén tiene un color distintivo para fácil identificación visual.</p>
                </div>

                <div style={{ 
                  position: 'sticky', 
                  bottom: '0', 
                  left: '0', 
                  right: '0', 
                  padding: '1.5rem', 
                  background: 'white', 
                  borderTop: '2px solid #f0f0f0',
                  marginLeft: '-2.5rem',
                  marginRight: '-2.5rem',
                  marginBottom: '-2.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <motion.button 
                    className="btn-cerrar" 
                    onClick={() => setMostrarAyuda(false)}
                    style={{ minWidth: '200px' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Check size={18} />
                    ¡Entendido!
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Donaciones;