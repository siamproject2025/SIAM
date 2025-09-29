const express = require("express");
const path = require("path");
const cors = require('cors');
const app = express();
require("dotenv").config();//llamado del .env
const port = process.env.PORT; //Usa el puerto 5000 en el .env 
app.use(cors()); // Permitir todas las solicitudes CORS
app.use(express.json()); // Para poder leer JSON en el body de las solicitudes


// Settings
app.set("port", port);  // Utiliza la variable port definida arriba

// Middlewares
app.use(express.json());

// Routes

// Static Files
// Solo necesitas esta línea para servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, "public")));

// Starting server

app.listen(port, () => {
    console.log(`Server on port ${port}`);
});
