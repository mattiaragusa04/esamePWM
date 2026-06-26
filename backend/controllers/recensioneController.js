const Recensione = require('../models/recensioneModel');
const Ordine = require('../models/ordineModel');


exports.creaRecensione = async (req, res) => {
    const utente_id = req.user.id;
    const { testo, voto } = req.body;

    if (!testo || testo.trim() === '') {
        return res.status(400).json({ error: 'Il testo della recensione è obbligatorio.' });
    }
    if (!voto || voto < 1 || voto > 5) {
        return res.status(400).json({ error: 'Il voto deve essere compreso tra 1 e 5.' });
    }

    try {
        const ordini = await Ordine.findByUserId(utente_id);
        const haOrdineConsegnato = ordini.some(o => o.statoOrdine === 'Consegnato');

        if (!haOrdineConsegnato) {
            return res.status(403).json({
                error: 'Puoi lasciare una recensione solo dopo aver ricevuto almeno un ordine.'
            });
        }

        const esistente = await Recensione.findByUserId(utente_id);

        if (esistente) {
            await Recensione.update(utente_id, testo.trim(), Number(voto));
            return res.status(200).json({ message: 'Recensione aggiornata con successo.' });
        } else {
            const nuova = await Recensione.create(utente_id, testo.trim(), Number(voto));
            return res.status(201).json({ message: 'Recensione creata con successo.', recensione: nuova });
        }
    } catch (error) {
        console.error('Errore creaRecensione:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
};


exports.getRecensioni = async (req, res) => {
    try {
        const recensioni = await Recensione.findAll();
        res.json(recensioni);
    } catch (error) {
        console.error('Errore getRecensioni:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
};


exports.getMiaRecensione = async (req, res) => {
    const utente_id = req.user.id;
    try {
        const recensione = await Recensione.findByUserId(utente_id);
        res.json({ recensione: recensione || null });
    } catch (error) {
        console.error('Errore getMiaRecensione:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
};
