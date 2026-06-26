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


        let prodottoId, estimatedPrice, conditions, tipoCompenso;

        if (req.body.offer) {
            try {
                const parsed = JSON.parse(req.body.offer);
                prodottoId    = parsed.prodottoId;
                estimatedPrice = parsed.estimatedPrice;
                conditions    = parsed.conditions;
                tipoCompenso  = parsed.tipoCompenso;
            } catch (parseErr) {
                console.error("Errore nel parsing di req.body.offer:", parseErr);
                return res.status(400).json({ message: "Formato dell'offerta non valido." });
            }
        } else {
            ({ prodottoId, estimatedPrice, conditions, tipoCompenso } = req.body);
        }

        if (!prodottoId) {
            return res.status(400).json({ message: "prodottoId mancante." });
        }

        const numericProductId = Number(prodottoId);
        const numericPrice     = Number(estimatedPrice);

        if (!Number.isInteger(numericProductId) || numericProductId <= 0) {
            return res.status(400).json({ message: "prodottoId non valido." });
        }
        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ message: "Prezzo stimato non valido." });
        }

        const compenso    = tipoCompenso === 'punti' ? 'punti' : 'euro';
        const imagePaths  = req.files ? req.files.map(file => `/public/uploads/vendi/${file.filename}`) : [];

        const newOffer = await vendiModel.create(
            userId,
            numericProductId,
            numericPrice,
            JSON.stringify(conditions || []),
            JSON.stringify(imagePaths),
            compenso
        );

        console.log(`Offerta #${newOffer.id} da utente ${userId} per prodotto ${numericProductId}. Prezzo: €${numericPrice.toFixed(2)}. Compenso: ${compenso}`);

        return res.status(200).json({
            message: "Offerta di vendita ricevuta con successo!",
            offer: { prodottoId: numericProductId, estimatedPrice: numericPrice, conditions, tipoCompenso: compenso }
        });

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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.accettaOfferta = async (req, res) => {
    const id = req.params.id;

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

        await vendiModel.updateStatus(id, 'Accettata');


        await prodottoModel.ripristinaGiacenza(offerta.prodotto_id, 1);


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
