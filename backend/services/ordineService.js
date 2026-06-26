const Ordine = require('../models/ordineModel');
const Carrello = require('../models/carrelloModel');
const User = require('../models/userModel');
const Prodotto = require('../models/prodottoModel');
const Coupon = require('../models/couponModel');


function arrotondaCommerciale(valore) {
    return Math.floor(valore + 0.5);
}


function calcolaPuntiDaPrezzo(prezzoUnitarioCongelato, puntiFedeltatProdotto) {
    if (puntiFedeltatProdotto && Number(puntiFedeltatProdotto) > 0) {
        return Number(puntiFedeltatProdotto);
    }
    return Math.floor(Number(prezzoUnitarioCongelato) + 0.5) / 5;
}

exports.createOrdine = async (userId, { carta_id, indirizzo_id, coupon_codice }) => {
    const prodottiInCarrello = await Carrello.findByUserId(userId);

    if (!prodottiInCarrello || prodottiInCarrello.length === 0) {
        const err = new Error("Il carrello è vuoto. Impossibile creare l'ordine.");
        err.status = 400;
        throw err;
    }

    let totaleOrdine = 0;
    const prodottiPerOrdine = [];

    for (const item of prodottiInCarrello) {
        let prezzoUnitario = item.prezzoUnitarioVendita;
        if (item.condizione === 'Usato') {
            prezzoUnitario = Math.round((prezzoUnitario * 0.75) * 100) / 100;
        }
        totaleOrdine += item.quantita * prezzoUnitario;
        prodottiPerOrdine.push({
            prodottoId: item.id,
            quantita: item.quantita,
            prezzoUnitario: prezzoUnitario
        });
    }

    totaleOrdine = Math.round(totaleOrdine * 100) / 100;

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

    const totaleArrotondato = arrotondaCommerciale(totaleScontato);
    const puntiFedeltaFinali = Math.floor(totaleArrotondato / 5);

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


exports.updateStatoOrdine = async (ordineId, nuovoStato) => {
    const ordine = await Ordine.findById(ordineId);
    if (!ordine) {
        const err = new Error("Ordine non trovato");
        err.status = 404;
        throw err;
    }

    if (ordine.statoOrdine !== 'Consegnato' && nuovoStato === 'Consegnato') {
        const puntiDaAccreditare = ordine.punti_fedelta || 0;
        if (puntiDaAccreditare > 0) {
            await User.updatePuntiFedelta(ordine.utente_id, puntiDaAccreditare);
            console.log(`[Ordine ${ordineId}] Accreditati ${puntiDaAccreditare} punti all'utente ${ordine.utente_id}`);
        }
    }

    if (ordine.statoOrdine !== 'Annullato' && nuovoStato === 'Annullato') {
        const prodottiOrdine = await Ordine.getProdottiByOrdineId(ordineId);


        for (const item of prodottiOrdine) {
            await Prodotto.ripristinaGiacenza(item.id, item.quantita);
            console.log(`[Ordine ${ordineId}] Giacenza ripristinata: prodotto ${item.id} +${item.quantita}`);
        }

        const righePagate = prodottiOrdine.filter(item => Number(item.pagato_con_punti) === 1);

        if (righePagate.length > 0) {

            const puntiDaRestituire = righePagate.reduce((acc, item) => {
                const puntiRiga = calcolaPuntiDaPrezzo(
                    item.prezzoUnitario,
                    item.puntiFedelta
                ) * (item.quantita ?? 1);
                return acc + puntiRiga;
            }, 0);

            const puntiInteri = Math.round(puntiDaRestituire);

            if (puntiInteri > 0) {
                await User.updatePuntiFedelta(ordine.utente_id, puntiInteri);
                console.log(`[Ordine ${ordineId}] Restituiti ${puntiInteri} punti all'utente ${ordine.utente_id}`);
            }
        }
    }

    await Ordine.updateStatus(ordineId, nuovoStato);

    return { message: `Stato ordine aggiornato a ${nuovoStato}` };
};
