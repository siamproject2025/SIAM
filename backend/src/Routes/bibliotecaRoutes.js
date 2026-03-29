// Routes/biblioteca.js — FIX #3: agrega ruta PUT /:id
const express = require("express");
const router  = express.Router();
const multer  = require("multer");
const ctrl    = require("../Controllers/bibliotecaController");
const { registrarAuditoria, capturarDatosPrevios } = require('../middleware/auditoriaMiddleware');
const Modelo  = require("../Models/biblioteca");
const { authenticateUser }  = require('../middleware/authMiddleWare');
const { checkPermission }   = require('../middleware/checkPermission');

const storage = multer.memoryStorage();
const upload  = multer({ storage });

router.use(authenticateUser);

// GET: Listar libros
router.get("/", ctrl.obtenerLibros);

// POST: Subir libro (con campos APA)
router.post("/",
    upload.single("archivo"),
    checkPermission('CREAR_BIBLIOTECA'),
    registrarAuditoria('BIBLIOTECA'),
    ctrl.crearLibro
);

// PUT: Editar metadatos (con o sin nuevo archivo) — FIX #3
router.put("/:id",
    upload.single("archivo"),
    checkPermission('CREAR_BIBLIOTECA'),
    capturarDatosPrevios(Modelo),
    registrarAuditoria('BIBLIOTECA'),
    ctrl.actualizarLibro
);

// DELETE: Eliminar libro
router.delete("/:id",
    checkPermission('ELIMINAR_BIBLIOTECA'),
    capturarDatosPrevios(Modelo),
    registrarAuditoria('BIBLIOTECA'),
    ctrl.eliminarLibro
);

module.exports = router;