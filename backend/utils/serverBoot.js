/**
 * Identificatore univoco generato all'avvio del server.
 *
 * Viene incluso nel payload dei JWT al momento del login/registrazione.
 * Il middleware auth confronta il bootId del token con quello attuale:
 * se differiscono significa che il server e' stato riavviato e tutti
 * i token emessi prima del riavvio vengono rifiutati (401), forzando
 * un logout pulito sul frontend.
 *
 * Effetto pratico:
 * - Riavvio server -> tutti gli utenti sloggati al successivo request.
 * - Refresh pagina con server ancora in esecuzione -> token ancora valido,
 *   utente NON viene sloggato.
 */
const crypto = require('crypto');

const bootId = crypto.randomBytes(16).toString('hex');

console.log(`[serverBoot] bootId = ${bootId}`);

module.exports = {
    bootId
};
