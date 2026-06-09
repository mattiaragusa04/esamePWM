const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite",
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Connected to SQLite DB");
            db.run("PRAGMA foreign_keys = ON;"); // Abilita il controllo delle foreign keys
        }
    });

//creazione delle tabelle
db.exec(`
CREATE TABLE IF NOT EXISTS utente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    puntiFedelta INTEGER DEFAULT 0
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
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE if not exists prodotto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER,
    nome TEXT NOT NULL,
    descrizione TEXT NOT NULL,
    giacenza INTEGER NOT NULL,
    immagine TEXT NOT NULL,
    prezzoUnitarioVendita double NOT NULL,
    pubblicatoVetrina boolean NOT NULL,
    condizione TEXT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categoria(id)
);
CREATE TABLE if not exists ordine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    carta_id INTEGER,
    indirizzo_id INTEGER,
    utente_id INTEGER,
    data DATE NOT NULL,
    totale double NOT NULL,
    statoOrdine TEXT NOT NULL,
    FOREIGN KEY (utente_id) REFERENCES utente(id),
    FOREIGN KEY (carta_id) REFERENCES carta_di_credito(id),
    FOREIGN KEY (indirizzo_id) REFERENCES indirizzo(id)
);
CREATE TABLE if not exists composto (
    ordine_id INTEGER,
    prodotto_id INTEGER,
    quantita INTEGER NOT NULL,
    prezzoUnitario double NOT NULL,
    PRIMARY KEY (ordine_id, prodotto_id),
    FOREIGN KEY (ordine_id) REFERENCES ordine(id),
    FOREIGN KEY (prodotto_id) REFERENCES prodotto(id)
);
CREATE TABLE if not exists recensione (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER,
    testo TEXT NOT NULL,
    voto INTEGER NOT NULL,
    data DATE NOT NULL,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE if not exists carrello (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    totale double NOT NULL,
    utente_id INTEGER,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE if not exists contiene (
    carrello_id INTEGER,
    prodotto_id INTEGER,
    quantita INTEGER NOT NULL,
    PRIMARY KEY (carrello_id, prodotto_id),
    FOREIGN KEY (carrello_id) REFERENCES carrello(id),
    FOREIGN KEY (prodotto_id) REFERENCES prodotto(id)
);
CREATE TABLE IF NOT EXISTS carta_di_credito (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER,
    numero_carta TEXT NOT NULL,
    nome_titolare TEXT NOT NULL,
    data_scadenza TEXT NOT NULL,
    cvv TEXT,
    FOREIGN KEY (utente_id) REFERENCES utente(id)
);
CREATE TABLE IF NOT EXISTS categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    denominazione TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS coupon (
    denominazione TEXT NOT NULL,
    codice TEXT NOT NULL,
    sconto DOUBLE NOT NULL,
    data_scadenza DATE NOT NULL,
    PRIMARY KEY (codice)
);
CREATE TABLE IF NOT EXISTS vendi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL,
    prodotto_id INTEGER NOT NULL,
    prezzo_stimato REAL NOT NULL,
    condizioni_json TEXT NOT NULL,
    stato_offerta TEXT NOT NULL DEFAULT 'In attesa',
    data_offerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_aggiornamento_stato TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note_amministratore TEXT,
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