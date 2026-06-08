const prodotto = require('../models/prodottoModel');

exports.getAllProdotti = async (req, res) => {
    try {
        const prodotti = await prodotto.findAll();
        res.json(prodotti);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getProdottoById = async (req, res) => {
    try {
        const id = req.params.id;
        const prodottoData = await prodotto.findById(id);
        if (!prodottoData) {
            return res.status(404).json({ message: "Prodotto non trovato" });
        }
        res.json(prodottoData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getProdottobyCategoria = async (req, res) => {
    try {
        const categoriaId = req.params.categoriaId;
        const prodotti = await prodotto.findByCategoria(categoriaId);
        if (categoriaId > 4 || categoriaId < 1) {
            return res.status(404).json({ message: "Categoria non trovata" });
        }
        res.json(prodotti);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.cercaProdotti = async (req, res) => {
    try {
        const q = req.query.q;
        console.log("Ricerca ricevuta dal frontend per il termine:", q);
        if (!q) {
            return res.json([]);
        }
        const prodotti = await prodotto.search(q);
        console.log(`Trovati ${prodotti.length} risultati per "${q}"`);
        res.json(prodotti);
    } catch (err) {
        console.error("Errore durante la ricerca nel DB:", err);
        res.status(500).json({ error: err.message });
    }
}