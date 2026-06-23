const jwt = require('jsonwebtoken');
const { bootId } = require('../utils/serverBoot');
const User = require('../models/userModel');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token non fornito o malformato.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, SECRET);

        // 1. Verifica che il token sia stato emesso dopo l'ultimo riavvio del server
        if (decoded.bootId !== bootId) {
            return res.status(401).json({ message: 'Sessione scaduta a causa di un aggiornamento del server. Effettua nuovamente il login.' });
        }

        // 2. Verifica che il security stamp non sia cambiato (es. dopo reset password)
        const user = await User.findById(decoded.id);
        if (!user || decoded.securityStamp !== user.security_stamp) {
            return res.status(401).json({ message: 'La sessione è stata invalidata per motivi di sicurezza. Effettua nuovamente il login.' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token non valido o scaduto.' });
    }
};

module.exports = authMiddleware;