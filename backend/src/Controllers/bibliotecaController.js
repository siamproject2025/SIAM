const { google } = require("googleapis");
const { PassThrough } = require("stream");
const path = require("path");
const Libro = require("../Models/biblioteca");
require("dotenv").config();

// Configuración de OAuth2 para Google Drive
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/oauth2callback"
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: "v3", auth: oAuth2Client });

/**
 * ✅ SUBIR LIBRO A GOOGLE DRIVE
 */
exports.crearLibro = async (req, res) => {
  try {
    // Import dinámico compatible con CommonJS (soluciona el error de uuid)
    const { v4: uuidv4 } = await import("uuid");

    const { titulo, autor } = req.body;
    if (!req.file)
      return res.status(400).json({ error: "No se subió ningún archivo" });

    const extension = path
      .extname(req.file.originalname)
      .replace(".", "")
      .toLowerCase();

    const fileMetadata = {
      name: `${uuidv4()}-${req.file.originalname}`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // ID de la carpeta destino
    };

    const media = {
      mimeType: req.file.mimetype,
      body: (() => {
        const stream = new PassThrough();
        stream.end(req.file.buffer);
        return stream;
      })(),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink",
    });

    const libro = new Libro({
      titulo,
      autor,
      extension,
      archivoUrl: response.data.webViewLink,
      nombreArchivo: fileMetadata.name,
    });

    await libro.save();
    res.status(201).json(libro);
  } catch (error) {
    console.error("Error al subir libro a Drive:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ OBTENER LISTA DE LIBROS
 */
exports.obtenerLibros = async (req, res) => {
  try {
    const libros = await Libro.find().sort({ createdAt: -1 }); // últimos primero
    res.status(200).json(libros);
  } catch (error) {
    console.error("Error al obtener libros:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ✅ ELIMINAR LIBRO (Drive + MongoDB)
 */
exports.eliminarLibro = async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro)
      return res.status(404).json({ error: "Libro no encontrado" });

    // Eliminar del Drive si existe
    const fileId = libro.archivoUrl?.match(/[-\w]{25,}/)?.[0];
    if (fileId) {
      await drive.files.delete({ fileId });
    }

    await libro.deleteOne();
    res.status(200).json({ message: "Libro se ha eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar libro:", error);
    res.status(500).json({ error: error.message });
  }
};
