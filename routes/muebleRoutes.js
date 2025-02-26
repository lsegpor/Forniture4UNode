// muebleRoutes.js
const express = require('express');
const router = express.Router();
const muebleController = require('../controllers/muebleController');

router.get('/', muebleController.getAllMueble);
router.get('/fechaentrega/:fecha', muebleController.getMueblesByFecha);
router.get('/buscar', muebleController.getMueblesByNombre);
router.get('/:id_mueble', muebleController.getMuebleById);
router.post('/', muebleController.createMueble);
router.put('/:id_mueble', muebleController.updateMueble);
router.delete('/:id_mueble', muebleController.deleteMueble);

module.exports = router;
