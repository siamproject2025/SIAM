// routes/bienesRoutes.js
const express = require("express");
const  {
  getBienes,
  getBienById,
  createBien,
  updateBien,
  deleteBien
} = require( "../Controllers/bienesController");

const router = express.Router();

router.get("/", getBienes);
router.get("/:id", getBienById);
router.post("/", createBien);
router.put("/:id", updateBien);
router.delete("/:id", deleteBien);

module.exports = router;