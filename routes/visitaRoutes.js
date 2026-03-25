const express = require('express');
const router = express.Router();
const visitaController = require('../controllers/visitaController');

router.get('/cliente/:clienteId', visitaController.obtenerVisitasPorCliente);
router.get('/:id', visitaController.obtenerVisitaPorId);
router.post('/:clienteId', visitaController.crearVisita);
router.put('/:id', visitaController.actualizarVisita);
router.delete('/:id', visitaController.eliminarVisita);

module.exports = router;