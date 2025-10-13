const Libro = require("../Models/biblioteca");

// Obtener todos los libros
exports.obtenerLibros = async (req, res) => {
  try {
    if (
      req.headers["content-type"] &&
      req.headers["content-type"].indexOf("application/json") === -1
    ) {
      return res
        .status(400)
        .json({ message: "El content-type debe ser application/json" });
    }

    const libros = await Libro.find();

    res.json(libros);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener libros", error: error.message });
  }
};

// Obtener un libro por ID
exports.obtenerLibroPorId = async (req, res) => {
  try {
    const libro = await Libro.findById(req.params.id);
    if (!libro) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }
    res.json(libro);
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
    let tipoRecurso = "";

    // Verificación de si es 
    if (req.file.mimetype === "application/pdf") {
      tipoRecurso = "pdf";
    } else if (req.file.mimetype === "application/epub+zip") {
      tipoRecurso = "epub";
    } else {
      return res.status(400).json({ message: "El recurso no es del tipo MIME admitido", error: "Tipo de archivo no soportado" });
    }

    
    const archivoNombre = `${titulo}-${autor}-${Date.now().toString()}.${tipoRecurso}`;

    const fs = require("fs");
    const path = require("path");

    const carpetaDestino = path.resolve(baseRuta);

    if (!fs.existsSync(carpetaDestino)) {
      fs.mkdirSync(carpetaDestino, { recursive: true });
    }

    const rutaRecurso = path.join(carpetaDestino, archivoNombre);
    await fs.promises.writeFile(rutaRecurso, archivo);

    // Guarda en la base de datos
    const nuevoLibro = new Libro({ titulo, autor, tipoRecurso, rutaRecurso });
    await nuevoLibro.save();

    res.status(201).json({ _id: nuevoLibro._id, titulo: nuevoLibro.titulo, autor: nuevoLibro.autor });
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

    if (libroEliminado.rutaRecurso) {
      const fs = require("fs");
      fs.unlink(libroEliminado.rutaRecurso, (err) => {
        console.error(`Error al eliminar el libro: ${err.message}`)
      });
    }
    res.json({ message: "Libro eliminado correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar el libro", error: error.message });
  }
};
