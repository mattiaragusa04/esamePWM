const express = require('express');
const router = express.Router();
const carrelloController = require('../controllers/carrelloControllers');
const authMiddleware = require('../middleware/authMiddleware');


router.use(authMiddleware);


router.post('/aggiungi', carrelloController.addToCart);

router.post('/rimuovi', carrelloController.removeFromCart);

router.post('/aggiorna', carrelloController.updateCartItem);

router.post('/svuota', carrelloController.clearCart);

router.get('/', carrelloController.getCartItems);

module.exports = router;