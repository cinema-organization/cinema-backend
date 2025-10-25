// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.proteger = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Accès non autorisé" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
};
