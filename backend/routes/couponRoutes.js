const express = require('express');
const router = express.Router();
const {
  getCoupon, creaCoupon, modificaCoupon, toggleCoupon, validaCoupon,
  getPresetCoupon, acquistaPresetCoupon, getCatalogoCoupon,
  acquistaCoupon, getProdottiUsati, acquistaProdottoConPunti,
  adminGetCouponFedelta, adminCreaCouponFedelta,
  adminToggleCouponFedelta, adminEliminaCouponFedelta, adminGetProdottiUsati
} = require('../controllers/couponController');

const verificaToken = require('../middleware/authMiddleware');
const verificaAdmin = require('../middleware/adminMiddleware');

// ─── Coupon promozionali (admin) ─────────────────────────────
// IMPORTANTE: route statiche PRIMA di quelle con :id
router.post('/valida', verificaToken, validaCoupon);
router.get('/', verificaToken, verificaAdmin, getCoupon);
router.post('/', verificaToken, verificaAdmin, creaCoupon);
router.put('/:id', verificaToken, verificaAdmin, modificaCoupon);
router.patch('/:id/toggle', verificaToken, verificaAdmin, toggleCoupon);

// ─── Fedeltà — utente ────────────────────────────────────────
router.get('/fedelta/preset',             verificaToken, getPresetCoupon);
router.post('/fedelta/acquista-preset',   verificaToken, acquistaPresetCoupon);
router.get('/fedelta/catalogo',           verificaToken, getCatalogoCoupon);
router.post('/fedelta/acquista',          verificaToken, acquistaCoupon);
router.get('/fedelta/prodotti-usati',     verificaToken, getProdottiUsati);
router.post('/fedelta/acquista-prodotto', verificaToken, acquistaProdottoConPunti);

// ─── Fedeltà — admin ─────────────────────────────────────────
router.get('/fedelta/admin/coupon',                       verificaToken, verificaAdmin, adminGetCouponFedelta);
router.post('/fedelta/admin/coupon',                      verificaToken, verificaAdmin, adminCreaCouponFedelta);
router.patch('/fedelta/admin/coupon/:id/toggle',          verificaToken, verificaAdmin, adminToggleCouponFedelta);
router.delete('/fedelta/admin/coupon/:id',                verificaToken, verificaAdmin, adminEliminaCouponFedelta);
router.get('/fedelta/admin/prodotti-usati',               verificaToken, verificaAdmin, adminGetProdottiUsati);

module.exports = router;
