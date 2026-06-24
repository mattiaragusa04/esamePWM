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
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM prodotto WHERE id = ?`;
      db.run(query, [id], (err) => {
        if (err) reject(err);
        else resolve({ id });
      });
    });
  },

  create: (prodotto) => {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, vendibile, pubblicatoVetrina, genere, condizione, puntiFedelta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const puntiFedelta = Math.round((prodotto.vendibile || 0) / 5);
      db.run(query, [
        prodotto.categoria_id,
        prodotto.nome,
        prodotto.descrizione,
        prodotto.giacenza || 0,
        prodotto.immagine || '',
        prodotto.vendibile || 0,
        1,
        prodotto.genere || null,
        prodotto.condizione || 'Nuovo',
        puntiFedelta
      ], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...prodotto });
      });
    });
  },

  update: (prodotto) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE prodotto SET categoria_id = ?, nome = ?, descrizione = ?, giacenza = ?, immagine = ?, vendibile = ?, visibile= ?, genere = ?, condizione = ? WHERE id = ?`;
      db.run(query, [
        prodotto.categoria_id,
        prodotto.nome,
        prodotto.descrizione,
        prodotto.giacenza || 0,
        prodotto.immagine || '',
        prodotto.vendibile || 0,
        prodotto.visibile|| 0,
        prodotto.genere || null,
        prodotto.condizione || 'Nuovo',
        prodotto.id
      ], function (err) {
        if (err) reject(err);
        else resolve({ id: prodotto.id, ...prodotto });
      });
    });
  },

  /**
   * Ripristina la giacenza di un prodotto sommando la quantità restituita.
   * Usato quando un ordine viene annullato.
   */
  ripristinaGiacenza: (prodottoId, quantita) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE prodotto SET giacenza = giacenza + ? WHERE id = ?`,
        [quantita, prodottoId],
        function (err) {
          if (err) reject(err);
          else resolve({ id: prodottoId, changes: this.changes });
        }
      );
    });
  }
};

module.exports = Prodotto;
