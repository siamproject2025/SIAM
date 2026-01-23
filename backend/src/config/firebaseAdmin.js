// backend/src/config/firebaseAdmin.js
const admin = require('firebase-admin');
require('dotenv').config(); // Asegúrate de llamar a config() aquí

let serviceAccount;

if (process.env.GOOGLE_CREDENTIALS) {
    try {
        serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        // Esto es vital: convierte los \n del string en saltos de línea reales
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    } catch (error) {
        console.error("Error al parsear el JSON de Google Credentials:", error);
    }
}

if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;