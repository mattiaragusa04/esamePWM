const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecretkey";

module.exports = (req, res, next) => {


    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "Accesso negato" });
    }

    const token = authHeader.split(" ")[1];

    try {

        console.log("Token ricevuto:", token);
        console.log("SECRET usata per la verifica:", SECRET);

        const verified = jwt.verify(token, SECRET);

        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token non valido o scaduto" });
    }
};