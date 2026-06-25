const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { bootId } = require("../utils/serverBoot");
const Indirizzo = require('../models/indirizziModel');
const CartaDiCredito = require('../models/cartaDiCreditoModel');
const AuthService = require('../services/authService');

const SECRET = process.env.JWT_SECRET || "supersecretkey";

// ─── Helper: normalizza i campi dell'utente (alias punti_fedelta) ─────────────
const normalizzaUtente = AuthService.normalizzaUtente;

// Email helpers (logica nel service) — esposte per le altre rotte del controller
exports.inviaEmailConferma = AuthService.inviaEmailConferma;
exports.inviaEmailBenvenuto = AuthService.inviaEmailBenvenuto;
exports.inviaEmailResetPassword = AuthService.inviaEmailResetPassword;

exports.register = async (req, res) => {
  try {
    const { nome, cognome, email, password } = req.body;
    const result = await AuthService.registerUser(nome, cognome, email, password);
    res.status(201).json(result);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    console.error("Errore durante la registrazione:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.confermaRegistrazione = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, SECRET);
    const existingUser = await User.findByEmail(decoded.email);
    if (!existingUser) {
        await User.create(decoded.nome, decoded.cognome, decoded.email, decoded.hashedPassword);
        exports.inviaEmailBenvenuto(decoded.email, decoded.nome, decoded.cognome);
    }
    res.redirect('http://localhost:4200/login');
  } catch (err) {
    console.error("Errore durante la conferma della registrazione:", err);
    res.status(400).send('<h2 style="font-family: Arial; text-align: center; margin-top: 50px;">Il link di conferma non è valido o è scaduto.</h2>');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Logging in user:", email);
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: "Credenziali non valide" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Credenziali non valide" }); // Rimosso securityStamp dal token
    const token = jwt.sign({ id: user.id, email: user.email, ruolo: user.ruolo, bootId }, SECRET, { expiresIn: "1h" });
    const { password: userPassword, ...safeUser } = user;
    res.json({ token, utente: normalizzaUtente(safeUser) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    const safeUsers = users.map(({ password, ...user }) => normalizzaUtente(user));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utente non trovato" });
    const { password, ...safeUser } = user;
    res.json(normalizzaUtente(safeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: dettaglio completo utente (profilo + indirizzi + carte oscurate + punti)
// GET /api/auth/:id/dettaglio
// ─────────────────────────────────────────────────────────────────────────────
exports.getUtenteDettaglio = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    const { password, ...safeUser } = user;

    const indirizzi = await Indirizzo.findByUserId(userId);
    const carte = await CartaDiCredito.findByUserId(userId);

    // Oscura numero carta (mostra solo ultimi 4 cifre) e CVV
    const carteOscurate = carte.map(c => ({
      id: c.id,
      nome_titolare: c.nome_titolare,
      data_scadenza: c.data_scadenza,
      numero_carta: '**** **** **** ' + String(c.numero_carta).slice(-4),
      cvv: '***'
    }));

    // normalizzaUtente aggiunge l'alias punti_fedelta = puntiFedelta
    res.json({ utente: normalizzaUtente(safeUser), indirizzi, carte: carteOscurate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: modifica punti fedeltà (delta positivo = aggiungi, negativo = sottrai)
// PUT /api/auth/:id/punti   body: { delta: number, nota?: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.modificaPuntiFedelta = async (req, res) => {
  try {
    const userId = req.params.id;
    const { delta, nota } = req.body;
    if (delta === undefined || isNaN(Number(delta))) {
      return res.status(400).json({ message: 'Il campo delta (numero intero) è obbligatorio' });
    }
    const result = await User.updatePuntiFedelta(userId, Number(delta));
    console.log(`[Admin] Punti fedeltà utente ${userId}: ${Number(delta) >= 0 ? '+' : ''}${delta} — ${nota || 'nessuna nota'}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: invia email reset password per conto dell'utente
// POST /api/auth/:id/reset-password-admin
// ─────────────────────────────────────────────────────────────────────────────
exports.inviaResetPasswordAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '15m' });
    await exports.inviaEmailResetPassword(user.email, token);
    console.log(`[Admin] Email reset password inviata a ${user.email} (id: ${userId})`);
    res.json({ message: 'Email di reset inviata a ' + user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN/OPERATORE: modifica un indirizzo salvato dell'utente
// PUT /api/auth/indirizzi/:id   body: { tipo, via, numero_civico, provincia, paese, cap }
// ─────────────────────────────────────────────────────────────────────────────
exports.aggiornaIndirizzoAdmin = async (req, res) => {
  try {
    const indirizzoId = req.params.id;
    const result = await Indirizzo.update(indirizzoId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.passwordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await AuthService.resetPassword(email);
    return res.status(200).json(result);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    console.error("Errore passwordReset:", err);
    return res.status(500).json({ message: "Errore interno durante il reset password." });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await AuthService.updatePassword(token, newPassword);
    return res.status(200).json(result);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ message: err.message });
    if (err.status === 404) return res.status(404).json({ message: err.message });
    console.error("Errore updatePassword:", err);
    return res.status(400).json({ message: "Il link di reset non è valido o è scaduto." });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.delete(userId);
    res.json(deletedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.admin = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUser = await User.rendiAdmin(userId);
    res.json(adminUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.user = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUser = await User.rendiUser(userId);
    res.json(adminUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
