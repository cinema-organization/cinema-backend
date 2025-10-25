// Backend: routes/statsRoutes.js
const express = require('express');
const router = express.Router();

// Imports avec fallback (si model manquant, log et set 0)
let Film, Reservation, Salle, Seance, User;
try {
  Film = require('../models/filmModel');
} catch (err) { console.warn('Model Film manquant:', err.message); Film = { countDocuments: () => Promise.resolve(0) }; }
try {
  Reservation = require('../models/reservationModel');
} catch (err) { console.warn('Model Reservation manquant:', err.message); Reservation = { countDocuments: () => Promise.resolve(0), aggregate: () => Promise.resolve([{ total: 0 }]) }; }
try {
  Salle = require('../models/salleModel');
} catch (err) { console.warn('Model Salle manquant:', err.message); Salle = { countDocuments: () => Promise.resolve(0) }; }
try {
  Seance = require('../models/seanceModel');  // Fix: 'Seance' (pas 'seancModel')
} catch (err) { console.warn('Model Seance manquant:', err.message); Seance = { countDocuments: () => Promise.resolve(0) }; }
try {
  User = require('../models/userModel');
} catch (err) { console.warn('Model User manquant:', err.message); User = { countDocuments: () => Promise.resolve(0) }; }

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const [totalFilms, totalSalles, totalSeancesAvenir, totalReservationsConfirmees, totalUsers, totalRevenue] = await Promise.all([
      Film.countDocuments().catch(() => 0),
      Salle.countDocuments().catch(() => 0),
      Seance.countDocuments({ statut: 'à venir' }).catch(() => 0),
      Reservation.countDocuments({ statut: 'confirmée' }).catch(() => 0),
      User.countDocuments().catch(() => 0),
      Reservation.aggregate([
        { $match: { statut: 'confirmée' } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$nombrePlaces', 12] } } } }
      ]).catch(() => [{ total: 0 }])
    ]);

    res.json({
      success: true,
      data: {
        totalFilms,
        totalSalles,
        totalSeancesAvenir,
        totalReservations: totalReservationsConfirmees,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
      }
    });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur stats' });
  }
});

module.exports = router;