const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Auth base
router.post('/register', authController.register);
router.get('/conferma/:token', authController.confermaRegistrazione);
router.post('/login', authController.login);
router.post('/password-reset', authController.passwordReset);
router.post('/update-password', authController.updatePassword);

// Profilo utente autenticato
router.get('/profile', authMiddleware, authController.getProfile);

// Gestione utenti (admin)
router.get('/users', authMiddleware, adminMiddleware, authController.getAllUsers);
router.delete('/:id', authMiddleware, adminMiddleware, authController.deleteUser);
router.put('/:id/admin', authMiddleware, adminMiddleware, authController.admin);
router.put('/:id/user', authMiddleware, adminMiddleware, authController.user);
router.put('/:id/operatore', authMiddleware, adminMiddleware, authController.operatore);

// ── PANNELLO DETTAGLIO UTENTE (admin) ─────────────────────────────────────
// Dettaglio completo: profilo + indirizzi + carte oscurate + punti
router.get('/:id/dettaglio', authMiddleware, adminMiddleware, authController.getUtenteDettaglio);
// Aggiunta/sottrazione punti fedeltà
router.put('/:id/punti', authMiddleware, adminMiddleware, authController.modificaPuntiFedelta);
// Invia email reset password per conto dell'utente
router.post('/:id/reset-password-admin', authMiddleware, adminMiddleware, authController.inviaResetPasswordAdmin);
// Modifica indirizzo salvato
router.put('/indirizzi/:id', authMiddleware, adminMiddleware, authController.aggiornaIndirizzoAdmin);

module.exports = router;
