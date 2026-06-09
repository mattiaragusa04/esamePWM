const express = require('express');
const router = express.Router();
const vendiController = require('../controllers/vendiControllers');
const authMiddleware = require('../middleware/authMiddleware'); 


router.use(authMiddleware);

router.get('/', vendiController.getAllProdottiForSelling);

router.get('/:id', vendiController.getProdottoForSellingById);

router.post('/offerta', vendiController.submitSellOffer);

router.get('/utente', vendiController.getProdottoForSellingByUserId);

router.post('/:id', vendiController.update);



module.exports = router;
