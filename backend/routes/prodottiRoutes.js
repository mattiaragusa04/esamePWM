const express = require("express");
const router = express.Router();
const prodottoController = require("../controllers/prodottiControllers");
const multer = require("multer");
const path = require("path");

// Configurazione Multer per il caricamento delle immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/immagini/upload-admin'); // La cartella dove verranno salvate le immagini
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'up-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Rotta per ottenere tutti i prodotti
router.get("/", prodottoController.getAllProdotti);
// Rotta per la ricerca dei prodotti
router.get("/ricerca", prodottoController.cercaProdotti);
// Rotta per ottenere tutti i prodotti di una categoria
router.get("/categoria/:categoriaId", prodottoController.getProdottobyCategoria);
// Rotta per ottenere un singolo prodotto
router.get("/:id", prodottoController.getProdottoById);

router.delete("/:id", prodottoController.deleteProdotto);

router.post("/create" , upload.single('immagine'), prodottoController.createProdotto);

router.put("/:id", upload.single('immagine'), prodottoController.updateProdotto);

module.exports = router;