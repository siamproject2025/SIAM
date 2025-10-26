const Alumno = require("../Models/Alumno");

exports.obtenerAlumnos = async (req, res) => {
    try {
        const alumnos = await Alumno.find();
        res.status(200).json(alumnos.map((alumno) => ({
            _id: alumno._id,
            identidad: alumno.identidad,
            nombre: alumno.nombre
        })));
    } catch (error) {
        console.error(`Error al obtener alumnos: ${error.message}`);
        res.status(500).json({ message: "Error al obtener alumnos", error: error.message });
    }
}

exports.obtenerAlumno = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);

        if (!alumno)
            return res.status(404).json({ message: "Alumno no encontrado" });

        res.status(200).json(alumno);
    } catch (error) {
        const mensaje = `Error al obtener el alumno ${req.params.id}`;
        console.error({ message: mensaje + `: ${error.message}` });
        res.status(500).json({ message: mensaje, error: error.message });
    }
}
