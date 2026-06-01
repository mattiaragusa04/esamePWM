const db = require('./database');

// Funzione per popolare il database con dati di esempio
function seedDatabase() {
    db.get ("SELECT COUNT(*) AS count from categoria", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO categoria (denominazione) VALUES ('Console'), ('Videogiochi'), ('Accessori'), ('Elettronica')",function(err) {
                if (err) {
                    console.error('Errore durante il popolamento del database:', err);
                } else {
                    console.log('Tabella categoria popolata con successo');
                }
            });
        }
    });
    db.get ("SELECT COUNT(*) AS count from prodotto", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            stmt.run(1, 'PlayStation 5', 'Console di ultima generazione', 10, 400, 500, true, true, 'Nuovo');
            stmt.run(2, 'The Legend of Zelda: Breath of the Wild', 'Videogioco per Nintendo Switch', 20, 30, 50, true, true, 'Nuovo');
            stmt.run(3, 'Controller Xbox Series X', 'Controller wireless per Xbox Series X', 15, 50, 70, true, true, 'Nuovo');
            stmt.run(4, 'Smartphone Samsung Galaxy S21', 'Smartphone di fascia alta', 5, 600, 800, true, true, 'Nuovo');
            stmt.finalize((err) => {
                if (err) {
                    console.error('Errore durante il popolamento del database:', err);
                } else {
                    console.log('Tabella prodotto popolata con successo');
                }
            });
        }
    });
}

module.exports = seedDatabase;