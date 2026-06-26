const db = require('../db/database');

const Recensione = {


    create: (utente_id, testo, voto) => {
        return new Promise((res, rej) => {
            const query = `
                INSERT INTO recensione (utente_id, testo, voto)
                VALUES (?, ?, ?)
            `;
            db.run(query, [utente_id, testo, voto], function (err) {
                if (err) rej(err);
                else res({ id: this.lastID, utente_id, testo, voto });
            });
        });
    },


    update: (utente_id, testo, voto) => {
        return new Promise((res, rej) => {
            const query = `
                UPDATE recensione SET testo = ?, voto = ?, data = CURRENT_TIMESTAMP
                WHERE utente_id = ?
            `;
            db.run(query, [testo, voto, utente_id], function (err) {
                if (err) rej(err);
                else res({ changes: this.changes });
            });
        });
    },


    findByUserId: (utente_id) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM recensione WHERE utente_id = ?`;
            db.get(query, [utente_id], (err, row) => {
                if (err) rej(err);
                else res(row || null);
            });
        });
    },

    findAll: () => {
        return new Promise((res, rej) => {
            const query = `
                SELECT r.id, r.testo, r.voto, r.data,
                       u.nome, u.cognome
                FROM recensione r
                JOIN utente u ON r.utente_id = u.id
                ORDER BY r.data DESC
            `;
            db.all(query, [], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },


    deleteByUserId: (utente_id) => {
        return new Promise((res, rej) => {
            const query = `DELETE FROM recensione WHERE utente_id = ?`;
            db.run(query, [utente_id], function (err) {
                if (err) rej(err);
                else res({ changes: this.changes });
            });
        });
    }
};

module.exports = Recensione;
