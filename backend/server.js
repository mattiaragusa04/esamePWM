const express = require('express');
const cors = require('cors');
const db = require('./db/database.js');
const app = express();

const PORT = 3000;

app.use(cors());
app.use (express.json());

app.get('/', (req, res) => {
    res.send('Server attivo');
});

// Rotta API temporanea per vedere tutti gli utenti registrati
app.get('/api/utenti', (req, res) => {
    db.all(`SELECT * FROM utente`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ utenti: rows });
    });
});

//Rotta API per il form dei contatti
app.post('/api/contatto',(req, res) => {
    const {nome, email, messaggio } = req.body;
    const sql = 'INSERT INTO messaggio_contatto (nome, email, messaggio) VALUES (?,?,?)';
    db.run(sql, [nome, email, messaggio], function(err) {
        if(err){
            console.error(err.message);
            return res.status(500).json({error: "Errore nel salvataggio del messaggio."});
        }
        res.status(201).json({ message: "Messaggio Ricevuto! Ti risponderemo al più presto"});
    });
});

// Rotta API per la registrazione
app.post('/api/register', (req, res) => {
    // Estraiamo i dati dal corpo della richiesta
    const { nome, cognome, email, password } = req.body;
    const {tipo, via, numero_civico, provincia, paese, cap} = req.body.indirizzo; // Dati dell'indirizzo
    // Query per inserire l'utente nel database
    const sql = `INSERT INTO utente (nome, cognome, email, password) VALUES (?, ?, ?, ?)`;
    const sqlCheckEmail = `SELECT * FROM utente WHERE email = ?`;
    const sqlInsertIndirizzo = `INSERT INTO indirizzo (utente_id, tipo, via, numero_civico, provincia, paese, cap) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    // Prima controlliamo se l'email è già registrata
    db.get(sqlCheckEmail, [email], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Errore durante la registrazione." });
        }
        if (row) {
            return res.status(400).json({ error: "Email già registrata." });
        }
    });
    // Usiamo db.run per eseguire l'inserimento
    db.run(sql, [nome, cognome, email, password], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Errore durante la registrazione." });
        }
        // this.lastID contiene l'ID generato automaticamente per questo nuovo utente
        res.status(201).json({ message: "Registrazione completata!", utenteId: this.lastID });
    });

    // Inseriamo l'indirizzo associato all'utente appena creato
    db.run(sqlInsertIndirizzo, [this.lastID, tipo, via, numero_civico, provincia, paese, cap], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Errore durante l'inserimento dell'indirizzo." });
        }
    });
    
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Rotta API per il login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = `SELECT * FROM utente WHERE email = ? AND password = ?`;
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Errore durante il login." });
        }
        if (row) {
            res.json({ message: "Login riuscito!", utente: row });
        } else {
            res.status(401).json({error : "Credenziali non valide."});
        }
    });
});