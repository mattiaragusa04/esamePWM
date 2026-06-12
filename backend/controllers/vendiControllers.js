const prodottoModel = require('../models/prodottoModel'); 
const vendiModel = require('../models/vendiModel'); 

exports.getAllProdottiForSelling = async (req, res) => {
    try {
        const prodotti = await prodottoModel.findAll();
        res.json(prodotti);
    } catch (err) {
        console.error("Errore nel recupero dei prodotti per la vendita:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getProdottoForSellingById = async (req, res) => {
    try {
        const id = req.params.id;
        const prodotto = await prodottoModel.findById(id);
        if (!prodotto) {
            return res.status(404).json({ message: "Prodotto non trovato per la vendita." });
        }
        res.json(prodotto);
    } catch (err) {
        console.error(`Errore nel recupero del prodotto ${req.params.id} per la vendita:`, err);
        res.status(500).json({ error: err.message });
    }
};

exports.submitSellOffer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId, estimatedPrice, conditions } = req.body;
        const numericPrice = Number(estimatedPrice);
        
        const imagePaths = req.files ? req.files.map(file => `/public/uploads/vendi/${file.filename}`) : [];
        const newOffer = await vendiModel.create(userId, prodottoId, numericPrice, conditions, JSON.stringify(imagePaths));

        console.log(`Offerta di vendita #${newOffer.id} inviata dall'utente ${userId} per il prodotto ${prodottoId}. Prezzo stimato: €${numericPrice.toFixed(2)}`);

        res.status(200).json({ message: "Offerta di vendita ricevuta con successo!", offer: { prodottoId, estimatedPrice, conditions } });

    } catch (err) {
        console.error("Errore nell'invio dell'offerta di vendita:", err);
        res.status(500).json({ error: err.message });
    }
};


exports.getProdottoForSellingByUserId = async (req, res) => {
      try {
        const userId = req.user.id;
        const offerte = await vendiModel.findByUserId(userId);
        res.json(offerte);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { stato_offerta } = req.body; 
        if (!stato_offerta) return res.status(400).json({ message: "Stato offerta mancante." });
        const updatedOffer = await vendiModel.updateStatus(id, stato_offerta);
        res.json(updatedOffer);
    } catch(err) {
        res.status(500).json({ error: err.message });
    } 

};

exports.getAllProdottiInviati = async (req, res) => {
    try {
        const vendi = await vendiModel.findAll();
        res.json(vendi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
