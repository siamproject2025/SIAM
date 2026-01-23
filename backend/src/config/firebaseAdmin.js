// backend/src/config/firebaseAdmin.js
const admin = require('firebase-admin');

// Opción robusta: Parsear el JSON entero si la variable existe
let serviceAccount;
if (process.env.GOOGLE_CREDENTIALS) {
    serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} else {
    // Tu método actual
    serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        // ...
        private_key: process.env.FIREBASE_PRIVATE_KEY 
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
            : undefined,
        // ...
    };
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
module.exports = admin;