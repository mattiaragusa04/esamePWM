const Coupon = require('../models/couponModel');
const User   = require('../models/userModel');
const Ordine = require('../models/ordineModel');
const db     = require('../db/database');

// ─── Helpers fedeltà ─────────────────────────────────────────
const arrotonda = v => Math.floor(Number(v) + 0.5);
const calcolaPunti = prezzo => arrotonda(prezzo) / 5;
const PUNTI_PER_PRESET = { 5: 50, 10: 100, 15: 150, 20: 200, 25: 250 };
const generaScadenza = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0];
};

// GET /api/coupon — lista tutti i coupon (admin)
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findAll();
    res.json(coupon);
  } catch (err) {
    console.error('getCoupon error:', err);
    res.status(500).json({ error: 'Errore nel recupero dei coupon.' });
  }
};

// POST /api/coupon — crea un nuovo coupon (admin)
exports.creaCoupon = async (req, res) => {
  const { codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi } = req.body;

  if (!codice || !tipo || !valore) {
    return res.status(400).json({ error: 'Codice, tipo e valore sono obbligatori.' });
  }
  if (!['percentuale', 'fisso'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve essere "percentuale" o "fisso".' });
  }
  if (tipo === 'percentuale' && (Number(valore) <= 0 || Number(valore) > 100)) {
    return res.status(400).json({ error: 'Il valore percentuale deve essere tra 1 e 100.' });
  }

  try {
    const tutti = await Coupon.findAll();
    const duplicato = tutti.find(c => c.codice === codice.toUpperCase().trim());
    if (duplicato) {
      return res.status(409).json({ error: 'Esiste già un coupon con questo codice.' });
    }

    await Coupon.create({ codice, tipo, valore: Number(valore), descrizione, data_scadenza, utilizzi_massimi });
    res.status(201).json({ message: 'Coupon creato con successo.' });
  } catch (err) {
    console.error('creaCoupon error:', err);
    res.status(500).json({ error: 'Errore nella creazione del coupon.' });
  }
};

// PUT /api/coupon/:id — modifica un coupon esistente (admin)
exports.modificaCoupon = async (req, res) => {
  const { id } = req.params;
  const { codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi } = req.body;

  if (!codice || !tipo || !valore) {
    return res.status(400).json({ error: 'Codice, tipo e valore sono obbligatori.' });
  }
  if (!['percentuale', 'fisso'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve essere "percentuale" o "fisso".' });
  }
  if (tipo === 'percentuale' && (Number(valore) <= 0 || Number(valore) > 100)) {
    return res.status(400).json({ error: 'Il valore percentuale deve essere tra 1 e 100.' });
  }

  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ error: 'Coupon non trovato.' });

    // Controlla duplicato codice solo se il codice è cambiato
    const nuovoCodice = codice.toUpperCase().trim();
    if (nuovoCodice !== coupon.codice) {
      const tutti = await Coupon.findAll();
      const duplicato = tutti.find(c => c.codice === nuovoCodice && c.id !== Number(id));
      if (duplicato) {
        return res.status(409).json({ error: 'Esiste già un altro coupon con questo codice.' });
      }
    }

    await Coupon.update(id, {
      codice: nuovoCodice,
      tipo,
      valore: Number(valore),
      descrizione: descrizione || null,
      data_scadenza: data_scadenza || null,
      utilizzi_massimi: utilizzi_massimi ? Number(utilizzi_massimi) : null
    });

    res.json({ message: 'Coupon aggiornato con successo.' });
  } catch (err) {
    console.error('modificaCoupon error:', err);
    res.status(500).json({ error: 'Errore nella modifica del coupon.' });
  }
};

// PATCH /api/coupon/:id/toggle — attiva/disattiva (admin)
exports.toggleCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ error: 'Coupon non trovato.' });

    await Coupon.toggle(id);
    const aggiornato = await Coupon.findById(id);
    res.json({ message: 'Stato aggiornato.', attivo: aggiornato.attivo });
  } catch (err) {
    console.error('toggleCoupon error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del coupon.' });
  }
};

