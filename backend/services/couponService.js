const Coupon = require('../models/couponModel');
const User   = require('../models/userModel');
const Ordine = require('../models/ordineModel');

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

// ─────────────────────────────────────────────────────────────────────────────
// Acquista un coupon preset con i punti fedeltà
// ─────────────────────────────────────────────────────────────────────────────
exports.acquistaPresetCoupon = async (userId, valore) => {
  const percNum = Number(valore);
  if (![5, 10, 15, 20, 25].includes(percNum)) {
    const err = new Error('Percentuale non valida. Valori ammessi: 5, 10, 15, 20, 25.');
    err.status = 400;
    throw err;
  }

  const costoInPunti = PUNTI_PER_PRESET[percNum];

  const utente = await User.findById(userId);
  if (!utente) {
    const err = new Error('Utente non trovato.');
    err.status = 404;
    throw err;
  }

  const puntiDisponibili = utente.puntiFedelta || 0;
  if (puntiDisponibili < costoInPunti) {
    const err = new Error(`Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`);
    err.status = 400;
    throw err;
  }

  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codice   = 'SC' + percNum + '-';
  for (let i = 0; i < 8; i++) codice += chars[Math.floor(Math.random() * chars.length)];

  const scadenza = new Date();
  scadenza.setMonth(scadenza.getMonth() + 3);
  const scadenzaStr = scadenza.toISOString().split('T')[0];

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
// Acquista un coupon dal catalogo fedeltà con i punti fedeltà
// ─────────────────────────────────────────────────────────────────────────────
exports.acquistaCoupon = async (userId, couponId) => {

  if (!couponId) {
    const err = new Error('catalogoId obbligatorio.');
    err.status = 400;
    throw err;
  }

  const template = await Coupon.findFedeltaById(couponId);
  if (!template) {
    const err = new Error('Coupon non trovato o non disponibile.');
    err.status = 404;
    throw err;
  }

  const utente = await User.findById(userId);
  if (!utente) {
    const err = new Error('Utente non trovato.');
    err.status = 404;
    throw err;
  }

  const puntiDisponibili = utente.puntiFedelta || 0;
  const costoInPunti = template.costo_punti;

  if (puntiDisponibili < costoInPunti) {
    const err = new Error(`Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`);
    err.status = 400;
    throw err;
  }

  const codice = `${template.codice}${template.valore}-${Date.now()}-${userId}`;
  const scadenza = new Date();
  scadenza.setMonth(scadenza.getMonth() + 3);
  const scadenzaStr = scadenza.toISOString().split('T')[0];

  const descrizione = `Generato da: ${utente.email} | Punti spesi: ${costoInPunti}`;

  const nuovoCoupon = await Coupon.createGenerato({ codice, valore: template.valore, descrizione, scadenzaStr });
  await Coupon.insertCouponGenerato(userId, nuovoCoupon.id);
  await Coupon.decrementaDisponibile(couponId);

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
// FIX: usa getCostoInPunti (puntiFedelta del prodotto)
//      verifica giacenza atomica dopo decrementaGiacenza
//      passa pagatoConPunti=1 ad addProdottoToOrdine
// ─────────────────────────────────────────────────────────────────────────────
exports.acquistaProdottoConPunti = async (userId, prodottoId) => {
  if (!prodottoId) {
    const err = new Error('prodottoId obbligatorio.');
    err.status = 400;
    throw err;
  }

  const prodotto = await Coupon.findProdottoById(prodottoId);

  if (!prodotto) {
    const err = new Error('Prodotto non trovato.');
    err.status = 404;
    throw err;
  }

  const isUsato = prodotto.condizione === 'Usato' || prodotto.usato == 1;
  if (!isUsato) {
    const err = new Error('Solo prodotti usati acquistabili con punti.');
    err.status = 400;
    throw err;
  }
  if (prodotto.giacenza < 1) {
    const err = new Error('Prodotto esaurito.');
    err.status = 400;
    throw err;
  }

  // FIX: usa puntiFedelta del prodotto come costo
  const costoInPunti = getCostoInPunti(prodotto);

  const utente = await User.findById(userId);
  if (!utente) {
    const err = new Error('Utente non trovato.');
    err.status = 404;
    throw err;
  }

  const puntiDisponibili = utente.puntiFedelta || 0;
  if (puntiDisponibili < costoInPunti) {
    const err = new Error(`Punti insufficienti. Hai ${puntiDisponibili} pt, ne servono ${costoInPunti} pt.`);
    err.status = 400;
    throw err;
  }

  // Crea l'ordine (pagato_con_punti = 1 a livello ordine)
  const newOrdine = await Ordine.createConPunti(userId, prodotto.prezzoUnitarioVendita);

  // FIX: aggiunge il prodotto alla tabella composto con pagato_con_punti = 1
  await Ordine.addProdottoToOrdine(newOrdine.id, prodottoId, 1, prodotto.prezzoUnitarioVendita, 1);

  // Decrementa giacenza in modo atomico; se changes=0 la giacenza era già 0 (race condition)
  const decResult = await Coupon.decrementaGiacenza(prodottoId);
  if (decResult.changes === 0) {
    const err = new Error('Prodotto esaurito. Riprova.');
    err.status = 409;
    throw err;
  }

  await User.deductPuntiFedelta(userId, costoInPunti);
  const utenteAggiornato = await User.findById(userId);

  return {
    message: `Acquisto effettuato con ${costoInPunti} punti!`,
    ordineId: newOrdine.id,
    costoInPunti,
    puntiFedeltaRimanenti: utenteAggiornato.puntiFedelta
  };
};

// Espone helper per uso nei controller (catalogo/prodotti usati, ecc.)
exports.getCostoInPunti = getCostoInPunti;
exports.PUNTI_PER_PRESET = PUNTI_PER_PRESET;
