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
            const prezzoUnitario = item.prezzoUnitarioVendita;
            const puntiFedeltaProdotto = item.puntiFedelta || 0;

            totaleOrdine += item.quantita * prezzoUnitario;
            puntiFedeltaTotali += item.quantita * puntiFedeltaProdotto;
            
            prodottiPerOrdine.push({
                prodottoId: item.id,
                quantita: item.quantita,
                prezzoUnitario: prezzoUnitario
            });
        }

        // 1. Creare l'ordine principale
        const newOrdine = await Ordine.create({
            carta_id,
            indirizzo_id,
            utente_id: userId,
            data: new Date().toISOString(),
            totale: totaleOrdine,
            statoOrdine: 'In elaborazione'
        });

        // 2. Aggiungere i prodotti all'ordine
        for (const item of prodottiPerOrdine) {
            await Ordine.addProdottoToOrdine(newOrdine.id, item.prodottoId, item.quantita, item.prezzoUnitario);
        }

        // 3. Svuotare il carrello dell'utente
        await Carrello.clearCart(userId);

        // 4. Aggiornare i punti fedeltà dell'utente
        await User.updatePuntiFedelta(userId, puntiFedeltaTotali);

        res.status(201).json({ message: 'Ordine creato con successo!', ordine: newOrdine, puntiGuadagnati: puntiFedeltaTotali });

    } catch (error) {
        console.error('Errore durante la creazione dell\'ordine:', error);
        res.status(500).json({ error: 'Errore interno del server durante la creazione dell\'ordine.' });
    }
};