const cartaDiCredito = require('../models/cartaDiCreditoModel');

exports.getAllCarte = async (req, res) => {
    try {
        const cart = await cartaDiCredito.findAll();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCartaById = async (req, res) => {
    try {
        const id = req.params.id;
        const cart = await cartaDiCredito.findById(id);
        if (!cart) {
            return res.status(404).json({ message: "Carta di credito non trovata" });
        }
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCarteByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cartaDiCredito.findByUserId(userId);
        res.json(cart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCarta = async (req, res) => {
    try {
        const userId = req.user.id;
        const numCarta = req.body.numeroCarta || req.body.numero_carta;
        // Il frontend passa salvaCarta (true/false), lo convertiamo in 0/1 per SQLite
        // Default 1 (salvata) se il campo non viene inviato (es. da altre parti dell'app)
        const salvato = req.body.salvaCarta === false || req.body.salvato === 0 ? 0 : 1;
        const cartaData = {
            utente_id: userId,
            numero_carta: numCarta ? numCarta.replace(/\s+/g, '') : '',
            nome_titolare: req.body.nomeCarta || req.body.nome_titolare,
            data_scadenza: req.body.scadenza || req.body.data_scadenza,
            cvv: req.body.cvv,
            salvato
        };
        const newCart = await cartaDiCredito.create(cartaData);
        res.json(newCart);
    } catch (err) {
        console.error("Errore salvataggio carta nel DB:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateCarta = async (req, res) => {
    try {
        const userId = req.user.id;
        const cartId = req.params.id;
        const cartaData = { ...req.body, id: cartId, utente_id: userId };
        const updatedCart = await cartaDiCredito.update(cartaData);
        res.json(updatedCart);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCarta = async (req, res) => {
    try {
        const cartId = req.params.id;
        const result = await cartaDiCredito.delete(cartId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
