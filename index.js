require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});
// Importar librería express --> web server
const express = require("express");
// Importar librería path, para manejar rutas de ficheros en el servidor
const path = require("path");
// Importar libreria CORS
const cors = require("cors");
// Importar gestores de rutas
const componenteRoutes = require("./routes/componenteRoutes");
const muebleRoutes = require("./routes/muebleRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Configurar middleware para analizar JSON en las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configurar CORS para admitir cualquier origen
app.use(cors());

// Configurar rutas de la API Rest
app.use("/api/componentes", componenteRoutes);
app.use("/api/mueble", muebleRoutes);

//Configurar el middleware para servir archivos estáticos desde el directorio 'public\old_js_vainilla'
app.use(express.static(path.join(__dirname, "public")));

//Ruta para manejar las solicitudes al archivo index.html
//app.get('/', (req, res) => {
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

if (process.env.NODE_ENV !== "test") {
  console.log(`Servidor escuchando en el puerto ${port}`);
}

module.exports = app;
