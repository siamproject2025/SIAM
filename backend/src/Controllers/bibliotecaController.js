// ============================================================
// Controllers/bibliotecaController.js
//
// CAMBIOS vs versión anterior:
// FIX #1 ALTO  — crearLibro guarda campos APA
// FIX #3 MEDIO — nuevo endpoint actualizarLibro (PUT)
//                edita metadatos sin requerir nuevo archivo
// ============================================================
const { google } = require("googleapis");
const { PassThrough } = require("stream");
const path  = require("path");
const Libro = require("../Models/biblioteca");
require("dotenv").config();

// ── Google Drive auth ────────────────────────────────────────
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5000/oauth2callback"
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oAuth2Client });

// ── POST /api/biblioteca — Subir libro ───────────────────────
exports.crearLibro = async (req, res) => {
    try {
        const { v4: uuidv4 } = await import("uuid");

        if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

        const {
            titulo, autor, grado, clase, observacion,
            // FIX #1: campos APA
            autor_corporativo, anio_publicacion, ciudad, editorial, edicion, isbn,
        } = req.body;

        if (!titulo)  return res.status(400).json({ error: "El título es obligatorio" });
        if (!autor)   return res.status(400).json({ error: "El autor es obligatorio" });
        if (!grado)   return res.status(400).json({ error: "El grado es obligatorio" });
        if (!clase)   return res.status(400).json({ error: "La clase es obligatoria" });

        const extension = path.extname(req.file.originalname).replace(".", "").toLowerCase();

        const fileMetadata = {
            name:    `${uuidv4()}-${req.file.originalname}`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        };
        const media = {
            mimeType: req.file.mimetype,
            body: (() => { const s = new PassThrough(); s.end(req.file.buffer); return s; })(),
        };

        const response = await drive.files.create({ requestBody: fileMetadata, media, fields: "id, webViewLink" });

        const libro = new Libro({
            titulo, autor, grado, clase, observacion, extension,
            archivoUrl:    response.data.webViewLink,
            nombreArchivo: fileMetadata.name,
            // FIX #1: guardar campos APA
            autor_corporativo:  autor_corporativo  || '',
            anio_publicacion:   anio_publicacion   ? parseInt(anio_publicacion) : null,
            ciudad:             ciudad             || '',
            editorial:          editorial          || '',
            edicion:            edicion            || '',
            isbn:               isbn               || '',
        });

        await libro.save();
        res.status(201).json(libro);

    } catch (err) {
        console.error("Error al subir libro:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/biblioteca — Listar libros ──────────────────────
exports.obtenerLibros = async (req, res) => {
    try {
        const libros = await Libro.find().sort({ fechaCreacion: -1 });
        res.status(200).json(libros);
    } catch (err) {
        console.error("Error al obtener libros:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── PUT /api/biblioteca/:id — Editar metadatos — FIX #3 ──────
// Si se sube un nuevo archivo, reemplaza el de Drive.
// Si no, solo actualiza los metadatos del documento.
exports.actualizarLibro = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.id);
        if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

        const {
            titulo, autor, grado, clase, observacion,
            autor_corporativo, anio_publicacion, ciudad, editorial, edicion, isbn,
        } = req.body;

        // Actualizar solo los campos que vienen en el body
        if (titulo)  libro.titulo  = titulo;
        if (autor)   libro.autor   = autor;
        if (grado)   libro.grado   = grado;
        if (clase)   libro.clase   = clase;
        if (observacion !== undefined)       libro.observacion   = observacion;
        if (autor_corporativo !== undefined) libro.autor_corporativo = autor_corporativo;
        if (anio_publicacion)                libro.anio_publicacion  = parseInt(anio_publicacion);
        if (ciudad !== undefined)            libro.ciudad            = ciudad;
        if (editorial !== undefined)         libro.editorial         = editorial;
        if (edicion !== undefined)           libro.edicion           = edicion;
        if (isbn !== undefined)              libro.isbn              = isbn;

        // Si viene un nuevo archivo, reemplazarlo en Drive
        if (req.file) {
            // Eliminar archivo anterior
            const fileIdAnterior = libro.archivoUrl?.match(/[-\w]{25,}/)?.[0];
            if (fileIdAnterior) {
                try { await drive.files.delete({ fileId: fileIdAnterior }); } catch(e) {}
            }

            // Subir nuevo archivo
            const { v4: uuidv4 } = await import("uuid");
            const extension = path.extname(req.file.originalname).replace(".", "").toLowerCase();
            const fileMetadata = { name:`${uuidv4()}-${req.file.originalname}`, parents:[process.env.GOOGLE_DRIVE_FOLDER_ID] };
            const media = { mimeType: req.file.mimetype, body: (() => { const s = new PassThrough(); s.end(req.file.buffer); return s; })() };
            const response = await drive.files.create({ requestBody: fileMetadata, media, fields:"id, webViewLink" });
            libro.archivoUrl    = response.data.webViewLink;
            libro.nombreArchivo = fileMetadata.name;
            libro.extension     = extension;
        }

        await libro.save();
        res.status(200).json(libro);

    } catch (err) {
        console.error("Error al actualizar libro:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── DELETE /api/biblioteca/:id — Eliminar libro ──────────────
exports.eliminarLibro = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.id);
        if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

        const fileId = libro.archivoUrl?.match(/[-\w]{25,}/)?.[0];
        if (fileId) { try { await drive.files.delete({ fileId }); } catch(e) {} }

        await libro.deleteOne();
        res.status(200).json({ message: "Libro eliminado correctamente" });

    } catch (err) {
        console.error("Error al eliminar libro:", err);
        res.status(500).json({ error: err.message });
    }
};