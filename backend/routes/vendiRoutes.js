const express = require('express');
const router = express.Router();
const vendiController = require('../controllers/vendiControllers');
const authMiddleware = require('../middleware/authMiddleware'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Assicurati che la cartella esista
const uploadDir = 'public/uploads/vendi/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.get('/', vendiController.getAllProdottiForSelling);

router.get('/utente', vendiController.getProdottoForSellingByUserId);

router.post('/offerta', upload.array('images', 5), vendiController.submitSellOffer);

router.get('/:id', vendiController.getProdottoForSellingById);

router.post('/:id', vendiController.update);




module.exports = router;
