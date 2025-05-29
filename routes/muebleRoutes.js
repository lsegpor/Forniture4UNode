// muebleRoutes.js
const express = require("express");
const router = express.Router();
const muebleController = require("../controllers/muebleController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear directorio si no existe
    const uploadDir = "./uploads/muebles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "mueble-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos de imagen"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de multer
    return res.status(400).json({
      ok: false,
      datos: null,
      mensaje: `Error al subir la imagen: ${err.message}`,
    });
  } else if (err) {
    // Otro tipo de error
    return res.status(400).json({
      ok: false,
      datos: null,
      mensaje: err.message,
    });
  }
  next();
};

router.get("/", muebleController.getAllMueble);
router.get("/fechaentrega/:fecha", muebleController.getMueblesByFecha);
router.get("/buscar", muebleController.getMueblesByNombre);
router.get("/:id_mueble/componentes", muebleController.getMuebleComponentes);
router.get("/:id_mueble", muebleController.getMuebleById);
router.post(
  "/",
  upload.single("imagen"),
  handleMulterError,
  muebleController.createMueble
);
router.put(
  "/:id_mueble",
  upload.single("imagen"),
  handleMulterError,
  muebleController.updateMueble
);
router.delete("/:id_mueble", muebleController.deleteMueble);

module.exports = router;
