const express = require('express');
const router = express.Router();
const indirizzoController = require('../controllers/indirizzoController');
const authMiddleware = require('../middleware/authMiddleware');


router.use(authMiddleware);


router.get('/', indirizzoController.getAllIndirizzi);

router.get('/utente', indirizzoController.getIndirizziByUserId);

router.get('/:id', indirizzoController.getIndirizzoById);

router.post('/create', indirizzoController.createIndirizzo);

router.delete('/:id', indirizzoController.deleteIndirizzo);

module.exports = router;

