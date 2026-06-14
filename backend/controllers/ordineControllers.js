const Ordine = require('../models/ordineModel');
const Carrello = require('../models/carrelloModel');
const User = require('../models/userModel');
const Prodotto = require('../models/prodottoModel');
const Coupon = require('../models/couponModel'); // ← AGGIUNTO

exports.createOrdine = async (req, res) => {
    const userId = req.user.id;
    const { carta_id, indirizzo_id, coupon_codice } = req.body; // ← aggiunto coupon_codice

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
            // ─── FUTURO: controllo promozioni attive ─────────────────────────────
            // Quando la logica promozioni sarà implementata, decommentare:
            //
            // const promozioneAttiva = await Promozione.findActivaByUserId(userId);
            // if (promozioneAttiva) {
            //   return res.status(409).json({
            //     error: 'Non puoi combinare un coupon con una promozione attiva.',
            //     codice: 'PROMOZIONE_ATTIVA'
            //   });
            // }
            // ─────────────────────────────────────────────────────────────────────

            const coupon = await Coupon.findValidByCodice(coupon_codice);

            if (!coupon) {
                // Il coupon era valido al momento della validazione ma ora non lo è più
                // (es. esaurito da un altro utente nel frattempo) → blocchiamo l'ordine
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

        // 1. Creare l'ordine principale (con campi coupon)
        const newOrdine = await Ordine.create({
            carta_id,
            indirizzo_id,
            utente_id: userId,
            data: new Date().toISOString(),
            totale: totaleOrdine,           // totale lordo (senza sconto)
            totale_scontato: totaleScontato, // totale finale pagato
            sconto_applicato: scontoApplicato,
            coupon_id: couponId,
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
            puntiGuadagnati: puntiFedeltaTotali,
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
            const prodottiOrdine = await Ordine.getProdottiByOrdineId(ordineId);
            for (const p of prodottiOrdine) {
                puntiDaAccreditare += (p.puntiFedelta || 0) * p.quantita;
            }

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