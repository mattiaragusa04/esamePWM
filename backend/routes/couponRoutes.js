const express = require('express');
const router = express.Router();
const {
  getCoupon,
  creaCoupon,
  toggleCoupon,
  validaCoupon
} = require('../controllers/couponController');

const verificaToken = require('../middleware/authMiddleware');
const verificaAdmin = require('../middleware/adminMiddleware');

// Admin: lista tutti i coupon
router.get('/', verificaToken, verificaAdmin, getCoupon);

// Admin: crea un nuovo coupon
router.post('/', verificaToken, verificaAdmin, creaCoupon);

// Admin: attiva/disattiva coupon
router.patch('/:id/toggle', verificaToken, verificaAdmin, toggleCoupon);

// Utente: valida un codice coupon (usato nel pagamento)
router.post('/valida', verificaToken, validaCoupon);

module.exports = router;