const admin = require('firebase-admin');

var serviceAccount = require("../config/firebase-service-account.json");
// Inicializar Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
}

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Adjuntar la información del usuario al objeto de la solicitud
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || 'Usuario',
    };

    next(); // Continuar con la siguiente función de middleware o ruta
  } catch (error) {
    console.error('Error al verificar el token:', error.message);
    return res.status(403).json({ message: 'No autorizado. Token inválido o expirado.' });
  }
};

module.exports = { authenticateUser };
