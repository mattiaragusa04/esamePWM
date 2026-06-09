const db = require('./database');
require('dotenv').config();
const axios = require('axios');

async function popolaDaRainForest(categoriaId, searchTerm, nomeCategoria, amazonCategoryId = null) {
    try {
        const params = {
            api_key: process.env.RAINFOREST_API_KEY,
            type: 'search',
            amazon_domain: 'amazon.it',
            search_term: searchTerm
        };
        
        if (amazonCategoryId) {
            params.category_id = amazonCategoryId;
        }

        const response = await axios.get('https://api.rainforestapi.com/request', { params });

        const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioVendita, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        if (response.data && response.data.search_results) {
            response.data.search_results.forEach(item => {
                if (item.price && item.image) {
                    stmt.run(categoriaId, item.title, item.snippet || 'Nessuna descrizione disponibile', 20, item.image, parseFloat(item.price.value) * 1.2, true, 'Nuovo');
                }
            });
        }
        stmt.finalize();
        console.log(`Tabella prodotto popolata con ${nomeCategoria} da RainForestAPI!`);
    } catch (err) {
        console.error(`Errore RainForestAPI per ${nomeCategoria}:`, err.message);
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
    db.get ("SELECT COUNT(*) AS count from prodotto", async (err, row) => {
        if (row && row.count === 0) {
            console.log('Dati base inseriti. Avvio download cataloghi esterni...');
            try {
                await popolaDaRainForest(1, 'Console PlayStation 5', 'Console PS5');
                await popolaDaRainForest(1, 'Console PlayStation 4', 'Console PS4');
                await popolaDaRainForest(1, 'Console Nintendo Switch OLED Lite', 'Console Nintendo Switch');
                await popolaDaRainForest(1, 'Console Xbox Series X S', 'Console Xbox');
                await popolaDaRainForest(2, 'videogiochi ps5 ps4 nintendo switch', 'Videogiochi');
                await popolaDaRainForest(3, 'accessori gaming pc console', 'Accessori');
                await popolaDaRainForest(4, 'elettronica pc smartwatch', 'Elettronica', 'electronics');
                console.log('\n✅ Tutti i cataloghi sono stati scaricati e inseriti con successo!');
            } catch (error) {
                console.error('\n❌ Errore imprevisto durante il download:', error.message);
            }
        }
    });

}

module.exports = seedDatabase;