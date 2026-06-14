const express = require('express');
const router = express.Router();
const {
  getCoupon,
  creaCoupon,
  modificaCoupon,
  toggleCoupon,
  validaCoupon
} = require('../controllers/couponController');

const verificaToken = require('../middleware/authMiddleware');
const verificaAdmin = require('../middleware/adminMiddleware');

// IMPORTANTE: le route statiche devono stare PRIMA di quelle con parametri dinamici (:id)
// altrimenti Express interpreta "valida" come un :id

// Utente: valida un codice coupon (usato nel pagamento) — DEVE stare prima di /:id
router.post('/valida', verificaToken, validaCoupon);

// Admin: lista tutti i coupon
router.get('/', verificaToken, verificaAdmin, getCoupon);

// Admin: crea un nuovo coupon
router.post('/', verificaToken, verificaAdmin, creaCoupon);

// Admin: modifica un coupon esistente
router.put('/:id', verificaToken, verificaAdmin, modificaCoupon);

// Admin: attiva/disattiva coupon
router.patch('/:id/toggle', verificaToken, verificaAdmin, toggleCoupon);

module.exports = router;
