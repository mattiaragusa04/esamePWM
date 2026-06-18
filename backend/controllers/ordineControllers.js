const Ordine = require('../models/ordineModel');
const Carrello = require('../models/carrelloModel');
const User = require('../models/userModel');
const Prodotto = require('../models/prodottoModel');
const Coupon = require('../models/couponModel');

/**
 * Arrotondamento commerciale: .50 o più -> su, meno di .50 -> giù.
 */
function arrotondaCommerciale(valore) {
    return Math.floor(valore + 0.5);
}

/**
 * Calcola il costo in punti di un prodotto dal suo prezzo congelato in composto.
 * Replica la stessa logica di getCostoInPunti in couponController:
 *   - se puntiFedelta è valorizzato, lo usa direttamente
 *   - altrimenti fallback: arrotondamento commerciale del prezzoUnitario / 5
 * Usando prezzoUnitario da composto (congelato al momento dell'acquisto)
 * il calcolo è sempre deterministico e non dipende dallo stato attuale del prodotto.
 */
function calcolaPuntiDaPrezzo(prezzoUnitarioCongelato, puntiFedeltatProdotto) {
    if (puntiFedeltatProdotto && Number(puntiFedeltatProdotto) > 0) {
        return Number(puntiFedeltatProdotto);
    }
    return Math.floor(Number(prezzoUnitarioCongelato) + 0.5) / 5;
}

exports.createOrdine = async (req, res) => {
    const userId = req.user.id;
    const { carta_id, indirizzo_id, coupon_codice } = req.body;

    try {
        const prodottiInCarrello = await Carrello.findByUserId(userId);

        if (!prodottiInCarrello || prodottiInCarrello.length === 0) {
            return res.status(400).json({ error: "Il carrello è vuoto. Impossibile creare l'ordine." });
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
                return res.status(400).json({
                    error: 'Il coupon non è più valido. Rimuovilo e riprova.',
                    codice: 'COUPON_SCADUTO'
                });
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

        res.status(201).json({
            message: 'Ordine creato con successo!',
            ordine: newOrdine,
            puntiGuadagnati: puntiFedeltaFinali,
            scontoApplicato,
            totaleScontato
        });

    } catch (error) {
        console.error('Errore durante la creazione dell\'ordine:', error);
        res.status(500).json({ error: 'Errore interno del server durante la creazione dell\'ordine.' });
    }
};

exports.getProdottiOrdine = async (req, res) => {
    try {
        const ordineId = req.params.id;
        const ordine = await Ordine.findById(ordineId);
        if (!ordine) {
            return res.status(404).json({ error: 'Ordine non trovato.' });
        }
        if (ordine.utente_id !== req.user.id && req.user.ruolo !== 'admin') {
            return res.status(403).json({ error: 'Accesso non autorizzato.' });
        }
        const prodotti = await Ordine.getProdottiByOrdineId(ordineId);
        res.json(prodotti);
    } catch (err) {
        console.error('Errore getProdottiOrdine:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatoOrdine = async (req, res) => {
    const { ordineId, nuovoStato } = req.body;

    try {
        const ordine = await Ordine.findById(ordineId);
        if (!ordine) return res.status(404).json({ error: "Ordine non trovato" });

        // ── Caso: → "Consegnato" ──────────────────────────────────────────────
        // Accredita i punti fedeltà guadagnati con l'acquisto in euro.
        if (ordine.statoOrdine !== 'Consegnato' && nuovoStato === 'Consegnato') {
            const puntiDaAccreditare = ordine.punti_fedelta || 0;
            if (puntiDaAccreditare > 0) {
                await User.updatePuntiFedelta(ordine.utente_id, puntiDaAccreditare);
                console.log(`[Ordine ${ordineId}] Accreditati ${puntiDaAccreditare} punti all'utente ${ordine.utente_id}`);
            }
        }

        // ── Caso: → "Annullato" ───────────────────────────────────────────────
        // 1) Ripristina la giacenza di ogni prodotto dell'ordine.
        // 2) Se l'ordine era pagato con punti, restituisce i punti all'utente.
        //    I punti vengono calcolati da c.prezzoUnitario (congelato al momento
        //    dell'acquisto in composto) e NON da p.puntiFedelta (che potrebbe
        //    essere stato modificato nel frattempo).
        if (ordine.statoOrdine !== 'Annullato' && nuovoStato === 'Annullato') {
            const prodottiOrdine = await Ordine.getProdottiByOrdineId(ordineId);

            // Ripristino giacenza per ogni riga dell'ordine
            for (const item of prodottiOrdine) {
                await Prodotto.ripristinaGiacenza(item.id, item.quantita);
                console.log(`[Ordine ${ordineId}] Giacenza ripristinata: prodotto ${item.id} +${item.quantita}`);
            }

            // Restituzione punti: solo se almeno una riga ha pagato_con_punti = 1
            const righePagate = prodottiOrdine.filter(item => Number(item.pagato_con_punti) === 1);

            if (righePagate.length > 0) {
                // Calcola i punti usando prezzoUnitario congelato in composto
                // (stessa logica di getCostoInPunti in couponController)
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
        // ─────────────────────────────────────────────────────────────────────

        await Ordine.updateStatus(ordineId, nuovoStato);

        res.json({ message: `Stato ordine aggiornato a ${nuovoStato}` });

    } catch (error) {
        console.error('Errore aggiornamento stato ordine:', error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento dell\'ordine.' });
    }
};

exports.getAllOrdini = async (req, res) => {
    try {
        const ordini = await Ordine.findAll();
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrdineById = async (req, res) => {
    try {
        const id = req.params.id;
        const ordineData = await Ordine.findById(id);
        if (!ordineData) {
            return res.status(404).json({ message: "Ordine non trovato" });
        }
        res.json(ordineData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOrdiniByUserId = async (req, res) => {
    try {
        const userId = req.user.id;
        const ordini = await Ordine.findByUserId(userId);
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
