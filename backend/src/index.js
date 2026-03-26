require("dotenv").config();
require("./config/firebaseAdmin");

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// NO importes cors - const cors = require("cors"); - COMENTADO

// Rutas
const horarios = require("./Routes/Horarios");
const ordencompra = require('./Routes/ordenCompra'); 
const bienesRoutes = require("./Routes/bienesRoutes");
const usuarios_route = require('./Routes/usuario_ruta'); 
const dashboard_route = require('./Routes/dashboard_ruta'); 
const personalRoutes = require('./Routes/personalRoutes'); 
const donacionesRoutes = require('./Routes/donacionesRoutes');
const proveedoresRoutes = require('./Routes/proveedoresRoutes');
const actividadesRoutes = require("./Routes/actividades");
const biblioteca = require("./Routes/bibliotecaRoutes");
const directivaRoutes = require("./Routes/directivaRoutes");
const question = require("./Routes/questionRoutes");
const matriculas = require("./Routes/matriculas");
const gradosRoutes = require("./Routes/gradosRoutes");
const bitacora = require("./Routes/auditoriaRoutes");
const Rol = require("./Models/Rol");
const rolRoutes = require("./Routes/rol_routes"); 
const authRoutes = require("./Routes/authRoutes");
const audit = require("./Routes/auditControlRoutes");
const resetRoutes = require('./Routes/reset_password_routes');


const app = express();

app.use(express.json());

// MIDDLEWARE CORS MANUAL - SIN NINGUNA RESTRICCIÓN
app.use((req, res, next) => {
  // Permite absolutamente cualquier origen
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Manejar preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error MongoDB:", err));

const cors = require("cors");

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sin origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    // Permite cualquier dominio
    return callback(null, true);
  },
  credentials: true
}));
// Rutas API
app.use("/api/compras", ordencompra);
app.use("/api/bienes", bienesRoutes);
app.use("/api/", usuarios_route);
app.use("/api/", dashboard_route);
app.use("/api/horario", horarios);
app.use("/api/directiva", directivaRoutes);
app.use("/api/personal", personalRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/donaciones", donacionesRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/biblioteca", biblioteca);
app.use("/api/questions", question);
app.use("/api/matriculas", matriculas);
app.use("/api/grados", gradosRoutes);
app.use("/api/auditoria", bitacora);
app.use("/api/", rolRoutes);
app.use("/api/", authRoutes);
app.use("/api/", audit);
app.use('/api', resetRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir React build
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Capturar cualquier ruta que no sea API
app.get(/^\/(?!api).*/, (req, res) => {
   res.send("¡Servidor funcionando correctamente!");
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));