const Ordine   = require('../models/ordineModel');
const Carrello = require('../models/carrelloModel');
const User     = require('../models/userModel');
const Coupon   = require('../models/couponModel');

// Arrotondamento commerciale: .50 o più → su, meno di .50 → giù
// Esempi: 59.99 → 60 | 59.01 → 59 | 59.50 → 60 | 59.49 → 59
function arrotondaCommerciale(valore) {
  return Math.floor(valore + 0.5);
}

// ─────────────────────────────────────────────────────────────────────────────
// Crea un ordine completo: calcola totale, applica coupon, calcola punti fedeltà
// ─────────────────────────────────────────────────────────────────────────────
exports.createOrdine = async (userId, { carta_id, indirizzo_id, coupon_codice }) => {
  const prodottiInCarrello = await Carrello.findByUserId(userId);

  if (!prodottiInCarrello || prodottiInCarrello.length === 0) {
    const err = new Error("Il carrello è vuoto. Impossibile creare l'ordine.");
    err.status = 400;
    throw err;
  }

  // ── Calcolo totale ──────────────────────────────────────────
  let totaleOrdine = 0;
  const prodottiPerOrdine = [];

  for (const item of prodottiInCarrello) {
    let prezzoUnitario = item.prezzoUnitarioVendita;
    if (item.condizione === 'Usato') {
      prezzoUnitario = Math.round((prezzoUnitario * 0.75) * 100) / 100;
    }
    totaleOrdine += item.quantita * prezzoUnitario;
    prodottiPerOrdine.push({ prodottoId: item.id, quantita: item.quantita, prezzoUnitario });
  }

  totaleOrdine = Math.round(totaleOrdine * 100) / 100;

  // ── Gestione coupon ─────────────────────────────────────────
  let couponId = null;
  let scontoApplicato = 0;
  let totaleScontato = totaleOrdine;

  if (coupon_codice) {
    const coupon = await Coupon.findValidByCodice(coupon_codice);
    if (!coupon) {
      const err = new Error('Il coupon non è più valido. Rimuovilo e riprova.');
      err.status = 400;
      err.codice = 'COUPON_SCADUTO';
      throw err;
    }

    if (coupon.tipo === 'percentuale') {
      scontoApplicato = Math.round(totaleOrdine * (coupon.valore / 100) * 100) / 100;
    } else {
      scontoApplicato = Math.min(coupon.valore, totaleOrdine);
    }

    totaleScontato = Math.round((totaleOrdine - scontoApplicato) * 100) / 100;
    couponId = coupon.id;
  }

  // ── Calcolo punti fedeltà ───────────────────────────────────
  // 1 punto ogni 5€ sul totale arrotondato commercialmente
  const totaleArrotondato  = arrotondaCommerciale(totaleScontato);
  const puntiFedeltaFinali = Math.floor(totaleArrotondato / 5);

  // ── Creazione ordine ────────────────────────────────────────
  const newOrdine = await Ordine.create({
    carta_id,
    indirizzo_id,
    utente_id: userId,
    data: new Date().toISOString(),
    totale: totaleOrdine,
    totale_scontato: totaleScontato,
    sconto_applicato: scontoApplicato,
    coupon_id: couponId,
    punti_fedelta: puntiFedeltaFinali,
    statoOrdine: 'In elaborazione'
  });

  for (const item of prodottiPerOrdine) {
    await Ordine.addProdottoToOrdine(newOrdine.id, item.prodottoId, item.quantita, item.prezzoUnitario);
  }

  await Carrello.clearCart(userId);

  if (couponId) {
    await Coupon.incrementaUtilizzi(couponId);
  }

  return {
    message: 'Ordine creato con successo!',
    ordine: newOrdine,
    puntiGuadagnati: puntiFedeltaFinali,
    scontoApplicato,
    totaleScontato
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Aggiorna stato ordine e accredita i punti fedeltà se diventa "Consegnato"
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStatoOrdine = async (ordineId, nuovoStato) => {
  const ordine = await Ordine.findById(ordineId);
  if (!ordine) {
    const err = new Error('Ordine non trovato');
    err.status = 404;
    throw err;
  }

  let puntiDaAccreditare = 0;

  if (ordine.statoOrdine !== 'Consegnato' && nuovoStato === 'Consegnato') {
    puntiDaAccreditare = ordine.punti_fedelta || 0;
    if (puntiDaAccreditare > 0) {
      await User.updatePuntiFedelta(ordine.utente_id, puntiDaAccreditare);
      console.log(`[OrdineService] Accreditati ${puntiDaAccreditare} punti all'utente ${ordine.utente_id}`);
    }
  }

  await Ordine.updateStatus(ordineId, nuovoStato);

  return {
    message: `Stato ordine aggiornato a ${nuovoStato}`,
    puntiAccreditati: puntiDaAccreditare
  };
};
