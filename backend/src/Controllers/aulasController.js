const Aula = require("../Models/Aula");

exports.obtenerAulas = async (req, res) => {
    try {
        const aulas = await Aula.find();
        res.status(200).json(aulas.map((aula) => ({
            _id: aula._id,
            nombre: aula.nombre
        })));
    } catch (error) {
        console.error(`Error al obtener aulas: ${error.message}`);
        res.status(500).json({ message: "Error al obtener aulas", error: error.message });
    }
}

exports.obtenerAula = async (req, res) => {
    try {
        const aula = await Aula.findById(req.params.id);

        if (!aula)
            return res.status(404).json({ message: "Aula no encontrada" });

        res.status(200).json(aula);
    } catch (error) {
        const mensaje = `Error al obtener el horario ${req.params.id}`;
        console.error({ message: mensaje + `: ${error.message}` });
        res.status(500).json({ message: mensaje, error: error.message });
    }
}

exports.crearAula = async (req, res) => {
    try {
        const aula = new Aula(req.body);
        const nuevaAula = await aula.save();

        res.status(201).json(nuevaAula);
    } catch (error) {
        const mensaje = `Error al crear el aula`;
        console.error(mensaje + `: ${error.message}`);
        res.status(500).json({ message: mensaje, error: error.message });
    }
}

exports.actualizarAula = async (req, res) => {
    try {
        const datosAula = req.body;
        const aula = await Aula.findById(datosAula._id);
        aula.updateOne(datosAula);
        aula.save();
        res.status(200).json(aula);
    } catch (error) {
        const mensaje = `El aula ${req.body._id} no se pudo actualizar`;
        console.error(`${mensaje}: ${error.message}`);
        res.status(500).json({ message: mensaje, error: error.message });
    }
}