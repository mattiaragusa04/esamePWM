const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const nodemailer = require('nodemailer');
const { bootId } = require("../utils/serverBoot");
const db = require('../db/database');
const Indirizzo = require('../models/indirizziModel');
const CartaDiCredito = require('../models/cartaDiCreditoModel');

const SECRET = process.env.JWT_SECRET || "supersecretkey";

// ─── Helper: normalizza i campi dell'utente verso snake_case
// Il DB usa 'puntiFedelta' (camelCase), ma il frontend si aspetta 'punti_fedelta'.
// Questa funzione aggiunge l'alias senza modificare lo schema DB.
function normalizzaUtente(user) {
  if (!user) return user;
  return {
    ...user,
    // Espone il valore sia col nome DB originale sia con quello che il frontend si aspetta
    punti_fedelta: user.puntiFedelta ?? user.punti_fedelta ?? 0
  };
}

// 1. Configurazione del Trasportatore per le Email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pawerupecommerce@gmail.com',
        pass: 'btns oosq omhr wuqm'
    }
});

// 2. Funzione per inviare la prima email (Conferma registrazione)
exports.inviaEmailConferma = async function(emailUtente, nomeUtente, cognomeUtente, token) {
    const linkConferma = `http://localhost:3000/api/auth/conferma/${token}`;
    const mailOptions = {
        from: '"PAwerUP Store" <pawerupecommerce@gmail.com>',
        to: emailUtente,
        subject: 'Conferma la tua registrazione su PAwerUP',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; box-shadow: 0 8px 16px rgba(0,0,0,0.05); background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f86ded; margin: 0; font-size: 32px;">PAwerUP</h1>
                </div>
                <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <h2 style="color: #0f172a; margin-top: 0;">Ciao ${nomeUtente} ${cognomeUtente}! 👋</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #475569;">Grazie per esserti registrato su <strong>PAwerUP</strong>. Per confermare la tua iscrizione e attivare l'account, clicca sul pulsante qui sotto:</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${linkConferma}" style="background: linear-gradient(135deg, #f86ded, #fb7185); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(248, 109, 237, 0.3);">Conferma la registrazione</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 14px; color: #64748b; text-align: center;">Se non hai richiesto tu questa registrazione, ignora pure questa email.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email di conferma inviata con successo a: ' + emailUtente);
        return true;
    } catch (error) {
        console.error('Errore durante l\'invio dell\'email di conferma:', error);
        throw error;
    }
}

