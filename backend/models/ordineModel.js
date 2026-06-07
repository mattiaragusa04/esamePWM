const db = require("../db/database");

const  Ordine = {
    findAll : () => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM ordine`;
            db.all(query, [], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    findById : (id) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM ordine WHERE id = ?`;
            db.get(query, [id], (err, row) => {
                if (err) rej(err);
                else res(row);
            });
        });
    },

    findByUserId : (userId) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM ordine WHERE utente_id = ?`;
            db.all(query, [userId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    
    create : (ordine) => {
        return new Promise((res, rej) => {
            const query = `INSERT INTO ordine (utente_id, data, totale, statoOrdine, acquisto_vendita) VALUES (?, ?, ?, ?, ?)`;
            db.run(query, [ordine.utente_id, ordine.data, ordine.totale, ordine.statoOrdine, ordine.acquisto_vendita], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...ordine });
            });
        });
    },

    addProdottoToOrdine : (ordineId, prodottoId, quantita, prezzoUnitario) => {
        return new Promise((res, rej) => {
            const query = `INSERT INTO composto (ordine_id, prodotto_id, quantita, prezzoUnitario) VALUES (?, ?, ?, ?)`;
            db.run(query, [ordineId, prodottoId, quantita, prezzoUnitario], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID });
            });
        });
    }

}
module.exports = Ordine;