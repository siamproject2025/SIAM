const mongoose = require('mongoose');

const documentoSchema = new mongoose.Schema({
  nombre_archivo: {
    type: String,
    required: true
  },
  tipo_documento: {
    type: String,
    enum: ['acta', 'contrato', 'informe', 'certificado', 'nombramiento', 'otro'],
    required: true
  },
  descripcion: {
    type: String,
    maxLength: 500
  },
  fecha_subida: {
    type: Date,
    required: true,
    default: Date.now
  },
  archivo_binario: {
    type: Buffer
  },
  tamano_kb: {
    type: Number,
    min: 0
  },
  hash_md5: {
    type: String,
    maxLength: 32
  }
});

const historialCargosSchema = new mongoose.Schema({
  cargo: {
    type: String,
    required: true
  },
  fecha_inicio: {
    type: Date,
    required: true
  },
  fecha_fin: {
    type: Date
  }
});

const directivaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  cargo: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Por favor ingrese un email válido']
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  empresa: {
    type: String,
    trim: true
  },
  fecha_registro: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'suspendido'],
    default: 'activo'
  },
  documentos_pdf: [documentoSchema],
  historial_cargos: [historialCargosSchema],
  sesiones_asistidas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sesion'
  }],
  notas: {
    type: String,
    maxLength: 1000
  }
}, {
  timestamps: true
});

// Índices para mejor performance
directivaSchema.index({ email: 1 });
directivaSchema.index({ estado: 1 });
directivaSchema.index({ cargo: 1 });

// Método para agregar un documento PDF
directivaSchema.methods.agregarDocumento = function(documentoData) {
  this.documentos_pdf.push({
    ...documentoData,
    fecha_subida: new Date()
  });
  return this.save();
};

// Método para agregar historial de cargo
directivaSchema.methods.agregarHistorialCargo = function(cargoData) {
  this.historial_cargos.push(cargoData);
  return this.save();
};

// Método para actualizar estado
directivaSchema.methods.actualizarEstado = function(nuevoEstado) {
  this.estado = nuevoEstado;
  return this.save();
};

const Directiva = mongoose.model('Directiva', directivaSchema);

module.exports = Directiva;