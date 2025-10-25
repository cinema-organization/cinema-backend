// controllers/reservationController.js
const Reservation = require("../models/reservationModel");
const Seance = require("../models/seanceModel");

// GET /api/reservations/mes-reservations - Réservations de l'utilisateur connecté (USER)
exports.getMesReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user_id: req.user._id })
      .populate({
        path: "seance_id",
        populate: [
          { path: "film_id" },
          { path: "salle_id" }
        ]
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET /api/reservations - Toutes les réservations avec filtres (ADMIN)
exports.getAllReservations = async (req, res) => {
  try {
    const { film_id, seance_id, user_id, statut } = req.query;

    let filtres = {};
    if (user_id) filtres.user_id = user_id;
    if (seance_id) filtres.seance_id = seance_id;
    if (statut) filtres.statut = statut;

    let reservations = await Reservation.find(filtres)
      .populate("user_id", "nom email")
      .populate({
        path: "seance_id",
        populate: [
          { path: "film_id" },
          { path: "salle_id" }
        ]
      })
      .sort({ createdAt: -1 });

    // Filtrer par film si nécessaire
    if (film_id) {
      reservations = reservations.filter(
        r => r.seance_id?.film_id?._id.toString() === film_id
      );
    }

    res.json({
      success: true,
      count: reservations.length,
      data: reservations
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// POST /api/reservations - Créer une réservation (USER)
exports.createReservation = async (req, res) => {
  try {
    const { seance_id, nombrePlaces } = req.body;

    // Vérifier que la séance existe
    const seance = await Seance.findById(seance_id).populate("salle_id film_id");
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: "Séance introuvable" 
      });
    }

    // Vérifier que la séance est à venir
    seance.calculerStatut();
    if (seance.statut !== "à venir") {
      return res.status(400).json({
        success: false,
        message: "Cette séance n'est plus disponible"
      });
    }

    const reservation = new Reservation({
      user_id: req.user._id,
      seance_id,
      nombrePlaces
    });

    // Les validations (disponibilité, doublon) se font dans le pre-save hook
    await reservation.save();

    const reservationComplete = await Reservation.findById(reservation._id)
      .populate("user_id", "nom email")
      .populate({
        path: "seance_id",
        populate: [
          { path: "film_id" },
          { path: "salle_id" }
        ]
      });

    res.status(201).json({
      success: true,
      message: "Réservation créée avec succès",
      data: reservationComplete
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// PUT /api/reservations/:id/annuler - Annuler une réservation (USER)
exports.annulerReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: "Réservation introuvable" 
      });
    }

    // Vérifier que c'est bien la réservation de l'utilisateur
    if (reservation.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez annuler que vos propres réservations"
      });
    }

    // Vérifier que la réservation est confirmée
    if (reservation.statut !== "confirmée") {
      return res.status(400).json({
        success: false,
        message: "Cette réservation est déjà annulée"
      });
    }

    // Vérifier que la séance n'est pas passée
    const peutAnnuler = await reservation.peutEtreAnnulee();
    if (!peutAnnuler) {
      return res.status(400).json({
        success: false,
        message: "Impossible d'annuler une réservation pour une séance passée"
      });
    }

    await reservation.annuler();

    const reservationMiseAJour = await Reservation.findById(reservation._id)
      .populate({
        path: "seance_id",
        populate: [
          { path: "film_id" },
          { path: "salle_id" }
        ]
      });

    res.json({
      success: true,
      message: "Réservation annulée avec succès",
      data: reservationMiseAJour
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// DELETE /api/reservations/:id - Supprimer une réservation (ADMIN)
exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: "Réservation introuvable" 
      });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Réservation supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};