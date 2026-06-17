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

  // Aggiorna un coupon esistente per id
  update: (id, { codice, tipo, valore, descrizione, data_scadenza, utilizzi_massimi }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon
         SET codice = ?, tipo = ?, valore = ?, descrizione = ?,
             data_scadenza = ?, utilizzi_massimi = ?
         WHERE id = ?`,
        [codice, tipo, valore, descrizione || null, data_scadenza || null,
         utilizzi_massimi || null, id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
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
  },

  // Coupon fedeltà: tutti quelli con costo_punti > 0
  findAllFedelta: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM Coupon WHERE costo_punti > 0 ORDER BY id DESC`,
        [],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },

  // Catalogo coupon fedeltà attivi (per utente)
  findCatalogoFedelta: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT id, codice, tipo, valore AS percentuale, descrizione,
                data_scadenza, utilizzi_massimi, utilizzi_attuali,
                costo_punti AS costoInPunti, disponibile
         FROM Coupon
         WHERE attivo = 1
           AND costo_punti > 0
           AND (disponibile = -1 OR disponibile > 0)
           AND (data_scadenza IS NULL OR date(data_scadenza) >= date('now'))
         ORDER BY valore ASC`,
        [],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },

  // Crea coupon fedeltà dal catalogo admin
  createFedelta: ({ codice, percentuale, costoInPunti, descrizione, scadenza, disponibile }) => {
    const disp = disponibile !== undefined ? Number(disponibile) : -1;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon
           (codice, tipo, valore, descrizione, data_scadenza,
            utilizzi_massimi, utilizzi_attuali, attivo, costo_punti, disponibile)
         VALUES (?, 'percentuale', ?, ?, ?, -1, 0, 1, ?, ?)`,
        [codice.trim().toUpperCase(), Number(percentuale),
         descrizione || `Sconto del ${percentuale}% — coupon fedeltà`,
         scadenza || null, Number(costoInPunti), disp],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // Inserisce un coupon generato on-the-fly (da acquisto preset o catalogo)
  createGenerato: ({ codice, valore, descrizione, scadenzaStr }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Coupon
           (codice, tipo, valore, descrizione, data_scadenza,
            utilizzi_massimi, utilizzi_attuali, attivo, costo_punti)
         VALUES (?, 'percentuale', ?, ?, ?, 1, 0, 1, 0)`,
        [codice, valore, descrizione, scadenzaStr],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
      );
    });
  },

  // Toggle attivo solo su coupon fedeltà (costo_punti > 0)
  toggleFedelta: (id, attivo) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon SET attivo = ? WHERE id = ? AND costo_punti > 0`,
        [attivo ? 1 : 0, id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  // Elimina coupon fedeltà
  deleteFedelta: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM Coupon WHERE id = ? AND costo_punti > 0`,
        [id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  // Decrementa disponibile (se non illimitato)
  decrementaDisponibile: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon SET disponibile = MAX(0, disponibile - 1) WHERE id = ? AND disponibile != -1`,
        [id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  }
};

module.exports = Coupon;
