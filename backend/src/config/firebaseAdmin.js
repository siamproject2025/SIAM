// backend/src/config/firebaseAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // tu JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
