const db = require("../db/database");

const Prodotto = {
  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.denominazione AS categoria_nome
        FROM prodotto p
        LEFT JOIN categoria c ON p.categoria_id = c.id
      `;
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.denominazione AS categoria_nome
        FROM prodotto p
        LEFT JOIN categoria c ON p.categoria_id = c.id
        WHERE p.id = ?
      `;
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findByCategoria: (categoriaId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.denominazione AS categoria_nome
        FROM prodotto p
        LEFT JOIN categoria c ON p.categoria_id = c.id
        WHERE p.categoria_id = ?
      `;
      db.all(query, [categoriaId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  search: (q) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT p.*, c.denominazione AS categoria_nome
        FROM prodotto p
        LEFT JOIN categoria c ON p.categoria_id = c.id
        WHERE p.nome LIKE ? OR p.descrizione LIKE ?
      `;
      db.all(query, [`%${q}%`, `%${q}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

module.exports = Prodotto;