// 3. Funzione per inviare l'email di benvenuto
exports.inviaEmailBenvenuto = function(emailUtente, nomeUtente, cognomeUtente) {
    const mailOptions = {
        from: '"PAwerUP Store" <pawerupecommerce@gmail.com>',
        to: emailUtente,
        subject: 'Conferma avvenuta registrazione su PAwerUP',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; box-shadow: 0 8px 16px rgba(0,0,0,0.05); background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f86ded; margin: 0; font-size: 32px;">PAwerUP</h1>
                </div>
                <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <h2 style="color: #0f172a; margin-top: 0;">Benvenuto a bordo, ${nomeUtente} ${cognomeUtente}! 🎮</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #475569;">Siamo felicissimi di confermarti che la tua registrazione su <strong>PAwerUP</strong> è avvenuta con successo.</p>
                    <p style="font-size: 16px; line-height: 1.6; color: #475569;">Il tuo account è ora attivo e pronto per permetterti di esplorare il nostro catalogo. Ecco cosa troverai nel nostro store:</p>
                    <ul style="font-size: 16px; color: #475569; padding-left: 20px; line-height: 1.6;">
                        <li>🕹️ <strong>Console Next-Gen e Retrò:</strong> PlayStation, Xbox, Nintendo e molto altro...</li>
                        <li>👾 <strong>Videogiochi:</strong> Le ultime uscite e i grandi classici, nuovi e usati.</li>
                        <li>🎧 <strong>Elettronica:</strong> Periferiche gaming, cuffie, smartwatch, videocamere...</li>
                        <li>✨​ <strong>Accessori:</strong> Cover, cavi, caricabatterie e kit pulizie.</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:4200/login" style="background: linear-gradient(135deg, #f86ded, #fb7185); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(248, 109, 237, 0.3);">Accedi subito al tuo Account</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 14px; color: #64748b; text-align: center;">Hai bisogno di assistenza o hai qualche domanda? <br><a href="http://localhost:4200/contattaci" style="color: #f86ded; text-decoration: none; font-weight: bold;">Visita la nostra pagina Contattaci</a> oppure rispondi direttamente a questa email.</p>
                <br>
                <div style="text-align: center;">
                    <p style="font-size: 14px; margin-bottom: 0; color: #64748b;">Buon divertimento,</p>
                    <p style="font-size: 16px; margin-top: 5px; font-weight: bold; color: #0f172a;">Il team di PAwerUP</p>
                </div>
            </div>
        `
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('Errore durante l\'invio dell\'email di benvenuto:', error);
        else console.log('Email di benvenuto inviata con successo a: ' + emailUtente);
    });
}

// 4. Funzione per inviare l'email di reset password
exports.inviaEmailResetPassword = async function(emailUtente, token) {
    const linkReset = `http://localhost:4200/#/reset-password/${token}`;
    const mailOptions = {
        from: '"PAwerUP Store" <pawerupecommerce@gmail.com>',
        to: emailUtente,
        subject: 'Reset della tua password su PAwerUP',
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; box-shadow: 0 8px 16px rgba(0,0,0,0.05); background-color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #f86ded; margin: 0; font-size: 32px;">PAwerUP</h1>
                </div>
                <div style="background-color: #ffffff; padding: 25px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <h2 style="color: #0f172a; margin-top: 0;">Richiesta di reset password</h2>
                    <p style="font-size: 16px; line-height: 1.6; color: #475569;">Hai richiesto il reset della tua password su <strong>PAwerUP</strong>. Clicca sul pulsante qui sotto per impostare una nuova password:</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${linkReset}" style="background: linear-gradient(135deg, #f86ded, #fb7185); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(248, 109, 237, 0.3);">Reimposta Password</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 14px; color: #64748b; text-align: center;">Se non hai richiesto tu il reset, ignora questa email. Il link scadrà tra 15 minuti.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email di reset password inviata con successo a: ' + emailUtente);
        return true;
    } catch (error) {
        console.error('Errore durante l\'invio dell\'email di reset password:', error);
        throw error;
    }
}

exports.register = async (req, res) => {
  try {
    const { nome, cognome, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email e password sono obbligatori" });
    console.log("Registering user:", email);
    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email già registrata" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ nome, cognome, email, hashedPassword }, SECRET, { expiresIn: "24h" });
    await exports.inviaEmailConferma(email, nome, cognome, token);
    res.status(201).json({ message: "Controlla la tua email per completare la registrazione." });
  } catch (err) {
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
    if (!isMatch) return res.status(400).json({ message: "Credenziali non valide" });
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
    if (!email) return res.status(400).json({ message: "Email obbligatoria" });
    const user = await User.findByEmail(email);
    if (!user) {
      console.log(`Richiesta reset password per email non presente: ${email}`);
      return res.status(200).json({ message: "Se l'email è corretta, riceverai a breve le istruzioni per il reset." });
    }
    console.log(`Richiesta reset password per utente: ${email} (id: ${user.id})`);
    const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: "15m" });
    await exports.inviaEmailResetPassword(email, token);
    return res.status(200).json({ message: "Se l'email è corretta, riceverai a breve le istruzioni per il reset." });
  } catch (err) {
    console.error("Errore passwordReset:", err);
    return res.status(500).json({ message: "Errore interno durante il reset password." });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Dati mancanti per il reset della password." });
    const decoded = jwt.verify(token, SECRET);
    const email = decoded.email;
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ message: "Utente non trovato." });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(user.id, hashedPassword);
    return res.status(200).json({ message: "Password aggiornata con successo." });
  } catch (err) {
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

exports.operatore = async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUser = await User.rendiOperatore(userId);
    res.json(adminUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
