// routes/reservationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getMesReservations,
  getAllReservations,
  createReservation,
  annulerReservation,
  deleteReservation
} = require("../controllers/reservationController");
const { proteger } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Routes client
router.get("/mes-reservations", proteger, getMesReservations);
router.post("/", proteger, createReservation);
router.put("/:id/annuler", proteger, annulerReservation);

// Routes admin
router.get("/", proteger, adminOnly, getAllReservations);
router.delete("/:id", proteger, adminOnly, deleteReservation);

module.exports = router;