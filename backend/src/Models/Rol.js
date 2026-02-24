const mongoose = require('mongoose');

const rolSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true,
    trim: true,
    uppercase: true,
    // Validación personalizada (opcional)
    validate: {
      validator: function(v) {
        // Solo permite letras mayúsculas, números y guiones bajos
        return /^[A-Z0-9_]+$/.test(v);
      },
      message: props => `${props.value} no es un ID de rol válido. Use solo mayúsculas, números y guiones bajos.`
    }
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  permisos: [{ 
    type: String, 
    required: true 
  }],
  descripcion: {
    type: String,
    default: ''
  },
  activo: {
    type: Boolean,
    default: true
  },
  nivel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, { 
  timestamps: true,
  _id: false 
});

// Índices
rolSchema.index({ _id: 1 });
rolSchema.index({ activo: 1 });

// Método para verificar si tiene un permiso
rolSchema.methods.tienePermiso = function(permiso) {
  return this.permisos.includes(permiso);
};

// Método para agregar permiso
rolSchema.methods.agregarPermiso = function(permiso) {
  if (!this.permisos.includes(permiso)) {
    this.permisos.push(permiso);
  }
  return this;
};

// Método para quitar permiso
rolSchema.methods.quitarPermiso = function(permiso) {
  this.permisos = this.permisos.filter(p => p !== permiso);
  return this;
};

module.exports = mongoose.model('Rol', rolSchema);