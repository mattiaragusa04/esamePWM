const bcrypt = require("bcrypt"); // per criptare le informazioni
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const SECRET = "supersecretkey";

exports.register = async (req, res) => {
  try {
    const { nome, cognome, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password sono obbligatori" });
    }

    console.log("Registering user:", email);
    console.log("Password:", password);

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(nome, cognome, email, hashedPassword);

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Logging in user:", email);
    console.log("Password:", password);


    const user = await User.findByEmail(email);
    console.log("Found user:", user);
    if (!user) {
      return res.status(400).json({ message: "Credenziali non valide" });
    }

   console.log("Password type:", typeof(password), "User password type:", typeof(user.password));

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", password, user.password, isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenziali non valide" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
      expiresIn: "1h"
    });

    // Rimuoviamo la password prima di inviare i dati al frontend
    const { password: userPassword, ...safeUser } = user;
    res.json({ token, utente: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    // Rimuoviamo la password da ogni utente prima di inviare i dati
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utente non trovato" });
    }

    const { password, ...safeUser } = user;

    res.json(safeUser);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};