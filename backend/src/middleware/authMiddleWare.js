const admin = require('firebase-admin');

var serviceAccount = require("../config/firebase-service-account.json");
// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
}
const Usuario = require('../Models/usuario_modelo'); // tu modelo de usuario

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Trae el usuario completo de MongoDB
    const usuario = await Usuario.findOne({ authId: decodedToken.uid });
    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado' });

    // Coloca todo el usuario en req.user (incluye roles)
    req.user = usuario;

    next();
  } catch (error) {
    console.error('Error al verificar el token:', error.message);
    return res.status(403).json({ message: 'No autorizado. Token inválido o expirado.' });
  }
};


module.exports = { authenticateUser };
