module.exports = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({ message: "Non autenticato" });
    }
    if (req.user.ruolo !== 'admin') {
        return res.status(403).json({ message: "Accesso negato: richiedono privilegi di amministratore" });
    }
    next();
};