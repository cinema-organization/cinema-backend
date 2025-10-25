// middleware/roleMiddleware.js

exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      message: "Accès refusé. Réservé aux administrateurs." 
    });
  }
  
  next();
};

exports.userOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentification requise" });
  }
  
  if (req.user.role !== "client" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé" });
  }
  
  next();
};