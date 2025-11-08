const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/authMiddleWare');

const { obtenerDocente, obtenerDocentes, crearDocente} = require("../Controllers/docentesController");

router.use(authenticateUser);
router.get('/', obtenerDocentes);
router.get('/:id', obtenerDocente);
router.post("/", crearDocente);

module.exports = router;