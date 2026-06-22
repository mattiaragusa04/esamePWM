const Coupon = require('../models/couponModel');
const User   = require('../models/userModel');
const Ordine = require('../models/ordineModel');

// ── Helper ───────────────────────────────────────────────────────────────────
const arrotonda    = v => Math.floor(Number(v) + 0.5);
const calcolaPunti = prezzo => arrotonda(prezzo) / 5;

const PUNTI_PER_PRESET = { 5: 50, 10: 100, 15: 150, 20: 200, 25: 250 };

// Genera scadenza a N mesi dalla data odierna (stringa YYYY-MM-DD)
function scadenzaMesi(mesi = 3) {
  const d = new Date();
  d.setMonth(d.getMonth() + mesi);
  return d.toISOString().split('T')[0];
}

// Genera codice casuale univoco per i preset (es. SC10-AB3KXYZ9)
function generaCodicePreset(percNum) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codice = 'SC' + percNum + '-';
  for (let i = 0; i < 8; i++) codice += chars[Math.floor(Math.random() * chars.length)];
  return codice;
}

// ─────────────────────────────────────────────────────────────────────────────
// Restituisce i preset coupon fissi (generati on-the-fly, non salvati su DB)
// ─────────────────────────────────────────────────────────────────────────────
exports.getPresetCoupon = () => {
  return [5, 10, 15, 20, 25].map(perc => ({
    percentuale: perc,
    costoInPunti: PUNTI_PER_PRESET[perc],
    descrizione: `Sconto del ${perc}% su qualsiasi ordine`
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Acquista un coupon preset con i punti fedeltà
// ─────────────────────────────────────────────────────────────────────────────
exports.acquistaPresetCoupon = async (userId, percentuale) => {
  const percNum = Number(percentuale);
  if (![5, 10, 15, 20, 25].includes(percNum)) {
    const err = new Error('Percentuale non valida. Valori ammessi: 5, 10, 15, 20, 25.');
    err.status = 400;
    throw err;
  }

  const costoInPunti = PUNTI_PER_PRESET[percNum];
  const utente = await User.findById(userId);
  if (!utente) { const err = new Error('Utente non trovato.'); err.status = 404; throw err; }

  if ((utente.puntiFedelta || 0) < costoInPunti) {
    const err = new Error(`Punti insufficienti. Hai ${utente.puntiFedelta || 0} pt, ne servono ${costoInPunti} pt.`);
    err.status = 400;
    throw err;
  }

  const codice      = generaCodicePreset(percNum);
  const scadenzaStr = scadenzaMesi(3);
  const descrizione = `Generato da: ${utente.email} | Punti spesi: ${costoInPunti}`;

  const nuovoCoupon = await Coupon.createGenerato({ codice, valore: percNum, descrizione, scadenzaStr });
  await Coupon.insertCouponGenerato(userId, nuovoCoupon.id);
  await User.deductPuntiFedelta(userId, costoInPunti);

  const utenteAggiornato = await User.findById(userId);

  return {
    message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`,
    codice,
    scadenza: scadenzaStr,
    percentuale: percNum,
    puntiScalati: costoInPunti,
    puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Acquista un coupon dal catalogo DB con i punti fedeltà
// ─────────────────────────────────────────────────────────────────────────────
exports.acquistaCoupon = async (userId, catalogoId) => {
  if (!catalogoId) {
    const err = new Error('catalogoId obbligatorio.'); err.status = 400; throw err;
  }

  const template = await Coupon.findFedeltaById(catalogoId);
  if (!template) { const err = new Error('Coupon non trovato o non disponibile.'); err.status = 404; throw err; }

  const utente = await User.findById(userId);
  if (!utente) { const err = new Error('Utente non trovato.'); err.status = 404; throw err; }

  const costoInPunti = template.costo_punti;
  if ((utente.puntiFedelta || 0) < costoInPunti) {
    const err = new Error(`Punti insufficienti. Hai ${utente.puntiFedelta || 0} pt, ne servono ${costoInPunti} pt.`);
    err.status = 400;
    throw err;
  }

  const codice      = `FEDELTA${template.valore}-${Date.now()}-${userId}`;
  const scadenzaStr = scadenzaMesi(3);
  const descrizione = `Generato da: ${utente.email} | Punti spesi: ${costoInPunti}`;

  const nuovoCoupon = await Coupon.createGenerato({ codice, valore: template.valore, descrizione, scadenzaStr });
  await Coupon.insertCouponGenerato(userId, nuovoCoupon.id);
  await Coupon.decrementaDisponibile(catalogoId);
  await User.deductPuntiFedelta(userId, costoInPunti);

  const utenteAggiornato = await User.findById(userId);

  return {
    message: `Coupon acquistato! Usa il codice entro il ${scadenzaStr}.`,
    codice,
    scadenza: scadenzaStr,
    percentuale: template.valore,
    puntiScalati: costoInPunti,
    puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Acquista un prodotto usato con i punti fedeltà
// ─────────────────────────────────────────────────────────────────────────────
exports.acquistaProdottoConPunti = async (userId, prodottoId) => {
  if (!prodottoId) {
    const err = new Error('prodottoId obbligatorio.'); err.status = 400; throw err;
  }

  const prodotto = await Coupon.findProdottoById(prodottoId);
  if (!prodotto) { const err = new Error('Prodotto non trovato.'); err.status = 404; throw err; }

  const isUsato = prodotto.condizione === 'Usato' || prodotto.usato == 1;
  if (!isUsato) {
    const err = new Error('Solo prodotti usati acquistabili con punti.'); err.status = 400; throw err;
  }
  if (prodotto.giacenza < 1) {
    const err = new Error('Prodotto esaurito.'); err.status = 400; throw err;
  }

  const costoInPunti = calcolaPunti(prodotto.prezzoUnitarioVendita);
  const utente = await User.findById(userId);
  if (!utente) { const err = new Error('Utente non trovato.'); err.status = 404; throw err; }

  if ((utente.puntiFedelta || 0) < costoInPunti) {
    const err = new Error(`Punti insufficienti. Hai ${utente.puntiFedelta || 0} pt, ne servono ${costoInPunti} pt.`);
    err.status = 400;
    throw err;
  }

  const newOrdine = await Ordine.createConPunti(userId, prodotto.prezzoUnitarioVendita);
  await Ordine.addProdottoToOrdine(newOrdine.id, prodottoId, 1, prodotto.prezzoUnitarioVendita);
  await Coupon.decrementaGiacenza(prodottoId);
  await User.deductPuntiFedelta(userId, costoInPunti);

  const utenteAggiornato = await User.findById(userId);

  return {
    message: `Acquisto effettuato con ${costoInPunti} punti!`,
    ordineId: newOrdine.id,
    costoInPunti,
    puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Calcola sconto coupon dato un totale (usato in validaCoupon)
// ─────────────────────────────────────────────────────────────────────────────
exports.calcolaSconto = (coupon, totale) => {
  const tot = Number(totale);
  let sconto = 0;
  if (coupon.tipo === 'percentuale') {
    sconto = (tot * coupon.valore) / 100;
  } else {
    sconto = Math.min(coupon.valore, tot);
  }
  return {
    sconto: Math.round(sconto * 100) / 100,
    totaleFinale: Math.max(0, Math.round((tot - sconto) * 100) / 100)
  };
};

// Espone calcolaPunti per uso esterno (es. nel controller admin)
exports.calcolaPunti = calcolaPunti;
