const express = require("express");
const router = express.Router();
const multer = require("multer");
const backupController = require("../Controllers/backupController");

console.log("✅ Rutas de backup cargadas");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// POST /api/backup/restaurar - IMPORTANTE: Multer ANTES que el controlador
router.post("/restaurar", upload.single("backupFile"), backupController.restaurarBackup);

// GET endpoints
router.get("/crear", backupController.crearBackup);
router.get("/info", backupController.obtenerInfoBackup);

module.exports = router;