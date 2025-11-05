require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// Rutas
const horarios = require("./Routes/Horarios");
const aulas = require("./Routes/aulasRoutes");
const alumnos = require("./Routes/alumnosRoutes");
const docentes = require("./Routes/docentesRoutes");
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

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// Conexión MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 Conectado a MongoDB"))
  .catch(err => console.error("❌ Error MongoDB:", err));

// Rutas API
app.use("/api/compras", ordencompra);
app.use("/api/bienes", bienesRoutes);
app.use("/api/usuarios", usuarios_route);
app.use("/api/dashboard", dashboard_route);
app.use("/api/horarios", horarios);
app.use("/api/aulas", aulas);
app.use("/api/alumnos", alumnos);
app.use("/api/docentes", docentes);
app.use("/api/directiva", directivaRoutes);
app.use("/api/personal", personalRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/donaciones", donacionesRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/biblioteca", biblioteca);
app.use("/api/questions", question);
app.use("/api/matriculas", matriculas);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir React build
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Capturar cualquier ruta que no sea API
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));
