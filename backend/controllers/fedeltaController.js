const db     = require('../db/database');
const User   = require('../models/userModel');
const Ordine = require('../models/ordineModel');
const Prodotto = require('../models/prodottoModel');

// ═══════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════
const arrotonda = v => Math.floor(Number(v) + 0.5);
const calcolaPunti = prezzo => arrotonda(prezzo) / 5;

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
    // Legge il coupon template dal DB
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

    // Genera codice univoco per l'utente
    const codice = `FEDELTA${template.valore}-${Date.now()}-${userId}`;
    const scadenza = new Date();
    scadenza.setMonth(scadenza.getMonth() + 3);
    const scadenzaStr = scadenza.toISOString().split('T')[0];

    // Inserisce il coupon personale nel DB
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon (codice, tipo, valore, descrizione, data_scadenza,
                             utilizzi_massimi, utilizzi_attuali, attivo, costo_punti)
         VALUES (?, 'percentuale', ?, ?, ?, 1, 0, 1, 0)`,
        [codice, template.valore, template.descrizione, scadenzaStr],
        function (err) { if (err) reject(err); else resolve(this.lastID); }
      );
    });

    // Decrementa disponibilità se non illimitata
    if (template.disponibile !== -1) {
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE Coupon SET disponibile = MAX(0, disponibile - 1) WHERE id = ?`,
          [catalogoId],
          function (err) { if (err) reject(err); else resolve(this.changes); }
        );
      });
    }

    // Scala i punti all'utente
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
// Prodotti usati visibili in vetrina, con costoInPunti calcolato
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
// Acquisto prodotto usato con punti fedeltà
// ═══════════════════════════════════════════════════════════════
exports.acquistaProdottoConPunti = async (req, res) => {
  const userId    = req.user.id;
  const { prodottoId } = req.body;

  if (!prodottoId) return res.status(400).json({ error: 'prodottoId obbligatorio.' });

  try {
    // Legge prodotto live dal DB
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

    // Crea ordine con pagato_con_punti=1, punti_fedelta=0
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

    // Aggiunge prodotto all'ordine
    await Ordine.addProdottoToOrdine(newOrdine.id, prodottoId, 1, prodotto.prezzoUnitarioVendita);

    // Scala giacenza
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE prodotto SET giacenza = MAX(0, giacenza - 1) WHERE id = ? AND giacenza > 0`,
        [prodottoId],
        function (err) { if (err) reject(err); else resolve(this.changes); }
      );
    });

    // Scala punti utente
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
// Tutti i coupon che hanno costo_punti > 0 (coupon fedeltà)
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
// Crea coupon fedeltà (acquistabile con punti)
// Body: { codice, percentuale, costoInPunti, descrizione, scadenza, disponibile }
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
// Tutti i prodotti usati (anche non in vetrina / esauriti)
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
