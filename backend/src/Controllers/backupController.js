const { MongoClient } = require("mongodb");
const { EJSON } = require("bson");

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

// ============================================================
// SINGLETON — una sola conexión reutilizada en todos los requests
// ============================================================
let clientInstance = null;

async function getDB() {
  if (!clientInstance) {
    clientInstance = new MongoClient(uri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 120000,   // evita ECONNRESET en escrituras largas
      maxPoolSize: 5,
      retryWrites: true,
      retryReads: true,
    });
    await clientInstance.connect();
    console.log("🔌 [BACKUP] Conexión MongoClient establecida");
  }
  return clientInstance.db();
}

// Inserta documentos en lotes para no saturar la conexión con Atlas
async function insertManyInBatches(db, collectionName, documents, batchSize = 200) {
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    let attempts = 0;
    while (true) {
      try {
        await db.collection(collectionName).insertMany(batch, { ordered: false });
        break;
      } catch (err) {
        attempts++;
        const isRetryable =
          err.code === "ECONNRESET" ||
          err.errorLabelSet?.has("RetryableWriteError") ||
          err.errorLabelSet?.has("ResetPool");
        if (isRetryable && attempts < 3) {
          console.warn(`⚠️  Reintento ${attempts}/3 en ${collectionName} (lote ${i})...`);
          clientInstance = null;
          await new Promise(r => setTimeout(r, 2000 * attempts));
          db = await getDB();
        } else {
          throw err;
        }
      }
    }
  }
}

// ============================================================
// CREAR BACKUP
// ============================================================
exports.crearBackup = async (req, res) => {
  try {
    console.log("📦 [BACKUP] Iniciando...");
    const db = await getDB();
    const collections = await db.listCollections().toArray();

    const backupData = {};
    let totalDocs = 0;

    for (const col of collections) {
      if (col.name.startsWith("system.")) continue;
      const docs = await db.collection(col.name).find({}).toArray();
      backupData[col.name] = EJSON.serialize(docs);
      totalDocs += docs.length;
      console.log(`  ✓ ${col.name}: ${docs.length} documentos`);
    }

    const backupComplete = {
      metadata: {
        version: "2.0",
        timestamp: new Date().toISOString(),
        database: db.databaseName,
        total_documentos: totalDocs,
        colecciones: Object.keys(backupData).length,
      },
      data: backupData,
    };

    const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(Buffer.from(JSON.stringify(backupComplete), "utf-8"));

    console.log(`✅ [BACKUP] Completado: ${totalDocs} documentos`);
  } catch (error) {
    console.error("❌ [BACKUP] Error:", error);
    // Si falló la conexión, resetear el singleton para que el próximo intento reconecte
    clientInstance = null;
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

// ============================================================
// RESTAURAR BACKUP
// ============================================================
exports.restaurarBackup = async (req, res) => {
  console.log("🟢 [RESTORE] Controlador ejecutado");
  console.log("🟢 [RESTORE] req.file existe?", !!req.file);

  if (req.file) {
    console.log("🟢 [RESTORE] Archivo:", req.file.originalname);
    console.log("🟢 [RESTORE] Tamaño:", req.file.size);
  }

  // ── SSE setup ──────────────────────────────────────────
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    if (!req.file) {
      send({ type: "error", message: "No se recibió archivo" });
      return res.end();
    }

    send({ type: "progress", message: "Procesando archivo...", percent: 0 });

    let backupData;
    try {
      backupData = EJSON.parse(req.file.buffer.toString("utf-8"));
    } catch {
      send({ type: "error", message: "El archivo JSON está corrupto o mal formado" });
      return res.end();
    }

    if (!backupData.data || !backupData.metadata) {
      send({ type: "error", message: "Estructura de backup inválida" });
      return res.end();
    }

    const entries = Object.entries(backupData.data).filter(([, docs]) => Array.isArray(docs));
    const total = entries.length;

    send({
      type: "progress",
      message: `Conectando a la base de datos...`,
      percent: 2,
    });

    const db = await getDB();
    const restoredCollections = [];

    for (let i = 0; i < entries.length; i++) {
      const [collectionName, documents] = entries[i];
      const percent = Math.round(((i + 1) / total) * 95) + 2; // 2% → 97%

      send({
        type: "progress",
        message: `Restaurando: ${collectionName} (${documents.length} docs)`,
        percent,
        current: i + 1,
        total,
      });

      await db.collection(collectionName).drop().catch(() => {});
      if (documents.length > 0) {
        await insertManyInBatches(db, collectionName, documents);
      }
      restoredCollections.push({ name: collectionName, documents: documents.length });
      console.log(`  ✓ ${collectionName}: ${documents.length} documentos restaurados`);
    }

    send({
      type: "done",
      message: "Base de datos restaurada exitosamente",
      percent: 100,
      colecciones_restauradas: restoredCollections.length,
      detalles: restoredCollections,
    });

    console.log("✅ [RESTORE] Completado");
  } catch (error) {
    console.error("❌ [RESTORE] Error:", error);
    clientInstance = null;
    send({ type: "error", message: error.message });
  } finally {
    res.end();
  }
};

// ============================================================
// INFORMACIÓN DE LA BASE DE DATOS
// ============================================================
exports.obtenerInfoBackup = async (req, res) => {
  try {
    const db = await getDB();
    const collections = await db.listCollections().toArray();

    const info = [];
    let totalDocs = 0;

    for (const col of collections) {
      if (col.name.startsWith("system.")) continue;
      const count = await db.collection(col.name).countDocuments();
      info.push({ nombre: col.name, documentos: count });
      totalDocs += count;
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      base_datos: db.databaseName,
      total_documentos: totalDocs,
      colecciones: info,
    });
  } catch (error) {
    console.error("❌ [INFO] Error:", error);
    clientInstance = null;
    res.status(500).json({ success: false, error: error.message });
  }
};