const express = require('express');
const router = express.Router();
const cartaDiCreditoController = require('../controllers/cartaDiCreditoController');
const authMiddleware = require('../middleware/authMiddleware');

// Applica il middleware a TUTTE le rotte di questo router per proteggerle
router.use(authMiddleware);

// Rotta per ottenere tutte le carte
router.get('/', cartaDiCreditoController.getAllCarte);
// Rotta per ottenere le carte di un utente
router.get('/utente', cartaDiCreditoController.getCarteByUserId);
// Rotta per ottenere una singola carta
router.get('/:id', cartaDiCreditoController.getCartaById);
// Rotta per aggiornare una carta
router.put('/:id', cartaDiCreditoController.updateCarta);
// Rotta per eliminare una carta
router.delete('/:id', cartaDiCreditoController.deleteCarta);
// Rotta per creare una nuova carta
router.post('/create', cartaDiCreditoController.createCarta);

module.exports = router;