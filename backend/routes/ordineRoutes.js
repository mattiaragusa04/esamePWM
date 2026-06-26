const express = require('express');
const router = express.Router();
const ordineController = require('../controllers/ordineControllers');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);

router.post('/create', ordineController.createOrdine);


router.get('/utente', ordineController.getOrdiniByUserId);


router.put('/stato', ordineController.updateStatoOrdine);


router.get('/:id/prodotti', ordineController.getProdottiOrdine);


router.get('/:id', ordineController.getOrdineById);

router.get('/',adminMiddleware, ordineController.getAllOrdini);

module.exports = router;
