const express = require('express');
const router = express.Router();
const cartaDiCreditoController = require('../controllers/cartaDiCreditoController');
const authMiddleware = require('../middleware/authMiddleware');


router.use(authMiddleware);


router.get('/', cartaDiCreditoController.getAllCarte);

router.get('/utente', cartaDiCreditoController.getCarteByUserId);

router.get('/:id', cartaDiCreditoController.getCartaById);

router.delete('/:id', cartaDiCreditoController.deleteCarta);

router.post('/create', cartaDiCreditoController.createCarta);

module.exports = router;