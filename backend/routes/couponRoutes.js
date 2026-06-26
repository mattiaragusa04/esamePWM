const express = require('express');
const router = express.Router();

const couponController = require('../controllers/couponController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


router.post('/valida', authMiddleware, couponController.validaCoupon);

router.get('/preset-coupon', authMiddleware,couponController.getPresetCoupon);

router.post('/acquista-preset-coupon', authMiddleware,couponController.acquistaPresetCoupon);


router.get('/catalogo-coupon', authMiddleware,couponController.getCatalogoCoupon);


router.post('/acquista-coupon', authMiddleware ,couponController.acquistaCoupon);


router.get('/prodotti-usati', authMiddleware,couponController.getProdottiUsati);

router.post('/acquista-prodotto',authMiddleware, couponController.acquistaProdottoConPunti);


router.get('/miei-coupon', authMiddleware, couponController.iMieiCoupon);


router.get('/admin/prodotti-usati', authMiddleware, adminMiddleware,couponController.adminGetProdottiUsati);

router.get('/admin/coupon-fedelta', authMiddleware,adminMiddleware,couponController.adminGetCouponFedelta);

router.post('/admin/coupon-fedelta', authMiddleware,adminMiddleware,couponController.adminCreaCouponFedelta);

router.put('/admin/coupon-fedelta/:id', authMiddleware, adminMiddleware, couponController.adminModificaCouponFedelta);


router.get('/', authMiddleware, adminMiddleware, couponController.getCoupon);


router.post('/', authMiddleware, adminMiddleware, couponController.creaCoupon);

router.patch('/admin/coupon-fedelta/:id/toggle', authMiddleware,adminMiddleware, couponController.adminToggleCouponFedelta);


router.delete('/admin/coupon-fedelta/:id', authMiddleware, adminMiddleware,couponController.adminEliminaCouponFedelta);


router.get('/admin/prodotti-usati', authMiddleware, adminMiddleware,couponController.adminGetProdottiUsati);


router.put('/:id', authMiddleware, adminMiddleware, couponController.modificaCoupon);


router.patch('/:id/toggle', authMiddleware, adminMiddleware, couponController.toggleCoupon);


module.exports = router;
