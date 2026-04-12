// seed.js
// Pobla la base de datos con todos los valores que antes estaban
// hardcodeados en cada pantalla del sistema.
// Uso: node seed.js

require("dotenv").config();
const mongoose = require("mongoose");
const Catalogo = require("./Models/Catalogo");
const MONGO_URI = "mongodb+srv://escuelamusica027:zvaNPmKBQ5lkYHa5@cluster0.idsqhtr.mongodb.net/BRAYAN?retryWrites=true&w=majority&appName=Cluster0";

// ── Datos semilla ─────────────────────────────────────────────
const SEED = [

  // ════════════════════════════════════════════════════════════
  // MATRÍCULA
  // ════════════════════════════════════════════════════════════
  // parentesco_encargado
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Padre",        orden: 1 },
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Madre",        orden: 2 },
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Tutor Legal",  orden: 3 },
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Abuelo/a",     orden: 4 },
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Tío/a",        orden: 5 },
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Hermano/a",    orden: 6 },
  { modulo: "matricula", tipo: "parentesco_encargado", valor: "Otro",         orden: 7 },

  // tipo_documento
  { modulo: "matricula", tipo: "tipo_documento", valor: "identidad",       etiqueta: "Identidad",        orden: 1 },
  { modulo: "matricula", tipo: "tipo_documento", valor: "pasaporte",       etiqueta: "Pasaporte",        orden: 2 },
  { modulo: "matricula", tipo: "tipo_documento", valor: "partida_nacimiento", etiqueta: "Partida de Nacimiento", orden: 3 },
  { modulo: "matricula", tipo: "tipo_documento", valor: "rtn",             etiqueta: "RTN",              orden: 4 },

  // ════════════════════════════════════════════════════════════
  // PERSONAL
  // ════════════════════════════════════════════════════════════
  // tipo_contrato
  { modulo: "personal", tipo: "tipo_contrato", valor: "TIEMPO_COMPLETO",  etiqueta: "Tiempo Completo",  orden: 1 },
  { modulo: "personal", tipo: "tipo_contrato", valor: "MEDIO_TIEMPO",     etiqueta: "Medio Tiempo",     orden: 2 },
  { modulo: "personal", tipo: "tipo_contrato", valor: "POR_HORA",         etiqueta: "Por Hora",         orden: 3 },
  { modulo: "personal", tipo: "tipo_contrato", valor: "TEMPORAL",         etiqueta: "Temporal",         orden: 4 },
  { modulo: "personal", tipo: "tipo_contrato", valor: "PASANTIA",         etiqueta: "Pasantía",         orden: 5 },

  // area_trabajo
  { modulo: "personal", tipo: "area_trabajo", valor: "Dirección",         orden: 1 },
  { modulo: "personal", tipo: "area_trabajo", valor: "Docencia",          orden: 2 },
  { modulo: "personal", tipo: "area_trabajo", valor: "Administración",    orden: 3 },
  { modulo: "personal", tipo: "area_trabajo", valor: "Secretaría",        orden: 4 },
  { modulo: "personal", tipo: "area_trabajo", valor: "Consejería",        orden: 5 },
  { modulo: "personal", tipo: "area_trabajo", valor: "Mantenimiento",     orden: 6 },
  { modulo: "personal", tipo: "area_trabajo", valor: "Seguridad",         orden: 7 },

  // cargo (cargo_asignacion)
  { modulo: "personal", tipo: "cargo", valor: "DOCENTE",        etiqueta: "Docente",         orden: 1 },
  { modulo: "personal", tipo: "cargo", valor: "DIRECTOR",       etiqueta: "Director/a",      orden: 2 },
  { modulo: "personal", tipo: "cargo", valor: "SUBDIRECTOR",    etiqueta: "Subdirector/a",   orden: 3 },
  { modulo: "personal", tipo: "cargo", valor: "ADMINISTRATIVO", etiqueta: "Administrativo/a",orden: 4 },
  { modulo: "personal", tipo: "cargo", valor: "SECRETARIO",     etiqueta: "Secretario/a",    orden: 5 },
  { modulo: "personal", tipo: "cargo", valor: "CONSEJERO",      etiqueta: "Consejero/a",     orden: 6 },
  { modulo: "personal", tipo: "cargo", valor: "CONSERJE",       etiqueta: "Conserje",        orden: 7 },

  // horario_preferido
  { modulo: "personal", tipo: "horario_preferido", valor: "MATUTINO",   etiqueta: "Matutino",   orden: 1 },
  { modulo: "personal", tipo: "horario_preferido", valor: "VESPERTINO", etiqueta: "Vespertino", orden: 2 },
  { modulo: "personal", tipo: "horario_preferido", valor: "NOCTURNO",   etiqueta: "Nocturno",   orden: 3 },
  { modulo: "personal", tipo: "horario_preferido", valor: "MIXTO",      etiqueta: "Mixto",      orden: 4 },

  // ════════════════════════════════════════════════════════════
  // DONACIONES
  // ════════════════════════════════════════════════════════════
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Alimentos",      orden: 1 },
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Ropa",           orden: 2 },
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Útiles",         orden: 3 },
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Medicamentos",   orden: 4 },
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Equipos",        orden: 5 },
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Dinero",         orden: 6 },
  { modulo: "donaciones", tipo: "tipo_donacion", valor: "Otros",          orden: 7 },

  // ════════════════════════════════════════════════════════════
  // BIENES
  // ════════════════════════════════════════════════════════════
  // categoria
  { modulo: "bienes", tipo: "categoria", valor: "EQUIPO_COMPUTO",    etiqueta: "Equipo de Cómputo",  orden: 1 },
  { modulo: "bienes", tipo: "categoria", valor: "MOBILIARIO",        etiqueta: "Mobiliario",         orden: 2 },
  { modulo: "bienes", tipo: "categoria", valor: "ELECTRODOMESTICO",  etiqueta: "Electrodoméstico",   orden: 3 },
  { modulo: "bienes", tipo: "categoria", valor: "VEHICULO",          etiqueta: "Vehículo",           orden: 4 },
  { modulo: "bienes", tipo: "categoria", valor: "HERRAMIENTA",       etiqueta: "Herramienta",        orden: 5 },
  { modulo: "bienes", tipo: "categoria", valor: "MATERIAL_DIDACTICO",etiqueta: "Material Didáctico", orden: 6 },
  { modulo: "bienes", tipo: "categoria", valor: "INFRAESTRUCTURA",   etiqueta: "Infraestructura",    orden: 7 },
  { modulo: "bienes", tipo: "categoria", valor: "OTRO",              etiqueta: "Otro",               orden: 8 },

  // tipo_asignacion
  { modulo: "bienes", tipo: "tipo_asignacion", valor: "Persona",      orden: 1 },
  { modulo: "bienes", tipo: "tipo_asignacion", valor: "Área",         orden: 2 },
  { modulo: "bienes", tipo: "tipo_asignacion", valor: "Aula",         orden: 3 },
  { modulo: "bienes", tipo: "tipo_asignacion", valor: "Sin asignar",  orden: 4 },

  // ════════════════════════════════════════════════════════════
  // DIRECTIVA
  // ════════════════════════════════════════════════════════════
  { modulo: "directiva", tipo: "cargo", valor: "Presidente",    orden: 1 },
  { modulo: "directiva", tipo: "cargo", valor: "Vicepresidente",orden: 2 },
  { modulo: "directiva", tipo: "cargo", valor: "Secretario/a",  orden: 3 },
  { modulo: "directiva", tipo: "cargo", valor: "Tesorero",      orden: 4 },
  { modulo: "directiva", tipo: "cargo", valor: "Vocal",         orden: 5 },
  { modulo: "directiva", tipo: "cargo", valor: "Fiscal",        orden: 6 },

  // ════════════════════════════════════════════════════════════
  // HORARIOS
  // ════════════════════════════════════════════════════════════
  { modulo: "horarios", tipo: "asignatura", valor: "Matemáticas",         orden: 1 },
  { modulo: "horarios", tipo: "asignatura", valor: "Español",             orden: 2 },
  { modulo: "horarios", tipo: "asignatura", valor: "Ciencias Naturales",  orden: 3 },
  { modulo: "horarios", tipo: "asignatura", valor: "Ciencias Sociales",   orden: 4 },
  { modulo: "horarios", tipo: "asignatura", valor: "Inglés",              orden: 5 },
  { modulo: "horarios", tipo: "asignatura", valor: "Educación Física",    orden: 6 },
  { modulo: "horarios", tipo: "asignatura", valor: "Arte",                orden: 7 },
  { modulo: "horarios", tipo: "asignatura", valor: "Tecnología",          orden: 8 },
  { modulo: "horarios", tipo: "asignatura", valor: "Religión",            orden: 9 },
  { modulo: "horarios", tipo: "asignatura", valor: "Música",              orden: 10 },
];


async function seed() {
  if (!MONGO_URI) {
    console.error("❌ Error: No se encontró la variable MONGO_URI en el archivo .env");
    return;
  }

  try {
    // Usamos la configuración de conexión que te funcionó antes
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB conectado exitosamente");

    const insertados = await Catalogo.insertMany(SEED, { ordered: false });
    console.log(`🌱  ${insertados.length} registros insertados`);

    // Resumen por módulo
    const resumen = insertados.reduce((acc, item) => {
      acc[item.modulo] = (acc[item.modulo] || 0) + 1;
      return acc;
    }, {});
    console.table(resumen);

  } catch (e) {
    console.error("❌  Error en seed:", e.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌  MongoDB desconectado");
  }
}

seed();