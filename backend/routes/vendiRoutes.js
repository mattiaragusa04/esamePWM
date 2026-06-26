const express = require('express');
const router = express.Router();
const vendiController = require('../controllers/vendiControllers');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminMiddleware = require('../middleware/adminMiddleware');

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

router.get('/inviati', vendiController.getAllProdottiInviati);

router.put('/:id/accetta', adminMiddleware,  vendiController.accettaOfferta);


router.put('/:id', adminMiddleware,vendiController.update);

router.get('/:id', vendiController.getProdottoForSellingById);

module.exports = router;
