const db = require('./database');
require('dotenv').config();
const axios = require('axios');

async function popolaVideogiochiIGDB() {
    try {
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });

        const igdbResponse = await axios({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${tokenResponse.data.access_token}`
            },
            // Prende nome, descrizione e cover dei 40 giochi più famosi per PS4, PS5 e PC
            data: 'fields name, summary, cover.url; where cover != null & summary != null & platforms = (6, 48, 167) & rating_count > 500; sort rating desc; limit 40;' 
        });

        const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        igdbResponse.data.forEach(game => {
            const imageUrl = "https:" + game.cover.url.replace('t_thumb', 't_cover_big');
            stmt.run(2, game.name, game.summary.substring(0, 150) + '...', 15, imageUrl, 40, 69.99, true, true, 'Nuovo');
        });
        stmt.finalize();
        console.log('Tabella prodotto popolata con 12 videogiochi reali da IGDB!');
    } catch (err) {
        console.error("Errore IGDB:", err.message);
    }
}
async function popolaAccessori(){
        try {
            const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            stmt.run(3, 'Apple Cavo di ricarica USB-C', 'Cavo di ricarica USB-C per iPhone e iPad (1 metro)', 20, 'https://m.media-amazon.com/images/I/61p4sgpkqKL._AC_UL640_QL65_.jpg', 10, 19.99, true, true, 'Nuovo');
            stmt.run(3, 'Apple Alimentatore USB-C 20W', 'Alimentatore USB-C da 20W per ricarica rapida iPhone e iPad', 20, 'https://m.media-amazon.com/images/I/313H9jLAH8L._AC_UL640_QL65_.jpg', 15, 29.99, true, true, 'Nuovo');
            stmt.run(3, 'Cavo Ricarica Magnetico Apple Watch', 'Cavo magnetico USB-C per ricarica veloce Apple Watch', 15, 'https://it.static.webuy.com/product_images/Accessori%20Nuovi/CeX%20basics%20-%20Cavi/MAG100WATCHCABLECEXB_l.jpg', 12, 24.99, true, true, 'Nuovo');
            stmt.run(3, 'Alimentatore Multiplo USB', 'Caricabatterie da parete con 2 porte USB, 2 porte USB-C e ricarica intelligente', 30, 'https://m.media-amazon.com/images/I/511L+yrGgIL._AC_UL640_QL65_.jpg', 8, 16.99, true, true, 'Nuovo');
            stmt.run(3, 'Cavo USB-C a Lightning', 'Cavo in nylon intrecciato per ricarica rapida iPhone e AirPods', 50, 'https://m.media-amazon.com/images/I/71H4HPBs4CL._AC_UY436_QL65_.jpg', 5, 12.99, true, true, 'Nuovo');
            stmt.run(3, 'Stand Ricarica Wireless 3 in 1', 'Stazione di ricarica per iPhone, Apple Watch e AirPods contemporaneamente', 10, 'https://m.media-amazon.com/images/I/61Vl0Q20sBL._AC_UL640_QL65_.jpg', 20, 39.99, true, true, 'Nuovo');
            stmt.run(3, 'Cavo HDMI 2.1 ad altissima velocità', 'Cavo HDMI 8K 4K 120Hz per console di ultima generazione come PS5 e Xbox Series X', 40, 'https://m.media-amazon.com/images/I/61DQkKlh2hL._AC_UL640_QL65_.jpg', 7, 14.99, true, true, 'Nuovo');
            stmt.run(3, 'Cinturino Sport per Apple Watch', 'Cinturino in silicone traspirante compatibile con Apple Watch 42/44/45/49mm', 25, 'https://m.media-amazon.com/images/I/616imAyU9FL._AC_UL640_QL65_.jpg', 4, 9.99, true, true, 'Nuovo');
            
            stmt.finalize();
            console.log('Tabella prodotto popolata con accessori!');
        } catch (err) {
            console.error("Errore:", err.message);
        }
}

async function popolaConsole(){
    try {
        const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        stmt.run(1, 'PlayStation 5 pro', 'Console PS5 Pro con SSD da 825GB, supporto per giochi in 4K e retrocompatibilità con PS4', 10, 'public/immagini/console/ps5_pro.png', 400, 499.99, true, true, 'Nuovo');
        stmt.run(1, 'PlayStation 5', 'Console PS5 con SSD da 825GB, supporto per giochi in 4K e retrocompatibilità con PS4', 10, 'public/immagini/console/ps5.png', 400, 499.99, true, true, 'Nuovo');
        stmt.run(1, 'Xbox Series X', 'Console Xbox Series X con SSD da 1TB, supporto per giochi in 4K e retrocompatibilità con Xbox One', 10, 'public/immagini/console/xbox_series_x.png', 400, 499.99, true, true, 'Nuovo');
        stmt.run(1, 'Nintendo Switch', 'Console Nintendo Switch con schermo da 6.2 pollici, modalità portatile e dock per TV', 10, 'public/immagini/console/nintendo_switch.png', 250, 299.99, true, true, 'Nuovo');
        stmt.run(1, 'PlayStation 4 Pro', 'Console PS4 Pro con supporto per giochi in 4K e HDR', 10, 'public/immagini/console/ps4_pro.png', 200, 299.99, true, true, 'Usato');
        stmt.run(1, 'Xbox One X', 'Console Xbox One X con supporto per giochi in 4K e HDR', 10, 'public/immagini/console/xbox_one_x.png', 200, 299.99, true, true, 'Usato');
        stmt.run(1, 'Playstation 5 Slim', 'Versione più compatta della PS5, con SSD da 825GB e supporto per giochi in 4K', 10, 'public/immagini/console/ps5_slim.png', 350, 449.99, true, true, 'Nuovo');
        stmt.run(1, 'Xbox Series S', 'Console Xbox Series S con SSD da 512GB, supporto per giochi in 1440p e retrocompatibilità con Xbox One', 10, 'public/immagini/console/xbox_series_s.png', 250, 299.99, true, true, 'Nuovo');
        stmt.run(1, 'Nintendo Switch Lite', 'Versione portatile della Nintendo Switch, con schermo da 5.5 pollici e senza dock per TV', 10, 'public/immagini/console/nintendo_switch_lite.png', 150, 199.99, true, true, 'Nuovo');
        stmt.run(1 , 'Nintendo Switch 2', 'Nuova generazione di Nintendo Switch con schermo OLED da 7 pollici, supporto per giochi in 4K e retrocompatibilità con giochi Switch', 10, 'public/immagini/console/nintendo_switch_2.png', 350, 449.99, true, true, 'Nuovo');
        stmt.finalize();
        console.log('Tabella prodotto popolata con console');
    } catch (err) {
        console.error("Errore Console:", err.message);
    }
}


// Funzione per popolare il database con dati di esempio
function seedDatabase() {
    db.get ("SELECT COUNT(*) AS count from categoria", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO categoria (denominazione) VALUES ('Console'), ('Videogiochi'), ('Accessori'), ('Elettronica')",function(err) {
                if (err) {
                    console.error('Errore durante il popolamento del database:', err);
                } else {
                    console.log('Tabella categoria popolata con successo');
                }
            });
        }
    });
    db.get ("SELECT COUNT(*) AS count from prodotto", (err, row) => {
        if (row && row.count === 0) {
            const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            stmt.run(3, 'Controller Xbox Series X', 'Controller wireless per Xbox Series X', 15, 'controller_xbox.jpg', 50, 70, true, true, 'Nuovo');
            stmt.finalize(async (err) => {
                if (err) {
                    console.error('Errore durante il popolamento del database:', err);
                } else {
                    console.log('Dati base inseriti. Avvio download cataloghi esterni...');
                    try {
                        await popolaConsole();
                        await popolaVideogiochiIGDB();
                        await popolaAccessori();
                        console.log('\n✅ Tutti i cataloghi sono stati scaricati e inseriti con successo!');
                    } catch (error) {
                        console.error('\n❌ Errore imprevisto durante il download:', error.message);
                    }
                }
            });
        }
    });

}

module.exports = seedDatabase;