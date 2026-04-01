const mongoose = require('mongoose');

// ── Contador para código autogenerado ─────────────────────
const contadorSchema = new mongoose.Schema({
  _id:    { type: String, required: true },
  seq:    { type: Number, default: 0 }
});
const Contador = mongoose.model('Contador', contadorSchema);

const generarCodigo = async () => {
  const año = new Date().getFullYear();
  const key  = `personal_${año}`;
  const doc  = await Contador.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `EMP-${año}-${String(doc.seq).padStart(4, '0')}`;
};

// ── Schema Principal ───────────────────────────────────────
const personalSchema = new mongoose.Schema({
  // ── Identificación ────────────────────────────────────
  codigo: {
    type: String,
    unique: true,
    trim: true
    // Se genera automáticamente en el pre-save
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

  // ── Contrato y estado ─────────────────────────────────
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
    required: true,
    enum: {
      values: ['ACTIVO', 'VACACIONES', 'LICENCIA', 'INACTIVO'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'ACTIVO'
  },

  // ── Foto de perfil ────────────────────────────────────
  imagen: { type: String, default: null },
  tipo_imagen: { type: String, default: null },

  // ── Especialidades (tabla de detalle — fix #3) ────────
  especialidades: [{
    nombre: { type: String, trim: true, required: true },
    nivel:  {
      type: String,
      enum: ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO'],
      default: 'INTERMEDIO'
    }
  }],

  // ── Área de trabajo parametrizable (fix #2) ───────────
  area_trabajo: {
    type: String,
    trim: true,
    maxlength: [100, 'El área de trabajo no puede exceder 100 caracteres']
  },

  // ── Contacto ──────────────────────────────────────────
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

  // ── Cargo y horario ───────────────────────────────────
  cargo_asignacion: {
    cargo: {
      type: String,
      required: [true, 'El cargo es obligatorio'],
      enum: {
        values: ['DOCENTE', 'DIRECTOR', 'LIMPIEZA', 'GUARDIA', 'SERVICIO_SOCIAL'],
        message: 'Cargo no válido'
      }
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

  // ── Documentación en Google Drive (fix #5) ───────────
  documentacion: [{
    tipo_documento: {
      type: String,
      enum: ['DPI', 'PASAPORTE', 'LICENCIA', 'ANTECEDENTES', 'TITULO', 'CERTIFICADO', 'CONTRATO', 'OTRO'],
      required: true
    },
    descripcion:   { type: String, maxlength: [500, 'La descripción no puede exceder 500 caracteres'] },
    // Drive fields
    nombre_archivo: { type: String },
    drive_file_id:  { type: String },   // ID del archivo en Google Drive
    drive_url:      { type: String },   // webViewLink
    tipo_archivo:   { type: String },
    fecha_subida:   { type: Date, default: Date.now }
  }],

  // ── CV / Certificados en Google Drive ─────────────────
  cv: [{
    tipo: {
      type: String,
      enum: ['CV', 'CERTIFICADO', 'TITULO', 'OTRO']
    },
    nombre_archivo: { type: String },
    drive_file_id:  { type: String },
    drive_url:      { type: String },
    tipo_archivo:   { type: String },
    fecha_subida:   { type: Date, default: Date.now }
  }],

  // ── Finanzas ──────────────────────────────────────────
  salario: {
    type: Number,
    min: [0, 'El salario no puede ser negativo']
  },

  // ── Fechas de ciclo laboral (fix #6) ──────────────────
  fecha_ingreso: { type: Date },
  fecha_salida:  { type: Date, default: null },
  motivo_salida: {
    type: String,
    maxlength: [500, 'El motivo de salida no puede exceder 500 caracteres'],
    default: null
  },

  // ── Auditoría (fix #9) ───────────────────────────────
  creado_por:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  creado_por_email:   { type: String, default: null },   // email Firebase
  actualizado_por:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actualizado_por_email: { type: String, default: null }, // email Firebase
  fecha_creacion:   { type: Date, default: Date.now },
  fecha_actualizacion: { type: Date, default: Date.now }

}, {
  timestamps: true,
  collection: 'personal'
});

// ── Middleware: generar código automático (fix #1) ─────────
personalSchema.pre('save', async function (next) {
  if (!this.codigo) {
    this.codigo = await generarCodigo();
  }
  this.fecha_actualizacion = Date.now();
  next();
});

personalSchema.pre('findOneAndUpdate', function (next) {
  this.set({ fecha_actualizacion: Date.now() });
  next();
});

// ── Índices ────────────────────────────────────────────────
personalSchema.index({ estado: 1 });
personalSchema.index({ 'cargo_asignacion.cargo': 1 });
personalSchema.index({ area_trabajo: 1 });
personalSchema.index({ 'especialidades.nombre': 1 });

const Personal = mongoose.model('Personal', personalSchema);

module.exports = Personal;
module.exports.generarCodigo = generarCodigo;