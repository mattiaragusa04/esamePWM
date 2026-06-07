const db = require('./db/database');

// Aggiorna la colonna 'giacenza' per tutti i prodotti assegnando un valore casuale tra 1 e 100
db.run("UPDATE prodotto SET giacenza = ABS(RANDOM() % 100) + 1", function(err) {
    if (err) {
        console.error("Errore durante l'aggiornamento:", err.message);
    } else {
        console.log(`Quantità casuali aggiornate con successo in ${this.changes} prodotti!`);
    }
    db.close();
});