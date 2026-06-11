const express = require('express');
const router = express.Router();
const ordineController = require('../controllers/ordineControllers');
const authMiddleware = require('../middleware/authMiddleware');

// Applica il middleware a TUTTE le rotte di questo router per proteggerle
router.use(authMiddleware);

// Rotta per creare un nuovo ordine
router.post('/create', ordineController.createOrdine);

// Rotta per ottenere tutti gli ordini dell'utente loggato
router.get('/utente', ordineController.getOrdiniByUserId);

// Rotta per aggiornare lo stato dell'ordine
router.put('/stato', ordineController.updateStatoOrdine);

// Rotta per ottenere i dettagli di un singolo ordine
router.get('/:id', ordineController.getOrdineById);

router.get('/', ordineController.getAllOrdini);

module.exports = router;