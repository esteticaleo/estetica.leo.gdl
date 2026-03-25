
const express = require('express');
const router = express.Router();
const agendaController = require('../controllers/agendaController');


router.get('/', agendaController.getAgenda);
router.post('/', agendaController.crearCita);
router.put('/:id', agendaController.actualizarCita);
router.delete('/:id', agendaController.eliminarCita);

module.exports = router;


