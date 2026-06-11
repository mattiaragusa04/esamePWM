const db = require("../db/database");

const  Ordine = {
    findAll : () => {
        return new Promise((res, rej) => {
            const query = `
                SELECT ordine.*, 
                       indirizzo.via || ' ' || indirizzo.numero_civico || ', ' || indirizzo.cap || ' ' || indirizzo.paese || ' (' || indirizzo.provincia || ')' AS indirizzo_spedizione
                FROM ordine
                LEFT JOIN indirizzo ON ordine.indirizzo_id = indirizzo.id
            `;
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
            const query = `INSERT INTO ordine (carta_id, indirizzo_id, utente_id, data, totale, statoOrdine) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [ordine.carta_id, ordine.indirizzo_id, ordine.utente_id, ordine.data, ordine.totale, ordine.statoOrdine], function(err) {
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
    },

    getProdottiByOrdineId: (ordineId) => {
        return new Promise((res, rej) => {
            const query = `
                SELECT c.quantita, p.puntiFedelta
                FROM composto c
                JOIN prodotto p ON c.prodotto_id = p.id
                WHERE c.ordine_id = ?
            `;
            db.all(query, [ordineId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },

    updateStatus : (id, statoOrdine) => {
        return new Promise((res, rej) => {
            const query = `UPDATE ordine SET statoOrdine = ? WHERE id = ?`;
            db.run(query, [statoOrdine, id], function (err) {
                if (err) rej(err);
                else res({ id: id, changes: this.changes });
            });
        });
    }

}
module.exports = Ordine;