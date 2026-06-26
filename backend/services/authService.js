const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const nodemailer = require('nodemailer');

const SECRET = process.env.JWT_SECRET || "supersecretkey";

function normalizzaUtente(user) {
  if (!user) return user;
  return {
    ...user,

    punti_fedelta: user.puntiFedelta ?? user.punti_fedelta ?? 0
  };
}
exports.normalizzaUtente = normalizzaUtente;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pawerupecommerce@gmail.com',
        pass: 'btns oosq omhr wuqm'
    }
});


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


exports.inviaEmailResetPassword = async function(emailUtente, token) {
    const linkReset = `http://localhost:4200/reset-password/${token}`;
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


exports.registerUser = async (nome, cognome, email, password) => {
  if (!email || !password) {
    const err = new Error("Email e password sono obbligatori");
    err.status = 400;
    throw err;
  }
  console.log("Registering user:", email);
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    const err = new Error("Email già registrata");
    err.status = 400;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign({ nome, cognome, email, hashedPassword }, SECRET, { expiresIn: "24h" });
  await exports.inviaEmailConferma(email, nome, cognome, token);
  return { message: "Controlla la tua email per completare la registrazione." };
};


exports.resetPassword = async (email) => {
  if (!email) {
    const err = new Error("Email obbligatoria");
    err.status = 400;
    throw err;
  }
  const user = await User.findByEmail(email);
  if (!user) {
    console.log(`Richiesta reset password per email non presente: ${email}`);
    return { message: "Se l'email è corretta, riceverai a breve le istruzioni per il reset." };
  }
  console.log(`Richiesta reset password per utente: ${email} (id: ${user.id})`);
  const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: "15m" });
  await exports.inviaEmailResetPassword(email, token);
  return { message: "Se l'email è corretta, riceverai a breve le istruzioni per il reset." };
};


exports.updatePassword = async (token, nuovaPassword) => {
  if (!token || !nuovaPassword) {
    const err = new Error("Dati mancanti per il reset della password.");
    err.status = 400;
    throw err;
  }
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch (err) {
    const error = new Error("Il link di reset non è valido o è scaduto.");
    error.status = 400;
    throw error;
  }

  const user = await User.findByEmail(decoded.email);
  if (!user) {
    const err = new Error("Utente non trovato.");
    err.status = 404;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(nuovaPassword, 10);
  await User.updatePassword(user.id, hashedPassword); 
  return { message: "Password aggiornata con successo." };
};
