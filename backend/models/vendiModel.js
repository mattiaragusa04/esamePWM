const db = require("../db/database");

const Vendi = {
  create: (utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto) => {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO vendi (utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, stato_offerta) VALUES (?, ?, ?, ?, ?, ?)`;
      db.run(query, [utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, 'In attesa'], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, stato_offerta: 'In attesa' });
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM vendi`;
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM vendi WHERE id = ?`;
      db.get(query, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  findByUserId: (utente_id) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM vendi WHERE utente_id = ?`;
      db.all(query, [utente_id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  updateStatus: (id, stato_offerta) => {
    return new Promise((resolve, reject) => {
      const query = `UPDATE vendi SET stato_offerta = ?, data_aggiornamento_stato = CURRENT_TIMESTAMP WHERE id = ?`;
      db.run(query, [stato_offerta, id], function (err) {
        if (err) reject(err);
        else resolve({ id: id, changes: this.changes });
      });
    });
  }
};

module.exports = Vendi;
