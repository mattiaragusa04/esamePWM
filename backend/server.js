const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const seedDatabase = require('./db/seeding'); // 1. Importa il file di seeding

const authRoutes = require('./routes/authRoutes');
const prodottiRoutes = require('./routes/prodottiRoutes');

const app = express();

// Middleware
// app.use(cors());

app.use(cors({
  origin: "*", 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Permette al server di leggere dati in formato JSON

// Routes
app.use('/api/auth', authRoutes);
// Collega le rotte dei prodotti
app.use('/api/prodotti', prodottiRoutes); 

// Rotta di prova
app.get('/', (req, res) => {
    res.send('Il server è attivo e funzionante!');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
    // 3. Avvia il popolamento del DB se le tabelle sono vuote
    seedDatabase(); 
});