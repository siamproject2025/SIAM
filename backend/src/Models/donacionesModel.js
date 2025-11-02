// models/donacionesModel.js
const mongoose = require('mongoose');

const donacionSchema = new mongoose.Schema({
  id_donacion: {
    type: Number,
    required: [true, 'El ID de donación es obligatorio'],
    unique: true,
    min: [1, 'El ID debe ser mayor a 0']
  },
  id_almacen: {
    type: Number,
    required: [true, 'El ID de almacén es obligatorio'],
    min: [1, 'El ID de almacén debe ser mayor a 0']
  },
  fecha: {
    type: Date,
    required: [false, 'La fecha de donación es obligatoria']
  },
  cantidad_donacion: {
    type: Number,
    required: [true, 'La cantidad de donación es obligatoria'],
    min: [0, 'La cantidad no puede ser negativa']
  },
  descripcion: {
    type: String,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    trim: true
  },
  tipo_donacion: {
    type: String,
    required: [true, 'El tipo de donación es obligatorio'],
    enum: {
      values: [
        'Alimentos',
        'Instrumentos Escolares',
        'Accesorios Musicales',
        'Vestimenta',
        'Medicina',
        'Enseres',
        'Bebidas',
        'Útiles Escolares',
        'Productos de Higiene',
        'Material Audiovisual',
        'Material Didactico',
        'Otro'
      ],
      message: '{VALUE} no es un tipo de donación válido'
    }
  },
  fecha_ingreso: {
    type: Date,
    required: [false, 'La fecha de ingreso es obligatoria'],
    default: Date.now
  },
  observaciones: {
    type: String,
    maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    trim: true
  },
  // NUEVOS CAMPOS PARA IMAGEN
  imagen: {
    type: String, // Guardará la imagen en Base64
    default: null
  },
  tipo_imagen: {
    type: String, // Guardará el tipo MIME, ej. image/png
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
},);

// Índices para mejorar el rendimiento
donacionSchema.index({ id_donacion: 1 });
donacionSchema.index({ id_almacen: 1 });
donacionSchema.index({ tipo_donacion: 1 });
donacionSchema.index({ fecha: -1 });

// Método para obtener el próximo ID disponible
donacionSchema.statics.getNextId = async function() {
  const lastDonacion = await this.findOne().sort({ id_donacion: -1 });
  return lastDonacion ? lastDonacion.id_donacion + 1 : 1;
};

module.exports = mongoose.model('Donacion',donacionSchema,'donaciones');
