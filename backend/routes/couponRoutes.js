const express = require('express');
const router = express.Router();

const couponController = require('../controllers/couponController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// IMPORTANTE: le route statiche devono stare PRIMA di quelle con parametri dinamici (:id)
// altrimenti Express interpreta "valida" come un :id

// ── Utente ──────────────────────────────────────────────
// Preset coupon fissi (5%, 10%, 15%, 20%, 25%) — generati on-the-fly

// Utente: valida un codice coupon (usato nel pagamento) — DEVE stare prima di /:id
router.post('/valida', authMiddleware, couponController.validaCoupon);

router.get('/preset-coupon', authMiddleware,couponController.getPresetCoupon);

// Acquisto coupon preset con punti
router.post('/acquista-preset-coupon', authMiddleware,couponController.acquistaPresetCoupon);

// Catalogo coupon dal DB (punti → coupon)
router.get('/catalogo-coupon', authMiddleware,couponController.getCatalogoCoupon);

// Acquisto coupon con punti
router.post('/acquista-coupon', authMiddleware ,couponController.acquistaCoupon);

// Lista prodotti usati (live dal DB)
router.get('/prodotti-usati', authMiddleware,couponController.getProdottiUsati);

// Acquisto prodotto usato con punti
router.post('/acquista-prodotto',authMiddleware, couponController.acquistaProdottoConPunti);

// Lista coupon utente
router.get('/miei-coupon', authMiddleware, couponController.iMieiCoupon);

// ── Admin ───────────────────────────────────────────────
// Tutti i coupon fedeltà (tabella admin)
// Tutti i prodotti usati (per admin, include anche quelli non in vetrina)
router.get('/admin/prodotti-usati', authMiddleware, adminMiddleware,couponController.adminGetProdottiUsati);

router.get('/admin/coupon-fedelta', authMiddleware,adminMiddleware,couponController.adminGetCouponFedelta);
// Crea coupon fedeltà
router.post('/admin/coupon-fedelta', authMiddleware,adminMiddleware,couponController.adminCreaCouponFedelta);
// Modifica coupon fedeltà
router.put('/admin/coupon-fedelta/:id', authMiddleware, adminMiddleware, couponController.adminModificaCouponFedelta);

// Admin: lista tutti i coupon
router.get('/', authMiddleware, adminMiddleware, couponController.getCoupon);

// Admin: crea un nuovo coupon
router.post('/', authMiddleware, adminMiddleware, couponController.creaCoupon);

// Toggle attivo
router.patch('/admin/coupon-fedelta/:id/toggle', authMiddleware,adminMiddleware, couponController.adminToggleCouponFedelta);

// Elimina coupon fedeltà
router.delete('/admin/coupon-fedelta/:id', authMiddleware, adminMiddleware,couponController.adminEliminaCouponFedelta);

// Tutti i prodotti usati (per admin, include anche quelli non in vetrina)
router.get('/admin/prodotti-usati', authMiddleware, adminMiddleware,couponController.adminGetProdottiUsati);

// Admin: modifica un coupon esistente
router.put('/:id', authMiddleware, adminMiddleware, couponController.modificaCoupon);

// Admin: attiva/disattiva coupon
router.patch('/:id/toggle', authMiddleware, adminMiddleware, couponController.toggleCoupon);


module.exports = router;
