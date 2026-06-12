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
      const query = `UPDATE utente SET puntiFedelta = COALESCE(puntiFedelta, 0) + ? WHERE id = ?`;
      db.run(query, [puntiDaAggiungere, userId], function (err) {
        if (err) reject(err);
        else resolve({ id: userId, changes: this.changes });
      });
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      // Prima di eliminare l'utente, cancella tutte le righe collegate
      // rispettando l'ordine dei vincoli di foreign key
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
  }
};

module.exports = User;