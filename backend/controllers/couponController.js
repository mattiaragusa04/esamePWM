const db = require('../db/database');

// GET /api/coupon — lista tutti i coupon (admin)
const getCoupon = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, codice, tipo, valore, descrizione,
             data_scadenza, utilizzi_massimi, utilizzi_attuali, attivo,
             created_at
      FROM Coupon
      ORDER BY created_at DESC
    `);
    res.json(rows);
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
  if (tipo === 'percentuale' && (valore <= 0 || valore > 100)) {
    return res.status(400).json({ error: 'Il valore percentuale deve essere tra 1 e 100.' });
  }

  try {
    // Verifica duplicati
    const [esistente] = await db.query(
      'SELECT id FROM Coupon WHERE codice = ?', [codice.toUpperCase()]
    );
    if (esistente.length > 0) {
      return res.status(409).json({ error: 'Esiste già un coupon con questo codice.' });
    }

    await db.query(
      `INSERT INTO Coupon (codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi, utilizzi_attuali, attivo)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        codice.toUpperCase().trim(),
        tipo,
        valore,
        descrizione || null,
        data_scadenza || null,
        utilizzi_massimi || null
      ]
    );
    res.status(201).json({ message: 'Coupon creato con successo.' });
  } catch (err) {
    console.error('creaCoupon error:', err);
    res.status(500).json({ error: 'Errore nella creazione del coupon.' });
  }
};

// PATCH /api/coupon/:id/toggle — attiva/disattiva (admin)
const toggleCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT attivo FROM Coupon WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Coupon non trovato.' });

    const nuovoStato = rows[0].attivo === 1 ? 0 : 1;
    await db.query('UPDATE Coupon SET attivo = ? WHERE id = ?', [nuovoStato, id]);
    res.json({ message: 'Stato aggiornato.', attivo: nuovoStato });
  } catch (err) {
    console.error('toggleCoupon error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento del coupon.' });
  }
};

// POST /api/coupon/valida — valida codice coupon (utente nel pagamento)
const validaCoupon = async (req, res) => {
  const { codice, totale } = req.body;
  if (!codice) return res.status(400).json({ error: 'Codice mancante.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM Coupon WHERE codice = ? AND attivo = 1', [codice.toUpperCase()]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Coupon non valido o disattivato.' });
    }

    const coupon = rows[0];

    // Controlla scadenza
    if (coupon.data_scadenza && new Date(coupon.data_scadenza) < new Date()) {
      return res.status(400).json({ error: 'Coupon scaduto.' });
    }

    // Controlla utilizzi
    if (coupon.utilizzi_massimi && coupon.utilizzi_attuali >= coupon.utilizzi_massimi) {
      return res.status(400).json({ error: 'Coupon esaurito.' });
    }

    // Calcola sconto
    let sconto = 0;
    if (coupon.tipo === 'percentuale') {
      sconto = (totale * coupon.valore) / 100;
    } else {
      sconto = Math.min(coupon.valore, totale); // non può superare il totale
    }

    const totaleFinale = Math.max(0, totale - sconto).toFixed(2);

    res.json({
      valido: true,
      coupon_id: coupon.id,
      tipo: coupon.tipo,
      valore: coupon.valore,
      sconto: parseFloat(sconto.toFixed(2)),
      totale_finale: parseFloat(totaleFinale)
    });
  } catch (err) {
    console.error('validaCoupon error:', err);
    res.status(500).json({ error: 'Errore nella validazione del coupon.' });
  }
};

module.exports = { getCoupon, creaCoupon, toggleCoupon, validaCoupon };