// POST /api/coupon/valida — valida codice coupon (utente nel pagamento)
exports.validaCoupon = async (req, res) => {
  const { codice, totale } = req.body;
  if (!codice) return res.status(400).json({ error: 'Codice mancante.' });
  if (!totale || Number(totale) <= 0) return res.status(400).json({ error: 'Totale non valido.' });

  try {
    const coupon = await Coupon.findValidByCodice(codice);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon non valido, scaduto o esaurito.' });
    }

    const tot = Number(totale);
    let sconto = 0;
    if (coupon.tipo === 'percentuale') {
      sconto = (tot * coupon.valore) / 100;
    } else {
      sconto = Math.min(coupon.valore, tot);
    }

    const totaleFinale = Math.max(0, tot - sconto);

    res.json({
      valido: true,
      coupon_id: coupon.id,
      codice: coupon.codice,
      tipo: coupon.tipo,
      valore: coupon.valore,
      sconto: Math.round(sconto * 100) / 100,
      totale_finale: Math.round(totaleFinale * 100) / 100
    });
  } catch (err) {
    console.error('validaCoupon error:', err);
    res.status(500).json({ error: 'Errore nella validazione del coupon.' });
  }
};


// ═══════════════════════════════════════════════════════════
// FEDELTÀ — UTENTE
// ═══════════════════════════════════════════════════════════

const getPresetCoupon = (req, res) => {
  res.json([5, 10, 15, 20, 25].map(perc => ({
    percentuale: perc,
    costoInPunti: PUNTI_PER_PRESET[perc],
    descrizione: `Sconto del ${perc}% su qualsiasi ordine`
  })));
};

const acquistaPresetCoupon = async (req, res) => {
  const userId = req.user.id;
  const percNum = Number(req.body.percentuale);
  if (![5, 10, 15, 20, 25].includes(percNum))
    return res.status(400).json({ error: 'Percentuale non valida.' });
  const costoInPunti = PUNTI_PER_PRESET[percNum];
  try {
    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });
    if ((utente.puntiFedelta || 0) < costoInPunti)
      return res.status(400).json({ error: `Punti insufficienti. Hai ${utente.puntiFedelta || 0} pt, ne servono ${costoInPunti} pt.` });
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codice = 'SC' + percNum + '-';
    for (let i = 0; i < 8; i++) codice += chars[Math.floor(Math.random() * chars.length)];
    const scadenzaStr = generaScadenza();
    await Coupon.createGenerato({ codice, valore: percNum, descrizione: `Generato da: ${utente.email} | Punti spesi: ${costoInPunti}`, scadenzaStr });
    await User.deductPuntiFedelta(userId, costoInPunti);
    const utenteAggiornato = await User.findById(userId);
    res.json({ message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`, codice, percentuale: percNum, puntiScalati: costoInPunti, puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Errore interno.' }); }
};

const getCatalogoCoupon = async (req, res) => {
  try { res.json(await Coupon.findCatalogoFedelta()); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const acquistaCoupon = async (req, res) => {
  const userId = req.user.id;
  const { catalogoId } = req.body;
  if (!catalogoId) return res.status(400).json({ error: 'catalogoId obbligatorio.' });
  try {
    const template = await Coupon.findById(catalogoId);
    if (!template || !template.attivo || !template.costo_punti)
      return res.status(404).json({ error: 'Coupon non trovato o non disponibile.' });
    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });
    if ((utente.puntiFedelta || 0) < template.costo_punti)
      return res.status(400).json({ error: `Punti insufficienti. Hai ${utente.puntiFedelta || 0} pt, ne servono ${template.costo_punti} pt.` });
    const codice = `FEDELTA${template.valore}-${Date.now()}-${userId}`;
    const scadenzaStr = generaScadenza();
    await Coupon.createGenerato({ codice, valore: template.valore, descrizione: `Generato da: ${utente.email} | Punti spesi: ${template.costo_punti}`, scadenzaStr });
    await Coupon.decrementaDisponibile(catalogoId);
    await User.deductPuntiFedelta(userId, template.costo_punti);
    const utenteAggiornato = await User.findById(userId);
    res.json({ message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`, codice, percentuale: template.valore, puntiScalati: template.costo_punti, puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Errore interno.' }); }
};

const getProdottiUsati = (req, res) => {
  db.all(
    `SELECT p.id, p.nome, p.descrizione, p.prezzoUnitarioVendita, p.immagine, p.giacenza, p.condizione, c.denominazione AS categoria_nome
     FROM prodotto p LEFT JOIN categoria c ON p.categoria_id = c.id
     WHERE (p.condizione = 'Usato' OR p.usato = 1) AND p.giacenza > 0 AND p.pubblicatoVetrina = 1
     ORDER BY p.prezzoUnitarioVendita ASC`,
    [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(p => ({ ...p, costoInPunti: calcolaPunti(p.prezzoUnitarioVendita) })));
    }
  );
};

