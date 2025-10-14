import { useEffect, useState } from "react";
import axios from "axios";

export default function BibliotecaTest() {
  const [libros, setLibros] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [archivo, setArchivo] = useState(null);

  const cargarLibros = async () => {
    const res = await axios.get("http://localhost:5000/api/biblioteca");
    setLibros(res.data);
  };

  useEffect(() => {
    cargarLibros();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo) return alert("Debes seleccionar un archivo");

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("autor", autor);
    formData.append("archivo", archivo);

    await axios.post("http://localhost:5000/api/biblioteca", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setTitulo("");
    setAutor("");
    setArchivo(null);
    cargarLibros();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">📚 Biblioteca Digital</h1>

      <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded-md mb-6 flex flex-col gap-3">
        <input type="text" placeholder="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="p-2 border rounded-md" />
        <input type="text" placeholder="Autor" value={autor} onChange={(e) => setAutor(e.target.value)} className="p-2 border rounded-md" />
        <input type="file" accept=".pdf,.epub" onChange={(e) => setArchivo(e.target.files[0])} className="p-2" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Subir Libro</button>
      </form>

      <table className="w-full text-left border">
        <thead className="bg-blue-100">
          <tr>
            <th className="p-2 border-b">Título</th>
            <th className="p-2 border-b">Autor</th>
            <th className="p-2 border-b">Fecha</th>
            <th className="p-2 border-b">Descargar</th>
          </tr>
        </thead>
        <tbody>
          {libros.map((libro) => (
            <tr key={libro._id} className="hover:bg-gray-50">
              <td className="p-2 border-b">{libro.titulo}</td>
              <td className="p-2 border-b">{libro.autor}</td>
              <td className="p-2 border-b">{new Date(libro.fechaCreacion).toLocaleDateString()}</td>
              <td className="p-2 border-b text-center">
                {libro.archivoUrl ? (
                  <a href={libro.archivoUrl} download target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">
                    Descargar
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Sin archivo</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
