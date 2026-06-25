const db = require("../db/database");

const User = {
  create: (nome, cognome, email, password) => {
    return new Promise((resolve, reject) => {
      // Crea l'utente senza security_stamp
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
      const queryUpdate = `UPDATE utente SET puntiFedelta = COALESCE(puntiFedelta, 0) + ? WHERE id = ?`;
      db.run(queryUpdate, [puntiDaAggiungere, userId], function (err) {
        if (err) return reject(err);
        if (this.changes === 0) {
          return reject(new Error(`updatePuntiFedelta: nessuna riga aggiornata per userId=${userId}.`));
        }
        db.get(`SELECT puntiFedelta FROM utente WHERE id = ?`, [userId], (err2, row) => {
          if (err2) return reject(err2);
          resolve({ id: Number(userId), changes: this.changes, puntiFedelta: row ? row.puntiFedelta : null });
        });
      });
    });
  },

  // Scala (sottrae) i punti fedeltà — usato per acquisti con punti
  deductPuntiFedelta: (userId, puntiDaSottrarre) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE utente SET puntiFedelta = MAX(0, COALESCE(puntiFedelta, 0) - ?) WHERE id = ?`,
        [puntiDaSottrarre, userId],
        function (err) {
          if (err) return reject(err);
          db.get(`SELECT puntiFedelta FROM utente WHERE id = ?`, [userId], (err2, row) => {
            if (err2) return reject(err2);
            resolve({ id: Number(userId), puntiFedelta: row ? row.puntiFedelta : null });
          });
        }
      );
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
        `DELETE FROM vende WHERE utente_id = ?`,
        `DELETE FROM utente WHERE id = ?`,
        `DELETE FROM riscatta WHERE utente_id = ?`,

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


  // Aggiorna solo la password
  updatePassword: (id, hashedPassword) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE utente SET password = ? WHERE id = ?`,
        [hashedPassword, id],
        function (err) { if (err) reject(err); else resolve({ id: id, changes: this.changes }); }
      );
    });
  }
};

module.exports = User;
