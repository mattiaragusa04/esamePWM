const db = require('../db/database');
const User = require('../models/userModel');
const Ordine = require('../models/ordineModel');
const Prodotto = require('../models/prodottoModel');

// Catalogo coupon fissi acquistabili con punti
const COUPON_CATALOGO = [
  { id: 'c5',  percentuale: 5,  costoInPunti: 50,  descrizione: 'Sconto del 5% su qualsiasi ordine' },
  { id: 'c10', percentuale: 10, costoInPunti: 90,  descrizione: 'Sconto del 10% su qualsiasi ordine' },
  { id: 'c15', percentuale: 15, costoInPunti: 130, descrizione: 'Sconto del 15% su qualsiasi ordine' },
  { id: 'c20', percentuale: 20, costoInPunti: 160, descrizione: 'Sconto del 20% su qualsiasi ordine' },
  { id: 'c25', percentuale: 25, costoInPunti: 190, descrizione: 'Sconto del 25% su qualsiasi ordine' },
];

// GET /api/fedelta/catalogo-coupon
exports.getCatalogoCoupon = (req, res) => {
  res.json(COUPON_CATALOGO);
};

// POST /api/fedelta/acquista-coupon  { catalogoId }
exports.acquistaCoupon = async (req, res) => {
  const userId = req.user.id;
  const { catalogoId } = req.body;

  const voce = COUPON_CATALOGO.find(c => c.id === catalogoId);
  if (!voce) return res.status(400).json({ error: 'Coupon non valido.' });

  try {
    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });

    const puntiDisponibili = utente.puntiFedelta || 0;
    if (puntiDisponibili < voce.costoInPunti) {
      return res.status(400).json({
        error: `Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${voce.costoInPunti} pt.`
      });
    }

    // Genera codice univoco
    const codice = `FEDELTA${voce.percentuale}-${Date.now()}-${userId}`;
    const scadenza = new Date();
    scadenza.setMonth(scadenza.getMonth() + 3);
    const scadenzaStr = scadenza.toISOString().split('T')[0];

    // Inserisce il coupon nel DB
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon (codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi, utilizzi_attuali, attivo)
         VALUES (?, 'percentuale', ?, ?, ?, 1, 0, 1)`,
        [codice, voce.percentuale, voce.descrizione, scadenzaStr],
        function (err) { if (err) reject(err); else resolve(this.lastID); }
      );
    });

    // Scala i punti all'utente
    await User.deductPuntiFedelta(userId, voce.costoInPunti);

    const utenteAggiornato = await User.findById(userId);

    res.json({
      message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`,
      codice,
      scadenza: scadenzaStr,
      percentuale: voce.percentuale,
      puntiScalati: voce.costoInPunti,
      puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
    });

  } catch (err) {
    console.error('acquistaCoupon error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// GET /api/fedelta/prodotti-usati
exports.getProdottiUsati = (req, res) => {
  db.all(
    `SELECT p.*, c.denominazione AS categoria_nome
     FROM prodotto p
     LEFT JOIN categoria c ON p.categoria_id = c.id
     WHERE p.condizione = 'Usato'
       AND p.giacenza > 0
       AND p.pubblicatoVetrina = 1
     ORDER BY p.prezzoUnitarioVendita ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      // Calcola costo in punti: prezzo arrotondato / 5
      const arrotonda = v => Math.floor(v + 0.5);
      const prodotti = rows.map(p => ({
        ...p,
        costoInPunti: arrotonda(p.prezzoUnitarioVendita) / 5
      }));
      res.json(prodotti);
    }
  );
};

// POST /api/fedelta/acquista-prodotto  { prodottoId }
exports.acquistaProdottoConPunti = async (req, res) => {
  const userId = req.user.id;
  const { prodottoId } = req.body;

  if (!prodottoId) return res.status(400).json({ error: 'prodottoId obbligatorio.' });

  try {
    const [utente, prodotto] = await Promise.all([
      User.findById(userId),
      Prodotto.findById(prodottoId)
    ]);

    if (!utente)  return res.status(404).json({ error: 'Utente non trovato.' });
    if (!prodotto) return res.status(404).json({ error: 'Prodotto non trovato.' });
    if (prodotto.condizione !== 'Usato') return res.status(400).json({ error: 'Solo prodotti usati acquistabili con punti.' });
    if (prodotto.giacenza < 1) return res.status(400).json({ error: 'Prodotto non disponibile (esaurito).' });

    const arrotonda = v => Math.floor(v + 0.5);
    const costoInPunti = arrotonda(prodotto.prezzoUnitarioVendita) / 5;
    const puntiDisponibili = utente.puntiFedelta || 0;

    if (puntiDisponibili < costoInPunti) {
      return res.status(400).json({
        error: `Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`
      });
    }

    // Crea ordine con pagato_con_punti = 1, punti_fedelta = 0 (non guadagna punti)
    const newOrdine = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ordine
           (carta_id, indirizzo_id, utente_id, coupon_id, data, totale, totale_scontato,
            sconto_applicato, punti_fedelta, statoOrdine, pagato_con_punti)
         VALUES (NULL, NULL, ?, NULL, ?, ?, ?, 0, 0, 'In elaborazione', 1)`,
        [userId, new Date().toISOString(), prodotto.prezzoUnitarioVendita, prodotto.prezzoUnitarioVendita],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
      );
    });

    // Aggiunge prodotto all'ordine
    await Ordine.addProdottoToOrdine(newOrdine.id, prodottoId, 1, prodotto.prezzoUnitarioVendita);

    // Scala giacenza del prodotto
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE prodotto SET giacenza = giacenza - 1 WHERE id = ? AND giacenza > 0`,
        [prodottoId],
        function (err) { if (err) reject(err); else resolve(this.changes); }
      );
    });

    // Scala punti all'utente
    await User.deductPuntiFedelta(userId, costoInPunti);

    const utenteAggiornato = await User.findById(userId);

    res.status(201).json({
      message: `Acquisto effettuato con ${costoInPunti} punti! L'ordine è stato creato.`,
      ordineId: newOrdine.id,
      costoInPunti,
      puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
    });

  } catch (err) {
    console.error('acquistaProdottoConPunti error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};
