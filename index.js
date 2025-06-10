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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configurar middleware para analizar JSON en las solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// configuración CORS que funciona para ambos entornos:
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como apps móviles o Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173", // Desarrollo con Vite
      "http://localhost:3000", // Desarrollo con Create React App
      "https://forniture4u-production.up.railway.app", // Tu frontend en producción
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
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
