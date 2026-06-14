const Coupon = require('../models/couponModel');

// GET /api/coupon — lista tutti i coupon (admin)
const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findAll();
    res.json(coupon);
  } catch (err) {
    console.error('getCoupon error:', err);
    res.status(500).json({ error: 'Errore nel recupero dei coupon.' });
  }
};

// POST /api/coupon — crea un nuovo coupon (admin)
const creaCoupon = async (req, res) => {
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
const modificaCoupon = async (req, res) => {
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
const toggleCoupon = async (req, res) => {
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
const validaCoupon = async (req, res) => {
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

module.exports = { getCoupon, creaCoupon, modificaCoupon, toggleCoupon, validaCoupon };
