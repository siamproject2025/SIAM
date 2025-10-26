const Docente = require("../Models/Docente");

exports.obtenerDocentes = async (req, res) => {
    try {
        const docentes = await Docente.find();
        res.status(200).json(docentes.map((docente) => ({
            _id: docente._id,
            identidad: docente.identidad,
            nombre: docente.nombre
        })));
    } catch (error) {
        console.error(`Error al obtener docentes: ${error.message}`);
        res.status(500).json({ message: "Error al obtener docentes", error: error.message });
    }
}

exports.obtenerDocente = async (req, res) => {
    try {
        const docente = await Docente.findById(req.params.id);

        if (!docente)
            return res.status(404).json({ message: "docente no encontrado" });

        res.status(200).json(docente);
    } catch (error) {
        const mensaje = `Error al obtener el docente ${req.params.id}`;
        console.error({ message: mensaje + `: ${error.message}` });
        res.status(500).json({ message: mensaje, error: error.message });
    }
}

exports.crearDocente = async (req, res) => {
    try {
        const datoDocente = req.body;
        const nuevoDocente = new Docente(datoDocente);
        nuevoDocente.save();
        res.status(201).json(nuevoDocente);
    } catch (error) {
        const mensaje = `Error al crear el docente`;
        console.error({ message: mensaje + `: ${error.message}` });
        res.status(500).json({ message: mensaje, error: error.message });
    }
}
