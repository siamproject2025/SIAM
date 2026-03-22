const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  authId:          { type: String, ref: 'User' },
  username:        { type: String, required: false, unique: true },
  email:           { type: String, required: false, unique: true },
  password_hash:   { type: String, required: false, default: null },
  roles:           { type: [String], required: false },
  debe_cambiar_password: {
  type: Boolean,
  default: false
},
  // ✅ NUEVO — para bloquear desde panel admin
  estado: {
    type: String,
    enum: ['ACTIVO', 'BLOQUEADO'],
    default: 'ACTIVO'
  },
  intentos_fallidos: { type: Number, default: 0 },
  bloqueado_hasta:   { type: Date, default: null }
});

const User = mongoose.model('Usuario', userSchema, 'usuarios');
module.exports = User;