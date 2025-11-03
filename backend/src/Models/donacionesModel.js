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
    required: [true, 'La fecha de donación es obligatoria'] // Corregí a true
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
    required: [true, 'La fecha de ingreso es obligatoria'], // Corregí a true
    default: Date.now
  },
  observaciones: {
    type: String,
    maxlength: [500, 'Las observaciones no pueden exceder 500 caracteres'],
    trim: true
  },
  // NUEVOS CAMPOS PARA IMAGEN (Base64)
  imagen: {
    type: String, // Guardará la imagen en Base64
    default: null
  },
  tipo_imagen: {
    type: String, // Guardará el tipo MIME, ej. image/png
    default: null
  },
  // CAMPO FOTO PRINCIPAL (URL) - AGREGADO
  foto_principal: {
    type: String,
    validate: {
      validator: function(url) {
        // Valida que sea una URL válida si se proporciona
        if (!url) return true; // Opcional
        return /^https?:\/\/.+/.test(url);
      },
      message: 'La URL de la foto principal debe ser válida'
    },
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

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

// Método virtual para obtener la imagen completa (si se usa Base64)
donacionSchema.virtual('imagen_completa').get(function() {
  if (this.imagen && this.tipo_imagen) {
    return `data:${this.tipo_imagen};base64,${this.imagen}`;
  }
  return null;
});

module.exports = mongoose.model('Donacion', donacionSchema);