const db = require('./database');
const bcrypt = require('bcrypt');
const authControllers = require('../controllers/authControllers');

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
            ['Console Xbox One X', 'L\'ammiraglia della scorsa generazione per il vero gaming in 4K. Rivivi i classici e i grandi titoli con la massima qualità grafica possibile.', 20, 'http://localhost:3000/public/immagini/console/xbox-one-x-1tb-tom-clancys-the-division-2-bundle-586175.1.webp', 249.99, 1, 'Usato', Math.round(249.99 / 5)],    
            ['Console PlayStation 1', 'La piattaforma che ha rivoluzionato il mondo dei videogiochi. Rivivi la magia dei grandi classici a 32 bit che hanno segnato un\'intera generazione di videogiocatori.', 0, 'http://localhost:3000/public/immagini/console/trasferimento (11).jpg', 79.99, 1, 'Usato', Math.round(79.99 / 5)],
            ['Console PlayStation 2', 'La console più venduta di tutti i tempi. Scopri o riscopri un catalogo sterminato di capolavori indimenticabili, uniti alla comodità del lettore DVD integrato.', 0, 'http://localhost:3000/public/immagini/console/trasferimento.jpg', 89.99, 1, 'Usato', Math.round(89.99 / 5)],
            ['Console PlayStation 3', 'Il grande salto nell\'era dell\'alta definizione. Goditi una straordinaria libreria di titoli, il lettore Blu-ray Disc nativo e il fascino del gaming online di terza generazione.', 0, 'http://localhost:3000/public/immagini/console/trasferimento (1).jpg', 119.99, 1, 'Usato', Math.round(119.99 / 5)]
        ];

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
            ['Marvel\'s Spider-Man: Miles Morales', 'Vivi l\'ascesa di Miles Morales mentre padroneggia nuovi poteri incredibili ed esplosivi per diventare il suo Spider-Man.', 25, 'http://localhost:3000/public/immagini/videogiochi/shopping (4).webp', 49.99, 1, 'Azione', 'Nuovo', Math.round(49.99 / 5)],
            ['Marvel\'s Spider-Man 2', 'I due Spider-Man, Peter Parker e Miles Morales, tornano per una nuova emozionante avventura su PS5.', 150, 'http://localhost:3000/public/immagini/videogiochi/shopping (3).webp', 79.99, 1, 'Azione', 'Nuovo', Math.round(79.99 / 5)],
            ['Marvel\'s Spider-Man (GOTY)', 'Esplora una New York vibrante e affronta i cattivi più iconici in questa edizione completa e imperdibile.', 9, 'http://localhost:3000/public/immagini/videogiochi/shopping (2).webp', 39.99, 1, 'Azione', 'Usato', Math.round(39.99 / 5)],
            ['God of War Ragnarok', 'Il Fimbulwinter è arrivato. Accompagna Kratos e Atreus in un viaggio epico attraverso i Nove Regni norreni.', 82, 'http://localhost:3000/public/immagini/videogiochi/shopping (8).webp', 69.99, 1, 'Azione', 'Nuovo', Math.round(69.99 / 5)],
            ['Minecraft', 'Costruisci tutto ciò che puoi immaginare ed esplora mondi infiniti in questo classico intramontabile.', 66, 'http://localhost:3000/public/immagini/videogiochi/shopping (5).webp', 29.99, 1, 'Avventura', 'Nuovo', Math.round(29.99 / 5)],
            ['Far Cry 6', 'Unisciti alla guerriglia per liberare Yara dalla morsa del dittatore Antón Castillo. Esplosioni, armi e puro caos.', 37, 'http://localhost:3000/public/immagini/videogiochi/shopping (7).webp', 29.99, 1, 'Azione', 'Nuovo', Math.round(29.99 / 5)],
            ['Ratchet & Clank', 'Rivivi le origini dell\'eroico duo in questa avventura ricca di azione e armi stravaganti in stile PlayStation Hits.', 4, 'http://localhost:3000/public/immagini/videogiochi/shopping (15).webp', 19.99, 1, 'Avventura', 'Nuovo', Math.round(19.99 / 5)],
            ['The Last of Us Remastered', 'Un viaggio emozionante e brutale. Vivi la cruda storia di Joel ed Ellie in un mondo post-apocalittico spietato.', 100, 'http://localhost:3000/public/immagini/videogiochi/shopping (16).webp', 19.99, 1, 'Avventura', 'Usato', Math.round(19.99 / 5)],
            ['EA SPORTS FC 26 (PS5)', 'La nuova era del calcio virtuale. Scendi in campo con le squadre, i giocatori e le leghe più realistiche di sempre.', 73, 'http://localhost:3000/public/immagini/videogiochi/fc26.webp', 69.99, 1, 'Sport', 'Nuovo', Math.round(69.99 / 5)],
            ['Grand Theft Auto V', 'Esplora la sconfinata e vibrante Los Santos. Un\'esperienza open world senza precedenti tra rapine mozzafiato.', 44, 'http://localhost:3000/public/immagini/videogiochi/gta_V.webp', 29.99, 1, 'Azione', 'Nuovo', Math.round(29.99 / 5)],
            ['The Last of Us Part I', 'Rivivi il capolavoro che ha segnato una generazione, ricostruito da zero per sfruttare appieno la potenza di PS5.', 20, 'http://localhost:3000/public/immagini/videogiochi/tlou1.jpg', 69.99, 1, 'Avventura', 'Nuovo', Math.round(69.99 / 5)],
            ['Call of Duty: Black Ops 7', 'L\'esperienza definitiva della serie Black Ops ti attende con nuove sfide, campagna avvincente e un multiplayer esplosivo.', 0, 'http://localhost:3000/public/immagini/videogiochi/shopping (6).webp', 79.99, 1, 'Sparatutto', 'Nuovo', Math.round(79.99 / 5)],
            ['Gran Turismo 7', 'La massima espressione della simulazione automobilistica con centinaia di auto riprodotte in ogni minimo dettaglio.', 2, 'http://localhost:3000/public/immagini/videogiochi/shopping.webp', 69.99, 1, 'Sport', 'Nuovo', Math.round(69.99 / 5)],
            ['Call of Duty Black Ops III', 'Il celebre sparatutto in prima persona targato Treyarch, con un multiplayer frenetico, nuove meccaniche di movimento e l\'amatissima modalità Zombie.', 0, 'http://localhost:3000/public/immagini/videogiochi/shopping (9).webp', 19.99, 1, 'Sparatutto', 'Usato', Math.round(19.99 / 5)],
            ['Uncharted 3 L\'inganno di Drake', 'Unisciti a Nathan Drake in una spettacolare caccia al tesoro attraverso il deserto arabico in questa esclusiva e pluripremiata avventura d\'azione.', 0, 'http://localhost:3000/public/immagini/videogiochi/shopping (10).webp', 14.99, 1, 'Avventura', 'Usato', Math.round(14.99 / 5)],
            ['Need for Speed Rivals', 'Sfreccia per le strade di Redview County: scegli se essere un pilota fuorilegge o un poliziotto spietato in questo adrenalinico gioco di corse open-world.', 0, 'http://localhost:3000/public/immagini/videogiochi/shopping (11).webp', 16.99, 1, 'Sport', 'Usato', Math.round(16.99 / 5)],
            ['FarCry 3', 'Sopravvivi a un\'isola tropicale dominata dalla follia di Vaas. Esplora, combatti e scopri oscuri segreti in uno dei migliori open-world di sempre.', 0, 'http://localhost:3000/public/immagini/videogiochi/shopping (12).webp', 12.99, 1, 'Azione', 'Usato', Math.round(12.99 / 5)],
            ['Gran Turismo 5', 'Il Real Driving Simulator sbarca su PS3 con una grafica mozzafiato, un sistema di danni ai veicoli e una vastissima selezione di tracciati e vetture storiche.', 0, 'http://localhost:3000/public/immagini/videogiochi/shopping (13).webp', 9.99, 1, 'Sport', 'Usato', Math.round(9.99 / 5)]
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
            ['Adattatore USB-C a HDMI 4K', 'Collega la tua console o dispositivo portatile al monitor o alla TV con questo cavo adattatore ad alta velocità per una risoluzione fino a 4K 60Hz.', 30, 'http://localhost:3000/public/immagini/accessori/shopping (21).webp', 19.99, 1, 'Nuovo', Math.round(19.99 / 5)],
            ['Cover PlayStation 5 Custom Red', 'Personalizza la tua console con questa cover dal design accattivante, caratterizzata da una sfumatura dal rosso intenso al nero.', 15, 'http://localhost:3000/public/immagini/accessori/trasferimento (6).jpg', 49.99, 1, 'Nuovo', Math.round(49.99 / 5)],
            ['Cover PlayStation 5 Starlight Blue', 'Dona un tocco di colore vibrante alla tua postazione di gioco con questa cover originale per PS5 in colorazione blu stellare.', 20, 'http://localhost:3000/public/immagini/accessori/images.jpg', 54.99, 1, 'Nuovo', Math.round(54.99 / 5)],
            ['Cover PlayStation 5 Custom Green', 'Distinguiti dalla massa con questa cover personalizzata per PS5, dotata di un\'incredibile sfumatura dal verde fluo al nero profondo.', 12, 'http://localhost:3000/public/immagini/accessori/trasferimento (1).jpg', 49.99, 1, 'Nuovo', Math.round(49.99 / 5)],
            ['Cover PlayStation 5 Sterling Silver', 'Dona alla tua console un aspetto premium e industriale con questa elegante cover rigida con finitura metallizzata argento.', 18, 'http://localhost:3000/public/immagini/accessori/trasferimento (2).jpg', 54.99, 1, 'Nuovo', Math.round(54.99 / 5)],
            ['Cover PlayStation 5 Galactic Purple', 'Rendi unica la tua console con questa cover rigida e resistente in una profonda e spaziale colorazione viola galattico.', 10, 'http://localhost:3000/public/immagini/accessori/trasferimento (3).jpg', 54.99, 1, 'Nuovo', Math.round(54.99 / 5)],
            ['Custodia Protettiva Apple Watch - Rossa', 'Proteggi il tuo smartwatch da urti e graffi con questo bumper rosso con vetro temperato integrato. Design sottile e altissima resistenza.', 30, 'http://localhost:3000/public/immagini/accessori/trasferimento (4).jpg', 12.99, 1, 'Nuovo', Math.round(12.99 / 5)],
            ['Cavo Adattatore TV per Nintendo Switch', 'Collega direttamente la tua Nintendo Switch alla TV senza usare la dock station. Cavo Type-C a HDMI rosso intrecciato ad alta durabilità.', 40, 'http://localhost:3000/public/immagini/accessori/trasferimento (4).webp', 24.99, 1, 'Nuovo', Math.round(24.99 / 5)],
            ['Custodia Trasparente Apple Watch', 'Mantieni intatto il design originale del tuo Apple Watch garantendo una protezione totale a 360 gradi contro urti e cadute grazie al vetro temperato.', 35, 'http://localhost:3000/public/immagini/accessori/trasferimento (5).jpg', 11.99, 1, 'Nuovo', Math.round(11.99 / 5)],
            ['Caricabatterie Rapido USB-C 20W', 'Ricarica velocemente i tuoi dispositivi con questo alimentatore da parete compatto. Cavo di ricarica rapida incluso per la massima efficienza.', 53, 'http://localhost:3000/public/immagini/accessori/trasferimento (5).webp', 15.99, 1, 'Nuovo', Math.round(15.99 / 5)],
            ['Cavo HDMI 4K ad Alta Velocità', 'Collega le tue console, PC o decoder alla TV con questo cavo HDMI ad altissime prestazioni. Supporta risoluzioni 4K Ultra HD per un\'esperienza visiva impeccabile.', 70, 'http://localhost:3000/public/immagini/accessori/trasferimento.jpg', 9.99, 1, 'Nuovo', Math.round(9.99 / 5)],
            ['Custodia Protettiva per Smartwatch Sport (Nera)', 'Proteggi il tuo orologio sportivo con questo bumper nero opaco dotato di vetro temperato. Ideale per le attività outdoor e gli allenamenti più intensi.', 25, 'http://localhost:3000/public/immagini/accessori/trasferimento (8).jpg', 10.99, 1, 'Nuovo', Math.round(10.99 / 5)],
            ['Custodia Rugged per Apple Watch Ultra', 'Massima protezione per il tuo Apple Watch Ultra. Bumper nero ultra-resistente con pellicola in vetro per affrontare le condizioni più estreme senza rinunciare allo stile.', 20, 'http://localhost:3000/public/immagini/accessori/trasferimento (4).jpg', 14.99, 1, 'Nuovo', Math.round(14.99 / 5)],
            ['Custodia Protettiva Apple Watch - Sport Edition', 'Bumper nero protettivo con dettagli rossi sulla Digital Crown. Vetro temperato integrato per difendere lo schermo da urti e graffi quotidiani.', 30, 'http://localhost:3000/public/immagini/accessori/trasferimento (7).jpg', 12.99, 1, 'Nuovo', Math.round(12.99 / 5)],
            ['Custodia Trasparente per Smartwatch', 'Protezione invisibile per il tuo smartwatch. Cover in morbido materiale trasparente che avvolge lo schermo e i bordi senza alterare il design elegante dell\'orologio.', 40, 'http://localhost:3000/public/immagini/accessori/trasferimento (10).jpg', 8.99, 1, 'Nuovo', Math.round(8.99 / 5)],
            ['Maxi-Spazzola per Pulizia Tastiere', 'Spazzola morbida e densa, ideale per spolverare superfici ampie e rimuovere briciole o detriti dalla tua tastiera senza graffiarla.', 40, 'http://localhost:3000/public/immagini/accessori/trasferimento (11).jpg', 6.99, 1, 'Nuovo', Math.round(6.99 / 5)],
            ['Kit Pulizia Console Multifunzione 7 in 1', 'Set completo per la cura della tua console. Include maxi-spazzola, estrattore di pannelli, panno in microfibra, spray e penna di precisione per angoli.', 50, 'http://localhost:3000/public/immagini/accessori/61PRCP-+vEL._AC_UF1000,1000_QL80_.jpg', 14.99, 1, 'Nuovo', Math.round(14.99 / 5)],
            ['Clip Estrattore Tasti (Keycap Puller)', 'Strumento essenziale per le tastiere meccaniche. Permette di rimuovere i tasti in totale sicurezza per una pulizia profonda ed evitare accumuli di sporco.', 60, 'http://localhost:3000/public/immagini/accessori/trasferiemnto0.jpg', 4.99, 1, 'Nuovo', Math.round(4.99 / 5)]
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
            ['Smartwatch Fitness Black Edition', 'Tieni traccia dei tuoi allenamenti, del battito cardiaco e delle notifiche con questo elegante smartwatch nero dal design squadrato.', 25, 'http://localhost:3000/public/immagini/elettronica/shopping (19).webp', 39.99, 1, 'Nuovo', Math.round(39.99 / 5)],
            ['PlayStation Camera V2 (PS4)', 'La telecamera ufficiale Sony con design cilindrico, indispensabile per il PlayStation VR e perfetta per lo streaming delle tue sessioni di gioco.', 12, 'http://localhost:3000/public/immagini/elettronica/images (1).jpg', 44.99, 1, 'Nuovo', Math.round(44.99 / 5)],
            ['Tastiera Meccanica 60% RGB', 'Layout ultra compatto 60%, switch meccanici reattivi e retroilluminazione RGB personalizzabile per massimizzare lo spazio sulla scrivania.', 30, 'http://localhost:3000/public/immagini/elettronica/images (2).jpg', 49.99, 1, 'Nuovo', Math.round(49.99 / 5)],
            ['Mouse Gaming Ergonomico LED Blu', 'Precisione assoluta e design aggressivo con illuminazione LED blu. Dotato di tasti laterali programmabili e DPI regolabili su più livelli.', 40, 'http://localhost:3000/public/immagini/elettronica/images (3).jpg', 19.99, 1, 'Nuovo', Math.round(19.99 / 5)],
            ['Mouse Gaming Wireless 7 Tasti', 'Libertà di movimento totale grazie alla connessione wireless. Design ergonomico, illuminazione LED e tasto speciale double-click integrato.', 35, 'http://localhost:3000/public/immagini/elettronica/images (4).jpg', 24.99, 1, 'Nuovo', Math.round(24.99 / 5)],
            ['Tastiera Logitech G PRO', 'Tastiera meccanica TKL progettata per i professionisti dell\'eSport. Edizione esclusiva League of Legends con switch tattili GX Brown.', 10, 'http://localhost:3000/public/immagini/elettronica/images.jpg', 129.99, 1, 'Nuovo', Math.round(129.99 / 5)],
            ['Cuffie Gaming Kotion Each', 'Immergiti nel gioco con un audio potente e bassi profondi. Padiglioni over-ear confortevoli, illuminazione LED blu e microfono flessibile.', 50, 'http://localhost:3000/public/immagini/elettronica/kotion (18).webp', 29.99, 1, 'Nuovo', Math.round(29.99 / 5)],
            ['Cuffie Razer Kraken X', 'Comfort prolungato grazie ai cuscinetti morbidissimi, audio surround 7.1 immersivo e microfono pieghevole con cancellazione del rumore.', 20, 'http://localhost:3000/public/immagini/elettronica/razer (18).webp', 59.99, 1, 'Nuovo', Math.round(59.99 / 5)],
            ['Smartwatch Ultra - Alpine Orange', 'Costruito per l\'avventura: cassa robusta, display ad altissima visibilità e cinturino sportivo intrecciato in tessuto tecnico arancione.', 15, 'http://localhost:3000/public/immagini/elettronica/shopping (18).webp', 49.99, 1, 'Nuovo', Math.round(49.99 / 5)],
            ['Auricolari True Wireless In-Ear', 'Cuffiette Bluetooth con cancellazione del rumore e gommini in silicone per una vestibilità perfetta. Custodia di ricarica inclusa per ore di ascolto ininterrotto.', 45, 'http://localhost:3000/public/immagini/elettronica/trasferimento (1).jpg', 34.99, 1, 'Nuovo', Math.round(34.99 / 5)],
            ['Auricolari Bluetooth Semi In-Ear', 'Design ergonomico e ultra-leggero, ideali per chiamate e musica in movimento. Audio cristallino, pairing rapido e comodi controlli touch.', 50, 'http://localhost:3000/public/immagini/elettronica/trasferimento (2).jpg', 29.99, 1, 'Nuovo', Math.round(29.99 / 5)],
            ['Cuffie Bluetooth JBL On-Ear', 'Bassi potenti e suono inconfondibile JBL. Cuffie wireless leggere e pieghevoli, con una batteria a lunghissima durata per accompagnarti tutto il giorno.', 20, 'http://localhost:3000/public/immagini/elettronica/trasferimento (2).webp', 49.99, 1, 'Usato', Math.round(49.99 / 5)],
            ['Tastiera Meccanica Bianca RGB', 'Illumina il tuo setup con questa elegante tastiera meccanica bianca. Switch reattivi, telaio compatto e retroilluminazione RGB completamente personalizzabile.', 30, 'http://localhost:3000/public/immagini/elettronica/trasferimento (3).jpg', 54.99, 1, 'Nuovo', Math.round(54.99 / 5)],
            ['Mouse Gaming Wireless Mecha', 'Design robotico accattivante e libertà totale grazie al dongle wireless. Sensore ottico ad alta precisione e illuminazione LED per i veri gamer.', 40, 'http://localhost:3000/public/immagini/elettronica/images (3).jpg', 24.99, 1, 'Nuovo', Math.round(24.99 / 5)],
            ['Mouse Gaming Logitech G Bianco', 'Prestazioni da eSport in un elegantissimo chassis bianco. Ergonomia avanzata, tasti programmabili e tecnologia wireless ad altissima velocità senza latenza.', 15, 'http://localhost:3000/public/immagini/elettronica/trasferimento (5).jpg', 89.99, 1, 'Nuovo', Math.round(89.99 / 5)],
            ['Smartwatch Fitness White Silver', 'Un compagno di benessere elegante e discreto. Monitoraggio salute 24/7, display squadrato luminosissimo e cinturino in morbido silicone bianco.', 25, 'http://localhost:3000/public/immagini/elettronica/shopping (20).webp', 39.99, 1, 'Nuovo', Math.round(39.99 / 5)]
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
        const utenti = [
            { nome: 'Admin', cognome: 'PAwerUP', email: 'pawerupecommerce@gmail.com', password: 'PAwerUP1234@!', ruolo: 'admin' },
            { nome: 'Luca', cognome: 'Molinelli', email: 'molinluca1@gmail.com', password: 'Lstarwars2@', ruolo: 'user' },
            { nome: 'Mattia', cognome: 'Ragusa', email: 'ragusamatt@hotmail.com', password: 'Mattia1207!', ruolo: 'user' },
            { nome: 'Dennis', cognome: 'Secco', email: 'dennis.secco10@gmail.com', password: 'Prova1234**', ruolo: 'user' },
            { nome: 'Utente', cognome: 'Prova', email: 'utenteaccessoprova@gmail.com', password: 'Prova1234!', ruolo: 'user' }
        ];

        for (const utente of utenti) {
            const hashedPassword = await bcrypt.hash(utente.password, 10);
            const response = "INSERT INTO utente (nome, cognome, email, password, ruolo) VALUES (?, ?, ?, ?, ?)";
            const values = [utente.nome, utente.cognome, utente.email, hashedPassword, utente.ruolo];

            db.run(response, values, (err) => {
                if (err) {
                    console.error(`Errore durante l'inserimento dell'utente ${utente.email}:`, err);
                } else {
                    console.log(`Utente ${utente.ruolo} generato con successo (Email: ${utente.email} - Password: ${utente.password})`);
                    authControllers.inviaEmailBenvenuto(utente.email, utente.nome, utente.cognome);
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}
function seedingProdotti() {
    db.get("SELECT COUNT(*) AS count from prodotto", async (err, row) => {
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
}
// Funzione per popolare il database con dati di esempio
function seedDatabase() {
    db.get("SELECT COUNT(*) AS count from categoria", (err, row) => {
        if (row && row.count === 0) {
            db.run("INSERT INTO categoria (denominazione) VALUES ('Console'), ('Videogiochi'), ('Accessori'), ('Elettronica')", function (err) {
                if (err) {
                    console.error('Errore durante il popolamento del database:', err);
                } else {
                    console.log('Tabella categoria popolata con successo');
                    seedingProdotti(); // Avviamo i prodotti SOLO DOPO le categorie
                }
            });
        } else {
            seedingProdotti(); // Avviamo i prodotti se le categorie sono già esistenti
        }
    });

    db.get("SELECT COUNT(*) AS count from utente WHERE ruolo = 'admin'", async (err, row) => {
        if (row && row.count === 0) {
            await popolaDatabaseUtenteAdmin();
        }
    });
}


module.exports = seedDatabase;