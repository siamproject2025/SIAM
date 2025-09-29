const express = require("express");
const mongoose = require('mongoose');
const path = require("path");
const cors = require('cors');
const app = express();
require("dotenv").config();//llamado del .env
const port = process.env.PORT; //Usa el puerto 5000 en el .env 

app.use(express.json()); // Para poder leer JSON en el body de las solicitudes


// Settings
app.set("port", port);  // Utiliza la variable port definida arriba


// 📌 Rutas organizadas correctamente


// Static Files
// Solo necesitas esta línea para servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, "public")));

// Starting server



app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📌 Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("🚀 Conectado a MongoDB"))
  .catch((error) => console.error("❌ Error conectando a MongoDB:", error));




// 📌 Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando correctamente! 🚀');
});

// 📌 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});