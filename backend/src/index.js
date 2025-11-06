require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");

const app = express();

/* ===================== Config ===================== */
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DBNAME = process.env.MONGO_DBNAME; // opcional

if (!MONGO_URI) {
  console.error("❌ Falta MONGO_URI en el .env");
  process.exit(1);
}

/* ===================== Middlewares base ===================== */
app.set("trust proxy", 1);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(compression());

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CORS (sin app.options con comodines)
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length"],
  })
);

/* ===================== Conexión MongoDB ===================== */
mongoose.set("strictQuery", true);
mongoose
  .connect(MONGO_URI, MONGO_DBNAME ? { dbName: MONGO_DBNAME } : undefined)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((error) => {
    console.error("❌ Error conectando a MongoDB:", error.message);
    process.exit(1);
  });

/* ===================== Import Rutas ===================== */
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
const gradosRoutes = require("./routes/gradosRoutes");

/* ===================== Montaje Rutas ===================== */
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || "development", time: new Date() })
);

app.use("/api/horarios", horarios);
app.use("/api/aulas", aulas);
app.use("/api/alumnos", alumnos);
app.use("/api/docentes", docentes);
app.use("/api/ordencompra", ordencompra);
app.use("/api/bienes", bienesRoutes);
app.use("/api/usuarios", usuarios_route);

// Dashboard
app.use("/api", dashboard_route);

app.use("/api/personal", personalRoutes);
app.use("/api/donaciones", donacionesRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/biblioteca", biblioteca);

// Grados
app.use("/api/grados", gradosRoutes);

/* ===================== Root & 404 ===================== */
app.get("/", (_req, res) => res.send("SIAM API OK"));
app.use((req, res) => {
  res.status(404).json({ message: `Recurso no encontrado: ${req.method} ${req.originalUrl}` });
});

/* ===================== Manejador de errores ===================== */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("💥 Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Error interno del servidor" });
});

/* ===================== Señales ===================== */
process.on("unhandledRejection", (reason) => {
  console.error("🔴 Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception:", err);
});

/* ===================== Listen ===================== */
app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
  console.log(`🌐 CORS permitido para: ${FRONTEND_ORIGIN}`);
});

