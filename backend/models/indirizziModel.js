const db = require("../db/database");

const Indirizzo = {
    findAll : () => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM indirizzo`;
            db.all(query, [], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    findById : (id) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM indirizzo WHERE id = ?`;
            db.get(query, [id], (err, row) => {
                if (err) rej(err);
                else res(row);
            });
        });
    },

    findByUserId : (userId) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM indirizzo WHERE utente_id = ? AND salvato = 1`;
            db.all(query, [userId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },

    create : (indirizzo) => {
        return new Promise((res, rej) => {
            const salvato = indirizzo.salvato !== undefined ? indirizzo.salvato : 1;
            const query = `INSERT INTO indirizzo (utente_id, tipo, via, numero_civico, provincia, paese, cap, salvato) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(query, [
                indirizzo.utente_id,
                indirizzo.tipo,
                indirizzo.via,
                indirizzo.numero_civico,
                indirizzo.provincia,
                indirizzo.paese,
                indirizzo.cap,
                salvato
            ], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...indirizzo, salvato });
            });
        });
    },
    update : (id, dati) => {
        return new Promise((res, rej) => {
            const query = `UPDATE indirizzo SET tipo = ?, via = ?, numero_civico = ?, provincia = ?, paese = ?, cap = ? WHERE id = ?`;
            db.run(query, [dati.tipo, dati.via, dati.numero_civico, dati.provincia, dati.paese, dati.cap, id], function(err) {
                if (err) rej(err);
                else res({ id, changes: this.changes });
            });
        });
    },

    delete : (id) => {
        return new Promise((res, rej) => {

            db.get(`SELECT COUNT(*) as cnt FROM ordine WHERE indirizzo_id = ?`, [id], (err, row) => {
                if (err) return rej(err);
                if (row.cnt > 0) {

                    db.run(`UPDATE indirizzo SET salvato = 0 WHERE id = ?`, [id], function(err2) {
                        if (err2) rej(err2);
                        else res({ id, softDeleted: true });
                    });
                } else {
                    db.run(`DELETE FROM indirizzo WHERE id = ?`, [id], function(err2) {
                        if (err2) rej(err2);
                        else res({ id, softDeleted: false });
                    });
                }
            });
        });
    }
};

module.exports = Indirizzo;
