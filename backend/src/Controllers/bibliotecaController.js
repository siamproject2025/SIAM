const biblioteca = require('../Models/biblioteca');

exports.crearBiblioteca = async (req, res) => {
  //
  const { titulo, autor} = req.body;
  const biblioteca = new biblioteca({ titulo, autor});
  res.status(201).json(biblioteca);
};

exports.crearArchivoBiblioteca = async (req, res) => {
    const { id } = req.params;

    // Validar archivo adjunto
    if (!req.file) {
        return res.status(400).json({ message: "No se ha enviado ningún archivo." });
    }

    try {
        // Encontrar el libro por id
        const libro = await biblioteca.findById(id);
        if (!libro) {
            return res.status(404).json({ message: "Biblioteca no encontrada." });
        }

        // La ruta base del archivo está en una variable de entorno y el nombre dependerá del tipo MIME enviado
        const baseRuta = process.env.RUTA_ARCHIVOS_BIBLIOTECA || "archivos_biblioteca";
        let extension = '';
        if (req.file.mimetype === 'application/pdf') {
            extension = 'pdf';
        } else if (req.file.mimetype === 'application/epub+zip') {
            extension = 'epub';
        } else {
            extension = req.file.originalname.split('.').pop().toLowerCase(); // Fallback: usa la extensión original
        }

        const archivoNombre = `${libro._id}.${extension}`;

        const fs = require('fs');
        const path = require('path');

        const carpetaDestino = path.resolve(baseRuta);
        if (!fs.existsSync(carpetaDestino)) {
            fs.mkdirSync(carpetaDestino, { recursive: true });
        }

        const destPath = path.join(carpetaDestino, archivoNombre);
        await fs.promises.writeFile(destPath, req.file.buffer);

        libro.ruta_archivo = destPath;
        await libro.save();

        res.status(200).json({ message: "Archivo guardado correctamente.", libro });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al guardar el archivo en la biblioteca." });
    }
};