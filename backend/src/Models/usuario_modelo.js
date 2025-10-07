const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  authId: {
    type: String,
    ref: 'User'
  },
  username: {
    type: String,
    required: false,
    unique: true
  },
  email: {
    type: String,
    required: false,
    unique: true
  },
  password_hash: {
    type: String,   // tipo string
    required: false, // no obligatorio
    default: null   // por defecto es null si no se envía
  },
 roles: {
    type: [String],
    enum: ["ADMIN", "DOCENTE", "PADRE"], // Solo estos valores son válidos
    required: false
  },
  intentos_fallidos: {
    type: Number,
    default: 0
  },
  bloqueado_hasta: {
    type: Date,
    default: null
  },
  /*createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }*/
});
/*
// Middleware para actualizar updatedAt antes de guardar
userSchema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = Date.now();
  }
  this.updatedAt = Date.now();
  next();
});*/

const User = mongoose.model('Usuario', userSchema, 'usuarios');

module.exports = User;
