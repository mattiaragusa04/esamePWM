const Ordine = require('../models/ordineModel');
const Carrello = require('../models/carrelloModel');
const User = require('../models/userModel');
const Prodotto = require('../models/prodottoModel');
const Coupon = require('../models/couponModel');

exports.createOrdine = async (req, res) => {
    const userId = req.user.id;
    const { carta_id, indirizzo_id, coupon_codice } = req.body;

    try {
        const prodottiInCarrello = await Carrello.findByUserId(userId);

        if (!prodottiInCarrello || prodottiInCarrello.length === 0) {
            return res.status(400).json({ error: "Il carrello è vuoto. Impossibile creare l'ordine." });
        }

        let totaleOrdine = 0;
        let puntiFedeltaTotali = 0;
        const prodottiPerOrdine = [];

        for (const item of prodottiInCarrello) {
            let prezzoUnitario = item.prezzoUnitarioVendita;
            if (item.condizione === 'Usato') {
                prezzoUnitario = Math.round((prezzoUnitario * 0.75) * 100) / 100;
            }
            const puntiFedeltaProdotto = item.puntiFedelta || 0;

            totaleOrdine += item.quantita * prezzoUnitario;
            puntiFedeltaTotali += item.quantita * puntiFedeltaProdotto;

            prodottiPerOrdine.push({
                prodottoId: item.id,
                quantita: item.quantita,
                prezzoUnitario: prezzoUnitario
            });
        }

        totaleOrdine = Math.round(totaleOrdine * 100) / 100;

        // ─── GESTIONE COUPON ────────────────────────────────────────────────────
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
        // ────────────────────────────────────────────────────────────────────────

        // ─── PUNTI FEDELTÀ: calcolati sul totale effettivamente pagato ──────────
        // 1 punto ogni 5€ sul totaleScontato (non sul lordo)
        const puntiFedeltaDaTotale = Math.floor(totaleScontato / 5);
        // I punti per prodotto vengono scalati proporzionalmente se c'è uno sconto,
        // oppure si usa direttamente il calcolo sul totale scontato.
        // Scelta: usare puntiFedeltaDaTotale come base unica e coerente.
        const puntiFedeltaFinali = puntiFedeltaDaTotale;
        // ────────────────────────────────────────────────────────────────────────

        // 1. Creare l'ordine principale
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

        // 2. Aggiungere i prodotti all'ordine
        for (const item of prodottiPerOrdine) {
            await Ordine.addProdottoToOrdine(newOrdine.id, item.prodottoId, item.quantita, item.prezzoUnitario);
        }

        // 3. Svuotare il carrello
        await Carrello.clearCart(userId);

        // 4. Incrementare il contatore utilizzi del coupon
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

exports.updateStatoOrdine = async (req, res) => {
    const { ordineId, nuovoStato } = req.body;

    try {
        const ordine = await Ordine.findById(ordineId);
        if (!ordine) return res.status(404).json({ error: "Ordine non trovato" });

        let puntiDaAccreditare = 0;

        if (ordine.statoOrdine !== 'Consegnato' && nuovoStato === 'Consegnato') {
            // Usa i punti già salvati nell'ordine (calcolati sul totale scontato)
            puntiDaAccreditare = ordine.punti_fedelta || 0;

            if (puntiDaAccreditare > 0) {
                await User.updatePuntiFedelta(ordine.utente_id, puntiDaAccreditare);
                console.log(`Accreditati ${puntiDaAccreditare} punti all'utente ${ordine.utente_id}`);
            }
        }

        await Ordine.updateStatus(ordineId, nuovoStato);

        res.json({
            message: `Stato ordine aggiornato a ${nuovoStato}`,
            puntiAccreditati: puntiDaAccreditare
        });

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
