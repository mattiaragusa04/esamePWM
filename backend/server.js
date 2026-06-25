require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./db/database');
const path    = require('path');
const seedDatabase = require('./db/seeding');

const authRoutes          = require('./routes/authRoutes');
const prodottiRoutes      = require('./routes/prodottiRoutes');
const ordineRoutes        = require('./routes/ordineRoutes');
const carrelloRoutes      = require('./routes/carrelloRoutes');
const cartaDiCreditoRoutes = require('./routes/cartaDiCreditoRoutes');
const vendiRoutes         = require('./routes/vendiRoutes');
const indirizzoRoutes     = require('./routes/indirizzoRoutes');
const couponRoutes        = require('./routes/couponRoutes');
const recensioneRoutes    = require('./routes/recensioneRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth',        authRoutes);
app.use('/api/prodotti',    prodottiRoutes);
app.use('/api/ordine',      ordineRoutes);
app.use('/api/carrello',    carrelloRoutes);
app.use('/api/carta',       cartaDiCreditoRoutes);
app.use('/api/vendi',       vendiRoutes);
app.use('/api/indirizzo',   indirizzoRoutes);
app.use('/api/coupon',      couponRoutes);
app.use('/api/recensioni',  recensioneRoutes);

app.get('/', (req, res) => res.send('Il server è attivo e funzionante!'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);

  // ── Migrazioni sicure (idempotenti) ─────────────────────────────
  const migrations = [
    // Colonna pagato_con_punti su ordine
    `ALTER TABLE ordine ADD COLUMN pagato_con_punti INTEGER DEFAULT 0`,
    // Colonna costo_punti su Coupon (per coupon fedeltà)
    `ALTER TABLE Coupon ADD COLUMN costo_punti INTEGER DEFAULT 0`,
    // Colonna disponibile su Coupon (-1 = illimitata)
    `ALTER TABLE Coupon ADD COLUMN disponibile INTEGER DEFAULT -1`,
    // FIX: Colonna pagato_con_punti su composto per tracciare i singoli articoli pagati con punti
    `ALTER TABLE composto ADD COLUMN pagato_con_punti INTEGER DEFAULT 0`,
    // FEAT: Tabella recensione - ricrea con vincoli corretti se non esiste
    `CREATE TABLE IF NOT EXISTS recensione (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      utente_id   INTEGER NOT NULL UNIQUE,
      testo       TEXT NOT NULL,
      voto        INTEGER NOT NULL CHECK(voto BETWEEN 1 AND 5),
      data        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (utente_id) REFERENCES utente(id)
    )`,
  ];

  migrations.forEach(sql => {
    db.run(sql, err => {
      if (err && !err.message.includes('duplicate column') && !err.message.includes('already exists')) {
        console.error('Migrazione fallita:', err.message);
      }
    });
  });

  // Richiama il popolamento iniziale del database se vuoto
  seedDatabase();
});
