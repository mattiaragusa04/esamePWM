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
  }
};

module.exports = User;