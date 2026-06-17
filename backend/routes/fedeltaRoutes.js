const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/fedeltaController');
const auth    = require('../middleware/authMiddleware');

router.use(auth);

// ── Utente ──────────────────────────────────────────────
// Catalogo coupon dal DB (punti → coupon)
router.get('/catalogo-coupon',   ctrl.getCatalogoCoupon);
// Acquisto coupon con punti
router.post('/acquista-coupon',  ctrl.acquistaCoupon);
// Lista prodotti usati (live dal DB)
router.get('/prodotti-usati',    ctrl.getProdottiUsati);
// Acquisto prodotto usato con punti
router.post('/acquista-prodotto', ctrl.acquistaProdottoConPunti);

// ── Admin ───────────────────────────────────────────────
// Tutti i coupon fedeltà (tabella admin)
router.get('/admin/coupon-fedelta',         ctrl.adminGetCouponFedelta);
// Crea coupon fedeltà
router.post('/admin/coupon-fedelta',        ctrl.adminCreaCouponFedelta);
// Toggle attivo
router.patch('/admin/coupon-fedelta/:id/toggle', ctrl.adminToggleCouponFedelta);
// Elimina coupon fedeltà
router.delete('/admin/coupon-fedelta/:id',  ctrl.adminEliminaCouponFedelta);
// Tutti i prodotti usati (per admin, include anche quelli non in vetrina)
router.get('/admin/prodotti-usati',         ctrl.adminGetProdottiUsati);

module.exports = router;
