// ============================================================
// Controllers/bibliotecaController.js
//
// CAMBIOS vs versión anterior:
// FIX #1 ALTO  — crearLibro guarda campos APA
// FIX #3 MEDIO — actualizarLibro (PUT) edita metadatos sin
//                requerir nuevo archivo
// AUDITORÍA    — Todos los endpoints registran creado_por,
//                actualizado_por y eliminado_por igual que
//                bienesController.js
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

// ── Función auxiliar: datos del usuario desde el token ───────
const getUserInfo = (req) => {
    const user = req.user;
    if (!user) return { id: "sistema", email: "sistema@escuela.edu" };
    return {
        id:    user._id || user.id || user.sub,
        email: user.email || "sistema@escuela.edu",
    };
};

// ── Función auxiliar: detectar cambios entre dos objetos ─────
const detectarCambiosEspecificos = (objetoAnterior, objetoNuevo) => {
    if (!objetoAnterior || !objetoNuevo) return { cambios: {}, descripcion: "" };

    const camposIgnorar = [
        "_id", "__v",
        "fecha_creacion", "fecha_actualizacion",
        "creado_por", "creado_por_email",
        "actualizado_por", "actualizado_por_email",
        "createdAt", "updatedAt",
    ];

    const cambios = {};
    const todosLosCampos = new Set([
        ...Object.keys(objetoAnterior),
        ...Object.keys(objetoNuevo),
    ]);

    for (const campo of todosLosCampos) {
        if (camposIgnorar.includes(campo)) continue;
        const valorAnterior = objetoAnterior[campo];
        const valorNuevo    = objetoNuevo[campo];
        if (JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo)) {
            cambios[campo] = {
                anterior: valorAnterior ?? "vacío",
                nuevo:    valorNuevo    ?? "vacío",
            };
        }
    }

    const descripcion = Object.keys(cambios)
        .map(campo => {
            const anterior = String(cambios[campo].anterior).substring(0, 50);
            const nuevo    = String(cambios[campo].nuevo).substring(0, 50);
            return `${campo}: "${anterior}" → "${nuevo}"`;
        })
        .join("; ");

    return { cambios, descripcion };
};

