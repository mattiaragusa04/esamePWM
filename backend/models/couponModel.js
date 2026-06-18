const db = require('../db/database');

const Coupon = {

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

  findFedeltaById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM Coupon WHERE id = ? AND attivo = 1 AND costo_punti > 0`,
        [id],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });
  },

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

  decrementaDisponibile: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon SET disponibile = MAX(0, disponibile - 1) WHERE id = ? AND disponibile != -1`,
        [id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  findAllFedelta: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM Coupon WHERE costo_punti > 0 ORDER BY id DESC`,
        [],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },

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
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
      );
    });
  },

  toggleFedelta: (id, attivo) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE Coupon SET attivo = ? WHERE id = ? AND costo_punti > 0`,
        [attivo ? 1 : 0, id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  deleteFedelta: (id) => {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM Coupon WHERE id = ? AND costo_punti > 0`,
        [id],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  // FIX: rimosso p.usato (colonna inesistente) — il filtro ora usa solo p.condizione = 'Usato'
  findProdottiUsati: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.id, p.nome, p.descrizione, p.prezzoUnitarioVendita,
                p.immagine, p.giacenza, p.condizione, p.puntiFedelta,
                c.denominazione AS categoria_nome
         FROM prodotto p
         LEFT JOIN categoria c ON p.categoria_id = c.id
         WHERE p.condizione = 'Usato'
           AND p.giacenza > 0
           AND p.pubblicatoVetrina = 1
         ORDER BY p.prezzoUnitarioVendita ASC`,
        [],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },

  findProdottoById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT p.*, c.denominazione AS categoria_nome
         FROM prodotto p
         LEFT JOIN categoria c ON p.categoria_id = c.id
         WHERE p.id = ?`,
        [id],
        (err, row) => { if (err) reject(err); else resolve(row); }
      );
    });
  },

  decrementaGiacenza: (prodottoId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE prodotto SET giacenza = MAX(0, giacenza - 1) WHERE id = ? AND giacenza > 0`,
        [prodottoId],
        function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
      );
    });
  },

  // FIX: rimosso p.usato (colonna inesistente) — il filtro ora usa solo p.condizione = 'Usato'
  findAllProdottiUsatiAdmin: () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT p.id, p.nome, p.descrizione, p.prezzoUnitarioVendita,
                p.immagine, p.giacenza, p.condizione, p.pubblicatoVetrina, p.puntiFedelta,
                c.denominazione AS categoria_nome
         FROM prodotto p
         LEFT JOIN categoria c ON p.categoria_id = c.id
         WHERE p.condizione = 'Usato'
         ORDER BY p.giacenza DESC, p.prezzoUnitarioVendita ASC`,
        [],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },

  insertCouponGenerato: (userId, couponId) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO coupon_utente (utente_id, coupon_id) VALUES (?, ?)`,
        [userId, couponId],
        function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
      );
    });
  },

  getCouponbyUserId: (userId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT c.codice, c.valore AS percentuale, c.data_scadenza AS scadenza, cu.data_generazione AS dataAcquisto
         FROM coupon_utente cu
         JOIN Coupon c ON c.id = cu.coupon_id
         WHERE cu.utente_id = ?
         ORDER BY cu.data_generazione DESC`,
        [userId],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
  },
};

module.exports = Coupon;
