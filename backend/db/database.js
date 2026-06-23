const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite",
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Connected to SQLite DB");
            db.run("PRAGMA foreign_keys = ON;");
        }
    });

db.exec(`
CREATE TABLE IF NOT EXISTS utente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    puntiFedelta INTEGER DEFAULT 0,
    ruolo TEXT DEFAULT 'user'
);
CREATE TABLE IF NOT EXISTS indirizzo(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER,
    tipo TEXT NOT NULL,
    via TEXT NOT NULL,
    numero_civico TEXT NOT NULL,
    provincia TEXT NOT NULL,
    paese TEXT NOT NULL,
    cap TEXT NOT NULL,
    salvato INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE IF NOT EXISTS categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    denominazione TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prodotto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    nome TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    giacenza INTEGER NOT NULL,
    immagine TEXT NOT NULL,
    prezzoUnitarioVendita REAL NOT NULL,
    pubblicatoVetrina INTEGER NOT NULL,
    genere TEXT,
    condizione TEXT NOT NULL,
    puntiFedelta INTEGER DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);
CREATE TABLE IF NOT EXISTS carta_di_credito (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER,
    numero_carta TEXT NOT NULL,
    nome_titolare TEXT NOT NULL,
    data_scadenza TEXT NOT NULL,
    cvv TEXT,
    salvato INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE IF NOT EXISTS ordine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carta_id INTEGER,
    indirizzo_id INTEGER,
    utente_id INTEGER,
    coupon_id INTEGER,
    data DATE NOT NULL,
    totale REAL NOT NULL,
    totale_scontato REAL,
    sconto_applicato REAL DEFAULT 0,
    punti_fedelta INTEGER DEFAULT 0,
    statoOrdine TEXT NOT NULL,
    pagato_con_punti BOOLEAN DEFAULT 0,
    FOREIGN KEY (utente_id) REFERENCES utente(id),
    FOREIGN KEY (carta_id) REFERENCES carta_di_credito(id),
    FOREIGN KEY (indirizzo_id) REFERENCES indirizzo(id),
    FOREIGN KEY (coupon_id) REFERENCES Coupon(id)
);
CREATE TABLE IF NOT EXISTS composto (
    ordine_id INTEGER,
    prodotto_id INTEGER,
    quantita INTEGER NOT NULL,
    pagato_con_punti INTEGER DEFAULT 0,
    prezzoUnitario REAL NOT NULL,
    PRIMARY KEY (ordine_id, prodotto_id),
    FOREIGN KEY (ordine_id) REFERENCES ordine(id),
    FOREIGN KEY (prodotto_id) REFERENCES prodotto(id)
);
CREATE TABLE IF NOT EXISTS recensione (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOY NULL UNIQUE,
    testo TEXT NOT NULL,
    voto INTEGER NOT NULL CHECK(voto BETWEEN 1 AND 5),
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE IF NOT EXISTS carrello (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    totale REAL NOT NULL,
    utente_id INTEGER UNIQUE,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE IF NOT EXISTS contiene (
    carrello_id INTEGER,
    prodotto_id INTEGER,
    condizione TEXT NOT NULL,
    quantita INTEGER,
    PRIMARY KEY (carrello_id, prodotto_id, condizione),
    FOREIGN KEY (carrello_id) REFERENCES carrello(id),
    FOREIGN KEY (prodotto_id) REFERENCES prodotto(id)
);
CREATE TABLE IF NOT EXISTS Coupon (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codice TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK(tipo IN ('percentuale', 'fisso')),
    valore REAL NOT NULL,
    descrizione TEXT,
    data_scadenza DATE,
    utilizzi_massimi INTEGER,
    utilizzi_attuali INTEGER DEFAULT 0,
    attivo INTEGER DEFAULT 1,
    costo_punti INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS coupon_utente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL REFERENCES Utente(id) ON DELETE CASCADE,
    coupon_id INTEGER NOT NULL REFERENCES Coupon(id) ON DELETE CASCADE,
    data_generazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS vendi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL,
    prodotto_id INTEGER NOT NULL,
    prezzo_stimato REAL NOT NULL,
    condizioni_json TEXT NOT NULL,
    allegati_foto TEXT,
    stato_offerta TEXT NOT NULL DEFAULT 'In attesa',
    data_offerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aggiornamento_stato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note_amministratore TEXT,
    tipo_compenso TEXT NOT NULL DEFAULT 'euro',
    punti_offerti INTEGER DEFAULT 0,
    FOREIGN KEY (utente_id) REFERENCES utente(id),
    FOREIGN KEY (prodotto_id) REFERENCES prodotto(id)
);
CREATE TABLE IF NOT EXISTS messaggio_contatto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    indirizzo TEXT,
    email TEXT NOT NULL,
    tipoRichiesta TEXT,
    oggetto TEXT,
    descrizione TEXT NOT NULL,
    allegato TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
