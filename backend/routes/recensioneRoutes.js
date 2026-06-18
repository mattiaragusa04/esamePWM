const express = require('express');
const router = express.Router();
const recensioneController = require('../controllers/recensioneController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotta pubblica: tutte le recensioni visibili a tutti
router.get('/', recensioneController.getRecensioni);

// Rotte protette: richiedono autenticazione
router.get('/mia', authMiddleware, recensioneController.getMiaRecensione);
router.post('/', authMiddleware, recensioneController.creaRecensione);

module.exports = router;
