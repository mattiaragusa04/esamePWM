const express = require('express');
const router = express.Router();
const indirizzoController = require('../controllers/indirizzoController');
const authMiddleware = require('../middleware/authMiddleware');

// Applica il middleware a TUTTE le rotte di questo router per proteggerle
router.use(authMiddleware);

// Rotta per ottenere tutti gli indirizzi
router.get('/', indirizzoController.getAllIndirizzi);
// Rotta per ottenere gli indirizzi dell'utente
router.get('/utente', indirizzoController.getIndirizziByUserId);
// Rotta per ottenere un indirizzo per ID
router.get('/:id', indirizzoController.getIndirizzoById);
// Rotta per creare un nuovo indirizzo
router.post('/create', indirizzoController.createIndirizzo);

module.exports = router;

