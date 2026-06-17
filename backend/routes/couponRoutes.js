const express = require('express');
const router = express.Router();

const couponController = require('../controllers/couponController');

const verificaToken = require('../middleware/authMiddleware');
const verificaAdmin = require('../middleware/adminMiddleware');

// IMPORTANTE: le route statiche devono stare PRIMA di quelle con parametri dinamici (:id)
// altrimenti Express interpreta "valida" come un :id

// Utente: valida un codice coupon (usato nel pagamento) — DEVE stare prima di /:id
router.post('/valida', verificaToken, couponController.validaCoupon);

// Admin: lista tutti i coupon
router.get('/', verificaToken, verificaAdmin, couponController.getAllCoupon);

// Admin: crea un nuovo coupon
router.post('/', verificaToken, verificaAdmin, couponController.creaCoupon);

// Admin: modifica un coupon esistente
router.put('/:id', verificaToken, verificaAdmin, couponController.modificaCoupon);

// Admin: attiva/disattiva coupon
router.patch('/:id/toggle', verificaToken, verificaAdmin, couponController.toggleCoupon);

// ── Utente ──────────────────────────────────────────────
// Preset coupon fissi (5%, 10%, 15%, 20%, 25%) — generati on-the-fly
router.get('/preset-coupon', couponController.getPresetCoupon);
// Acquisto coupon preset con punti
router.post('/acquista-preset-coupon', couponController.acquistaPresetCoupon);
// Catalogo coupon dal DB (punti → coupon)
router.get('/catalogo-coupon', couponController.getCatalogoCoupon);
// Acquisto coupon con punti
router.post('/acquista-coupon',  couponController.acquistaCoupon);
// Lista prodotti usati (live dal DB)
router.get('/prodotti-usati', couponController.getProdottiUsati);
// Acquisto prodotto usato con punti
router.post('/acquista-prodotto', couponController.acquistaProdottoConPunti);

// ── Admin ───────────────────────────────────────────────
// Tutti i coupon fedeltà (tabella admin)
router.get('/admin/coupon-fedelta', couponController.adminGetCouponFedelta);
// Crea coupon fedeltà
router.post('/admin/coupon-fedelta', couponController.adminCreaCouponFedelta);
// Toggle attivo
router.patch('/admin/coupon-fedelta/:id/toggle', couponController.adminToggleCouponFedelta);
// Elimina coupon fedeltà
router.delete('/admin/coupon-fedelta/:id', couponController.adminEliminaCouponFedelta);
// Tutti i prodotti usati (per admin, include anche quelli non in vetrina)
router.get('/admin/prodotti-usati', couponController.adminGetProdottiUsati);

module.exports = router;
