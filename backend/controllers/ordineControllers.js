const ordineModel = require("../models/ordineModel");
const carrelloModel = require("../models/carrelloModel");

exports.getAllOrdini = async (req, res) => {
    try {
        const ordini = await ordineModel.findAll();
        res.json(ordini);
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getOrdineById = async (req, res) => {
    try {
        const id = req.params.id;
        const ordineData = await ordineModel.findById(id);
        if (!ordineData) {
            return res.status(404).json({ message: "Ordine non trovato" });
        }
        res.json(ordineData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getOrdiniByUserId = async (req, res) => {
    try {
        // Usiamo req.user.id per la sicurezza, così ogni utente può vedere solo i propri ordini
        const userId = req.user.id;
        const ordini = await ordineModel.findByUserId(userId);
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.createOrdine = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Recuperiamo i prodotti attualmente nel carrello
        const cartItems = await carrelloModel.findByUserId(userId);
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Il carrello è vuoto" });
        }

        // 2. Calcoliamo il totale e prepariamo l'oggetto ordine
        const totale = cartItems.reduce((acc, item) => acc + (item.prezzoUnitarioVendita * item.quantita), 0);
        const ordine = {
            utente_id: userId,
            data: new Date().toISOString().slice(0, 10), // Data corrente (es: 2024-05-18)
            totale: totale,
            statoOrdine: 'In elaborazione',
            acquisto_vendita: false // false = vendita all'utente finale
        };

        // 3. Creiamo l'ordine e spostiamo gli elementi nella tabella 'composto'
        const newOrdine = await ordineModel.create(ordine);
        for (const item of cartItems) {
            await ordineModel.addProdottoToOrdine(newOrdine.id, item.id, item.quantita, item.prezzoUnitarioVendita);
        }

        // 4. Svuotiamo il carrello dell'utente
        await carrelloModel.clearCart(userId);

        res.status(201).json(newOrdine);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
