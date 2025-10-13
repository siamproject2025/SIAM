require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const path = require("path");
const cors = require('cors');

const ordencompra = require('./Routes/ordenCompra'); 
const bienesRoutes = require( "./routes/bienesRoutes");
const usuarios_route = require('./Routes/usuario_ruta'); 
const dashboard_route = require('./Routes/dashboard_ruta'); 
const actividadesRoutes = require("./Routes/actividades");


const app = express();


app.use(express.json()); // Para poder leer JSON en el body de las solicitudes
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

// 📌 Rutas organizadas correctamente
app.use('/api/compras',ordencompra);
app.use("/api/bienes", bienesRoutes);
app.use('/api/',usuarios_route);
app.use('/api/',dashboard_route);
app.use("/api/actividades", actividadesRoutes);


// 📌 Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('¡Servidor funcionando correctamente! 🚀');
});


// 📌 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});





// Static Files
// Solo necesitas esta línea para servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, "public")));

// Starting server







