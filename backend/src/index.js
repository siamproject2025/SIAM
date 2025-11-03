require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

/* ============================
   SHIM REFORZADO app.use()
   - valida y reemplaza handlers inválidos (incluye arrays) para NO crashear
=============================*/
const __originalUse = app.use.bind(app);
function toArray(x){ return Array.isArray(x) ? x : [x]; }
function sanitizeHandlers(handlers, where, mountPath){
  const flat = handlers.flat(Infinity);
  return flat.map((h,i)=>{
    if(typeof h !== "function"){
      console.error(`❌ Handler inválido en app.use(${mountPath}) -> ${where} (índice ${i}) tipo=${typeof h}`);
      return (req,res)=>res.status(501).json({
        error:`Handler no implementado en app.use(${mountPath})`,
        indice:i, tipo:typeof h, donde:where
      });
    }
    return h;
  });
}
app.use = function(...args){
  if(args.length===0) return __originalUse();
  if(typeof args[0]==="string"){
    const mountPath = args[0];
    const rest = args.slice(1);
    const handlers = rest.length ? rest : [undefined];
    const safe = sanitizeHandlers(handlers, "handlers", mountPath);
    return __originalUse(mountPath, ...safe);
  }else{
    const middlewares = toArray(args[0]).concat(args.slice(1));
    const safe = sanitizeHandlers(middlewares, "middlewares", "(no-path)");
    return __originalUse(...safe);
  }
};

/* ============================
   PARCHE express.Router()
   - detecta y reemplaza handlers inválidos en .get/.post/... y .use
=============================*/
const expressPkg = require("express");
const _Router = expressPkg.Router;

expressPkg.Router = function(...args){
  const r = _Router(...args);

  const wrap = (verb, routePath, handlers, origin, isUse=false)=>
    handlers.map((h,i)=>{
      if(typeof h!=="function"){
        const where = isUse ? "Router.use" : `Router.${verb.toUpperCase()}`;
        console.error(`❌ Handler inválido en ${where} ${routePath} (índice ${i}) dentro de: ${origin}`);
        return (req,res)=>res.status(501).json({
          error:`Handler no implementado (índice ${i}) en ${where} ${routePath}`,
          archivo: origin
        });
      }
      return h;
    });

  const methods = ["get","post","put","delete","patch","all"];
  methods.forEach(m=>{
    const orig = r[m].bind(r);
    r[m] = (routePath, ...handlers)=>{
      const origin = (module.parent && module.parent.filename) || "(archivo desconocido)";
      return orig(routePath, ...wrap(m, routePath, handlers, origin, false));
    };
  });

  const origUse = r.use.bind(r);
  r.use = (pathOrFn, ...handlers)=>{
    const origin = (module.parent && module.parent.filename) || "(archivo desconocido)";
    if(typeof pathOrFn === "function"){
      return origUse(...wrap("use", "(no-path)", [pathOrFn], origin, true));
    }else{
      const p = pathOrFn || "(no-path)";
      return origUse(p, ...wrap("use", p, handlers, origin, true));
    }
  };

  return r;
};

/* ============================
   REQUIRES DE RUTAS (después del parche)
=============================*/
const horarios = require("./Routes/Horarios");
const aulas = require("./Routes/aulasRoutes");
const alumnos = require("./Routes/alumnosRoutes");
const docentes = require("./Routes/docentesRoutes");
const ordencompra = require("./Routes/ordenCompra");
const bienesRoutes = require("./Routes/bienesRoutes");
const usuarios_route = require("./Routes/usuario_ruta");
const dashboard_route = require("./Routes/dashboard_ruta");
const personalRoutes = require("./Routes/personalRoutes");
const donacionesRoutes = require("./Routes/donacionesRoutes");
const proveedoresRoutes = require("./Routes/proveedoresRoutes");
const actividadesRoutes = require("./Routes/actividades");
const biblioteca = require("./Routes/bibliotecaRoutes");
const gradoGestionRoutes = require("./Routes/gradoGestionRoutes");

// Diagnóstico: confirmar que cada require es un router (function)
const routers = { horarios,aulas,alumnos,docentes,ordencompra,bienesRoutes,usuarios_route,
  dashboard_route,personalRoutes,donacionesRoutes,proveedoresRoutes,actividadesRoutes,
  biblioteca,gradoGestionRoutes };
Object.entries(routers).forEach(([k,v])=>console.log(`[ROUTER CHECK] ${k}: typeof ->`, typeof v));

/* ============================
   MIDDLEWARES BASE
=============================*/
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET","POST","PUT","DELETE"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

/* ============================
   MONGODB
=============================*/
mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser:true,
  useUnifiedTopology:true
})
.then(()=>console.log("🚀 Conectado a MongoDB"))
.catch(err=>console.error("❌ Error conectando a MongoDB:", err))
.finally(()=>console.log("✅ Conectado."));

/* ============================
   RUTAS (las tuyas, tal cual)
=============================*/
console.log("🚀 Conectando con rutas.");
app.use("/api/compras", ordencompra);
app.use("/api/bienes", bienesRoutes);
app.use("/api/", usuarios_route);
app.use("/api/", dashboard_route);
app.use("/api/horario", horarios);
app.use("/api/aula", aulas);
app.use("/api/alumno", alumnos);
app.use("/api/docente", docentes);

app.use("/api/", usuarios_route);
app.use("/api/", dashboard_route);

app.use("/api/personal", personalRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/donaciones", donacionesRoutes);

app.use("/api/horarios", horarios);
app.use("/api/actividades", actividadesRoutes);
app.use("/api/horarios", horarios);
app.use("/api/biblioteca", biblioteca);
app.use("/api/grados", gradoGestionRoutes);

app.use("/uploads", express.static(path.join(__dirname,"uploads")));
console.log("✅ Conectado.");

/* ============================
   RUTA DE PRUEBA
=============================*/
app.get("/", (req,res)=> res.send("¡Servidor funcionando correctamente! 🚀"));
console.log("✅ Conectado.");

/* ============================
   INICIAR SERVER
=============================*/
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));

// Static files
app.use(express.static(path.join(__dirname,"public")));

