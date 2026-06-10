const db = require('./database');
const bcrypt = require('bcrypt');

async function popolaDatabaseCategoriaConsole() {
    try {
        const response = 'INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioVendita, pubblicatoVetrina, condizione, puntiFedelta) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            ['Console PlayStation 5', 'Vivi un\'esperienza di gioco senza limiti con caricamenti fulminei grazie all\'SSD da 1TB e un coinvolgimento totale grazie al feedback aptico e all\'audio 3D.', 20, 'http://localhost:3000/public/immagini/console/ps5.png', 449.99, 1, 'Nuovo', Math.round(449.99 / 5)],
            ['Console PlayStation 4', 'La console che ha definito una generazione. Goditi un vasto catalogo di capolavori e le migliori esclusive PlayStation con 500GB di archiviazione. ', 20, 'http://localhost:3000/public/immagini/console/SONY-Console-Sony-PS4-Chassis-B-500-GB--GTA-V-bundle.jpg', 249.99, 1, 'Usato', Math.round(249.99 / 5)],
            ['Console Nintendo Switch OLED Lite', 'Il connubio perfetto tra portabilità estrema e uno schermo vibrante. Gioca ovunque senza compromessi visivi con questa edizione speciale.', 20, 'http://localhost:3000/public/immagini/console/nintendo_switch_lite.png', 399.99, 1, 'Nuovo', Math.round(399.99 / 5)],
            ['Console Xbox Series X', 'La Xbox più veloce e potente di sempre. Esplora nuovi mondi con 12 teraflop di potenza grafica, ray tracing e puro gaming in 4K.', 20, 'http://localhost:3000/public/immagini/console/xbox_series_x.png', 499.99, 1, 'Nuovo', Math.round(499.99 / 5)],
            ['Console PlayStation 5 Slim', 'Tutta la potenza next-gen di PS5 racchiusa in un design più sottile ed elegante. Prestazioni straordinarie con 1TB di archiviazione SSD ultra-veloce.', 20, 'http://localhost:3000/public/immagini/console/ps5_slim.png', 499.99, 1, 'Nuovo', Math.round(499.99 / 5)],
            ['Console PlayStation 4 Slim', 'Design snello e compatto con la stessa incredibile potenza di gioco. Silenziosa ed elegante, la porta d\'accesso a migliaia di fantastici titoli.', 20, 'http://localhost:3000/public/immagini/console/SONY-Console-Sony-PS4-Slim-1-TB--Uncharted-4--Tomb-Raider-bundle.jpg', 299.99, 1, 'Usato', Math.round(299.99 / 5)],
            ['Console Nintendo Switch OLED', 'Gioca a casa sulla TV o in viaggio con uno splendido schermo OLED da 7 pollici che offre colori intensi e un contrasto elevato.', 20, 'http://localhost:3000/public/immagini/console/nintendo_switch.png', 399.99, 1, 'Nuovo', Math.round(399.99 / 5)],
            ['Console Xbox Series S', 'Prestazioni next-gen nella Xbox più piccola di sempre. Passa al digitale e goditi velocità fulminee e tempi di caricamento azzerati.', 20, 'http://localhost:3000/public/immagini/console/xbox_series_s.png', 499.99, 1, 'Nuovo', Math.round(499.99 / 5)],
            ['Console Nintendo Switch OLED', 'Lo schermo OLED con colori mozzafiato, ora in versione usata in ottime condizioni per goderti il gaming ibrido al miglior prezzo.', 20, 'http://localhost:3000/public/immagini/console/nintendo_switch.png', 299.99, 1, 'Usato', Math.round(299.99 / 5)],
            ['Console Nintendo Switch 2', 'Il futuro del gaming ibrido è qui. Prestazioni rivoluzionarie e nuove modalità di interazione per la prossima evoluzione di casa Nintendo.', 20, 'http://localhost:3000/public/immagini/console/nintendo_switch_2.png', 449.99, 1, 'Nuovo', Math.round(449.99 / 5)],
            ['Console PlayStation 5 pro', 'Porta il gaming su console a un livello superiore. Framerate altissimi, ray tracing avanzato e grafica inarrivabile per i gamer più esigenti.', 20, 'http://localhost:3000/public/immagini/console/ps5_pro.png', 499.99, 1, 'Nuovo', Math.round(499.99 / 5)],
            ['Console PlayStation 4 pro', 'Il potenziamento per i gamer appassionati. Goditi giochi in 4K dinamico e framerate stabile per un\'esperienza visiva spettacolare da 1TB.', 20, 'http://localhost:3000/public/immagini/console/ps4_pro.png', 349.99, 1, 'Usato', Math.round(349.99 / 5)],
            ['Console Xbox One X', 'L\'ammiraglia della scorsa generazione per il vero gaming in 4K. Rivivi i classici e i grandi titoli con la massima qualità grafica possibile.', 20, 'http://localhost:3000/public/immagini/console/xbox-one-x-1tb-tom-clancys-the-division-2-bundle-586175.1.webp', 249.99, 1, 'Usata', Math.round(249.99 / 5)],
        ]

        values.forEach(val => {
            db.run(response, val, (err) => {
                if (err) {
                    console.error('Errore durante l\'inserimento di una console:', err);
                }
            });
        });
    }catch(error) {
        console.log(error);
    }
}

