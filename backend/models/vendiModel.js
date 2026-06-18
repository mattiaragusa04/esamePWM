const db = require("../db/database");

const Vendi = {
  // tipo_compenso: 'euro' | 'punti'
  create: (utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, tipo_compenso) => {
    return new Promise((resolve, reject) => {
      const compenso = tipo_compenso === 'punti' ? 'punti' : 'euro';
      const query = `INSERT INTO vendi (utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, stato_offerta, tipo_compenso) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(query, [utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, 'In attesa', compenso], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, utente_id, prodotto_id, prezzo_stimato, condizioni_json, allegati_foto, stato_offerta: 'In attesa', tipo_compenso: compenso });
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, p.nome AS nome_prodotto, u.nome AS nome_utente, u.cognome AS cognome_utente
        FROM vendi v
        LEFT JOIN prodotto p ON v.prodotto_id = p.id
        LEFT JOIN utente u ON v.utente_id = u.id
      `;
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
      const query = `
        SELECT v.*, p.nome AS nome_prodotto
        FROM vendi v
        LEFT JOIN prodotto p ON v.prodotto_id = p.id
        WHERE v.utente_id = ?
        ORDER BY v.data_offerta DESC
      `;
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
