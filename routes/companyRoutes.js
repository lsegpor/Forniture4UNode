const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { verifyToken, esEmpresa } = require("../middlewares/authMiddleware");

// Rutas para empresas
router.post("/login", companyController.login);
router.post("/register", companyController.signup);
router.post("/logout", verifyToken, companyController.logout);
router.get("/", verifyToken, esEmpresa, companyController.getAllCompanies);
router.get("/perfil", verifyToken, esEmpresa, companyController.getProfile);
router.put("/actualizar", verifyToken, esEmpresa, companyController.updateCompany);

module.exports = router;
