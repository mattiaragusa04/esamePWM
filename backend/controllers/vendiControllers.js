const prodottoModel = require('../models/prodottoModel');
const vendiModel = require('../models/vendiModel');
const userModel = require('../models/userModel');
const db = require('../db/database');

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
        const { prodottoId, estimatedPrice, conditions, tipoCompenso } = req.body;
        const numericPrice = Number(estimatedPrice);
        const compenso = tipoCompenso === 'punti' ? 'punti' : 'euro';

        const imagePaths = req.files ? req.files.map(file => `/public/uploads/vendi/${file.filename}`) : [];
        const newOffer = await vendiModel.create(
            userId,
            prodottoId,
            numericPrice,
            JSON.stringify(conditions),
            JSON.stringify(imagePaths),
            compenso
        );

        console.log(`Offerta #${newOffer.id} da utente ${userId} per prodotto ${prodottoId}. Prezzo: €${numericPrice.toFixed(2)}. Compenso: ${compenso}`);

        res.status(200).json({ message: "Offerta di vendita ricevuta con successo!", offer: { prodottoId, estimatedPrice, conditions, tipoCompenso: compenso } });

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

// PUT /api/vendi/:id  — aggiorna solo lo stato (usato anche per Rifiuta / In attesa)
exports.update = async (req, res) => {
    try {
        const id = req.params.id;
        const { stato_offerta } = req.body;
        if (!stato_offerta) return res.status(400).json({ message: "Stato offerta mancante." });
        const updatedOffer = await vendiModel.updateStatus(id, stato_offerta);
        res.json(updatedOffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/vendi/:id/accetta — accetta l'offerta con logica completa:
//   1. Aggiorna stato_offerta → 'Accettata'
//   2. Incrementa giacenza del prodotto di 1
//   3. Se tipo_compenso = 'punti': accredita punti all'utente (Math.round(prezzo/5) + 5)
exports.accettaOfferta = async (req, res) => {
    const id = req.params.id;

    // Recupera l'offerta
    let offerta;
    try {
        offerta = await vendiModel.findById(id);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

    if (!offerta) return res.status(404).json({ message: 'Offerta non trovata.' });
    if (offerta.stato_offerta === 'Accettata') {
        return res.status(400).json({ message: 'Offerta già accettata.' });
    }

    try {
        // 1. Aggiorna stato
        await vendiModel.updateStatus(id, 'Accettata');

        // 2. Incrementa giacenza prodotto di 1
        await prodottoModel.ripristinaGiacenza(offerta.prodotto_id, 1);

        // 3. Se tipo_compenso = 'punti', accredita punti fedeltà
        let puntiAccreditati = 0;
        if (offerta.tipo_compenso === 'punti') {
            puntiAccreditati = Math.round(offerta.prezzo_stimato / 5) + 5;
            await userModel.updatePuntiFedelta(offerta.utente_id, puntiAccreditati);
            console.log(`Accreditati ${puntiAccreditati} punti fedeltà all'utente ${offerta.utente_id} per offerta #${id}`);
        }

        console.log(`Offerta #${id} accettata. Giacenza prodotto #${offerta.prodotto_id} incrementata. Compenso: ${offerta.tipo_compenso}.`);

        res.json({
            message: 'Offerta accettata con successo.',
            offertaId: Number(id),
            prodottoId: offerta.prodotto_id,
            tipoCompenso: offerta.tipo_compenso,
            puntiAccreditati
        });
    } catch (err) {
        console.error('Errore durante accettazione offerta:', err);
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
