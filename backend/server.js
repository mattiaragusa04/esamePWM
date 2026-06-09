require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const seedDatabase = require('./db/seeding'); // 1. Importa il file di seeding
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const prodottiRoutes = require('./routes/prodottiRoutes');
const ordineRoutes = require('./routes/ordineRoutes');
const carrelloRoutes = require('./routes/carrelloRoutes');
const cartaDiCreditoRoutes = require('./routes/cartaDiCreditoRoutes');
const vendiRoutes = require('./routes/vendiRoutes');
const indirizzoRoutes = require('./routes/indirizzoRoutes');



const app = express();

app.use(cors({
  origin: "*", 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Permette al server di leggere dati in formato JSON

// Rende pubblica la cartella "public" del backend per servire le immagini statiche
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/prodotti', prodottiRoutes); 

app.use('/api/ordine', ordineRoutes);

app.use('/api/carrello', carrelloRoutes);

app.use('/api/carta', cartaDiCreditoRoutes);

app.use('/api/vendi', vendiRoutes);

app.use('/api/indirizzo', indirizzoRoutes);
// Rotta di prova
app.get('/', (req, res) => {
    res.send('Il server è attivo e funzionante!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
    // 3. Avvia il popolamento del DB se le tabelle sono vuote
    seedDatabase(); 

    // Aggiorna automaticamente le quantità fisse (20) con valori casuali nel database
    db.run("UPDATE prodotto SET giacenza = ABS(RANDOM() % 100) + 1 WHERE giacenza = 20", function(err) {
        if (!err && this.changes > 0) {
            console.log(`Aggiornate le giacenze di ${this.changes} prodotti a valori casuali!`);
        }
    });
});