// ── POST /api/biblioteca — Subir libro ───────────────────────
exports.crearLibro = async (req, res) => {
    try {
        const { v4: uuidv4 } = await import("uuid");

        if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo" });

        const usuario = getUserInfo(req);
        console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

        const {
            titulo, autor, grado, clase, observacion,
            autor_corporativo, anio_publicacion, ciudad, editorial, edicion, isbn,
        } = req.body;

        if (!titulo) return res.status(400).json({ error: "El título es obligatorio" });
        if (!autor)  return res.status(400).json({ error: "El autor es obligatorio" });
        if (!grado)  return res.status(400).json({ error: "El grado es obligatorio" });
        if (!clase)  return res.status(400).json({ error: "La clase es obligatoria" });

        const extension = path.extname(req.file.originalname).replace(".", "").toLowerCase();

        const fileMetadata = {
            name:    `${uuidv4()}-${req.file.originalname}`,
            parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        };
        const media = {
            mimeType: req.file.mimetype,
            body: (() => { const s = new PassThrough(); s.end(req.file.buffer); return s; })(),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media,
            fields: "id, webViewLink",
        });

        const ahora = new Date();

        const libro = new Libro({
            titulo, autor, grado, clase, observacion, extension,
            archivoUrl:    response.data.webViewLink,
            nombreArchivo: fileMetadata.name,
            // FIX #1: campos APA
            autor_corporativo:  autor_corporativo  || "",
            anio_publicacion:   anio_publicacion   ? parseInt(anio_publicacion) : null,
            ciudad:             ciudad             || "",
            editorial:          editorial          || "",
            edicion:            edicion            || "",
            isbn:               isbn               || "",
            // Auditoría
            creado_por:           usuario.id,
            creado_por_email:     usuario.email,
            fecha_creacion:       ahora,
            actualizado_por:      usuario.id,
            actualizado_por_email: usuario.email,
            fecha_actualizacion:  ahora,
        });

        await libro.save();
        console.log(`✅ Libro creado exitosamente por ${usuario.email}: ${titulo}`);

        res.status(201).json({
            success: true,
            message: "Libro creado exitosamente",
            data: libro,
            audit: {
                creado_por:   usuario.email,
                fecha_creacion: libro.fecha_creacion,
            },
        });

    } catch (err) {
        console.error("❌ Error al subir libro:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/biblioteca — Listar libros ──────────────────────
exports.obtenerLibros = async (req, res) => {
    try {
        const libros = await Libro.find().sort({ fechaCreacion: -1 });
        res.status(200).json(libros);
    } catch (err) {
        console.error("❌ Error al obtener libros:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── PUT /api/biblioteca/:id — Editar metadatos ───────────────
// Si se sube un nuevo archivo, reemplaza el de Drive.
// Si no, solo actualiza los metadatos del documento.
exports.actualizarLibro = async (req, res) => {
    try {
        const usuario = getUserInfo(req);
        console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

        const libroAnterior = await Libro.findById(req.params.id);
        if (!libroAnterior) return res.status(404).json({ error: "Libro no encontrado" });

        const {
            titulo, autor, grado, clase, observacion,
            autor_corporativo, anio_publicacion, ciudad, editorial, edicion, isbn,
        } = req.body;

        // Actualizar solo los campos que vienen en el body
        if (titulo)  libroAnterior.titulo  = titulo;
        if (autor)   libroAnterior.autor   = autor;
        if (grado)   libroAnterior.grado   = grado;
        if (clase)   libroAnterior.clase   = clase;
        if (observacion        !== undefined) libroAnterior.observacion        = observacion;
        if (autor_corporativo  !== undefined) libroAnterior.autor_corporativo  = autor_corporativo;
        if (anio_publicacion)                 libroAnterior.anio_publicacion   = parseInt(anio_publicacion);
        if (ciudad    !== undefined)          libroAnterior.ciudad             = ciudad;
        if (editorial !== undefined)          libroAnterior.editorial          = editorial;
        if (edicion   !== undefined)          libroAnterior.edicion            = edicion;
        if (isbn      !== undefined)          libroAnterior.isbn               = isbn;

        // Si viene un nuevo archivo, reemplazarlo en Drive
        if (req.file) {
            const fileIdAnterior = libroAnterior.archivoUrl?.match(/[-\w]{25,}/)?.[0];
            if (fileIdAnterior) {
                try { await drive.files.delete({ fileId: fileIdAnterior }); } catch (e) {}
            }
            const { v4: uuidv4 } = await import("uuid");
            const extension      = path.extname(req.file.originalname).replace(".", "").toLowerCase();
            const fileMetadata   = { name: `${uuidv4()}-${req.file.originalname}`, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] };
            const media          = { mimeType: req.file.mimetype, body: (() => { const s = new PassThrough(); s.end(req.file.buffer); return s; })() };
            const response       = await drive.files.create({ requestBody: fileMetadata, media, fields: "id, webViewLink" });
            libroAnterior.archivoUrl    = response.data.webViewLink;
            libroAnterior.nombreArchivo = fileMetadata.name;
            libroAnterior.extension     = extension;
        }

        // Detectar cambios para el log
        const libroAnteriorObj = libroAnterior.toObject();
        const { cambios, descripcion } = detectarCambiosEspecificos(libroAnteriorObj, {
            titulo:            libroAnterior.titulo,
            autor:             libroAnterior.autor,
            grado:             libroAnterior.grado,
            clase:             libroAnterior.clase,
            observacion:       libroAnterior.observacion,
            autor_corporativo: libroAnterior.autor_corporativo,
            anio_publicacion:  libroAnterior.anio_publicacion,
            ciudad:            libroAnterior.ciudad,
            editorial:         libroAnterior.editorial,
            edicion:           libroAnterior.edicion,
            isbn:              libroAnterior.isbn,
        });

        if (Object.keys(cambios).length > 0) {
            console.log(`📝 Cambios detectados por ${usuario.email}:`, descripcion);
        } else {
            console.log(`ℹ️ No se detectaron cambios en la actualización por ${usuario.email}`);
        }

        // Auditoría de actualización
        libroAnterior.actualizado_por       = usuario.id;
        libroAnterior.actualizado_por_email = usuario.email;
        libroAnterior.fecha_actualizacion   = new Date();

        await libroAnterior.save();
        console.log(`✅ Libro actualizado exitosamente por ${usuario.email}: ${libroAnterior.titulo}`);

        res.status(200).json({
            success: true,
            message: "Libro actualizado exitosamente",
            data: libroAnterior,
            audit: {
                actualizado_por:      usuario.email,
                fecha_actualizacion:  libroAnterior.fecha_actualizacion,
                cambios_realizados:   Object.keys(cambios).length,
                detalles_cambios:     descripcion || "Sin cambios significativos",
            },
        });

    } catch (err) {
        console.error("❌ Error al actualizar libro:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── DELETE /api/biblioteca/:id — Eliminar libro ──────────────
exports.eliminarLibro = async (req, res) => {
    try {
        console.log("🗑️ Iniciando eliminación de libro...");

        const usuario = getUserInfo(req);
        console.log(`👤 Usuario: ${usuario.email} (${usuario.id})`);

        const libro = await Libro.findById(req.params.id);
        if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

        // Guardar datos relevantes antes de eliminar (para la respuesta de auditoría)
        const datosEliminados = {
            id:           libro._id,
            titulo:       libro.titulo,
            autor:        libro.autor,
            grado:        libro.grado,
            clase:        libro.clase,
            creado_por:   libro.creado_por_email || libro.creado_por,
            fecha_creacion:       libro.fecha_creacion,
            ultima_actualizacion: libro.fecha_actualizacion,
            actualizado_por:      libro.actualizado_por_email,
        };

        console.log(`📋 Libro a eliminar: "${datosEliminados.titulo}" (${datosEliminados.autor})`);
        console.log(`👤 Creado por: ${datosEliminados.creado_por}`);
        console.log(`🗑️ Eliminado por: ${usuario.email}`);

        // Eliminar archivo de Drive
        const fileId = libro.archivoUrl?.match(/[-\w]{25,}/)?.[0];
        if (fileId) { try { await drive.files.delete({ fileId }); } catch (e) {} }

        // Eliminar documento de la BD
        await libro.deleteOne();
        console.log(`✅ Libro eliminado exitosamente por ${usuario.email}`);

        res.status(200).json({
            success: true,
            message: "Libro eliminado correctamente",
            data: {
                id:     req.params.id,
                titulo: datosEliminados.titulo,
                autor:  datosEliminados.autor,
            },
            audit: {
                eliminado_por:    usuario.email,
                fecha_eliminacion: new Date(),
                libro_eliminado:  datosEliminados,
            },
        });

    } catch (err) {
        console.error("❌ Error al eliminar libro:", err);
        res.status(500).json({ error: err.message });
    }
};

// ── GET /api/biblioteca/:id/auditoria — Auditoría de un libro ─
exports.getLibroAuditoria = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.id);
        if (!libro) return res.status(404).json({ error: "Libro no encontrado" });

        const auditoria = {
            id:     libro._id,
            titulo: libro.titulo,
            autor:  libro.autor,
            creado: {
                por:   libro.creado_por_email   || libro.creado_por,
                fecha: libro.fecha_creacion,
            },
            ultima_actualizacion: {
                por:   libro.actualizado_por_email || libro.actualizado_por,
                fecha: libro.fecha_actualizacion,
            },
            historial: {
                fecha_creacion:            libro.fecha_creacion,
                fecha_ultima_modificacion: libro.fecha_actualizacion || libro.fecha_creacion,
            },
        };

        res.status(200).json(auditoria);

    } catch (err) {
        console.error("❌ Error en getLibroAuditoria:", err);
        res.status(500).json({ message: "Error al obtener auditoría del libro", error: err.message });
    }
};