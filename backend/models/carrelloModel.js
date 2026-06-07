const db = require("../db/database");

const Carrello = {
    findByUserId : (userId) => {
        return new Promise((res, rej) => {
            const query = `
                SELECT p.*, c.quantita 
                FROM carrello car
                JOIN contiene c ON car.id = c.carrello_id
                JOIN prodotto p ON c.prodotto_id = p.id
                WHERE car.utente_id = ?
            `;
            db.all(query, [userId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    addItem : (userId, prodottoId, quantita) => {
        return new Promise((res, rej) => {
            const findCartQuery = `SELECT id FROM carrello WHERE utente_id = ?`;
            db.get(findCartQuery, [userId], (err, row) => {
                if (err) rej(err);
                else {
                    const carrelloId = row ? row.id : null;

                    // Query UPSERT: inserisce il prodotto o, se c'è un conflitto, ne incrementa la quantità
                    const upsertItemQuery = `
                        INSERT INTO contiene (carrello_id, prodotto_id, quantita) 
                        VALUES (?, ?, ?) 
                        ON CONFLICT(carrello_id, prodotto_id) 
                        DO UPDATE SET quantita = contiene.quantita + excluded.quantita
                    `;

                    if (carrelloId) {
                        db.run(upsertItemQuery, [carrelloId, prodottoId, quantita], function(err) {
                            if (err) rej(err);
                            else res({ carrelloId, prodottoId, quantita });
                        });
                    } else {
                        const createCartQuery = `INSERT INTO carrello (totale, utente_id) VALUES (0, ?)`;
                        db.run(createCartQuery, [userId], function(err) {
                            if (err) rej(err);
                            else {
                                const newCarrelloId = this.lastID;
                                db.run(upsertItemQuery, [newCarrelloId, prodottoId, quantita], function(err) {
                                    if (err) rej(err);
                                    else res({ carrelloId: newCarrelloId, prodottoId, quantita });
                                });
                            }
                        });
                    }
                }
            });
        });
    },
    removeItem : (userId, prodottoId) => {
        return new Promise((res, rej) => {
            const query = `DELETE FROM contiene WHERE carrello_id = ? AND prodotto_id = ?`;
            db.run(query, [userId, prodottoId], function(err) {
                if (err) rej(err);
                else res({ prodottoId });
            });
        });
    },

    updateItem : (userId, prodottoId, quantita) => {
        return new Promise((res, rej) => {
            const query = `UPDATE contiene SET quantita = ? WHERE carrello_id = ? AND prodotto_id = ?`;
            db.run(query, [quantita, userId, prodottoId], function(err) {
                if (err) rej(err);
                else res({ prodottoId, quantita });
            });
        });
    },

    clearCart : (userId) => {
        return new Promise((res, rej) => {
            const query = `DELETE FROM contiene WHERE carrello_id = ?`;
            db.run(query, [userId], function(err) {
                if (err) rej(err);
                else res({ userId });
            });
        });
    },

    

};

module.exports = Carrello;