const db = require("../db/database");

const Prodotto = {
  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM prodotto`;
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM prodotto WHERE id = ?`;
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findByCategoria: (categoriaId) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM prodotto WHERE categoria_id = ?`;
      db.all(query, [categoriaId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = Prodotto;