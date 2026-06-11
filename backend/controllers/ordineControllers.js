const Ordine = require('../models/ordineModel');
const Carrello = require('../models/carrelloModel');
const User = require('../models/userModel'); // Import User model
const Prodotto = require('../models/prodottoModel'); // Import Prodotto model to get points


exports.createOrdine = async (req, res) => {
    const userId = req.user.id; // Assumendo che l'ID utente sia disponibile dal middleware di autenticazione
    const { carta_id, indirizzo_id } = req.body; 

    try {
        // Recupera i prodotti direttamente dal carrello dell'utente nel database
        const prodottiInCarrello = await Carrello.findByUserId(userId);

        if (!prodottiInCarrello || prodottiInCarrello.length === 0) {
            return res.status(400).json({ error: "Il carrello è vuoto. Impossibile creare l'ordine." });
        }

        let totaleOrdine = 0;
        let puntiFedeltaTotali = 0;
        const prodottiPerOrdine = [];

        for (const item of prodottiInCarrello) {
            // Logica del prezzo: se usato applica lo sconto del 25%
            let prezzoUnitario = item.prezzoUnitarioVendita;
            if (item.condizione === 'Usato') {
                prezzoUnitario = Math.round((prezzoUnitario * 0.75) * 100) / 100;
            }
            const puntiFedeltaProdotto = item.puntiFedelta || 0;

            totaleOrdine += item.quantita * prezzoUnitario;
            puntiFedeltaTotali += item.quantita * puntiFedeltaProdotto;
            
            prodottiPerOrdine.push({
                prodottoId: item.id, // L'ID del prodotto dal JOIN nel carrello
                quantita: item.quantita,
                prezzoUnitario: prezzoUnitario
            });
        }

        // 1. Creare l'ordine principale (Salviamo i punti ma non li accreditiamo all'utente)
        const newOrdine = await Ordine.create({
            carta_id,
            indirizzo_id,
            utente_id: userId,
            data: new Date().toISOString(),
            totale: totaleOrdine,
            punti_fedelta: puntiFedeltaTotali,
            statoOrdine: 'In elaborazione'
        });

        // 2. Aggiungere i prodotti all'ordine
        for (const item of prodottiPerOrdine) {
            await Ordine.addProdottoToOrdine(newOrdine.id, item.prodottoId, item.quantita, item.prezzoUnitario);
        }

        // 3. Svuotare il carrello dell'utente
        await Carrello.clearCart(userId);

        res.status(201).json({ message: 'Ordine creato con successo!', ordine: newOrdine, puntiGuadagnati: puntiFedeltaTotali });

    } catch (error) {
        console.error('Errore durante la creazione dell\'ordine:', error);
        res.status(500).json({ error: 'Errore interno del server durante la creazione dell\'ordine.' });
    }
};

exports.updateStatoOrdine = async (req, res) => {
    const { ordineId, nuovoStato } = req.body;

    try {
        // Recuperiamo l'ordine corrente
        const ordine = await Ordine.findById(ordineId);
        if (!ordine) return res.status(404).json({ error: "Ordine non trovato" });

        // Se lo stato precedente non era 'Consegnato' e quello nuovo lo è, accreditiamo i punti
        if (ordine.statoOrdine !== 'Consegnato' && nuovoStato === 'Consegnato') {
            const puntiDaAccreditare = ordine.punti_fedelta || 0;
            if (puntiDaAccreditare > 0) {
                await User.updatePuntiFedelta(ordine.utente_id, puntiDaAccreditare);
                console.log(`Accreditati ${puntiDaAccreditare} punti all'utente ${ordine.utente_id}`);
            }
        }

        // Aggiorniamo lo stato nel database
        await Ordine.updateStatus(ordineId, nuovoStato);

        res.json({ 
            message: `Stato ordine aggiornato a ${nuovoStato}`, 
            puntiAccreditati: nuovoStato === 'Consegnato' ? ordine.punti_fedelta : 0 
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
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}

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
}

exports.getOrdiniByUserId = async (req, res) => {
    try {
        // Usiamo req.user.id per la sicurezza, così ogni utente può vedere solo i propri ordini
        const userId = req.user.id;
        const ordini = await Ordine.findByUserId(userId);
        res.json(ordini);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
