const indirizzo = require('../models/indirizziModel');

exports.getAllIndirizzi = async (req, res) => {
    try {
        const indirizzi = await indirizzo.findAll();
        res.json(indirizzi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getIndirizzoById = async (req, res) => {
    try {
        const indirizzoId = req.params.id;
        const indirizzoData = await indirizzo.findById(indirizzoId);
        if (!indirizzoData) {
            return res.status(404).json({ message: "Indirizzo non trovato" });
        }
        res.json(indirizzoData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getIndirizziByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const indirizzi = await indirizzo.findByUserId(userId);
        res.json(indirizzi);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};  

exports.createIndirizzo = async (req, res) => {
    try {
        const userId = req.user.id;
        const indirizzoData = { 
            utente_id: userId,
            tipo: req.body.tipo || req.body.tipo_indirizzo,
            via: req.body.via || req.body.via_indirizzo,
            numero_civico: req.body.numero_civico || req.body.civico,
            provincia: req.body.provincia || req.body.provincia_indirizzo,
            paese: req.body.paese || req.body.paese_indirizzo,
            cap: req.body.cap || req.body.cap_indirizzo
        };
        const newIndirizzo = await indirizzo.create(indirizzoData);
        res.json(newIndirizzo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteIndirizzo = async (req, res) => {
    try {
        const indirizzoId = req.params.id;
        const deletedIndirizzo = await indirizzo.delete(indirizzoId);
        res.json(deletedIndirizzo);
    }catch (err) {
        // Controlla se l'errore è dovuto al fatto che l'indirizzo è presente in un ordine
        if (err.message && err.message.includes("FOREIGN KEY constraint failed")) {
            return res.status(400).json({ error: "Impossibile eliminare questo indirizzo perché è associato a uno o più ordini passati." });
        }
        res.status(500).json({ error: err.message });
    }
}