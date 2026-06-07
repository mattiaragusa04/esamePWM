const express = require('express');
const router = express.Router();
const ordineController = require('../controllers/ordineControllers');

// Rotta per creare un nuovo ordine
router.post('/create', ordineController.createOrdine);

module.exports = router;