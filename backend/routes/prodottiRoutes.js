const express = require("express");
const router = express.Router();
const prodottoController = require("../controllers/prodottiControllers");

// Rotta per ottenere tutti i prodotti
router.get("/", prodottoController.getAllProdotti);
// Rotta per ottenere tutti i prodotti di una categoria
router.get("/categoria/:categoriaId", prodottoController.getProdottobyCategoria);
// Rotta per ottenere un singolo prodotto
router.get("/:id", prodottoController.getProdottoById);

module.exports = router;