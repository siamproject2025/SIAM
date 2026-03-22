require("dotenv").config();
require("./config/firebaseAdmin");

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors"); // ELIMINADO - No usar cors

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

const app = express();

app.use(express.json());
const allowedOrigins = [
  "http://localhost:3000", // desarrollo
  "https://frontend-production-a861.up.railway.app" // producción
];

app.use(cors({ origin: true }));

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Conectado a MongoDB"))
  .catch(err => console.error(" Error MongoDB:", err));

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir React build
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// Capturar cualquier ruta que no sea API
app.get(/^\/(?!api).*/, (req, res) => {
   res.send("¡Servidor funcionando correctamente! ");
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Servidor corriendo en http://localhost:${PORT}`));