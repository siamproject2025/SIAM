const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 0 },
  costoUnit: { type: Number, required: true, min: 0 }
});

// Schema para adjuntos (PDF, imágenes, documentos)
const adjuntoSchema = new mongoose.Schema({
  nombre: { 
    type: String, 
    required: true,
    trim: true 
  },
  tipo: { 
    type: String, 
    enum: ['PDF', 'IMG', 'DOC'], 
    required: true 
  },
  ruta: { 
    type: String, 
    required: true 
  },
  tamano: { 
    type: Number, 
    required: true 
  },
  fecha_carga: { 
    type: Date, 
    default: Date.now 
  }
});

const ordenCompraSchema = new mongoose.Schema({
  numero: { 
    type: String, 
    required: false,  // Se genera en pre-save, no es obligatorio en input
    unique: true,
    trim: true 
  },
  proveedor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Proveedor", //  Necesario para populate()
    required: true 
  },
  estado: { 
    type: String, 
    required: true,
    enum: ["BORRADOR", "ENVIADA", "RECIBIDA", "CERRADA"],
    default: "BORRADOR"
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  },
  items: { 
    type: [itemSchema], 
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'La orden debe tener al menos un ítem'
    }
  },
  recepciones: { 
    type: Array,
    default: [] 
  },
  adjuntos: {
    type: [adjuntoSchema],
    default: [],
    validate: {
      validator: function(adjuntos) {
        // Máximo 5 adjuntos por orden
        return adjuntos.length <= 5;
      },
      message: 'Máximo 5 adjuntos por orden'
    }
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Método pre-save para generar número automáticamente
ordenCompraSchema.pre('save', async function(next) {
  // Si el número ya existe (actualización), no regenerar
  if (this.numero) {
    return next();
  }
  
  try {
    // Obtener la última orden creada
    const ultimaOrden = await mongoose.model('OrdenCompra').findOne()
      .sort({ createdAt: -1 })
      .lean();
    
    // Generar nuevo número: ORD-000001, ORD-000002, etc.
    let proximoNumero = 1;
    if (ultimaOrden && ultimaOrden.numero) {
      const numeroActual = parseInt(ultimaOrden.numero.split('-')[1]);
      proximoNumero = numeroActual + 1;
    }
    
    this.numero = `ORD-${String(proximoNumero).padStart(6, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("OrdenCompra", ordenCompraSchema);