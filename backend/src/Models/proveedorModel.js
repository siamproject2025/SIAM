const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema({
  id_proveedor: {
    type: Number,
    required: [true, 'El ID del proveedor es obligatorio'],
    unique: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del proveedor es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  contacto: {
    type: String,
    trim: true,
    maxlength: [100, 'El contacto no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    maxlength: [100, 'El email no puede exceder 100 caracteres'],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Por favor ingrese un email válido']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  empresa: {
    type: String,
    trim: true,
    maxlength: [100, 'El nombre de la empresa no puede exceder 100 caracteres']
  },
  direccion: {
    type: String,
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  ciudad: {
    type: String,
    trim: true,
    maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
  },
  pais: {
    type: String,
    trim: true,
    maxlength: [100, 'El país no puede exceder 100 caracteres']
  },
  sitio_web: {
    type: String,
    trim: true,
    maxlength: [200, 'El sitio web no puede exceder 200 caracteres']
  },
  rtn: {
    type: String,
    trim: true,
    maxlength: [50, 'El RTN no puede exceder 50 caracteres']
  },
  tipo_proveedor: {
    type: String,
    enum: {
      values: ['PRODUCTOS', 'SERVICIOS', 'MIXTO'],
      message: '{VALUE} no es un tipo de proveedor válido'
    }
  },
  estado: {
    type: String,
    enum: {
      values: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'ACTIVO'
  },
  calificacion: {
    type: Number,
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  notas: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },
  condiciones_pago: {
    type: String,
    trim: true,
    maxlength: [200, 'Las condiciones de pago no pueden exceder 200 caracteres']
  },
  tiempo_entrega_promedio: {
    type: Number,
    min: [0, 'El tiempo de entrega no puede ser negativo']
  },
  fecha_registro: {
    type: Date,
    default: Date.now
  },
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_actualizacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'proveedores'
});

// Middleware para actualizar fecha_actualizacion antes de guardar
proveedorSchema.pre('save', function(next) {
  this.fecha_actualizacion = Date.now();
  next();
});

// Middleware para actualizar fecha_actualizacion antes de actualizar
proveedorSchema.pre('findOneAndUpdate', function(next) {
  this.set({ fecha_actualizacion: Date.now() });
  next();
});

const Proveedor = mongoose.model('Proveedor', proveedorSchema);

module.exports = Proveedor;