const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);

// rotta per ottenere tutti gli utenti
router.get("/users", authController.getAllUsers);

// esempio route protetta
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router;