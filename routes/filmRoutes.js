// routes/filmRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAllFilms,
  getFilmById,
  createFilm,
  updateFilm,
  deleteFilm
} = require("../controllers/filmController");
const { proteger } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Routes publiques
router.get("/", getAllFilms);
router.get("/:id", getFilmById);

// Routes admin
router.post("/", proteger, adminOnly, createFilm);
router.put("/:id", proteger, adminOnly, updateFilm);
router.delete("/:id", proteger, adminOnly, deleteFilm);

module.exports = router;