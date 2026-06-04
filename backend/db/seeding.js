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

async function popolaProdottiIcecatAccessori() {
    const username = process.env.ICECAT_USERNAME;
    if (!username) {
        console.error("❌ Nessun ICECAT_USERNAME trovato nel file .env. Popolamento saltato.");
        return;
    }

    // Array di oggetti da cercare su Icecat con dati di riserva (fallback) in caso di errore 403/404
    const prodottiDaCercare = [
        // Cavi HDMI
        { catId: 3, brand: 'Belkin', code: 'AV10175bt2M-BLK', prezzo: 24.99, fallbackNome: 'Cavo HDMI 2.1 Ultra High Speed 2m', fallbackImg: 'https://images.unsplash.com/photo-1534068590799-09895a7065cb?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'AmazonBasics', code: 'HL-007306', prezzo: 9.99, fallbackNome: 'Cavo HDMI 2.0 High Speed 1.8m', fallbackImg: 'https://images.unsplash.com/photo-1544228807-695d7b561c21?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Sony', code: 'DLC-HX10', prezzo: 29.99, fallbackNome: 'Cavo HDMI Sony 8K Ultra HD 1m', fallbackImg: 'https://images.unsplash.com/photo-1558227096-7c98de92150a?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'UGREEN', code: '80403', prezzo: 15.99, fallbackNome: 'Cavo HDMI 2.1 8K 60Hz 2m UGREEN', fallbackImg: 'https://images.unsplash.com/photo-1542646698-e7c65b530c33?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Hama', code: 'AV10176bt2M-BLK', prezzo: 19.99, fallbackNome: 'Cavo HDMI 2.1 4K 120Hz', fallbackImg: 'https://images.unsplash.com/photo-1534068590799-09895a7065cb?q=80&w=800&auto=format&fit=crop' },

        // Cavi USB / Lightning
        { catId: 3, brand: 'Apple', code: 'MX0K2ZM/A', prezzo: 25.00, fallbackNome: 'Cavo da USB-C a Lightning (1 m)', fallbackImg: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Apple', code: 'MQGJ2ZM/A', prezzo: 35.00, fallbackNome: 'Cavo da USB-C a Lightning (2 m)', fallbackImg: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EP-DG930IBEGWW', prezzo: 14.99, fallbackNome: 'Cavo USB-A a USB-C Samsung', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EP-DA705BBEGWW', prezzo: 19.99, fallbackNome: 'Cavo USB-C a USB-C Samsung (1 m)', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A8121011', prezzo: 12.99, fallbackNome: 'Cavo Anker PowerLine Lightning 0.9m', fallbackImg: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A8166011', prezzo: 15.99, fallbackNome: 'Cavo Anker PowerLine USB-C a USB-A 1.8m', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Belkin', code: 'CAB001bt1MBK', prezzo: 14.99, fallbackNome: 'Cavo USB-A a Lightning Belkin BOOST CHARGE', fallbackImg: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Belkin', code: 'CAB002bt1MBK', prezzo: 16.99, fallbackNome: 'Cavo USB-C a USB-C Belkin BOOST CHARGE', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'UGREEN', code: '60136', prezzo: 10.99, fallbackNome: 'Cavo UGREEN USB-C a USB-A Intrecciato', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'AmazonBasics', code: 'L6LUG002-CS-R', prezzo: 11.99, fallbackNome: 'Cavo Lightning Amazon Basics (Certificato Apple)', fallbackImg: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop' },

        // Alimentatori e Caricabatterie
        { catId: 3, brand: 'Apple', code: 'MHJE3AM/A', prezzo: 25.00, fallbackNome: 'Alimentatore USB-C Apple 20W', fallbackImg: 'https://images.unsplash.com/photo-1615526673619-2182c611ee67?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Apple', code: 'MNF82Z/A', prezzo: 55.00, fallbackNome: 'Alimentatore USB-C Apple 61W', fallbackImg: 'https://images.unsplash.com/photo-1615526673619-2182c611ee67?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EP-TA800NBEGEU', prezzo: 24.90, fallbackNome: 'Caricabatterie Rapido Samsung 25W USB-C', fallbackImg: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EP-T4510XBEGEU', prezzo: 49.90, fallbackNome: 'Caricabatterie Super Rapido Samsung 45W USB-C', fallbackImg: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A2019G11', prezzo: 19.99, fallbackNome: 'Caricabatterie Anker Nano 20W USB-C', fallbackImg: 'https://images.unsplash.com/photo-1615526673619-2182c611ee67?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A2663G11', prezzo: 39.99, fallbackNome: 'Caricabatterie Anker Nano II 65W GaN', fallbackImg: 'https://images.unsplash.com/photo-1615526673619-2182c611ee67?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'UGREEN', code: '10334', prezzo: 29.99, fallbackNome: 'Caricatore UGREEN Nexode 30W USB-C', fallbackImg: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Belkin', code: 'WCA004vfWH', prezzo: 24.99, fallbackNome: 'Caricabatteria da parete Belkin BOOST CHARGE 20W', fallbackImg: 'https://images.unsplash.com/photo-1615526673619-2182c611ee67?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Xiaomi', code: 'MDY-11-EZ', prezzo: 29.90, fallbackNome: 'Caricabatterie Xiaomi Mi 33W', fallbackImg: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Huawei', code: 'CP84', prezzo: 39.90, fallbackNome: 'Caricabatterie Huawei SuperCharge 40W', fallbackImg: 'https://images.unsplash.com/photo-1615526673619-2182c611ee67?q=80&w=800&auto=format&fit=crop' },

        // Caricabatterie Smartwatch
        { catId: 3, brand: 'Apple', code: 'MU9F2AM/A', prezzo: 35.00, fallbackNome: 'Cavo magnetico per Apple Watch (1 m)', fallbackImg: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Apple', code: 'MX2E2ZM/A', prezzo: 39.00, fallbackNome: 'Cavo magnetico rapido USB-C per Apple Watch', fallbackImg: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EP-OR900BBEGWW', prezzo: 29.90, fallbackNome: 'Caricabatterie Wireless per Galaxy Watch', fallbackImg: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Garmin', code: '010-12491-01', prezzo: 24.99, fallbackNome: 'Cavo di ricarica Garmin per smartwatch', fallbackImg: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Fitbit', code: '010-12491-01_FB', prezzo: 19.99, fallbackNome: 'Cavo di ricarica USB per Fitbit', fallbackImg: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop' },

        // Power Bank e Caricabatterie Wireless
        { catId: 3, brand: 'Anker', code: 'A1229G11', prezzo: 39.99, fallbackNome: 'Power Bank Anker PowerCore 10000mAh', fallbackImg: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A1268G11', prezzo: 59.99, fallbackNome: 'Power Bank Anker PowerCore Essential 20000mAh', fallbackImg: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Belkin', code: 'BPB011btBK', prezzo: 49.99, fallbackNome: 'Power Bank magnetico Belkin 5000mAh', fallbackImg: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EB-U1200CSEGWW', prezzo: 49.90, fallbackNome: 'Samsung Power Bank Wireless 10000mAh', fallbackImg: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Apple', code: 'MJWY3ZM/A', prezzo: 109.00, fallbackNome: 'MagSafe Battery Pack Apple', fallbackImg: 'https://images.unsplash.com/photo-1628102491629-77858ab215b2?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Belkin', code: 'WIA001vfWH', prezzo: 29.99, fallbackNome: 'Caricabatterie Wireless Pad Belkin 10W', fallbackImg: 'https://images.unsplash.com/photo-1584033324683-149bb89280b1?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Samsung', code: 'EP-P2400TBEGEU', prezzo: 39.90, fallbackNome: 'Samsung Wireless Charger Pad 15W', fallbackImg: 'https://images.unsplash.com/photo-1584033324683-149bb89280b1?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A2503011', prezzo: 19.99, fallbackNome: 'Anker PowerWave Pad Caricatore Wireless', fallbackImg: 'https://images.unsplash.com/photo-1584033324683-149bb89280b1?q=80&w=800&auto=format&fit=crop' },

        // Adattatori e Hub
        { catId: 3, brand: 'Apple', code: 'MUF82ZM/A', prezzo: 79.00, fallbackNome: 'Adattatore multiporta da USB-C ad AV digitale Apple', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' },
        { catId: 3, brand: 'Anker', code: 'A83460A2', prezzo: 45.99, fallbackNome: 'Hub USB-C Anker 7-in-1', fallbackImg: 'https://images.unsplash.com/photo-1615526649725-cbb612b7f093?q=80&w=800&auto=format&fit=crop' }
    ];

    console.log('\nAvvio download Accessori ed Elettronica da Icecat...');
    const stmt = db.prepare("INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioAcquisto, prezzoUnitarioVendita, pubblicatoAcquisto, pubblicatoVetrina, condizione) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    for (const item of prodottiDaCercare) {
        try {
            // Chiamata all'API Open Catalog di Icecat in formato JSON
            const response = await axios.get(`https://live.icecat.biz/api/?UserName=${username}&Language=it&Brand=${item.brand}&ProductCode=${item.code}`);
            
            if (response.data && response.data.data && response.data.data.GeneralInfo) {
                const info = response.data.data.GeneralInfo;
                const title = info.Title || `${item.brand} ${item.code}`;
                
                // Pulizia della descrizione da eventuali tag HTML
                let desc = info.Description?.LongDesc || 'Nessuna descrizione disponibile';
                desc = desc.replace(/<[^>]*>?/gm, ''); 
                const shortDesc = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;

                // Estrazione dell'immagine principale
                let img = 'https://via.placeholder.com/400';
                if (response.data.data.Gallery && response.data.data.Gallery.length > 0) {
                    img = response.data.data.Gallery[0].Pic;
                } else if (info.Image) {
                    img = info.Image;
                }

                stmt.run(item.catId, title, shortDesc, 10, img, item.prezzo * 0.7, item.prezzo, true, true, 'Nuovo');
                console.log(`✅ Inserito da Icecat: ${title}`);
            } else {
                console.log(`⚠️ Prodotto non trovato su Icecat: ${item.brand} ${item.code}`);
            }
        } catch (err) {
            console.error(`❌ Errore API Icecat per ${item.brand} ${item.code}:`, err.message);
            if (item.fallbackNome) {
                console.log(`🔄 Uso i dati di fallback (Unsplash) per ${item.fallbackNome}...`);
                stmt.run(item.catId, item.fallbackNome, `Accessorio originale ${item.brand}.`, 10, item.fallbackImg, item.prezzo * 0.7, item.prezzo, true, true, 'Nuovo');
            }
        }
    }
    stmt.finalize();
    console.log('Popolamento da Icecat completato!\n');
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
                        await popolaProdottiIcecatAccessori();
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