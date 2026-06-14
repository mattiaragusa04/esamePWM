const db = require('../db/database');

const Coupon = {

  // Trova un coupon valido per codice (usato sia in validaCoupon che in createOrdine)
  findValidByCodice: (codice) => {
    const oggi = new Date().toISOString().split('T')[0];
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM Coupon
         WHERE codice = ?
           AND attivo = 1
           AND (data_scadenza IS NULL OR data_scadenza >= ?)
           AND (utilizzi_massimi IS NULL OR utilizzi_attuali < utilizzi_massimi)`,
        [codice.toUpperCase().trim(), oggi],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM Coupon WHERE id = ?`, [id],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM Coupon ORDER BY id DESC`, [],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },

  create: ({ codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon (codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi, utilizzi_attuali, attivo)
         VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
        [codice.toUpperCase().trim(), tipo, valore, descrizione || null, data_scadenza || null, utilizzi_massimi || null],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
      );
    });
  },

  toggle: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon SET attivo = CASE WHEN attivo = 1 THEN 0 ELSE 1 END WHERE id = ?`,
        [id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  incrementaUtilizzi: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon SET utilizzi_attuali = utilizzi_attuali + 1 WHERE id = ?`,
        [id],
        (err) => { if (err) reject(err); else resolve(); }
      );
    });
  }
};

module.exports = Coupon;