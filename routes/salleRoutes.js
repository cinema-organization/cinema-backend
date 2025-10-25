// routes/salleRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllSalles,
  getSalleById,
  createSalle,
  updateSalle,
  deleteSalle
} = require("../controllers/salleController");
const { proteger } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Routes publiques
router.get("/", getAllSalles);
router.get("/:id", getSalleById);

// Routes admin
router.post("/", proteger, adminOnly, createSalle);
router.put("/:id", proteger, adminOnly, updateSalle);
router.delete("/:id", proteger, adminOnly, deleteSalle);

module.exports = router;