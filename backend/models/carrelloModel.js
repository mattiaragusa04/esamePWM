const db = require("../db/database");

const Carrello = {
    findByUserId : (userId) => {
        return new Promise((res, rej) => {
            const query = `
                SELECT p.*, c.quantita , c.condizione
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
    addItem : (userId, prodottoId, quantita, condizione) => {
        return new Promise((res, rej) => {
            const findCartQuery = `SELECT id FROM carrello WHERE utente_id = ?`;
            db.get(findCartQuery, [userId], (err, row) => {
                if (err) return rej(err);

                const carrelloId = row ? row.id : null;
                
                const upsertItemQuery = `
                    INSERT INTO contiene (carrello_id, prodotto_id, quantita, condizione) 
                    VALUES (?, ?, ?, ?) 
                    ON CONFLICT(carrello_id, prodotto_id, condizione) 
                    DO UPDATE SET quantita = contiene.quantita + excluded.quantita
                `;
                

                if (carrelloId) {
                     db.run(upsertItemQuery, [carrelloId, prodottoId, quantita, condizione], function(err) {
                        if (err) rej(err);
                        else res({ carrelloId, prodottoId, quantita, condizione });
                    });
                } else {
                    const createCartQuery = `INSERT INTO carrello (totale, utente_id) VALUES (0, ?)`;
                    db.run(createCartQuery, [userId], function(err) {
                        if (err) rej(err);
                        else {
                            const newCarrelloId = this.lastID;
                            db.run(upsertItemQuery, [newCarrelloId, prodottoId, quantita, condizione], function(err) {
                                if (err) rej(err);
                                else res({ carrelloId: newCarrelloId, prodottoId, quantita, condizione });
                            });
                        }
                    });
                }
            });
        });
    },
    removeItem : (userId, prodottoId, condizione) => {
        return new Promise((res, rej) => {
            const query = `
                DELETE FROM contiene 
                WHERE carrello_id = (SELECT id FROM carrello WHERE utente_id = ?) 
                AND prodotto_id = ? AND condizione = ?
            `;
            db.run(query, [userId, prodottoId, condizione], function(err) {                
                if (err) rej(err);
                else res({ prodottoId, condizione });
            });
        });
    },
    updateItem : (userId, prodottoId, quantita, condizione) => {
        return new Promise((res, rej) => {
            const query = `
                UPDATE contiene 
                SET quantita = ? 
                WHERE carrello_id = (SELECT id FROM carrello WHERE utente_id = ?) 
                AND prodotto_id = ? AND condizione = ?
            `;
             db.run(query, [quantita, userId, prodottoId, condizione], function(err)  {
                if (err) rej(err);
                else res({ prodottoId, quantita, condizione });
            });
        });
    },
    
    clearCart : (userId) => {
        return new Promise((res, rej) => {
            const query = `
                DELETE FROM contiene 
                WHERE carrello_id = (SELECT id FROM carrello WHERE utente_id = ?)
            `;
            db.run(query, [userId], function(err) {
                if (err) rej(err);
                else res({ userId });
            });
        });
    },

    

};

module.exports = Carrello;