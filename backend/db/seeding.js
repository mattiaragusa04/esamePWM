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
            // Prende nome, descrizione e cover dei 12 giochi col voto più alto
            data: 'fields name, summary, cover.url; where cover != null & summary != null & rating > 85; sort rating desc; limit 12;' 
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

async function popolaConsoleIGDB(){
    try {
        const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });

        const igdbResponse = await axios({
            url: 'https://api.igdb.com/v4/platforms',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${tokenResponse.data.access_token}`
            },
            data: 'fields name, summary, platform_logo.url; where platform_logo != null & summary != null; sort popularity desc; limit 10;' 
        });

        const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        igdbResponse.data.forEach(platform => {
            const imageUrl = "https:" + platform.platform_logo.url.replace('t_thumb', 't_logo_med');
            stmt.run(1, platform.name, platform.summary.substring(0, 150) + '...', 10, imageUrl, 100, 199.99, true, true, 'Nuovo');
        });
        stmt.finalize();
        console.log('Tabella prodotto popolata con 10 console reali da IGDB!');
    } catch (err) {
        console.error("Errore IGDB:", err.message);
    }
}
async function seedElettronicaJSON(){
    const categorieDummyJson = ['smartphones', 'laptops'];
    for(const cat of categorieDummyJson){
        try{
            console.log('\n Scarico la categoria ' + cat + ' da DummyJSON...');
            const response = await axios.get(`https://dummyjson.com/products/category/${cat}`);
            const products = response.data.products;
            for(const product of products){
                const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                stmt.run(4, product.title, product.description.substring(0, 150) + '...', product.stock, product.thumbnail, product.price * 0.7, product.price, true, true, 'Nuovo');
                stmt.finalize();
            }
            console.log('Categoria ' + cat + ' popolata con successo da DummyJSON!');
        }
        catch(err){
            console.error("Errore DummyJSON:", err.message);
        }
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
            stmt.finalize((err) => {
                if (err) {
                    console.error('Errore durante il popolamento del database:', err);
                } else {
                    console.log('Dati base inseriti. Avvio download catalogo giochi...');
                    popolaVideogiochiIGDB();
                    popolaConsoleIGDB();
                    seedElettronicaJSON();
                }
            });
        }
    });

}

module.exports = seedDatabase;