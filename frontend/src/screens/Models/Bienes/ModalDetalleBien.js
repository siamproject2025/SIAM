import React, { useState, useEffect } from 'react';
import { 
  ImagePlus,
  Upload,
} from 'lucide-react';

import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog';

const ModalDetalleBien = ({ bien, onClose, onUpdate, onDelete }) => {

  const [bienEditado, setBienEditado] = useState({
    ...bien,
    foto_preview: bien.imagen ? `data:image/png;base64,${bien.imagen}` : null,
  });

  const [notification, setNotification] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);
  const [hayCambios, setHayCambios] = useState(false);

  // Evitar mostrar preview si imagen está vacía o null
  useEffect(() => {
    if (!bien?.imagen || bien.imagen === "null" || bien.imagen === "") {
      setBienEditado(prev => ({ ...prev, foto_preview: null }));
    }
  }, [bien]);

  // Limpiar object URL al desmontar
  useEffect(() => {
    return () => {
      if (bienEditado.foto_preview && bienEditado.foto_preview.startsWith('blob:')) {
        URL.revokeObjectURL(bienEditado.foto_preview);
      }
    };
  }, [bienEditado.foto_preview]);

  // ─── Helper para detectar cambios ────────────────────────────────────────
  const handleChange = (campo, valor) => {
    setBienEditado(prev => ({ ...prev, [campo]: valor }));
    setHayCambios(true);
  };

  // ─── Foto ─────────────────────────────────────────────────────────────────
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('La imagen no debe superar 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Solo se permiten imágenes', 'error');
        return;
      }
      if (bienEditado.foto_preview && bienEditado.foto_preview.startsWith('blob:')) {
        URL.revokeObjectURL(bienEditado.foto_preview);
      }
      setBienEditado(prev => ({
        ...prev,
        imagen: file,
        foto_preview: URL.createObjectURL(file)
      }));
      setHayCambios(true);
    }
  };

  const eliminarFoto = () => {
    if (bienEditado.foto_preview && bienEditado.foto_preview.startsWith('blob:')) {
      URL.revokeObjectURL(bienEditado.foto_preview);
    }
    setBienEditado(prev => ({ ...prev, imagen: null, foto_preview: null }));
    setHayCambios(true);
  };

  // ─── Notificación ─────────────────────────────────────────────────────────
  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ message: mensaje, type: tipo });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── Guardar ──────────────────────────────────────────────────────────────
  const handleGuardar = () => {
    const actualizado = {
      ...bienEditado,
      valor: parseFloat(bienEditado.valor),
      fechaIngreso: new Date(bienEditado.fechaIngreso)
    };
    onUpdate(actualizado);
    setHayCambios(false);
  };

  // ─── Cerrar con verificación ──────────────────────────────────────────────
  const handleCerrar = () => {
    if (hayCambios) {
      setShowConfirmCerrar(true);
    } else {
      onClose();
    }
  };

  // ─── Eliminar ─────────────────────────────────────────────────────────────
  const prepararEliminacion = () => {
    setShowConfirm(true);
  };

  const confirmarEliminacion = () => {
    onDelete(bienEditado._id);
    setShowConfirm(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title"> Editar Bien</h3>

        <div className="modal-form-grid">
          <div className="form-group">
            <label>Código del Bien</label>
            <input
              type="text"
              value={bienEditado.codigo}
              onChange={(e) => handleChange('codigo', e.target.value)}
              placeholder="Ej: BIEN-001"
            />
          </div>

          <div className="form-group">
            <label>Nombre del Bien</label>
            <input
              type="text"
              value={bienEditado.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              placeholder="Ej: Laptop Dell"
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <select
              className="form-select"
              value={bienEditado.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
            >
              <option value="">Seleccione una categoría</option>
              <optgroup label="Generales">
                <option value="MOBILIARIO">Mobiliario</option>
                <option value="EQUIPO_COMPUTO">Equipo de Cómputo</option>
                <option value="ELECTRONICO">Electrónico</option>
                <option value="HERRAMIENTA">Herramienta</option>
                <option value="OTRO">Otro</option>
              </optgroup>
              <optgroup label="Instrumentos Musicales">
                <option value="CUERDA">Cuerda</option>
                <option value="VIENTO_MADERA">Viento Madera</option>
                <option value="VIENTO_METAL">Viento Metal</option>
                <option value="PERCUSION">Percusión</option>
                <option value="TECLADO">Teclado</option>
                <option value="INSTRUMENTO_ELECTRONICO">Instrumento Electrónico</option>
                <option value="ACCESORIO_MUSICAL">Accesorio Musical</option>
              </optgroup>
            </select>
          </div>

          <div className="form-group">
            <label>Estado Actual</label>
            <select
              value={bienEditado.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              <option value="PRESTAMO">PRESTAMO</option>
            </select>
          </div>

          <div className="form-group">
            <label>Valor (L.)</label>
            <input
              type="number"
              value={bienEditado.valor}
              onChange={(e) => handleChange('valor', e.target.value)}
              placeholder="Ej: 1500.00"
            />
          </div>

          <div className="form-group">
            <label>Fecha de Ingreso</label>
            <input
              type="date"
              value={bienEditado.fechaIngreso?.slice(0, 10)}
              onChange={(e) => handleChange('fechaIngreso', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Descripción Detallada</label>
          <textarea
            value={bienEditado.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
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
            Foto del Bien
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
                  <input
                    type="file"
                    accept=".jpg,.jpeg"
                    onChange={handleFotoChange}
                    style={{ display: 'none' }}
                    id="foto-upload-editar-replace"
                  />
                  <label htmlFor="foto-upload-editar-replace" className="btn-upload-label">
                    <Upload size={16} />
                    Cambiar foto
                  </label>
                  <button
                    type="button"
                    onClick={eliminarFoto}
                    className="btn btn-danger"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    Eliminar foto
                  </button>
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
                <label htmlFor="foto-upload-editar" className="btn-upload-label">
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

        {/* Indicador de cambios sin guardar */}
        {hayCambios && (
          <div style={{
            background: '#fff8e1',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '0.6rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#856404',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            ⚠️ Tienes cambios sin guardar
          </div>
        )}

        <div className="modal-actions-orden d-flex flex-wrap gap-2 justify-content-end">
          <button className="btn-guardar-donaciones" onClick={handleGuardar}>
            Guardar Cambios
          </button>

          <button className="btn btn-danger" onClick={prepararEliminacion}>
            Eliminar
          </button>

          <button className="btn btn-dark" onClick={handleCerrar}>
            Cerrar
          </button>
        </div>

        {/* Confirm eliminar bien */}
        {showConfirm && (
          <ConfirmDialog
            message={`¿Seguro que deseas eliminar el bien "${bienEditado?.nombre}"?`}
            onConfirm={confirmarEliminacion}
            onCancel={() => setShowConfirm(false)}
            visible={showConfirm}
          />
        )}

        {/* Confirm cerrar sin guardar */}
        {showConfirmCerrar && (
          <ConfirmDialog
            message="Tienes cambios sin guardar. ¿Seguro que deseas cerrar sin guardar?"
            onConfirm={() => {
              setShowConfirmCerrar(false);
              onClose();
            }}
            onCancel={() => setShowConfirmCerrar(false)}
            visible={showConfirmCerrar}
          />
        )}

        {/* Notificación inline */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            background: notification.type === 'success' ? '#4CAF50' : '#f44336',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalDetalleBien;