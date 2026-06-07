const carrelloModel = require('../models/carrelloModel');

exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId, quantita } = req.body;
        const item = await carrelloModel.addItem(userId, prodottoId, quantita);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId } = req.body;
        const item = await carrelloModel.removeItem(userId, prodottoId);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { prodottoId, quantita } = req.body;
        const item = await carrelloModel.updateItem(userId, prodottoId, quantita);
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
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