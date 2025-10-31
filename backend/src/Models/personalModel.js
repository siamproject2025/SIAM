
const mongoose = require('mongoose');

const personalSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: [true, 'El código es obligatorio'],
    unique: true,
    trim: true
  },
  nombres: {
    type: String,
    required: [true, 'Los nombres son obligatorios'],
    trim: true,
    minlength: [2, 'Los nombres deben tener al menos 2 caracteres'],
    maxlength: [100, 'Los nombres no pueden exceder 100 caracteres']
  },
  apellidos: {
    type: String,
    required: [true, 'Los apellidos son obligatorios'],
    trim: true,
    minlength: [2, 'Los apellidos deben tener al menos 2 caracteres'],
    maxlength: [100, 'Los apellidos no pueden exceder 100 caracteres']
  },
  numero_identidad: {
    type: String,
    required: [true, 'El número de identidad es obligatorio'],
    unique: true,
    trim: true,
    minlength: [5, 'El número de identidad debe tener al menos 5 caracteres'],
    maxlength: [20, 'El número de identidad no puede exceder 20 caracteres']
  },
  tipo_contrato: {
    type: String,
    required: [true, 'El tipo de contrato es obligatorio'],
    enum: {
      values: ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'TEMPORAL', 'HONORARIOS', 'PRACTICANTE'],
      message: '{VALUE} no es un tipo de contrato válido'
    }
  },
  estado: {
    type: String,
    required: [true, 'El estado es obligatorio'],
    enum: {
      values: ['ACTIVO', 'VACACIONES', 'LICENCIA', 'INACTIVO'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'ACTIVO'
  },
    // NUEVOS CAMPOS PARA IMAGEN
  imagen: {
    type: String, // Guardará la imagen en Base64
    default: null
  },
  tipo_imagen: {
    type: String, // Guardará el tipo MIME, ej. image/png
    default: null
  },
  cv: [{
    tipo: {
      type: String,
      enum: ['CV', 'CERTIFICADO', 'TITULO', 'OTRO']
    },
    nombre_archivo: String,
    tipo_archivo: {
      type: String,
      enum: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    },
    data: String
  }],
  especialidades: [{
    type: String,
    trim: true
  }],
  area_trabajo: {
    type: String,
    trim: true,
    maxlength: [100, 'El área de trabajo no puede exceder 100 caracteres']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true,
    minlength: [8, 'El teléfono debe tener al menos 8 caracteres'],
    maxlength: [20, 'El teléfono no puede exceder 20 caracteres']
  },
  direccion_correo: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Por favor ingrese un correo válido']
  },
  cargo_asignacion: {
    cargo: {
      type: String,
      required: [true, 'El cargo es obligatorio'],
      trim: true,
      minlength: [2, 'El cargo debe tener al menos 2 caracteres'],
      maxlength: [100, 'El cargo no puede exceder 100 caracteres']
    },
    horario_preferido: {
      type: String,
      enum: ['MATUTINO', 'VESPERTINO', 'NOCTURNO', 'ROTATIVO', 'FLEXIBLE']
    },
    fecha_asignacion: {
      type: Date,
      required: [true, 'La fecha de asignación es obligatoria']
    }
  },
  documentacion: [{
    tipo_documento: {
      type: String,
      enum: ['DPI', 'PASAPORTE', 'LICENCIA', 'ANTECEDENTES', 'TITULO', 'CERTIFICADO', 'CONTRATO', 'OTRO']
    },
    descripcion: {
      type: String,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    archivo: {
      nombre_archivo: String,
      tipo_archivo: String,
      data: String
    },
    fecha_subida: {
      type: Date,
      default: Date.now
    }
  }],
  salario: {
    type: Number,
    min: [0, 'El salario no puede ser negativo']
  },
  fecha_ingreso: {
    type: Date
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
  collection: 'personal'
});

// Middleware para actualizar fecha_actualizacion antes de guardar
personalSchema.pre('save', function(next) {
  this.fecha_actualizacion = Date.now();
  next();
});

// Middleware para actualizar fecha_actualizacion antes de actualizar
personalSchema.pre('findOneAndUpdate', function(next) {
  this.set({ fecha_actualizacion: Date.now() });
  next();
});

const Personal = mongoose.model('Personal', personalSchema);

module.exports = Personal;