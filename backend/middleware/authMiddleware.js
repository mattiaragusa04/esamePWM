const jwt = require("jsonwebtoken");
const { bootId } = require("../utils/serverBoot");

const SECRET = process.env.JWT_SECRET || "supersecretkey";

module.exports = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "Accesso negato" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const verified = jwt.verify(token, SECRET);

        if (verified.bootId && verified.bootId !== bootId) {
            return res.status(401).json({ message: "Sessione scaduta. Effettua nuovamente il login.", code: "SERVER_RESTARTED" });
        }

        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token non valido o scaduto" });
    }
};