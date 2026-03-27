// ============================================================
// Models/directivaModel.js
//
// CAMBIOS vs versión anterior:
// FIX #1 CRÍTICO — numero_identidad (obligatorio, único)
// FIX #2 ALTO    — foto (base64 string)
// FIX #3 ALTO    — fecha_inicio_cargo, fecha_fin_cargo,
//                  motivo_salida en el schema principal
//                  (no solo en historial_cargos)
// FIX #4 ALTO    — creado_por, fecha_creacion_sistema,
//                  actualizado_por, fecha_actualizacion
// ============================================================
const mongoose = require('mongoose');

// ── Sub-schema: documentos PDF ────────────────────────────────
const documentoSchema = new mongoose.Schema({
    nombre_archivo:          { type: String, required: true },
    tipo_documento:          { type: String, enum: ['acta','contrato','informe','certificado','nombramiento','otro'], required: true },
    descripcion:             { type: String, maxlength: 500 },
    fecha_subida:            { type: Date, required: true, default: Date.now },
    driveFileId:             { type: String },
    driveViewLink:           { type: String },
    driveDownloadLink:       { type: String },
    tamano_kb:               { type: Number, min: 0 },
    nombre_archivo_original: { type: String },
    numero_sesion:           { type: String },
});

// ── Sub-schema: historial de cargos ──────────────────────────
const historialCargosSchema = new mongoose.Schema({
    cargo:       { type: String, required: true },
    fecha_inicio:{ type: Date, required: true },
    fecha_fin:   { type: Date },
    motivo_fin:  { type: String },
});

// ── Schema principal ─────────────────────────────────────────
const directivaSchema = new mongoose.Schema({

    nombre: { type: String, required: true, trim: true },
    cargo:  { type: String, required: true, trim: true },
    email:  {
        type: String, required: true, unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email inválido'],
    },
    telefono: { type: String, required: true, trim: true },

    // FIX #1 CRÍTICO: número de identidad obligatorio y único
    numero_identidad: {
        type: String,
        required: [true, 'El número de identidad es obligatorio'],
        unique: true,
        trim: true,
        index: true,
    },

    // FIX #2 ALTO: foto como base64
    foto: { type: String, default: null },

    empresa:       { type: String, trim: true },
    fecha_registro:{ type: Date, default: Date.now },
    estado:        { type: String, enum: ['activo','inactivo','suspendido'], default: 'activo' },

    // FIX #3 ALTO: vigencia del cargo actual
    // (además del historial_cargos[] para trazabilidad completa)
    fecha_inicio_cargo: { type: Date },
    fecha_fin_cargo:    { type: Date },
    motivo_salida:      { type: String, maxlength: 1000 },

    // FIX #4 ALTO: auditoría completa
    creado_por:              { type: String, default: 'sistema' },
    fecha_creacion_sistema:  { type: Date, default: Date.now },
    actualizado_por:         { type: String },
    fecha_actualizacion:     { type: Date },

    // Sub-documentos existentes
    documentos_pdf:      [documentoSchema],
    historial_cargos:    [historialCargosSchema],
    sesiones_asistidas:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sesion' }],
    notas:               { type: String, maxlength: 1000 },

}, { timestamps: true });

// ── Índices ────────────────────────────────────────────────────
directivaSchema.index({ email:             1 });
directivaSchema.index({ estado:            1 });
directivaSchema.index({ cargo:             1 });
directivaSchema.index({ numero_identidad:  1 }, { unique: true });

// ── Middleware pre-save: actualizar fecha_actualizacion ───────
directivaSchema.pre('save', function(next) {
    if (this.isModified() && !this.isNew) {
        this.fecha_actualizacion = new Date();
    }
    // Si el cargo cambia y hay fecha de inicio, guardar en historial
    if (this.isModified('cargo') && this.fecha_inicio_cargo && !this.isNew) {
        const entradaHistorial = {
            cargo:        this.cargo,
            fecha_inicio: this.fecha_inicio_cargo,
            fecha_fin:    this.fecha_fin_cargo || null,
            motivo_fin:   this.motivo_salida || '',
        };
        this.historial_cargos.push(entradaHistorial);
    }
    next();
});

// ── Métodos ────────────────────────────────────────────────────
directivaSchema.methods.agregarDocumento = function(documentoData) {
    this.documentos_pdf.push({ ...documentoData, fecha_subida: new Date() });
    return this.save();
};

directivaSchema.methods.agregarHistorialCargo = function(cargoData) {
    this.historial_cargos.push(cargoData);
    return this.save();
};

directivaSchema.methods.actualizarEstado = function(nuevoEstado) {
    this.estado = nuevoEstado;
    return this.save();
};

const Directiva = mongoose.model('Directiva', directivaSchema);
module.exports = Directiva;