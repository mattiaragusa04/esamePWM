const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/register', authController.register);
router.get('/conferma/:token', authController.confermaRegistrazione);
router.post('/login', authController.login);
router.post('/password-reset', authController.passwordReset);
router.post('/update-password', authController.updatePassword);


router.get('/profile', authMiddleware, authController.getProfile);


router.get('/users', authMiddleware, adminMiddleware, authController.getAllUsers);
router.delete('/:id', authMiddleware, adminMiddleware, authController.deleteUser);
router.put('/:id/admin', authMiddleware, adminMiddleware, authController.admin);
router.put('/:id/user', authMiddleware, adminMiddleware, authController.user);


router.get('/:id/dettaglio', authMiddleware, adminMiddleware, authController.getUtenteDettaglio);

router.put('/:id/punti', authMiddleware, adminMiddleware, authController.modificaPuntiFedelta);

router.post('/:id/reset-password-admin', authMiddleware, adminMiddleware, authController.inviaResetPasswordAdmin);

router.put('/indirizzi/:id', authMiddleware, adminMiddleware, authController.aggiornaIndirizzoAdmin);

module.exports = router;
