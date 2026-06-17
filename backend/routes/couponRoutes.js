const express = require('express');
const router = express.Router();

const couponController = require('../controllers/couponController');

const verificaToken = require('../middleware/authMiddleware');
const verificaAdmin = require('../middleware/adminMiddleware');

// IMPORTANTE: le route statiche devono stare PRIMA di quelle con parametri dinamici (:id)
// altrimenti Express interpreta "valida" come un :id

// ── Utente ──────────────────────────────────────────────
// Preset coupon fissi (5%, 10%, 15%, 20%, 25%) — generati on-the-fly

// Utente: valida un codice coupon (usato nel pagamento) — DEVE stare prima di /:id
router.post('/valida', verificaToken, couponController.validaCoupon);

router.get('/preset-coupon', verificaToken,couponController.getPresetCoupon);

// Acquisto coupon preset con punti
router.post('/acquista-preset-coupon', verificaToken,couponController.acquistaPresetCoupon);

// Catalogo coupon dal DB (punti → coupon)
router.get('/catalogo-coupon', verificaToken,couponController.getCatalogoCoupon);

// Acquisto coupon con punti
router.post('/acquista-coupon', verificaToken ,couponController.acquistaCoupon);

// Lista prodotti usati (live dal DB)
router.get('/prodotti-usati', verificaToken,couponController.getProdottiUsati);

// Acquisto prodotto usato con punti
router.post('/acquista-prodotto',verificaToken, couponController.acquistaProdottoConPunti);

// Lista coupon utente
router.get('/miei-coupon', verificaToken, couponController.iMieiCoupon);

// ── Admin ───────────────────────────────────────────────
// Tutti i coupon fedeltà (tabella admin)
// Tutti i prodotti usati (per admin, include anche quelli non in vetrina)
router.get('/admin/prodotti-usati', verificaToken, verificaAdmin,couponController.adminGetProdottiUsati);

router.get('/admin/coupon-fedelta', verificaToken,verificaAdmin,couponController.adminGetCouponFedelta);
// Crea coupon fedeltà
router.post('/admin/coupon-fedelta', verificaToken,verificaAdmin,couponController.adminCreaCouponFedelta);
// Admin: lista tutti i coupon
router.get('/', verificaToken, verificaAdmin, couponController.getCoupon);

// Admin: crea un nuovo coupon
router.post('/', verificaToken, verificaAdmin, couponController.creaCoupon);

// Toggle attivo
router.patch('/admin/coupon-fedelta/:id/toggle', verificaToken,verificaAdmin, couponController.adminToggleCouponFedelta);

// Elimina coupon fedeltà
router.delete('/admin/coupon-fedelta/:id', verificaToken, verificaAdmin,couponController.adminEliminaCouponFedelta);

// Tutti i prodotti usati (per admin, include anche quelli non in vetrina)
router.get('/admin/prodotti-usati', verificaToken, verificaAdmin,couponController.adminGetProdottiUsati);

// Admin: modifica un coupon esistente
router.put('/:id', verificaToken, verificaAdmin, couponController.modificaCoupon);

// Admin: attiva/disattiva coupon
router.patch('/:id/toggle', verificaToken, verificaAdmin, couponController.toggleCoupon);


module.exports = router;
