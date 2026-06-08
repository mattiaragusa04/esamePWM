const db = require("../db/database");

const CartaDiCredito = {
    findAll : () => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM carta_di_credito` ;
            db.all(query, [], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    findById : (id) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM carta_di_credito WHERE id = ?` ;
            db.get(query, [id], (err, row) => {
                if (err) rej(err);
                else res(row);
            });
        });
    },
    findByUserId : (userId) => {
        return new Promise((res, rej) => {
            const query = `SELECT * FROM carta_di_credito WHERE utente_id = ?` ;
            db.all(query, [userId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        });
    },
    create : (cartaDiCredito) => {
        return new Promise((res, rej) => {
            const query = `INSERT INTO carta_di_credito (utente_id, numero_carta, nome_titolare, data_scadenza, cvv) VALUES (?, ?, ?, ?, ?)` ;
            db.run(query, [cartaDiCredito.utente_id, cartaDiCredito.numero_carta, cartaDiCredito.nome_titolare, cartaDiCredito.data_scadenza, cartaDiCredito.cvv], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...cartaDiCredito });
            });
        });
    },
    update : (cartaDiCredito) => {
        return new Promise((res, rej) => {
            const query = `UPDATE carta_di_credito SET utente_id = ?, numero_carta = ?, nome_titolare = ?, data_scadenza = ?, cvv = ? WHERE id = ?` ;
            db.run(query, [cartaDiCredito.utente_id, cartaDiCredito.numero_carta, cartaDiCredito.nome_titolare, cartaDiCredito.data_scadenza, cartaDiCredito.cvv, cartaDiCredito.id], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...cartaDiCredito });
            });
        });
    },
    delete : (id) => {
        return new Promise((res, rej) => {
            const query = `DELETE FROM carta_di_credito WHERE id = ?` ;
            db.run(query, [id], function(err) {
                if (err) rej(err);
                else res({ id });
            });
        });
    },

};

module.exports = CartaDiCredito;