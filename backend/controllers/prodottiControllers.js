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

exports.deleteProdotto = async (req, res) => {
    try {
        const prodottoId = req.params.id;
        const deletedProdotto = await prodotto.delete(prodottoId);
        res.json(deletedProdotto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.createProdotto = async (req, res) => {
    try {
        const prodottoData = req.body || {};

        if (Object.keys(prodottoData).length === 0) {
            return res.status(400).json({ error: "Nessun dato fornito per il prodotto" });
        }

        if (prodottoData.categoria_id) prodottoData.categoria_id = parseInt(prodottoData.categoria_id, 10);

        // Giacenze separate
        const giacenzaNuovo = parseInt(prodottoData.giacenzaNuovo, 10) || 0;
        const giacenzaUsato = parseInt(prodottoData.giacenzaUsato, 10) || 0;

        // Prezzi distinti già calcolati dal frontend
        const prezzoNuovo = parseFloat(prodottoData.prezzoNuovo) || 0;
        const prezzoUsato = parseFloat(prodottoData.prezzoUsato) || 0;

        if (prezzoNuovo <= 0 || prezzoUsato <= 0) {
            return res.status(400).json({ error: "I prezzi devono essere maggiori di zero" });
        }

        // Impostazione URL immagine se caricata
        if (req.file) {
            prodottoData.immagine = 'http://localhost:3000/public/immagini/upload-admin/' + req.file.filename;
        }

        // Crea la riga con condizione 'Nuovo'
        const prodottoNuovo = await prodotto.create({
            ...prodottoData,
            giacenza: giacenzaNuovo,
            prezzoUnitarioVendita: prezzoNuovo,
            condizione: 'Nuovo'
        });

        // Crea la riga con condizione 'Usato'
        const prodottoUsato = await prodotto.create({
            ...prodottoData,
            giacenza: giacenzaUsato,
            prezzoUnitarioVendita: prezzoUsato,
            condizione: 'Usato'
        });

        res.json({ nuovo: prodottoNuovo, usato: prodottoUsato });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.updateProdotto = async (req, res) => {
    try {
        const prodottoId = req.params.id;
        const prodottoData = req.body || {};
        prodottoData.id = prodottoId;

        if (Object.keys(prodottoData).length === 0) {
            return res.status(400).json({ error: "Nessun dato fornito per l'aggiornamento" });
        }

        if (prodottoData.prezzoUnitarioVendita) prodottoData.prezzoUnitarioVendita = parseFloat(prodottoData.prezzoUnitarioVendita);
        if (prodottoData.giacenza) prodottoData.giacenza = parseInt(prodottoData.giacenza, 10);
        if (prodottoData.categoria_id) prodottoData.categoria_id = parseInt(prodottoData.categoria_id, 10);
        if (prodottoData.visibile !== undefined) prodottoData.visibile = parseInt(prodottoData.visibile, 10);

        if (req.file) {
            prodottoData.immagine = 'http://localhost:3000/public/immagini/upload-admin/' + req.file.filename;
        }

        const updatedProdotto = await prodotto.update(prodottoData);
        res.json(updatedProdotto);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
