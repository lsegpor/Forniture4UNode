const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, esUsuario } = require("../middlewares/authMiddleware");

// Rutas para usuarios
router.post("/login", userController.login);
router.post("/register", userController.signup);
router.post("/logout", verifyToken, userController.logout);
router.get("/", verifyToken, esUsuario, userController.getAllUsers);

module.exports = router;
