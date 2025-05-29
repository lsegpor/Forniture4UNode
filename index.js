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
const userRoutes = require("./routes/userRoutes");
const companyRoutes = require("./routes/companyRoutes");
const pedidoRoutes = require("./routes/pedidosRoutes");
const cookieParser = require("cookie-parser");

const app = express();
const port = process.env.PORT || 3000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // Reemplaza * con tu dominio en producción
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configurar middleware para analizar JSON en las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Configurar CORS para admitir cualquier origen
app.use(
  cors({
    origin: "http://localhost:5173", // Especifica exactamente tu origen frontend
    credentials: true, // Permite credenciales
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser()); // Para analizar cookies

// Configurar rutas de la API Rest
app.use("/api/componentes", componenteRoutes);
app.use("/api/mueble", muebleRoutes);
app.use("/api/usuario", userRoutes);
app.use("/api/empresa", companyRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("images", express.static(path.join(__dirname, "public/assets")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//Configurar el middleware para servir archivos estáticos desde el directorio 'public\old_js_vainilla'
app.use(express.static(path.join(__dirname, "public")));

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

if (process.env.NODE_ENV !== "test") {
  console.log(`Servidor escuchando en el puerto ${port}`);
}

app.get("*", (req, res) => {
  if (!req.path.startsWith("/api/")) {
    // Evita que afecte a las rutas de la API
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

module.exports = app;
