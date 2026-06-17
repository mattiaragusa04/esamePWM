const db = require("../db/database");

const User = {
  create: (nome, cognome, email, password) => {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO utente (nome, cognome, email, password) VALUES (?, ?, ?, ?)`;
      db.run(query, [nome, cognome, email, password], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, nome, cognome, email });
      });
    });
  },

  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM utente WHERE email = ?`;
      db.get(query, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM utente`;
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM utente WHERE id = ?`;
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  updatePuntiFedelta: (userId, puntiDaAggiungere) => {
    return new Promise((resolve, reject) => {
      // Usa il nome esatto della colonna come da CREATE TABLE in database.js
      const queryUpdate = `UPDATE utente SET puntiFedelta = COALESCE(puntiFedelta, 0) + ? WHERE id = ?`;
      db.run(queryUpdate, [puntiDaAggiungere, userId], function (err) {
        if (err) return reject(err);
        if (this.changes === 0) {
          // Nessuna riga aggiornata: userId inesistente o colonna non trovata
          return reject(new Error(`updatePuntiFedelta: nessuna riga aggiornata per userId=${userId}. Verifica che l'utente esista.`));
        }
        // Leggi il valore effettivo aggiornato dal DB per conferma
        db.get(`SELECT puntiFedelta FROM utente WHERE id = ?`, [userId], (err2, row) => {
          if (err2) return reject(err2);
          resolve({
            id: Number(userId),
            changes: this.changes,
            puntiFedelta: row ? row.puntiFedelta : null
          });
        });
      });
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      const queries = [
        `DELETE FROM contiene WHERE carrello_id IN (SELECT id FROM carrello WHERE utente_id = ?)`,
        `DELETE FROM carrello WHERE utente_id = ?`,
        `DELETE FROM composto WHERE ordine_id IN (SELECT id FROM ordine WHERE utente_id = ?)`,
        `DELETE FROM ordine WHERE utente_id = ?`,
        `DELETE FROM indirizzo WHERE utente_id = ?`,
        `DELETE FROM carta_di_credito WHERE utente_id = ?`,
        `DELETE FROM recensione WHERE utente_id = ?`,
        `DELETE FROM vendi WHERE utente_id = ?`,
        `DELETE FROM utente WHERE id = ?`
      ];

      const runNext = (index) => {
        if (index >= queries.length) return resolve({ id });
        db.run(queries[index], [id], (err) => {
          if (err) return reject(err);
          runNext(index + 1);
        });
      };

      runNext(0);
    });
  },

  rendiAdmin: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE utente SET ruolo = 'admin' WHERE id = ?`;
      db.run(query, [userId], function (err) {
        if (err) reject(err);
        else resolve({ id: userId, changes: this.changes });
      });
    });
  },

  rendiUser: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE utente SET ruolo = 'user' WHERE id = ?`;
      db.run(query, [userId], function (err) {
        if (err) reject(err);
        else resolve({ id: userId, changes: this.changes });
      });
    });
  },

  rendiOperatore: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE utente SET ruolo = 'operatore' WHERE id = ?`;
      db.run(query, [userId], function (err) {
        if (err) reject(err);
        else resolve({ id: userId, changes: this.changes });
      });
    });
  },
};

module.exports = User;
