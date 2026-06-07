const express = require('express');
const router = express.Router();
const carrelloController = require('../controllers/carrelloControllers');
const authMiddleware = require('../middleware/authMiddleware');

// Applica il middleware a TUTTE le rotte di questo router per proteggerle
router.use(authMiddleware);

// Rotta per aggiungere un prodotto al carrello
router.post('/aggiungi', carrelloController.addToCart);
// Rotta per rimuovere un prodotto dal carrello
router.post('/rimuovi', carrelloController.removeFromCart);
// Rotta per aggiornare la quantità di un prodotto nel carrello
router.post('/aggiorna', carrelloController.updateCartItem);
// Rotta per svuotare il carrello
router.post('/svuota', carrelloController.clearCart);
// Rotta per ottenere gli articoli nel carrello
router.get('/', carrelloController.getCartItems);

module.exports = router;