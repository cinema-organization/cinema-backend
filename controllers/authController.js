// controllers/authController.js
const User = require("../models/userModel");

// 📝 Inscription
exports.register = async (req, res) => {
  try {
    const { nom, email, password } = req.body;

    // Vérifier si email déjà utilisé
    const existe = await User.findOne({ email });
    if (existe) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Créer l'utilisateur
    const user = await User.create({ nom, email, password });

    // Générer token
    const token = user.generateToken();

    res.status(201).json({
      message: "Inscription réussie",
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔐 Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier utilisateur
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Utilisateur introuvable" });

    // Vérifier mot de passe
    const estValide = await user.comparePassword(password);
    if (!estValide) return res.status(400).json({ message: "Mot de passe incorrect" });

    // Générer token
    const token = user.generateToken();

    res.json({
      message: "Connexion réussie",
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
