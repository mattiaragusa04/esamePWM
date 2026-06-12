const bcrypt = require("bcrypt"); // per criptare le informazioni
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const nodemailer = require('nodemailer');
const { bootId } = require("../utils/serverBoot");

const SECRET = process.env.JWT_SECRET || "supersecretkey";

// 1. Configurazione del Trasportatore per le Email
const transporter = nodemailer.createTransport({
    service: 'gmail', // Puoi usare anche 'outlook', 'hotmail', 'yahoo', ecc.
    auth: {
        user: 'pawerupecommerce@gmail.com', 
        pass: 'btns oosq omhr wuqm' // generata una "Password per le app" da Google Account
    }
});

// 2. Funzione per inviare l'email con un bel template HTML
function inviaEmailBenvenuto(emailUtente, nomeUtente) {
    const mailOptions = {
        from: '"PAwerUP Store" <la_tua_email_del_negozio@gmail.com>',
        to: emailUtente,
        subject: 'Conferma avvenuta registrazione su PAwerUP',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 15px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f86ded; margin: 0;">PAwerUP</h1>
                </div>
                <h2 style="color: #0f172a;">Benvenuto a bordo, ${nomeUtente}! 🎮</h2>
                <p style="font-size: 16px; line-height: 1.5;">Siamo felicissimi di confermarti che la tua registrazione su <strong>PAwerUP</strong> è avvenuta con successo.</p>
                <p style="font-size: 16px; line-height: 1.5;">Il tuo account è ora attivo e pronto per permetterti di esplorare il nostro catalogo di console, videogiochi, accessori ed elettronica.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:4200/login" style="background-color: #f86ded; color: white; padding: 12px 25px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">Accedi subito al tuo Account</a>
                </div>
                
                <p style="font-size: 14px; color: #64748b;">Se hai bisogno di assistenza, non esitare a contattarci rispondendo a questa email.</p>
                <br>
                <p style="font-size: 14px; margin-bottom: 0;">Buon divertimento,</p>
                <p style="font-size: 16px; margin-top: 5px; font-weight: bold; color: #0f172a;">Il team di PAwerUP</p>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Errore durante l\'invio dell\'email di benvenuto:', error);
        } else {
            console.log('Email di benvenuto inviata con successo a: ' + emailUtente);
        }
    });
}

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

    // Quando il database conferma l'inserimento, spara l'email!
    inviaEmailBenvenuto(email, nome);

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

    const token = jwt.sign({ id: user.id, email: user.email, ruolo: user.ruolo, bootId }, SECRET, {
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

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.delete(userId);
    res.json(deletedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}