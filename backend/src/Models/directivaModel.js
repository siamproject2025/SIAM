// models/Directiva.js
const mongoose = require('mongoose');

// ============================================
// SCHEMA DE DOCUMENTO PDF
// ============================================
const documentoPDFSchema = new mongoose.Schema({
  nombre_archivo: {
    type: String,
    required: [true, 'El nombre del archivo es obligatorio']
  },
  tipo_documento: {
    type: String,
    required: [true, 'El tipo de documento es obligatorio'],
    enum: {
      values: ['acta', 'contrato', 'informe', 'certificado', 'nombramiento', 'otro'],
      message: '{VALUE} no es un tipo de documento válido'
    }
  },
  descripcion: {
    type: String,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  fecha_subida: {
    type: Date,
    required: [true, 'La fecha de subida es obligatoria'],
    default: Date.now
  },
  archivo_binario: {
    type: Buffer,
    required: [true, 'El archivo binario es obligatorio']
  },
  tamano_kb: {
    type: Number,
    required: [true, 'El tamaño del archivo es obligatorio'],
    min: [0, 'El tamaño no puede ser negativo']
  },
  hash_md5: {
    type: String,
    required: [true, 'El hash MD5 es obligatorio'],
    maxlength: 32
  },
  content_type: {
    type: String,
    default: 'application/pdf'
  }
}, {
  _id: true,
  timestamps: false
});

// ============================================
// SCHEMA DE HISTORIAL DE CARGOS
// ============================================
const historialCargoSchema = new mongoose.Schema({
  cargo: {
    type: String,
    required: true
  },
  fecha_inicio: {
    type: Date,
    required: true
  },
  fecha_fin: {
    type: Date,
    default: null
  }
}, {
  _id: true,
  timestamps: false
});

// ============================================
// SCHEMA PRINCIPAL DE DIRECTIVA
// ============================================
const directivaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  cargo: {
    type: String,
    required: [true, 'El cargo es obligatorio'],
    trim: true,
    maxlength: [50, 'El cargo no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Por favor ingrese un email válido'
    ]
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
  fecha_registro: {
    type: Date,
    required: [true, 'La fecha de registro es obligatoria'],
    default: Date.now
  },
  estado: {
    type: String,
    enum: {
      values: ['activo', 'inactivo', 'suspendido'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'activo'
  },
  documentos_pdf: [documentoPDFSchema],
  historial_cargos: [historialCargoSchema],
  sesiones_asistidas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sesion'
  }],
  notas: {
    type: String,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  }
}, {
  timestamps: true,
  collection: 'directiva'
});

// ============================================
// ÍNDICES
// ============================================
directivaSchema.index({ email: 1 }, { unique: true });
directivaSchema.index({ cargo: 1 });
directivaSchema.index({ estado: 1 });
directivaSchema.index({ 'documentos_pdf.tipo_documento': 1 });

// ============================================
// MÉTODOS VIRTUALES
// ============================================
directivaSchema.virtual('cantidad_documentos').get(function() {
  return this.documentos_pdf ? this.documentos_pdf.length : 0;
});

directivaSchema.virtual('cargo_actual').get(function() {
  if (!this.historial_cargos || this.historial_cargos.length === 0) {
    return this.cargo;
  }
  const cargoActual = this.historial_cargos.find(h => !h.fecha_fin);
  return cargoActual ? cargoActual.cargo : this.cargo;
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================
directivaSchema.methods.getTamanoTotalDocumentos = function() {
  if (!this.documentos_pdf || this.documentos_pdf.length === 0) {
    return 0;
  }
  return this.documentos_pdf.reduce((total, doc) => total + doc.tamano_kb, 0);
};

directivaSchema.methods.getDocumentosPorTipo = function(tipo) {
  if (!this.documentos_pdf) return [];
  return this.documentos_pdf.filter(doc => doc.tipo_documento === tipo);
};

// ============================================
// PRE-SAVE HOOK
// ============================================
directivaSchema.pre('save', function(next) {
  // Validar que el tamaño total del documento no exceda 16MB (límite de MongoDB)
  const tamanoTotal = JSON.stringify(this).length / (1024 * 1024); // Convertir a MB
  
  if (tamanoTotal > 15) { // Dejamos 1MB de margen
    return next(new Error('El documento excede el tamaño máximo permitido de 16MB'));
  }
  
  next();
});

// ============================================
// CONFIGURACIÓN DE toJSON
// ============================================
directivaSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Directiva = mongoose.model('Directiva', directivaSchema);

module.exports = Directiva;