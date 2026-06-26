const express = require('express');
const router = express.Router();
const recensioneController = require('../controllers/recensioneController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', recensioneController.getRecensioni);


router.get('/mia', authMiddleware, recensioneController.getMiaRecensione);
router.post('/', authMiddleware, recensioneController.creaRecensione);

module.exports = router;
