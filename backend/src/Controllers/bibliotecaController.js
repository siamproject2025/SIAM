const Libro = require("../Models/biblioteca");

// Obtener todos los libros
exports.obtenerLibros = async (req, res) => {
  try {
    const libros = await Libro.find();

    res.json(
      libros.map((libro) => ({
        _id: libro._id,
        titulo: libro.titulo,
        autor: libro.autor,
        fechaCreacion: libro.fechaCreacion,
      }))
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener libros", error: error.message });
  }
};

// Obtener un libro por ID
exports.obtenerLibro = async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);

    if (!libro) {
      res.status(404).json({ message: "Libro no encontrado" });
    }

    // JSON si el cliente lo acepta (o si no especifica)
    const aceptaJson = req.accepts(["application/json", "json"]);
    if (
      aceptaJson === "application/json" ||
      aceptaJson === "json" ||
      !req.headers["accept"]
    ) {
      return res.json(
        ({ _id, titulo, autor, tipoRecurso, fechaCreacion } = libro)
      );
    }

    // Binarios soportados (PDF/EPUB)
    const tipoAceptado = req.accepts([
      "application/pdf",
      "application/epub+zip",
    ]);

    if (!tipoAceptado) {
      // El cliente no acepta ninguno de los tipos que podemos servir
      return res
        .status(406)
        .json({
          message:
            "Tipo de contenido no aceptable. Use application/json, application/pdf o application/epub+zip",
        });
    }

    if (!libro.tipoRecurso || !libro.recurso) {
      return res
        .status(404)
        .json({ message: "El recurso no fue encontrado para este libro" });
    }

    if (libro.tipoRecurso !== tipoAceptado) {
      return res
        .status(406)
        .json({
          message: "El libro no está disponible en el tipo solicitado",
          disponibleComo: libro.tipoRecurso,
        });
    }

    // Busca y envía el archivo recurso
    const path = require("path");
    const fs = require("fs");

    const baseRuta =
      process.env.RUTA_ARCHIVOS_BIBLIOTECA || "archivos_biblioteca";
    const archivoPath = path.resolve(baseRuta, libro.recurso);

    if (!fs.existsSync(archivoPath)) {
      return res
        .status(404)
        .json({ message: "Archivo no encontrado en el servidor" });
    }

    res.setHeader("Content-Type", libro.tipoRecurso);
    return res.sendFile(archivoPath);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al buscar el libro", error: error.message });
  }
};

// Crear nuevo libro
exports.crearLibro = async (req, res) => {
  try {
    // Obtención de los datos
    const { titulo, autor } = req.body;
    const archivo = req.file.buffer;

    // Guardado del archivo
    const baseRuta =
      process.env.RUTA_ARCHIVOS_BIBLIOTECA || "archivos_biblioteca";
    let extension = "";
    let tipoRecurso = req.file.mimetype;

    // Verificación de si es del tipo MIME soportado
    switch (tipoRecurso) {
      case "application/pdf":
        extension = "pdf";
        break;
      case "application/epub+zip":
        extension = "epub";
        break;
      default:
        res.status(400).json({
          message: "El recurso no es del tipo MIME admitido",
          error: "Tipo de archivo no soportado",
        });
    }

    const { v4: uuidv4 } = require('uuid');
    const recurso = `${uuidv4()}.${extension}`;

    const fs = require("fs");
    const path = require("path");

    const carpetaDestino = path.resolve(baseRuta);

    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    const rutaRecurso = path.join(carpetaDestino, recurso);
    await fs.promises.writeFile(rutaRecurso, archivo);

    // Guarda en la base de datos
    const nuevoLibro = new Libro({ titulo, autor, tipoRecurso, recurso });
    await nuevoLibro.save();

    res.status(201).json({
      _id: nuevoLibro._id,
      titulo: nuevoLibro.titulo,
      autor: nuevoLibro.autor,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al crear el libro", error: error.message });
  }
};

// Actualizar libro
exports.actualizarLibro = async (req, res) => {
  try {
    const { titulo, autor } = req.body;
    const libroActualizado = await Libro.findByIdAndUpdate(
      req.params.id,
      { titulo, autor },
      { new: true, runValidators: true }
    );

    if (!libroActualizado) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    res.json(libroActualizado);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error al actualizar el libro", error: error.message });
  }
};

// Eliminar libro
exports.eliminarLibro = async (req, res) => {
  try {
    const libroEliminado = await Libro.findByIdAndDelete(req.params.id);

    if (!libroEliminado) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    if (libroEliminado.recurso) {
      const fs = require("fs");
      const path = require("path");
      const carpetaDestino = path.resolve(
        process.env.RUTA_ARCHIVOS_BIBLIOTECA || "archivos_biblioteca"
      );
      const rutaArchivo = path.join(carpetaDestino, libroEliminado.recurso);
      fs.unlink(rutaArchivo, (err) => {
        if (err) {
          console.error(
            `Error al eliminar el archivo: ${rutaArchivo}. Error: ${err.message}`
          );
        } else {
          console.log(`Archivo eliminado correctamente: ${rutaArchivo}`);
        }
      });
    }
    res.json({ message: "Libro eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar el libro", error: error.message });
  }
};
