const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type:     String,
    required: true,
    lowercase: true,
    trim:     true
  },
  codigo: {
    type:     String,
    required: true
  },
  expira_en: {
    type:    Date,
    required: true,
    index:   { expireAfterSeconds: 0 }   // TTL index — MongoDB lo borra solo
  },
  usado: {
    type:    Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);