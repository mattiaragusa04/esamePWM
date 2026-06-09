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
            const query = `SELECT * FROM indirizzo WHERE utente_id = ?`;    
            db.all(query, [userId], (err, rows) => {
                if (err) rej(err);
                else res(rows);
            });
        }); 
    },
    create : (indirizzo) => {
        return new Promise((res, rej) => {
            const query = `INSERT INTO indirizzo (utente_id, tipo, via, numero_civico, provincia, paese, cap) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(query, [indirizzo.utente_id, indirizzo.tipo, indirizzo.via, indirizzo.numero_civico, indirizzo.provincia, indirizzo.paese, indirizzo.cap], function(err) {
                if (err) rej(err);
                else res({ id: this.lastID, ...indirizzo });
            });
        });
    },
    delete : (id) => {
        return new Promise((res, rej) => {
            const query = `DELETE FROM indirizzo WHERE id = ?`;
            db.run(query, [id], function(err) {
                if (err) rej(err);
                else res({ id });
            });
        });
    }
};

module.exports = Indirizzo;