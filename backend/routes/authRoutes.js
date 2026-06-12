const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post('/password-reset', authController.passwordReset);

// rotta per ottenere tutti gli utenti
router.get("/utenti", authController.getAllUsers);

// esempio route protetta
router.get("/profilo", authMiddleware, authController.getProfile);

// rotta conferma registrazione utente
router.get("/conferma/:token", authController.confermaRegistrazione);
router.delete("/:id", authController.deleteUser);

router.post('/password-reset', authControllers.passwordReset);
router.post('/update-password', authControllers.updatePassword);

module.exports = router;