async function popolaDatabaseCategoriaVideogiochi() {
    try {
        const response = 'INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioVendita, pubblicatoVetrina, genere, condizione, puntiFedelta) VALUES (2, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            ['Marvel\'s Spider-Man: Miles Morales', 'Vivi l\'ascesa di Miles Morales mentre padroneggia nuovi poteri incredibili ed esplosivi per diventare il suo Spider-Man.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (4).webp', 49.99, 1, 'Azione', 'Nuovo', Math.round(49.99 / 5)],
            ['Marvel\'s Spider-Man 2', 'I due Spider-Man, Peter Parker e Miles Morales, tornano per una nuova emozionante avventura su PS5.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (3).webp', 79.99, 1, 'Azione', 'Nuovo', Math.round(79.99 / 5)],
            ['Marvel\'s Spider-Man (GOTY)', 'Esplora una New York vibrante e affronta i cattivi più iconici in questa edizione completa e imperdibile.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (2).webp', 39.99, 1, 'Azione', 'Usato', Math.round(39.99 / 5)],
            ['God of War Ragnarok', 'Il Fimbulwinter è arrivato. Accompagna Kratos e Atreus in un viaggio epico attraverso i Nove Regni norreni.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (8).webp', 69.99, 1, 'Azione', 'Nuovo', Math.round(69.99 / 5)],
            ['Minecraft', 'Costruisci tutto ciò che puoi immaginare ed esplora mondi infiniti in questo classico intramontabile.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (5).webp', 29.99, 1, 'Avventura', 'Nuovo', Math.round(29.99 / 5)],
            ['Far Cry 6', 'Unisciti alla guerriglia per liberare Yara dalla morsa del dittatore Antón Castillo. Esplosioni, armi e puro caos.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (7).webp', 29.99, 1, 'Azione', 'Nuovo', Math.round(29.99 / 5)],
            ['Ratchet & Clank', 'Rivivi le origini dell\'eroico duo in questa avventura ricca di azione e armi stravaganti in stile PlayStation Hits.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (15).webp', 19.99, 1, 'Avventura', 'Nuovo', Math.round(19.99 / 5)],
            ['The Last of Us Remastered', 'Un viaggio emozionante e brutale. Vivi la cruda storia di Joel ed Ellie in un mondo post-apocalittico spietato.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (16).webp', 19.99, 1, 'Avventura', 'Usato', Math.round(19.99 / 5)],
            ['EA SPORTS FC 26 (PS5)', 'La nuova era del calcio virtuale. Scendi in campo con le squadre, i giocatori e le leghe più realistiche di sempre.', 20, 'http://localhost:3000/public/immagini/videogiochi/fc26.webp', 69.99, 1, 'Sport', 'Nuovo', Math.round(69.99 / 5)],
            ['Grand Theft Auto V', 'Esplora la sconfinata e vibrante Los Santos. Un\'esperienza open world senza precedenti tra rapine mozzafiato.', 20, 'http://localhost:3000/public/immagini/videogiochi/gta_V.webp', 29.99, 1, 'Azione', 'Nuovo', Math.round(29.99 / 5)],
            ['The Last of Us Part I', 'Rivivi il capolavoro che ha segnato una generazione, ricostruito da zero per sfruttare appieno la potenza di PS5.', 20, 'http://localhost:3000/public/immagini/videogiochi/tlou1.jpg', 69.99, 1, 'Avventura', 'Nuovo', Math.round(69.99 / 5)],
            ['Call of Duty: Black Ops 7', 'L\'esperienza definitiva della serie Black Ops ti attende con nuove sfide, campagna avvincente e un multiplayer esplosivo.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping (6).webp', 79.99, 1, 'Sparatutto', 'Nuovo', Math.round(79.99 / 5)],
            ['Gran Turismo 7', 'La massima espressione della simulazione automobilistica con centinaia di auto riprodotte in ogni minimo dettaglio.', 20, 'http://localhost:3000/public/immagini/videogiochi/shopping.webp', 69.99, 1, 'Sport', 'Nuovo', Math.round(69.99 / 5)]
        ];

        values.forEach(val => {
            db.run(response, val, (err) => {
                if (err) {
                    console.error('Errore durante l\'inserimento di un videogioco:', err);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
}

async function popolaDatabaseCategoriaAccessori() {
    try {
        const response = 'INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioVendita, pubblicatoVetrina, condizione, puntiFedelta) VALUES (3, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            ['Cuffie Gaming Kotion Each', 'Cuffie over-ear con microfono e luci LED, perfette per lunghe sessioni di gaming. Audio stereo ad alta fedeltà e comfort garantito.', 20, 'http://localhost:3000/public/immagini/accessori/kotion (18).webp', 29.99, 1, 'Nuovo', Math.round(29.99 / 5)],
            ['Cuffie Gaming Razer Kraken', 'Vivi l\'audio posizionale con le celebri cuffie Razer. Padiglioni in gel rinfrescante e microfono retrattile per la massima chiarezza vocale.', 15, 'http://localhost:3000/public/immagini/accessori/razer (18).webp', 79.99, 1, 'Nuovo', Math.round(79.99 / 5)],
            ['PlayStation VR2', 'Immergiti in mondi incredibili con la realtà virtuale di nuova generazione per PS5. Display 4K HDR e controller Sense innovativi.', 10, 'http://localhost:3000/public/immagini/accessori/shopping (22).webp', 549.99, 1, 'Nuovo', Math.round(549.99 / 5)],
            ['Adattatore USB-C a HDMI 4K', 'Collega la tua console o dispositivo portatile al monitor o alla TV con questo cavo adattatore ad alta velocità per una risoluzione fino a 4K 60Hz.', 30, 'http://localhost:3000/public/immagini/accessori/shopping (21).webp', 19.99, 1, 'Nuovo', Math.round(19.99 / 5)],
            ['Cuffie Wireless Over-Ear Premium', 'Audio ad altissima fedeltà, cancellazione attiva del rumore e design elegante. Il top per l\'ascolto e il gaming wireless.', 5, 'http://localhost:3000/public/immagini/accessori/shopping (23).webp', 199.99, 1, 'Nuovo', Math.round(199.99 / 5)],
            ['PlayStation Camera per PS4', 'Aggiungi nuove modalità di interazione alla tua PS4. Trasmetti i tuoi gameplay e sblocca le funzionalità di PlayStation VR.', 12, 'http://localhost:3000/public/immagini/accessori/ps4_camera.jpg', 49.99, 1, 'Usato', Math.round(49.99 / 5)]
        ];

        values.forEach(val => {
            db.run(response, val, (err) => {
                if (err) {
                    console.error('Errore durante l\'inserimento di un accessorio:', err);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
}

async function popolaDatabaseCategoriaElettronica() {
    try {
        const response = 'INSERT INTO prodotto (categoria_id, nome, descrizione, giacenza, immagine, prezzoUnitarioVendita, pubblicatoVetrina, condizione, puntiFedelta) VALUES (4, ?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [
            ['Smartwatch Amazfit', 'Smartwatch con display AMOLED, monitoraggio della frequenza cardiaca e 14 giorni di autonomia.', 20, 'http://localhost:3000/public/immagini/elettronica/shopping (20).webp', 99.99, 1, 'Nuovo', Math.round(99.99 / 5)],
            ['Apple Watch SE 2022', 'Smartwatch con display AMOLED, monitoraggio della frequenza cardiaca, monitoraggio allenamenti, sensori di movimento.', 30, 'http://localhost:3000/public/immagini/elettronica/shopping (19).webp', 99.99, 1, 'usato', Math.round(99.99 / 5)],
            ['Cuffie JBL Tune', 'Audio avvolgente e bassi potenti in un design compatto. Connessione Bluetooth affidabile.', 10, 'http://localhost:3000/public/immagini/elettronica/trasferimento (2).webp', 49.99, 1, 'Nuovo', Math.round(49.99 / 5)],
            ['Alimentatore USB-C', 'Alimentatore compatto per una ricarica rapida e sicura dei tuoi dispositivi.', 25, 'http://localhost:3000/public/immagini/elettronica/trasferimento (5).webp', 19.99, 1, 'Nuovo', Math.round(19.99 / 5)]
        ];

        values.forEach(val => {
            db.run(response, val, (err) => {
                if (err) {
                    console.error('Errore durante l\'inserimento di elettronica:', err);
                }
            });
        });
    } catch (error) {
        console.log(error);
    }
}

async function popolaDatabaseUtenteAdmin() {
    try {
        // Creiamo la password cifrata per l'admin (la password in chiaro sarà 'admin')
        const hashedPassword = await bcrypt.hash('Admin12!', 10);
        const response = "INSERT INTO utente (nome, cognome, email, password, ruolo) VALUES (?, ?, ?, ?, 'admin')";
        const values = ['Admin', 'PAwerUP', 'admin@pawerup.it', hashedPassword];

        db.run(response, values, (err) => {
            if (err) {
                console.error('Errore durante l\'inserimento dell\'admin:', err);
            } else {
                console.log('Utente admin generato con successo (Email: admin@pawerup.it - Password: Admin12!)');
            }
        });
    } catch (error) {
        console.log(error);
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
            
            // Esegue l'inserimento statico di console e videogiochi
            await popolaDatabaseCategoriaConsole();
            await popolaDatabaseCategoriaVideogiochi();
            await popolaDatabaseCategoriaAccessori();
            await popolaDatabaseCategoriaElettronica();

            console.log('Download cataloghi esterni completato.');
        }   
    });

    db.get ("SELECT COUNT(*) AS count from utente WHERE ruolo = 'admin'", async (err, row) => {
        if (row && row.count === 0) {
            await popolaDatabaseUtenteAdmin();
        }
    });
}

module.exports = seedDatabase;