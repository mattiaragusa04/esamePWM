require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

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
});
