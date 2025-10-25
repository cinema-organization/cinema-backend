// routes/seanceRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllSeances,
  getSeanceById,
  getDisponibilite,
  createSeance,
  updateSeance,
  deleteSeance
} = require("../controllers/seanceController");
const { proteger } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Routes publiques
router.get("/", getAllSeances);
router.get("/:id", getSeanceById);
router.get("/:id/disponibilite", getDisponibilite);

// Routes admin
router.post("/", proteger, adminOnly, createSeance);
router.put("/:id", proteger, adminOnly, updateSeance);
router.delete("/:id", proteger, adminOnly, deleteSeance);

module.exports = router;