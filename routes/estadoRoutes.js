const express = require('express');
const router = express.Router();
const estadoController = require('../controllers/estadoController');
const upload = require('../config/multer');

router.get('/:clienteId', estadoController.obtenerEstadoPorCliente);
router.post('/:clienteId', estadoController.guardarEstado);

router.post('/:clienteId/fotos', upload.fields([
  { name: 'foto1', maxCount: 1 },
  { name: 'foto2', maxCount: 1 }
]), estadoController.subirFotos);

router.delete('/:clienteId/fotos/:fotoNumero', estadoController.eliminarFoto);

module.exports = router;