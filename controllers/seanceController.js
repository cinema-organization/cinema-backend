// controllers/seanceController.js - VERSION CORRIGÉE
const Seance = require("../models/seanceModel");
const Film = require("../models/filmModel");
const Salle = require("../models/salleModel");
const Reservation = require("../models/reservationModel");

// GET /api/seances - Liste toutes les séances avec filtres (PUBLIC)
exports.getAllSeances = async (req, res) => {
  try {
    const { film_id, salle_id, date, statut } = req.query;

    let filtres = {};
    if (film_id) filtres.film_id = film_id;
    if (salle_id) filtres.salle_id = salle_id;
    if (date) filtres.date = new Date(date);
    if (statut) filtres.statut = statut;

    const seances = await Seance.find(filtres)
      .populate("film_id")
      .populate("salle_id")
      .sort({ date: 1, heure: 1 });

    // ✅ CORRECTION : Calculer le statut sans sauvegarder
    const seancesAvecStatut = seances.map(seance => {
      const statutCalcule = calculerStatutSeance(seance);
      return {
        ...seance.toObject(),
        statut: statutCalcule
      };
    });

    res.json({
      success: true,
      count: seancesAvecStatut.length,
      data: seancesAvecStatut
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET /api/seances/:id - Détails d'une séance (PUBLIC)
exports.getSeanceById = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id)
      .populate("film_id")
      .populate("salle_id");
    
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: "Séance introuvable" 
      });
    }

    // ✅ CORRECTION : Calculer sans sauvegarder
    const statutCalcule = calculerStatutSeance(seance);
    const seanceAvecStatut = {
      ...seance.toObject(),
      statut: statutCalcule
    };

    res.json({
      success: true,
      data: seanceAvecStatut
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET /api/seances/:id/disponibilite - Places restantes (PUBLIC)
exports.getDisponibilite = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id).populate("salle_id");
    
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: "Séance introuvable" 
      });
    }

    // Calculer les places réservées
    const reservations = await Reservation.aggregate([
      { $match: { seance_id: seance._id, statut: "confirmée" } },
      { $group: { _id: null, total: { $sum: "$nombrePlaces" } } }
    ]);

    const placesReservees = reservations[0]?.total || 0;
    const placesRestantes = seance.salle_id.capacite - placesReservees;

    res.json({
      success: true,
      data: {
        capaciteTotal: seance.salle_id.capacite,
        placesReservees,
        placesRestantes,
        pourcentageRempli: Math.round((placesReservees / seance.salle_id.capacite) * 100)
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// POST /api/seances - Créer une séance (ADMIN)
exports.createSeance = async (req, res) => {
  try {
    const { film_id, salle_id, date, heure } = req.body;

    // Vérifier que le film existe
    const film = await Film.findById(film_id);
    if (!film) {
      return res.status(404).json({ 
        success: false, 
        message: "Film introuvable" 
      });
    }

    // Vérifier que la salle existe
    const salle = await Salle.findById(salle_id);
    if (!salle) {
      return res.status(404).json({ 
        success: false, 
        message: "Salle introuvable" 
      });
    }

    const seance = new Seance({ film_id, salle_id, date, heure });
    await seance.save();

    const seanceComplete = await Seance.findById(seance._id)
      .populate("film_id")
      .populate("salle_id");

    res.status(201).json({
      success: true,
      message: "Séance créée avec succès",
      data: seanceComplete
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// PUT /api/seances/:id - Modifier une séance (ADMIN)
exports.updateSeance = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id);
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: "Séance introuvable" 
      });
    }

    const { film_id, salle_id, date, heure } = req.body;

    // Mettre à jour les champs
    if (film_id) seance.film_id = film_id;
    if (salle_id) seance.salle_id = salle_id;
    if (date) seance.date = date;
    if (heure) seance.heure = heure;

    await seance.save();

    const seanceMiseAJour = await Seance.findById(seance._id)
      .populate("film_id")
      .populate("salle_id");

    res.json({
      success: true,
      message: "Séance modifiée avec succès",
      data: seanceMiseAJour
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// DELETE /api/seances/:id - Supprimer une séance (ADMIN)
exports.deleteSeance = async (req, res) => {
  try {
    const seance = await Seance.findById(req.params.id);
    if (!seance) {
      return res.status(404).json({ 
        success: false, 
        message: "Séance introuvable" 
      });
    }

    // Vérifier s'il y a des réservations confirmées
    const reservationsConfirmees = await Reservation.countDocuments({
      seance_id: req.params.id,
      statut: "confirmée"
    });

    if (reservationsConfirmees > 0) {
      return res.status(400).json({
        success: false,
        message: `Cette séance a ${reservationsConfirmees} réservation(s) confirmée(s). Suppression impossible.`,
        reservationsCount: reservationsConfirmees
      });
    }

    // Supprimer les réservations annulées associées
    await Reservation.deleteMany({ seance_id: req.params.id });

    await Seance.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Séance supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 🔄 Mise à jour automatique des statuts de séances (PUBLIC)
exports.updateSeancesStatus = async (req, res) => {
  try {
    const seances = await Seance.find();
    const maintenant = new Date();
    let updatedCount = 0;

    for (let seance of seances) {
      const [heures, minutes] = seance.heure.split(':').map(Number);
      const dateHeureSeance = new Date(seance.date);
      dateHeureSeance.setHours(heures, minutes, 0, 0);
      
      const nouveauStatut = dateHeureSeance < maintenant ? "terminée" : "à venir";
      
      // ✅ CORRECTION : Utiliser updateOne pour éviter les validations
      if (seance.statut !== nouveauStatut) {
        await Seance.updateOne(
          { _id: seance._id },
          { $set: { statut: nouveauStatut } }
        );
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${updatedCount} séances mises à jour`,
      updated: updatedCount
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour séances:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ FONCTION UTILITAIRE : Calculer statut sans sauvegarder
function calculerStatutSeance(seance) {
  const maintenant = new Date();
  const [heures, minutes] = seance.heure.split(':').map(Number);
  const dateHeureSeance = new Date(seance.date);
  dateHeureSeance.setHours(heures, minutes, 0, 0);
  
  return dateHeureSeance < maintenant ? "terminée" : "à venir";
}