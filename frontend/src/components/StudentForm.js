import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2,
  ImagePlus,
  Upload,
} from 'lucide-react';
import axios from 'axios';
import { auth } from "../components/authentication/Auth";

const API_HOST = process.env.REACT_APP_API_URL;
const API_GRADOS = `${API_HOST}/api/grados`;

const StudentForm = ({ student, onSubmit, onCancel, onDelete, isEdit = false }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    fecha_nacimiento: '',
    edad: '',
    genero: '',
    id_documento: '',
    residencia_direccion: '',
    telefono_alumno: '',
    grado_a_matricular: '',
    escuela_anterior: '',
    notas_grado_anterior: '',
    nombre_encargado: '',
    parentesco_encargado: '',
    id_documento_encargado: '',
    telefono_encargado: '',
    email_encargado: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    imagen: null,
    foto_preview: null,
  });

  const [errors, setErrors] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState(null);
 const [grados, setGrados] = useState([]);
  const [loadingGrados, setLoadingGrados] = useState(false);

  const obtenerGrados = async () => {
    try {
      setLoadingGrados(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      };

      const response = await axios.get(API_GRADOS, config);
      
      // Extraer solo el campo "grado" de cada objeto
      const gradosList = response.data.items.map(item => item.grado);
      setGrados(gradosList);
      
    } catch (error) {
      console.error("❌ Error al cargar los grados:", error);
      mostrarNotificacion("Error al cargar la lista de grados", "error");
      // Grados por defecto en caso de error
      setGrados([
        'Primer Grado',
        'Segundo Grado', 
        'Tercer Grado',
        'Cuarto Grado',
        'Quinto Grado',
        'Sexto Grado'
      ]);
    } finally {
      setLoadingGrados(false);
    }
  };
   useEffect(() => {
    obtenerGrados();
  }, []);

  useEffect(() => {
    if (student) {
      const formattedStudent = { ...student };

      // Formatear fecha
      if (student.fecha_nacimiento) {
        formattedStudent.fecha_nacimiento = student.fecha_nacimiento.split('T')[0];
      }

      formattedStudent.foto_preview = student.imagen && student.imagen !== "null"
  ? `data:image/png;base64,${student.imagen}`
  : null;


      setFormData(formattedStudent);
    }
  }, [student]);
  
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

      setFormData(prev => {
        if (prev.foto_preview) URL.revokeObjectURL(prev.foto_preview);
        return {
          ...prev,
          imagen: file,
          foto_preview: URL.createObjectURL(file)
        };
      });
    }
  };

  const eliminarFoto = () => {
    if (formData.foto_preview) {
      URL.revokeObjectURL(formData.foto_preview);
    }
    setFormData(prev => ({
      ...prev,
      imagen: null,
      foto_preview: null
    }));
  };

  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotification({ message: mensaje, type: tipo });
    setTimeout(() => setNotification(null), 4000);
  };

  // Obtener año actual para limitar fecha de nacimiento
  const getCurrentYear = () => new Date().getFullYear();
  const maxDate = `${getCurrentYear()}-12-31`;
  const minDate = `${getCurrentYear() - 100}-01-01`;

  // Solo permitir números en campos de teléfono
  const handlePhoneChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^\d]/g, '');
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones requeridas
    const requiredFields = [
      'nombre_completo', 'fecha_nacimiento', 'edad', 'genero', 'id_documento',
      'residencia_direccion', 'grado_a_matricular', 'nombre_encargado',
      'parentesco_encargado', 'id_documento_encargado', 'telefono_encargado'
    ];

    requiredFields.forEach(field => {
      const fieldValue = formData[field];
      if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
        newErrors[field] = 'Este campo es requerido';
      }
    });

    // Validación de email si se proporciona
    if (formData.email_encargado && !/\S+@\S+\.\S+/.test(formData.email_encargado)) {
      newErrors.email_encargado = 'Email inválido';
    }

    // Validación de edad numérica
    if (formData.edad) {
      const edadNum = parseInt(formData.edad);
      if (isNaN(edadNum) || edadNum < 3 || edadNum > 25) {
        newErrors.edad = 'Edad debe ser un número entre 3 y 25';
      }
    }

    // Validación de teléfonos (solo números)
    const phoneFields = ['telefono_alumno', 'telefono_encargado', 'contacto_emergencia_telefono'];
    phoneFields.forEach(field => {
      if (formData[field] && !/^\d+$/.test(formData[field])) {
        newErrors[field] = 'Solo se permiten números';
      }
    });

    // Validación de longitud de teléfonos
    if (formData.telefono_encargado && formData.telefono_encargado.length < 8) {
      newErrors.telefono_encargado = 'El teléfono debe tener al menos 8 dígitos';
    }

    if (formData.telefono_alumno && formData.telefono_alumno.length < 8) {
      newErrors.telefono_alumno = 'El teléfono debe tener al menos 8 dígitos';
    }

    if (formData.contacto_emergencia_telefono && formData.contacto_emergencia_telefono.length < 8) {
      newErrors.contacto_emergencia_telefono = 'El teléfono debe tener al menos 8 dígitos';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FUNCIÓN MEJORADA: Preparar datos para enviar al backend
  const prepareDataForBackend = () => {
    // Crear copia limpia del formData
    const cleanData = { ...formData };
    
    // ❌ ELIMINAR CAMPOS QUE NO DEBEN IR AL BACKEND
    delete cleanData.foto_preview; // Solo para preview en frontend
    
    // Si estamos en modo edición y no hay imagen nueva, eliminar el campo imagen
    if (isEdit && !(cleanData.imagen instanceof File)) {
      delete cleanData.imagen;
    }
    
    return cleanData;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // ✅ Enviar solo los datos limpios al backend
      const cleanData = prepareDataForBackend();
     
      onSubmit(cleanData);
    }
  };


  return (
    <>
      {/* Notificación de errores */}
      {showNotification && (
        <div className="error-notification">
          <div className="notification-content" style={{border:"2px solid red"}}>
            <i className="fas fa-exclamation-circle"></i>
            <div>
              <strong>Faltan campos por llenar</strong>
              <p>Por favor complete todos los campos requeridos marcados con *</p>
            </div>
            <button 
              className="notification-close"
              onClick={() => setShowNotification(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="student-form">
        <div className="form-sections">
          {/* Sección 1: Datos del Alumno */}
          <section className="form-section">
            <h3 className="section-title">
              <i className="fas fa-user-graduate"></i>
              Datos del Alumno
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nombre_completo">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  className={errors.nombre_completo ? 'error' : ''}
                />
                {errors.nombre_completo && <span className="error-message">{errors.nombre_completo}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  className={errors.fecha_nacimiento ? 'error' : ''}
                  max={maxDate}
                  min={minDate}
                />
                {errors.fecha_nacimiento && <span className="error-message">{errors.fecha_nacimiento}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edad">Edad *</label>
                <input
                  type="number"
                  id="edad"
                  name="edad"
                  value={formData.edad}
                  onChange={handleChange}
                  min="3"
                  max="25"
                  className={errors.edad ? 'error' : ''}
                />
                {errors.edad && <span className="error-message">{errors.edad}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="genero">Género *</label>
                <select
                  id="genero"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  className={errors.genero ? 'error' : ''}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.genero && <span className="error-message">{errors.genero}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="id_documento">Documento de Identidad *</label>
                <input
                  type="text"
                  id="id_documento"
                  name="id_documento"
                  value={formData.id_documento}
                  onChange={handleChange}
                  className={errors.id_documento ? 'error' : ''}
                />
                {errors.id_documento && <span className="error-message">{errors.id_documento}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="residencia_direccion">Dirección de Residencia *</label>
                <input
                  type="text"
                  id="residencia_direccion"
                  name="residencia_direccion"
                  value={formData.residencia_direccion}
                  onChange={handleChange}
                  className={errors.residencia_direccion ? 'error' : ''}
                />
                {errors.residencia_direccion && <span className="error-message">{errors.residencia_direccion}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefono_alumno">Teléfono del Alumno</label>
                <input
                  type="tel"
                  id="telefono_alumno"
                  name="telefono_alumno"
                  value={formData.telefono_alumno}
                  onChange={handlePhoneChange}
                  className={errors.telefono_alumno ? 'error' : ''}
                  placeholder="Solo números"
                  maxLength="15"
                />
                {errors.telefono_alumno && <span className="error-message">{errors.telefono_alumno}</span>}
              </div>
            </div>
          </section>

          {/* Sección 2: Datos Académicos */}
          <section className="form-section">
            <h3 className="section-title">
              <i className="fas fa-book"></i>
              Datos Académicos
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="grado_a_matricular">Grado a Matricular *</label>
                <select
                  id="grado_a_matricular"
                  name="grado_a_matricular"
                  value={formData.grado_a_matricular}
                  onChange={handleChange}
                  className={errors.grado_a_matricular ? 'error' : ''}
                  disabled={loadingGrados}
                >
                  <option value="">
                    {loadingGrados ? 'Cargando grados...' : 'Seleccionar grado...'}
                  </option>
                  {grados.map((grado, index) => (
                    <option key={index} value={grado}>
                      {grado}
                    </option>
                  ))}
                </select>
                {loadingGrados && (
                  <small style={{ color: '#666', fontStyle: 'italic' }}>
                    Cargando lista de grados...
                  </small>
                )}
                {errors.grado_a_matricular && <span className="error-message">{errors.grado_a_matricular}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="notas_grado_anterior">Notas del Grado Anterior</label>
                <textarea
                  id="notas_grado_anterior"
                  name="notas_grado_anterior"
                  value={formData.notas_grado_anterior}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Observaciones o notas académicas..."
                />
              </div>
            </div>
          </section>

          {/* Sección 3: Datos del Encargado */}
          <section className="form-section">
            <h3 className="section-title">
              <i className="fas fa-user-friends"></i>
              Datos del Padre/Encargado
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nombre_encargado">Nombre del Encargado *</label>
                <input
                  type="text"
                  id="nombre_encargado"
                  name="nombre_encargado"
                  value={formData.nombre_encargado}
                  onChange={handleChange}
                  className={errors.nombre_encargado ? 'error' : ''}
                />
                {errors.nombre_encargado && <span className="error-message">{errors.nombre_encargado}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="parentesco_encargado">Parentesco *</label>
                <select
                  id="parentesco_encargado"
                  name="parentesco_encargado"
                  value={formData.parentesco_encargado}
                  onChange={handleChange}
                  className={errors.parentesco_encargado ? 'error' : ''}
                >
                  <option value="">Seleccionar parentesco...</option>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Abuelo">Abuelo</option>
                  <option value="Abuela">Abuela</option>
                  <option value="Tío">Tío</option>
                  <option value="Tía">Tía</option>
                  <option value="Hermano">Hermano</option>
                  <option value="Hermana">Hermana</option>
                  <option value="Otro">Otro</option>
                </select>
                {errors.parentesco_encargado && <span className="error-message">{errors.parentesco_encargado}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="id_documento_encargado">Documento del Encargado *</label>
                <input
                  type="text"
                  id="id_documento_encargado"
                  name="id_documento_encargado"
                  value={formData.id_documento_encargado}
                  onChange={handleChange}
                  className={errors.id_documento_encargado ? 'error' : ''}
                />
                {errors.id_documento_encargado && <span className="error-message">{errors.id_documento_encargado}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="telefono_encargado">Teléfono del Encargado *</label>
                <input
                  type="tel"
                  id="telefono_encargado"
                  name="telefono_encargado"
                  value={formData.telefono_encargado}
                  onChange={handlePhoneChange}
                  className={errors.telefono_encargado ? 'error' : ''}
                  placeholder="Solo números"
                  maxLength="15"
                />
                {errors.telefono_encargado && <span className="error-message">{errors.telefono_encargado}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="email_encargado">Email del Encargado</label>
                <input
                  type="email"
                  id="email_encargado"
                  name="email_encargado"
                  value={formData.email_encargado}
                  onChange={handleChange}
                  className={errors.email_encargado ? 'error' : ''}
                />
                {errors.email_encargado && <span className="error-message">{errors.email_encargado}</span>}
              </div>
            </div>
          </section>

          {/* Sección 4: Contacto de Emergencia */}
          <section className="form-section">
            <h3 className="section-title">
              <i className="fas fa-phone-alt"></i>
              Contacto de Emergencia
            </h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="contacto_emergencia_nombre">Nombre de Contacto</label>
                <input
                  type="text"
                  id="contacto_emergencia_nombre"
                  name="contacto_emergencia_nombre"
                  value={formData.contacto_emergencia_nombre}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contacto_emergencia_telefono">Teléfono de Emergencia</label>
                <input
                  type="tel"
                  id="contacto_emergencia_telefono"
                  name="contacto_emergencia_telefono"
                  value={formData.contacto_emergencia_telefono}
                  onChange={handlePhoneChange}
                  className={errors.contacto_emergencia_telefono ? 'error' : ''}
                  placeholder="Solo números"
                  maxLength="15"
                />
                {errors.contacto_emergencia_telefono && <span className="error-message">{errors.contacto_emergencia_telefono}</span>}
              </div>
              <div className="form-group form-grid-full">
                <label>
                  <ImagePlus size={16} />
                  Foto del alumno
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
                          className="btn btn-danger"
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
          </section>
        </div>

        {/* Botones de acción */}
        <div className="form-actions">
          <div className="action-left">
            {isEdit && onDelete && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={onDelete}
              >
                <i className="fas fa-trash"></i>
                Eliminar
              </button>
            )}
          </div>
          <div className="action-right">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <i className="fas fa-save"></i>
              {isEdit ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default StudentForm;