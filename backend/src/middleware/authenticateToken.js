const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../config/firebase-service-account.json')),
});

// Middleware para verificar el token
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);  // Verificar el token con Firebase Admin SDK
    req.user = decodedToken;  // Almacenar los datos del usuario decodificados
    next();  // Continuar con la solicitud
  } catch (error) {
    res.status(401).json({ message: 'Token no válido o expirado' });
  }
};

module.exports = authenticateUser;
