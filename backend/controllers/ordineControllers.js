const Ordine = require('../models/ordineModel');
const OrdineService = require('../services/ordineService');

exports.createOrdine = async (req, res) => {
    const userId = req.user.id;
    const { carta_id, indirizzo_id, coupon_codice } = req.body;

    try {
        const result = await OrdineService.createOrdine(userId, { carta_id, indirizzo_id, coupon_codice });
        res.status(201).json(result);
    } catch (error) {
        if (error.status === 400) {
            const body = { error: error.message };
            if (error.codice) body.codice = error.codice;
            return res.status(400).json(body);
        }
        console.error('Errore durante la creazione dell\'ordine:', error);
        res.status(500).json({ error: 'Errore interno del server durante la creazione dell\'ordine.' });
    }
};

exports.getProdottiOrdine = async (req, res) => {
    try {
        const ordineId = req.params.id;
        const ordine = await Ordine.findById(ordineId);
        if (!ordine) {
            return res.status(404).json({ error: 'Ordine non trovato.' });
        }
        if (ordine.utente_id !== req.user.id && req.user.ruolo !== 'admin') {
            return res.status(403).json({ error: 'Accesso non autorizzato.' });
        }
        const prodotti = await Ordine.getProdottiByOrdineId(ordineId);
        res.json(prodotti);
    } catch (err) {
        console.error('Errore getProdottiOrdine:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatoOrdine = async (req, res) => {
    const { ordineId, nuovoStato } = req.body;

    try {
        const result = await OrdineService.updateStatoOrdine(ordineId, nuovoStato);
        res.json(result);
    } catch (error) {
        if (error.status === 404) return res.status(404).json({ error: error.message });
        console.error('Errore aggiornamento stato ordine:', error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'ordine.' });
    }
};

exports.getAllOrdini = async (req, res) => {
    try {
        const ordini = await Ordine.findAll();
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrdineById = async (req, res) => {
    try {
        const id = req.params.id;
        const ordineData = await Ordine.findById(id);
        if (!ordineData) {
            return res.status(404).json({ message: "Ordine non trovato" });
        }
        res.json(ordineData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrdiniByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const ordini = await Ordine.findByUserId(userId);
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
