require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* --------------------------- Middlewares base --------------------------- */
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* --------------------------- Conexión MongoDB --------------------------- */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Falta MONGO_URI en el archivo .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((error) => {
    console.error("❌ Error conectando a MongoDB:", error.message);
    process.exit(1);
  });

/* --------------------------- Import Rutas --------------------------- */
const horarios = require("./routes/Horarios");
const aulas = require("./routes/aulasRoutes");
const alumnos = require("./routes/alumnosRoutes");
const docentes = require("./routes/docentesRoutes");
const ordencompra = require("./routes/ordenCompra");
const bienesRoutes = require("./routes/bienesRoutes");
const usuarios_route = require("./routes/usuario_ruta");
const dashboard_route = require("./routes/dashboard_ruta");
const personalRoutes = require("./routes/personalRoutes");
const donacionesRoutes = require("./routes/donacionesRoutes");
const proveedoresRoutes = require("./routes/proveedoresRoutes");
const actividadesRoutes = require("./routes/actividades");
const biblioteca = require("./routes/bibliotecaRoutes");

// 🚀 NUEVA RUTA GRADOS (corregida minúscula)
const gradosRoutes = require("./routes/gradosRoutes");

/* ------------------------------- Montaje Rutas ------------------------------- */
app.use("/api/horarios", horarios);
app.use("/api/aulas", aulas);
app.use("/api/alumnos", alumnos);
app.use("/api/docentes", docentes);
app.use("/api/ordencompra", ordencompra);
app.use("/api/bienes", bienesRoutes);
app.use("/api/usuarios", usuarios_route);
app.use("/api/dashboard", dashboard_route);
app.use("/api/personal", personalRoutes);
app.use("/api/donaciones", donacionesRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/biblioteca", biblioteca);

// ⬇️ RUTA GRADOS
app.use("/api/grados", gradosRoutes);

/* ------------------------------- Healthcheck ------------------------------- */
app.get("/", (_, res) => res.send("SIAM API OK"));

/* ------------------------------- Error 404 ------------------------------- */
app.use((req, res) => {
  return res.status(404).json({ message: "Recurso no encontrado" });
});

/* ------------------------------- Listen ------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API en puerto ${PORT}`));

