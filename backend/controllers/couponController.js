const Coupon = require('../models/couponModel');
const CouponService = require('../services/couponService');

// ═══════════════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════════════
const arrotonda = v => Math.floor(Number(v) + 0.5);

// FIX: costoInPunti ora usa il campo puntiFedelta del prodotto.
// Se puntiFedelta è 0 o assente, fallback al calcolo dal prezzo (retrocompatibilità).
const getCostoInPunti = (prodotto) => {
  if (prodotto.puntiFedelta && Number(prodotto.puntiFedelta) > 0) {
    return Number(prodotto.puntiFedelta);
  }
  // Fallback: arrotondamento commerciale del prezzo / 5
  return arrotonda(prodotto.prezzoUnitarioVendita) / 5;
};

// Punti richiesti per ogni percentuale di sconto preset
const PUNTI_PER_PRESET = {
  5:  50,
  10: 100,
  15: 150,
  20: 200,
  25: 250
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

// ═══════════════════════════════════════════════════════════════
// UTENTE — GET /api/coupon/preset-coupon
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
// UTENTE — POST /api/coupon/acquista-preset-coupon
// ═══════════════════════════════════════════════════════════════
exports.acquistaPresetCoupon = async (req, res) => {
  const userId = req.user.id;
  const { percentuale } = req.body;

  try {
    const result = await CouponService.acquistaPresetCoupon(userId, percentuale);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('acquistaPresetCoupon error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — GET /api/coupon/catalogo-coupon
// ═══════════════════════════════════════════════════════════════
exports.getCatalogoCoupon = async (req, res) => {
  try {
    res.json(await Coupon.findCatalogoFedelta());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — POST /api/coupon/acquista-coupon
// ═══════════════════════════════════════════════════════════════
exports.acquistaCoupon = async (req, res) => {
  const userId = req.user.id;
  const { catalogoId } = req.body;

  try {
    const result = await CouponService.acquistaCoupon(userId, catalogoId);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('acquistaCoupon error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — GET /api/coupon/prodotti-usati
// FIX: costoInPunti ora proviene da p.puntiFedelta (non più dal prezzo)
// ═══════════════════════════════════════════════════════════════
exports.getProdottiUsati = async (req, res) => {
  try {
    const rows = await Coupon.findProdottiUsati();
    res.json(rows.map(p => ({ ...p, costoInPunti: getCostoInPunti(p) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// UTENTE — POST /api/coupon/acquista-prodotto  { prodottoId }
// FIX: usa getCostoInPunti (puntiFedelta del prodotto)
//      verifica giacenza atomica dopo decrementaGiacenza
//      passa pagatoConPunti=1 ad addProdottoToOrdine
// ═══════════════════════════════════════════════════════════════
exports.acquistaProdottoConPunti = async (req, res) => {
  const userId = req.user.id;
  const { prodottoId } = req.body;

  try {
    const result = await CouponService.acquistaProdottoConPunti(userId, prodottoId);
    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error('acquistaProdottoConPunti error:', err);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — GET /api/coupon/admin/coupon-fedelta
// ═══════════════════════════════════════════════════════════════
exports.adminGetCouponFedelta = async (req, res) => {
  try {
    res.json(await Coupon.findAllFedelta());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — POST /api/coupon/admin/coupon-fedelta
// ═══════════════════════════════════════════════════════════════
exports.adminCreaCouponFedelta = async (req, res) => {
  const { codice, percentuale, costoInPunti, descrizione, scadenza, disponibile } = req.body;
  if (!codice || !percentuale || !costoInPunti)
    return res.status(400).json({ error: 'codice, percentuale e costoInPunti sono obbligatori.' });
  try {
    const result = await Coupon.createFedelta({ codice, percentuale, costoInPunti, descrizione, scadenza, disponibile });
    res.status(201).json({ message: 'Coupon fedeltà creato.', id: result.id });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE'))
      return res.status(400).json({ error: 'Codice coupon già esistente.' });
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — PATCH /api/coupon/admin/coupon-fedelta/:id/toggle
// ═══════════════════════════════════════════════════════════════
exports.adminToggleCouponFedelta = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Coupon.toggleFedelta(id, req.body.attivo);
    if (result.changes === 0) return res.status(404).json({ error: 'Coupon non trovato.' });
    res.json({ message: 'Stato aggiornato.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — DELETE /api/coupon/admin/coupon-fedelta/:id
// ═══════════════════════════════════════════════════════════════
exports.adminEliminaCouponFedelta = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await Coupon.deleteFedelta(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Coupon non trovato.' });
    res.json({ message: 'Coupon eliminato.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═══════════════════════════════════════════════════════════════
// ADMIN — GET /api/coupon/admin/prodotti-usati
// FIX: costoInPunti ora proviene da p.puntiFedelta
// ═══════════════════════════════════════════════════════════════
exports.adminGetProdottiUsati = async (req, res) => {
  try {
    const rows = await Coupon.findAllProdottiUsatiAdmin();
    res.json(rows.map(p => ({ ...p, costoInPunti: getCostoInPunti(p) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.iMieiCoupon = async (req, res) => {
  const userId = req.user.id;
  try {
    const coupon = await Coupon.getCouponbyUserId(userId);
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
