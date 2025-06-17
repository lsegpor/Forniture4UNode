// muebleRoutes.js
const express = require("express");
const router = express.Router();
const muebleController = require("../controllers/muebleController");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary"); // Asegúrate de crear este archivo

// Configuración de Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "muebles", // carpeta en Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "limit",
        quality: "auto:good",
      },
    ],
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

// Rutas (sin cambios)
router.get("/", muebleController.getAllMueble);
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
