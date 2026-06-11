const bcrypt = require("bcrypt"); // per criptare le informazioni
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.register = async (req, res) => {
  try {
    const { nome, cognome, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password sono obbligatori" });
    }

    console.log("Registering user:", email);

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(nome, cognome, email, hashedPassword);

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Logging in user:", email);

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Credenziali non valide" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, ruolo: user.ruolo }, SECRET, {
      expiresIn: "1h"
    });

    // Rimuoviamo la password prima di inviare i dati al frontend
    const { password: userPassword, ...safeUser } = user;
    res.json({ token, utente: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    // Rimuoviamo la password da ogni utente prima di inviare i dati
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const { password, ...safeUser } = user;

    res.json(safeUser);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Richiesta di reset password
 * 
 * Non cambia i tuoi modelli:
 * - usa User.findByEmail(email)
 * - non rivela se l'email esiste o meno
 * - per ora logga la richiesta sul server
 */
exports.passwordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email obbligatoria" });
    }

    const user = await User.findByEmail(email);

    // Non riveliamo se l'utente esiste, per sicurezza
    if (!user) {
      console.log(`Richiesta reset password per email non presente: ${email}`);
      return res.status(200).json({
        message: "Se l’email è corretta, riceverai a breve le istruzioni per il reset."
      });
    }

    console.log(`Richiesta reset password per utente: ${email} (id: ${user.id})`);

    // Qui potresti:
    // - generare un token di reset e salvarlo su DB
    // - inviare una mail con il link di reset
    // Per l'esame basta la risposta generica

    return res.status(200).json({
      message: "Se l’email è corretta, riceverai a breve le istruzioni per il reset."
    });
  } catch (err) {
    console.error("Errore passwordReset:", err);
    return res.status(500).json({ message: "Errore interno durante il reset password." });
  }
};