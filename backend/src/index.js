require("dotenv").config();
require("./config/firebaseAdmin");

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

// ========== IMPORTAR TODAS LAS RUTAS ==========
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
const rolRoutes = require("./Routes/rol_routes"); 
const authRoutes = require("./Routes/authRoutes");
const audit = require("./Routes/auditControlRoutes");
const resetRoutes = require('./Routes/reset_password_routes');
const backupRoutes = require("./Routes/backup");
const parametros = require("./Routes/Parametros.routes");
const catalogoRoutes = require("./Routes/catalogoRoutes");
 

const app = express();

// ========== MIDDLEWARE: CONEXIÓN MONGODB ==========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error MongoDB:", err));

// ========== MIDDLEWARE CORS ==========
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Orden-Data');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ========== MIDDLEWARE: JSON PARSER (EXCLUYE RUTAS DE UPLOAD) ==========
app.use((req, res, next) => {
  if (req.path.startsWith('/api/backup/restaurar')) {
    console.log(`⏭️  Saltando JSON parser para: ${req.method} ${req.path}`);
    return next();
  }
  express.json({ limit: '500mb' })(req, res, next);
});

// ========== MIDDLEWARE: URL ENCODED (EXCLUYE RUTAS DE UPLOAD) ==========
app.use((req, res, next) => {
  if (req.path.startsWith('/api/backup/restaurar')) {
    return next();
  }
  express.urlencoded({ limit: '500mb', extended: true })(req, res, next);
});

// ========== MIDDLEWARE: FILE UPLOAD (EXCLUYE RUTAS DE BACKUP Y COMPRAS) ==========
// express-fileupload NO debe procesar /api/backup porque esa ruta usa multer.
// express-fileupload NO debe procesar /api/compras porque esa ruta usa multer en uploadAdjuntos.
// Si ambos middlewares intentan consumir el stream multipart al mismo tiempo,
// multer recibe el stream vacío y lanza "Unexpected end of form".
// ========== MIDDLEWARE: FILE UPLOAD ==========
/*const fileUpload = require("express-fileupload");

// Middleware condicional para fileUpload
app.use((req, res, next) => {
  // Excluir TODAS las rutas de backup del fileUpload
  if (req.path.startsWith('/api/backup')) {
    console.log(`⏭️  Saltando fileUpload para: ${req.method} ${req.path}`);
    return next();
  }
  
  // Aplicar fileUpload solo a rutas que NO son backup
  fileUpload({
    limits: { fileSize: 500 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: '/tmp/'
  })(req, res, next);
});*/

// ========== RUTAS API ==========
// ⭐ RUTA DE BACKUP PRIMERO (antes de cualquier otro middleware)
app.use("/api/backup", backupRoutes);

// Resto de rutas
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
app.use("/api/parametros", parametros);
app.use("/api/catalogos", catalogoRoutes);
// ========== ARCHIVOS ESTÁTICOS ==========
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Servir React build
app.use(express.static(path.join(__dirname, "../../frontend/build")));

// ========== RUTA FALLBACK ==========
app.get(/^\/(?!api).*/, (req, res) => {
   res.send("¡Servidor funcionando correctamente!");
});

// ========== INICIAR SERVIDOR ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));