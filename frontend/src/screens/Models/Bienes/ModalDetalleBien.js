import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2,
  ImagePlus,
  Upload,
} from 'lucide-react';

const ModalDetalleBien = ({ bien, onClose, onUpdate, onDelete }) => {
const [bienEditado, setBienEditado] = useState({
  ...bien,
  foto_preview: bien.imagen ? `data:image/png;base64,${bien.imagen}` : null,
});

// Evitar mostrar preview si imagen está vacía o null
useEffect(() => {
  if (!bien?.imagen || bien.imagen === "null" || bien.imagen === "") {
    setBienEditado(prev => ({ ...prev, foto_preview: null }));
  }
}, [bien]);
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
      foto_preview: null,
    });
  useEffect(() => {
  // Esto se ejecuta cuando el componente se monta

  return () => {
    // Esto se ejecuta al desmontarse, es decir, al cerrar el modal
    if (bienEditado.foto_preview) {
      URL.revokeObjectURL(bienEditado.foto_preview);
      console.log('✅ URL temporal revocada al cerrar modal');
    }
  };
}, [bienEditado.foto_preview]);
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
          // Revocar previa URL si existe
      if (bienEditado.foto_preview) {
        URL.revokeObjectURL(bienEditado.foto_preview);
      }

      setBienEditado(prev => ({
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
      
  const handleGuardar = () => {
   
    
    const actualizado = {
      ...bienEditado,
      valor: parseFloat(bienEditado.valor),
      fechaIngreso: new Date(bienEditado.fechaIngreso)
    };
    onUpdate(actualizado);
  };

  const eliminarFoto = () => {
    if (bienEditado.foto_preview) {
      URL.revokeObjectURL(bienEditado.foto_preview);
    }
    setBienEditado(prev => ({
      ...prev,
      imagen: null,
      foto_preview: null
    }));
  };


  const handleEliminar = () => {
    if (window.confirm('¿Seguro que deseas eliminar este bien?')) {
      onDelete(bienEditado._id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">📋 Detalle del Bien</h3>

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Código del Bien</label>
            <input
              type="text"
              value={bienEditado.codigo}
              onChange={(e) => setBienEditado({ ...bienEditado, codigo: e.target.value })}
              placeholder="Ej: BIEN-001"
            />
          </div>

          <div className="form-group">
            <label>Nombre del Bien</label>
            <input
              type="text"
              value={bienEditado.nombre}
              onChange={(e) => setBienEditado({ ...bienEditado, nombre: e.target.value })}
              placeholder="Ej: Laptop Dell"
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              value={bienEditado.categoria}
              onChange={(e) => setBienEditado({ ...bienEditado, categoria: e.target.value })}
              placeholder="Ej: Tecnología"
            />
          </div>

          <div className="form-group">
            <label>Estado Actual</label>
            <select
              value={bienEditado.estado}
              onChange={(e) => setBienEditado({ ...bienEditado, estado: e.target.value })}
            >
              <option value="ACTIVO">🟢 ACTIVO</option>
              <option value="INACTIVO">🔴 INACTIVO</option>
              <option value="MANTENIMIENTO">🟡 MANTENIMIENTO</option>
              <option value="PRESTAMO">🔵 PRESTAMO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Valor ($)</label>
            <input
              type="number"
              value={bienEditado.valor}
              onChange={(e) => setBienEditado({ ...bienEditado, valor: e.target.value })}
              placeholder="Ej: 1500.00"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Ingreso</label>
            <input
              type="date"
              value={bienEditado.fechaIngreso?.slice(0, 10)}
              onChange={(e) => setBienEditado({ ...bienEditado, fechaIngreso: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Descripción Detallada</label>
          <textarea
            value={bienEditado.descripcion}
            onChange={(e) => setBienEditado({ ...bienEditado, descripcion: e.target.value })}
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
              Foto de la Donación
            </label>
            <div className={`foto-upload-area ${bienEditado.foto_preview ? 'has-image' : ''}`}>
              {bienEditado.foto_preview ? (
                <div>
                  <img 
                    src={bienEditado.foto_preview} 
                    alt="Preview" 
                    className="foto-preview"
                  />
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <motion.button
                      type="button"
                      onClick={eliminarFoto}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-eliminar-donaciones"
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
        <div className="modal-actions-orden d-flex flex-wrap gap-2 justify-content-end">
        <button className="btn btn-success" onClick={handleGuardar}>
          💾 Guardar Cambios
        </button>
        <button className="btn btn-danger" onClick={handleEliminar}>
          🗑️ Eliminar
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          ❌ Cerrar
        </button>
      </div>
      </div>
    </div>
  );
};

export default ModalDetalleBien;