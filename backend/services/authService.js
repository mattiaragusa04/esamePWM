const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const nodemailer  = require('nodemailer');
const User        = require('../models/userModel');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

// ── Nodemailer ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pawerupecommerce@gmail.com',
    pass: 'btns oosq omhr wuqm'
  }
});

// ── Helper: normalizza campi utente (aggiunge alias punti_fedelta) ────────────
exports.normalizzaUtente = function (user) {
  if (!user) return user;
  return {
    ...user,
    punti_fedelta: user.puntiFedelta ?? user.punti_fedelta ?? 0
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Email: conferma registrazione
// ─────────────────────────────────────────────────────────────────────────────
exports.inviaEmailConferma = async function (emailUtente, nomeUtente, cognomeUtente, token) {
  const linkConferma = `http://localhost:3000/api/auth/conferma/${token}`;
  const mailOptions = {
    from: '"PAwerUP Store" <pawerupecommerce@gmail.com>',
    to: emailUtente,
    subject: 'Conferma la tua registrazione su PAwerUP',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; background-color: #f8fafc;">
        <h1 style="color: #f86ded; text-align: center;">PAwerUP</h1>
        <div style="background-color: #ffffff; padding: 25px; border-radius: 10px;">
          <h2>Ciao ${nomeUtente} ${cognomeUtente}! 👋</h2>
          <p>Grazie per esserti registrato su <strong>PAwerUP</strong>. Clicca sul pulsante per attivare il tuo account:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkConferma}" style="background: linear-gradient(135deg, #f86ded, #fb7185); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold;">Conferma la registrazione</a>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">Se non hai richiesto tu questa registrazione, ignora questa email.</p>
      </div>`
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('[AuthService] Email conferma inviata a: ' + emailUtente);
    return true;
  } catch (error) {
    console.error('[AuthService] Errore invio email conferma:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Email: benvenuto dopo conferma
// ─────────────────────────────────────────────────────────────────────────────
exports.inviaEmailBenvenuto = function (emailUtente, nomeUtente, cognomeUtente) {
  const mailOptions = {
    from: '"PAwerUP Store" <pawerupecommerce@gmail.com>',
    to: emailUtente,
    subject: 'Conferma avvenuta registrazione su PAwerUP',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; background-color: #f8fafc;">
        <h1 style="color: #f86ded; text-align: center;">PAwerUP</h1>
        <div style="background-color: #ffffff; padding: 25px; border-radius: 10px;">
          <h2>Benvenuto a bordo, ${nomeUtente} ${cognomeUtente}! 🎮</h2>
          <p>La tua registrazione su <strong>PAwerUP</strong> è avvenuta con successo. Il tuo account è attivo.</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:4200/login" style="background: linear-gradient(135deg, #f86ded, #fb7185); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold;">Accedi al tuo Account</a>
        </div>
      </div>`
  };
  transporter.sendMail(mailOptions, (error) => {
    if (error) console.error('[AuthService] Errore invio email benvenuto:', error);
    else console.log('[AuthService] Email benvenuto inviata a: ' + emailUtente);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Email: reset password
// ─────────────────────────────────────────────────────────────────────────────
exports.inviaEmailResetPassword = async function (emailUtente, token) {
  const linkReset = `http://localhost:4200/#/reset-password/${token}`;
  const mailOptions = {
    from: '"PAwerUP Store" <pawerupecommerce@gmail.com>',
    to: emailUtente,
    subject: 'Reset della tua password su PAwerUP',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 15px; padding: 20px; background-color: #f8fafc;">
        <h1 style="color: #f86ded; text-align: center;">PAwerUP</h1>
        <div style="background-color: #ffffff; padding: 25px; border-radius: 10px;">
          <h2>Richiesta di reset password</h2>
          <p>Clicca sul pulsante per impostare una nuova password:</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${linkReset}" style="background: linear-gradient(135deg, #f86ded, #fb7185); color: white; padding: 14px 28px; text-decoration: none; border-radius: 50px; font-weight: bold;">Reimposta Password</a>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">Se non hai richiesto tu il reset, ignora questa email. Il link scadrà tra 15 minuti.</p>
      </div>`
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('[AuthService] Email reset password inviata a: ' + emailUtente);
    return true;
  } catch (error) {
    console.error('[AuthService] Errore invio email reset password:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Logica registrazione: hash password + token JWT + invio email conferma
// ─────────────────────────────────────────────────────────────────────────────
exports.register = async (nome, cognome, email, password) => {
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    const err = new Error('Email già registrata'); err.status = 400; throw err;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign({ nome, cognome, email, hashedPassword }, SECRET, { expiresIn: '24h' });
  await exports.inviaEmailConferma(email, nome, cognome, token);
};

// ─────────────────────────────────────────────────────────────────────────────
// Logica reset password: trova utente, genera token, invia email
// ─────────────────────────────────────────────────────────────────────────────
exports.richiestaResetPassword = async (email) => {
  const user = await User.findByEmail(email);
  if (!user) {
    console.log(`[AuthService] Reset password per email non trovata: ${email}`);
    return; // Non rivela se l'email esiste o meno
  }
  const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '15m' });
  await exports.inviaEmailResetPassword(email, token);
  console.log(`[AuthService] Reset password richiesto per: ${email} (id: ${user.id})`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Logica aggiornamento password: verifica token, hash nuova password, salva
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, SECRET); // lancia errore se token non valido
  const user = await User.findByEmail(decoded.email);
  if (!user) {
    const err = new Error('Utente non trovato.'); err.status = 404; throw err;
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(decoded.email, hashedPassword);
};
