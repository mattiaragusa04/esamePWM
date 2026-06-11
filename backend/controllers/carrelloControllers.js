const carrelloModel = require('../models/carrelloModel');

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId, quantita, condizione } = req.body;
        const item = await carrelloModel.addItem(userId, prodottoId, quantita, condizione);
        res.json(item);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message, disponibili: err.disponibili, giacenza: err.giacenza });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId, condizione } = req.body;
        const item = await carrelloModel.removeItem(userId, prodottoId, condizione);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId, quantita, condizione } = req.body;
        const item = await carrelloModel.updateItem(userId, prodottoId, quantita, condizione);
        res.json(item);
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({ error: err.message, giacenza: err.giacenza });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await carrelloModel.clearCart(userId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCartItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await carrelloModel.findByUserId(userId);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};