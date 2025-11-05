const express = require("express");
const router = express.Router();
const ordenController = require("../Controllers/ordenCompra");

router.post("/", ordenController.crearOrden);
router.get("/", ordenController.obtenerOrdenes);
router.put("/:id", ordenController.actualizarOrden);
router.delete("/:id", ordenController.eliminarOrden);
module.exports = router;