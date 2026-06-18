const db = require("../db/database");

const CartaDiCredito = {
    findAll : () => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM carta_di_credito`;
            db.all(query, [], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    findById : (id) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM carta_di_credito WHERE id = ?`;
            db.get(query, [id], (err, row) => {
                if (err) rej(err);
                else res(row);
            });
        });
    },
    // Restituisce solo le carte visibili nel profilo (salvato = 1)
    findByUserId : (userId) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM carta_di_credito WHERE utente_id = ? AND salvato = 1`;
            db.all(query, [userId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    // Crea la carta. Il campo salvato determina se appare nel profilo.
    create : (cartaDiCredito) => {
        return new Promise((res, rej) => {
            const salvato = cartaDiCredito.salvato !== undefined ? cartaDiCredito.salvato : 1;
            const query = `INSERT INTO carta_di_credito (utente_id, numero_carta, nome_titolare, data_scadenza, cvv, salvato) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(query, [
                cartaDiCredito.utente_id,
                cartaDiCredito.numero_carta,
                cartaDiCredito.nome_titolare,
                cartaDiCredito.data_scadenza,
                cartaDiCredito.cvv,
                salvato
            ], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...cartaDiCredito, salvato });
            });
        });
    },
    update : (cartaDiCredito) => {
        return new Promise((res, rej) => {
            const query = `UPDATE carta_di_credito SET utente_id = ?, numero_carta = ?, nome_titolare = ?, data_scadenza = ?, cvv = ? WHERE id = ?`;
            db.run(query, [
                cartaDiCredito.utente_id,
                cartaDiCredito.numero_carta,
                cartaDiCredito.nome_titolare,
                cartaDiCredito.data_scadenza,
                cartaDiCredito.cvv,
                cartaDiCredito.id
            ], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...cartaDiCredito });
            });
        });
    },
    // Soft-delete: nasconde la carta dal profilo (salvato = 0).
    // Se la carta non è usata in nessun ordine, la elimina fisicamente.
    delete : (id) => {
        return new Promise((res, rej) => {
            // Controlla se la carta è referenziata da almeno un ordine
            db.get(`SELECT COUNT(*) as cnt FROM ordine WHERE carta_id = ?`, [id], (err, row) => {
                if (err) return rej(err);
                if (row.cnt > 0) {
                    // Ha ordini collegati: soft-delete (nasconde dal profilo)
                    db.run(`UPDATE carta_di_credito SET salvato = 0 WHERE id = ?`, [id], function(err2) {
                        if (err2) rej(err2);
                        else res({ id, softDeleted: true });
                    });
                } else {
                    // Nessun ordine collegato: delete fisica
                    db.run(`DELETE FROM carta_di_credito WHERE id = ?`, [id], function(err2) {
                        if (err2) rej(err2);
                        else res({ id, softDeleted: false });
                    });
                }
            });
        });
    },
};

module.exports = CartaDiCredito;
