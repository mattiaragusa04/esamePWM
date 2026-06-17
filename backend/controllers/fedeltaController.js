const db     = require('../db/database');
const User   = require('../models/userModel');
const Ordine = require('../models/ordineModel');
const Prodotto = require('../models/prodottoModel');

// ═══════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════
const arrotonda = v => Math.floor(Number(v) + 0.5);
const calcolaPunti = prezzo => arrotonda(prezzo) / 5;

// Punti richiesti per ogni percentuale di sconto preset
const PUNTI_PER_PRESET = {
  5:  50,
  10: 100,
  15: 150,
  20: 200,
  25: 250
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — GET /api/fedelta/preset-coupon
// Restituisce i coupon preset fissi (5%, 10%, 15%, 20%, 25%)
// Non richiedono un record in DB: sono generati on-the-fly.
// ═══════════════════════════════════════════════════════════════
exports.getPresetCoupon = (req, res) => {
  const preset = [5, 10, 15, 20, 25].map(perc => ({
    percentuale: perc,
    costoInPunti: PUNTI_PER_PRESET[perc],
    descrizione: `Sconto del ${perc}% su qualsiasi ordine`
  }));
  res.json(preset);
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — POST /api/fedelta/acquista-preset-coupon  { percentuale }
// Genera un coupon personale partendo da un preset (5/10/15/20/25%)
// utilizzi_massimi = 1, descrizione = [email utente | X pt spesi]
// ═══════════════════════════════════════════════════════════════
exports.acquistaPresetCoupon = async (req, res) => {
  const userId      = req.user.id;
  const { percentuale } = req.body;

  const percNum = Number(percentuale);
  if (![5, 10, 15, 20, 25].includes(percNum)) {
    return res.status(400).json({ error: 'Percentuale non valida. Valori ammessi: 5, 10, 15, 20, 25.' });
  }

  const costoInPunti = PUNTI_PER_PRESET[percNum];

  try {
    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });

    const puntiDisponibili = utente.puntiFedelta || 0;
    if (puntiDisponibili < costoInPunti) {
      return res.status(400).json({
        error: `Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`
      });
    }

    // Codice casuale univoco
    const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codice   = 'SC' + percNum + '-';
    for (let i = 0; i < 8; i++) codice += chars[Math.floor(Math.random() * chars.length)];

    // Scadenza 3 mesi
    const scadenza = new Date();
    scadenza.setMonth(scadenza.getMonth() + 3);
    const scadenzaStr = scadenza.toISOString().split('T')[0];

    // Descrizione con dati utente
    const descrizione = `Generato da: ${utente.email} | Punti spesi: ${costoInPunti}`;

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon
           (codice, tipo, valore, descrizione, data_scadenza,
            utilizzi_massimi, utilizzi_attuali, attivo, costo_punti)
         VALUES (?, 'percentuale', ?, ?, ?, 1, 0, 1, 0)`,
        [codice, percNum, descrizione, scadenzaStr],
        function (err) { if (err) reject(err); else resolve(this.lastID); }
      );
    });

    await User.deductPuntiFedelta(userId, costoInPunti);
    const utenteAggiornato = await User.findById(userId);

    res.json({
      message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`,
      codice,
      scadenza: scadenzaStr,
      percentuale: percNum,
      puntiScalati: costoInPunti,
      puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
    });

  } catch (err) {
    console.error('acquistaPresetCoupon error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — GET /api/fedelta/catalogo-coupon
// Legge i coupon fedeltà ATTIVI dal DB (costo_punti > 0)
// ═══════════════════════════════════════════════════════════════
exports.getCatalogoCoupon = (req, res) => {
  db.all(
    `SELECT id, codice, tipo, valore AS percentuale, descrizione,
            data_scadenza, utilizzi_massimi, utilizzi_attuali,
            costo_punti AS costoInPunti, disponibile
     FROM Coupon
     WHERE attivo = 1
       AND costo_punti > 0
       AND (disponibile = -1 OR disponibile > 0)
       AND (data_scadenza IS NULL OR date(data_scadenza) >= date('now'))
     ORDER BY valore ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — POST /api/fedelta/acquista-coupon  { catalogoId }
// catalogoId = id numerico del coupon in DB
// ═══════════════════════════════════════════════════════════════
exports.acquistaCoupon = async (req, res) => {
  const userId = req.user.id;
  const { catalogoId } = req.body;

  if (!catalogoId) return res.status(400).json({ error: 'catalogoId obbligatorio.' });

  try {
    const template = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM Coupon WHERE id = ? AND attivo = 1 AND costo_punti > 0`,
        [catalogoId],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });
    if (!template) return res.status(404).json({ error: 'Coupon non trovato o non disponibile.' });

    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });

    const puntiDisponibili = utente.puntiFedelta || 0;
    const costoInPunti = template.costo_punti;

    if (puntiDisponibili < costoInPunti) {
      return res.status(400).json({
        error: `Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`
      });
    }

    const codice = `FEDELTA${template.valore}-${Date.now()}-${userId}`;
    const scadenza = new Date();
    scadenza.setMonth(scadenza.getMonth() + 3);
    const scadenzaStr = scadenza.toISOString().split('T')[0];

    // Descrizione arricchita con dati utente
    const descrizione = `Generato da: ${utente.email} | Punti spesi: ${costoInPunti}`;

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon (codice, tipo, valore, descrizione, data_scadenza,
                             utilizzi_massimi, utilizzi_attuali, attivo, costo_punti)
         VALUES (?, 'percentuale', ?, ?, ?, 1, 0, 1, 0)`,
        [codice, template.valore, descrizione, scadenzaStr],
        function (err) { if (err) reject(err); else resolve(this.lastID); }
      );
    });

    if (template.disponibile !== -1) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE Coupon SET disponibile = MAX(0, disponibile - 1) WHERE id = ?`,
          [catalogoId],
          function (err) { if (err) reject(err); else resolve(this.changes); }
        );
      });
    }

    await User.deductPuntiFedelta(userId, costoInPunti);
    const utenteAggiornato = await User.findById(userId);

    res.json({
      message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`,
      codice,
      scadenza: scadenzaStr,
      percentuale: template.valore,
      puntiScalati: costoInPunti,
      puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
    });

  } catch (err) {
    console.error('acquistaCoupon error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — GET /api/fedelta/prodotti-usati
// ═══════════════════════════════════════════════════════════════
exports.getProdottiUsati = (req, res) => {
  db.all(
    `SELECT p.id, p.nome, p.descrizione, p.prezzoUnitarioVendita,
            p.immagine, p.giacenza, p.condizione,
            c.denominazione AS categoria_nome
     FROM prodotto p
     LEFT JOIN categoria c ON p.categoria_id = c.id
     WHERE (p.condizione = 'Usato' OR p.usato = 1)
       AND p.giacenza > 0
       AND p.pubblicatoVetrina = 1
     ORDER BY p.prezzoUnitarioVendita ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const prodotti = rows.map(p => ({
        ...p,
        costoInPunti: calcolaPunti(p.prezzoUnitarioVendita)
      }));
      res.json(prodotti);
    }
  );
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — POST /api/fedelta/acquista-prodotto  { prodottoId }
// ═══════════════════════════════════════════════════════════════
exports.acquistaProdottoConPunti = async (req, res) => {
  const userId    = req.user.id;
  const { prodottoId } = req.body;

  if (!prodottoId) return res.status(400).json({ error: 'prodottoId obbligatorio.' });

  try {
    const prodotto = await new Promise((resolve, reject) => {
      db.get(
        `SELECT p.*, c.denominazione AS categoria_nome
         FROM prodotto p
         LEFT JOIN categoria c ON p.categoria_id = c.id
         WHERE p.id = ?`,
        [prodottoId],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });

    if (!prodotto) return res.status(404).json({ error: 'Prodotto non trovato.' });

    const isUsato = prodotto.condizione === 'Usato' || prodotto.usato == 1;
    if (!isUsato) return res.status(400).json({ error: 'Solo prodotti usati acquistabili con punti.' });
    if (prodotto.giacenza < 1) return res.status(400).json({ error: 'Prodotto esaurito.' });

    const costoInPunti = calcolaPunti(prodotto.prezzoUnitarioVendita);

    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });

    const puntiDisponibili = utente.puntiFedelta || 0;
    if (puntiDisponibili < costoInPunti) {
      return res.status(400).json({
        error: `Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`
      });
    }

    const newOrdine = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ordine
           (carta_id, indirizzo_id, utente_id, coupon_id, data, totale,
            totale_scontato, sconto_applicato, punti_fedelta, statoOrdine, pagato_con_punti)
         VALUES (NULL, NULL, ?, NULL, ?, ?, ?, 0, 0, 'In elaborazione', 1)`,
        [userId, new Date().toISOString(),
         prodotto.prezzoUnitarioVendita, prodotto.prezzoUnitarioVendita],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
      );
    });

    await Ordine.addProdottoToOrdine(newOrdine.id, prodottoId, 1, prodotto.prezzoUnitarioVendita);

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE prodotto SET giacenza = MAX(0, giacenza - 1) WHERE id = ? AND giacenza > 0`,
        [prodottoId],
        function (err) { if (err) reject(err); else resolve(this.changes); }
      );
    });

    await User.deductPuntiFedelta(userId, costoInPunti);
    const utenteAggiornato = await User.findById(userId);

    res.status(201).json({
      message: `Acquisto effettuato con ${costoInPunti} punti!`,
      ordineId: newOrdine.id,
      costoInPunti,
      puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
    });

  } catch (err) {
    console.error('acquistaProdottoConPunti error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — GET /api/fedelta/admin/coupon-fedelta
// ═══════════════════════════════════════════════════════════════
exports.adminGetCouponFedelta = (req, res) => {
  db.all(
    `SELECT * FROM Coupon
     WHERE costo_punti > 0
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — POST /api/fedelta/admin/coupon-fedelta
// ═══════════════════════════════════════════════════════════════
exports.adminCreaCouponFedelta = (req, res) => {
  const { codice, percentuale, costoInPunti, descrizione, scadenza, disponibile } = req.body;

  if (!codice || !percentuale || !costoInPunti) {
    return res.status(400).json({ error: 'codice, percentuale e costoInPunti sono obbligatori.' });
  }

  const disp = disponibile !== undefined ? Number(disponibile) : -1;

  db.run(
    `INSERT INTO Coupon
       (codice, tipo, valore, descrizione, data_scadenza,
        utilizzi_massimi, utilizzi_attuali, attivo, costo_punti, disponibile)
     VALUES (?, 'percentuale', ?, ?, ?, -1, 0, 1, ?, ?)`,
    [codice.trim().toUpperCase(), Number(percentuale),
     descrizione || `Sconto del ${percentuale}% — coupon fedeltà`,
     scadenza || null,
     Number(costoInPunti), disp],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Codice coupon già esistente.' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Coupon fedeltà creato.', id: this.lastID });
    }
  );
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — PATCH /api/fedelta/admin/coupon-fedelta/:id/toggle
// ═══════════════════════════════════════════════════════════════
exports.adminToggleCouponFedelta = (req, res) => {
  const { id } = req.params;
  const { attivo } = req.body;
  db.run(
    `UPDATE Coupon SET attivo = ? WHERE id = ? AND costo_punti > 0`,
    [attivo ? 1 : 0, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Coupon non trovato.' });
      res.json({ message: 'Stato aggiornato.' });
    }
  );
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — DELETE /api/fedelta/admin/coupon-fedelta/:id
// ═══════════════════════════════════════════════════════════════
exports.adminEliminaCouponFedelta = (req, res) => {
  const { id } = req.params;
  db.run(
    `DELETE FROM Coupon WHERE id = ? AND costo_punti > 0`,
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Coupon non trovato.' });
      res.json({ message: 'Coupon eliminato.' });
    }
  );
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — GET /api/fedelta/admin/prodotti-usati
// ═══════════════════════════════════════════════════════════════
exports.adminGetProdottiUsati = (req, res) => {
  db.all(
    `SELECT p.id, p.nome, p.descrizione, p.prezzoUnitarioVendita,
            p.immagine, p.giacenza, p.condizione, p.pubblicatoVetrina,
            c.denominazione AS categoria_nome
     FROM prodotto p
     LEFT JOIN categoria c ON p.categoria_id = c.id
     WHERE (p.condizione = 'Usato' OR p.usato = 1)
     ORDER BY p.giacenza DESC, p.prezzoUnitarioVendita ASC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const prodotti = rows.map(p => ({
        ...p,
        costoInPunti: calcolaPunti(p.prezzoUnitarioVendita)
      }));
      res.json(prodotti);
    }
  );
};