const acquistaProdottoConPunti = async (req, res) => {
  const userId = req.user.id;
  const { prodottoId } = req.body;
  if (!prodottoId) return res.status(400).json({ error: 'prodottoId obbligatorio.' });
  try {
    const prodotto = await new Promise((resolve, reject) => {
      db.get(`SELECT p.*, c.denominazione AS categoria_nome FROM prodotto p LEFT JOIN categoria c ON p.categoria_id = c.id WHERE p.id = ?`, [prodottoId], (err, row) => { if (err) reject(err); else resolve(row); });
    });
    if (!prodotto) return res.status(404).json({ error: 'Prodotto non trovato.' });
    if (prodotto.condizione !== 'Usato' && !prodotto.usato) return res.status(400).json({ error: 'Solo prodotti usati acquistabili con punti.' });
    if (prodotto.giacenza < 1) return res.status(400).json({ error: 'Prodotto esaurito.' });
    const costoInPunti = calcolaPunti(prodotto.prezzoUnitarioVendita);
    const utente = await User.findById(userId);
    if (!utente) return res.status(404).json({ error: 'Utente non trovato.' });
    if ((utente.puntiFedelta || 0) < costoInPunti)
      return res.status(400).json({ error: `Punti insufficienti. Hai ${utente.puntiFedelta || 0} pt, ne servono ${costoInPunti} pt.` });
    const newOrdine = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO ordine (carta_id, indirizzo_id, utente_id, coupon_id, data, totale, totale_scontato, sconto_applicato, punti_fedelta, statoOrdine, pagato_con_punti) VALUES (NULL, NULL, ?, NULL, ?, ?, ?, 0, 0, 'In elaborazione', 1)`,
        [userId, new Date().toISOString(), prodotto.prezzoUnitarioVendita, prodotto.prezzoUnitarioVendita],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); });
    });
    await Ordine.addProdottoToOrdine(newOrdine.id, prodottoId, 1, prodotto.prezzoUnitarioVendita);
    await new Promise((resolve, reject) => {
      db.run(`UPDATE prodotto SET giacenza = MAX(0, giacenza - 1) WHERE id = ? AND giacenza > 0`, [prodottoId], function (err) { if (err) reject(err); else resolve(this.changes); });
    });
    await User.deductPuntiFedelta(userId, costoInPunti);
    const utenteAggiornato = await User.findById(userId);
    res.status(201).json({ message: `Acquisto effettuato con ${costoInPunti} punti!`, ordineId: newOrdine.id, costoInPunti, puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Errore interno.' }); }
};

// ═══════════════════════════════════════════════════════════
// FEDELTÀ — ADMIN
// ═══════════════════════════════════════════════════════════

const adminGetCouponFedelta = async (req, res) => {
  try { res.json(await Coupon.findAllFedelta()); }
  catch (err) { res.status(500).json({ error: err.message }); }
};

const adminCreaCouponFedelta = async (req, res) => {
  const { codice, percentuale, costoInPunti, descrizione, scadenza, disponibile } = req.body;
  if (!codice || !percentuale || !costoInPunti)
    return res.status(400).json({ error: 'codice, percentuale e costoInPunti sono obbligatori.' });
  try {
    await Coupon.createFedelta({ codice, percentuale, costoInPunti, descrizione, scadenza, disponibile });
    res.status(201).json({ message: 'Coupon fedeltà creato.' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Codice coupon già esistente.' });
    res.status(500).json({ error: err.message });
  }
};

const adminToggleCouponFedelta = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Coupon.toggleFedelta(id, req.body.attivo);
    if (result.changes === 0) return res.status(404).json({ error: 'Coupon non trovato.' });
    res.json({ message: 'Stato aggiornato.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const adminEliminaCouponFedelta = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Coupon.deleteFedelta(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Coupon non trovato.' });
    res.json({ message: 'Coupon eliminato.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const adminGetProdottiUsati = (req, res) => {
  db.all(
    `SELECT p.id, p.nome, p.descrizione, p.prezzoUnitarioVendita, p.immagine, p.giacenza, p.condizione, p.pubblicatoVetrina, c.denominazione AS categoria_nome
     FROM prodotto p LEFT JOIN categoria c ON p.categoria_id = c.id
     WHERE (p.condizione = 'Usato' OR p.usato = 1)
     ORDER BY p.giacenza DESC, p.prezzoUnitarioVendita ASC`,
    [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(p => ({ ...p, costoInPunti: calcolaPunti(p.prezzoUnitarioVendita) })));
    }
  );
};

module.exports = {
  getCoupon, creaCoupon, modificaCoupon, toggleCoupon, validaCoupon,
  getPresetCoupon, acquistaPresetCoupon, getCatalogoCoupon,
  acquistaCoupon, getProdottiUsati, acquistaProdottoConPunti,
  adminGetCouponFedelta, adminCreaCouponFedelta,
  adminToggleCouponFedelta, adminEliminaCouponFedelta, adminGetProdottiUsati
};

