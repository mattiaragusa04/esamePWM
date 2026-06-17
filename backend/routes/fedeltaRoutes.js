const express = require('express');
const router = express.Router();
const fedeltaController = require('../controllers/fedeltaController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Catalogo coupon acquistabili con punti
router.get('/catalogo-coupon', fedeltaController.getCatalogoCoupon);

// Acquisto coupon con punti
router.post('/acquista-coupon', fedeltaController.acquistaCoupon);

// Lista prodotti usati acquistabili con punti
router.get('/prodotti-usati', fedeltaController.getProdottiUsati);

// Acquisto prodotto usato con punti
router.post('/acquista-prodotto', fedeltaController.acquistaProdottoConPunti);

module.exports = router;
