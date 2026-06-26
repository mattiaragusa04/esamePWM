const express = require("express");
const router = express.Router();
const prodottoController = require("../controllers/prodottiControllers");
const multer = require("multer");
const path = require("path");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware"); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/immagini/upload-admin');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'up-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });



router.get("/", prodottoController.getAllProdotti);

router.get("/ricerca", prodottoController.cercaProdotti);

router.get("/categoria/:categoriaId", prodottoController.getProdottobyCategoria);

router.get("/:id", prodottoController.getProdottoById);

router.delete("/:id", authMiddleware, adminMiddleware, prodottoController.deleteProdotto);

router.post("/create", authMiddleware, upload.single('immagine'), adminMiddleware, prodottoController.createProdotto);

router.put("/:id", authMiddleware, upload.single('immagine'), adminMiddleware, prodottoController.updateProdotto);

module.exports = router;