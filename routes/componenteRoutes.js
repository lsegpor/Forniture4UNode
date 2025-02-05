// componenteRoutes.js
const express = require('express');
const router = express.Router();
const componenteController = require('../controllers/componenteController');

router.get('/', componenteController.getAllComponentes);
router.get('/materiales', componenteController.getMateriales);
router.get('/materiales/:material', componenteController.getComponentesByMaterial);
router.get('/buscar', componenteController.getComponentesByNombre);
router.get('/:id_componente', componenteController.getComponenteById);
router.post('/', componenteController.createComponente);
router.put('/:id_componente', componenteController.updateComponente);
router.delete('/:id_componente', componenteController.deleteComponente);

module.exports = router;
