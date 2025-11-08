// routes/bienesRoutes.js
const express = require("express");
const { upload } = require('../middleware/uploadImage'); // Multer en memoria
const { authenticateUser } = require('../middleware/authMiddleWare');

const  {
  getBienes,
  getBienById,
  createBien,
  updateBien,
  deleteBien
} = require( "../Controllers/bienesController");

const router = express.Router();
router.use(authenticateUser);
router.get("/", getBienes);
router.get("/:id",getBienById);
router.post("/", upload.single('imagen'), createBien);
router.put("/:id",  upload.single('imagen'),authenticateUser, updateBien);
router.delete("/:id", deleteBien);

module.exports = router;