import React, { useState, useEffect } from 'react';
import { 
  Trash2,
  ImagePlus,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const ModalCrearBien = ({ onClose, onCreate }) => {
  const [notification, setNotification] = useState(null);
  const [nuevoBien, setNuevoBien] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    estado: '',
    valor: '',
    fechaIngreso: '',
    imagen: null,
    foto_preview: null
  });

    useEffect(() => {
  // Esto se ejecuta cuando el componente se monta

  return () => {
    // Esto se ejecuta al desmontarse, es decir, al cerrar el modal
    if (nuevoBien.foto_preview) {
      URL.revokeObjectURL(nuevoBien.foto_preview);
      
    }
  };
}, [nuevoBien.foto_preview]);

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

      setNuevoBien(prev => ({
        ...prev,
        imagen: file,
        foto_preview: URL.createObjectURL(file)
      }));
    }
  };

    const mostrarNotificacion = (mensaje, tipo = 'success') => {
      setNotification({ message: mensaje, type: tipo });
      setTimeout(() => setNotification(null), 4000);
    };
    
   const eliminarFoto = () => {
    if (nuevoBien.foto_preview) {
      URL.revokeObjectURL(nuevoBien.foto_preview);
    }
    setNuevoBien(prev => ({
      ...prev,
      imagen: null,
      foto_preview: null
    }));
  };

  const handleCrear = () => {
    const bienFinal = {
      ...nuevoBien,
      valor: parseFloat(nuevoBien.valor),
      fechaIngreso: new Date(nuevoBien.fechaIngreso)
    };
    onCreate(bienFinal);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title"> Crear Nuevo Bien</h3>

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Código del Bien *</label>
            <input
              type="text"
              value={nuevoBien.codigo}
              onChange={(e) => setNuevoBien({ ...nuevoBien, codigo: e.target.value })}
              placeholder="Ej: BIEN-001"
            />
          </div>

          <div className="form-group">
            <label>Nombre del Bien *</label>
            <input
              type="text"
              value={nuevoBien.nombre}
              onChange={(e) => setNuevoBien({ ...nuevoBien, nombre: e.target.value })}
              placeholder="Ej: Laptop Dell"
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              value={nuevoBien.categoria}
              onChange={(e) => setNuevoBien({ ...nuevoBien, categoria: e.target.value })}
              placeholder="Ej: Tecnología"
            />
          </div>

          <div className="form-group">
            <label>Estado Inicial *</label>
            <select
              value={nuevoBien.estado}
              onChange={(e) => setNuevoBien({ ...nuevoBien, estado: e.target.value })}
            >
              <option value="">Seleccionar estado</option>
              <option value="ACTIVO"> ACTIVO</option>
              <option value="INACTIVO"> INACTIVO</option>
              <option value="MANTENIMIENTO"> MANTENIMIENTO</option>
              <option value="PRESTAMO"> PRESTAMO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Valor ($) *</label>
            <input
              type="number"
              value={nuevoBien.valor}
              onChange={(e) => setNuevoBien({ ...nuevoBien, valor: e.target.value })}
              placeholder="Ej: 1500.00"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Ingreso *</label>
            <input
              type="date"
              value={nuevoBien.fechaIngreso}
              onChange={(e) => setNuevoBien({ ...nuevoBien, fechaIngreso: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Descripción Detallada</label>
          <textarea
            value={nuevoBien.descripcion}
            onChange={(e) => setNuevoBien({ ...nuevoBien, descripcion: e.target.value })}
            placeholder="Describe las características y detalles del bien..."
            rows="3"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              resize: 'vertical'
            }}
          />
        </div>

        <div className="form-group form-grid-full">
            <label>
              <ImagePlus size={16} />
              Foto del bien
            </label>
            <div className={`foto-upload-area ${nuevoBien.foto_preview ? 'has-image' : ''}`}>
              {nuevoBien.foto_preview ? (
                <div>
                  <img 
                    src={nuevoBien.foto_preview} 
                    alt="Preview" 
                    className="foto-preview"
                  />
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <motion.button
                      type="button"
                      onClick={eliminarFoto}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn btn-danger"
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
                    accept=".jpg,.jpeg"
                    onChange={handleFotoChange}
                    style={{ display: 'none' }}
                    id="foto-upload-nueva"
                  />
                  <label htmlFor="foto-upload-nueva" className="btn-upload-label">
                    <ImagePlus size={18} />
                    Seleccionar imagen
                  </label>
                  <small style={{ display: 'block', marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                    Formatos: JPG, JPEG
                  </small>
                </div>
              )}
            </div>
          </div>

        <div className="modal-actions">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-guardar-donaciones" onClick={handleCrear}>Crear Bien</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearBien;