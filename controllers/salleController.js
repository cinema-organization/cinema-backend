// controllers/salleController.js
const Salle = require("../models/salleModel");
const Seance = require("../models/seanceModel");
const Reservation = require("../models/reservationModel");

// GET /api/salles - Liste toutes les salles (PUBLIC)
exports.getAllSalles = async (req, res) => {
  try {
    const salles = await Salle.find().sort({ nom: 1 });
    res.json({
      success: true,
      count: salles.length,
      data: salles
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET /api/salles/:id - Détails d'une salle (PUBLIC)
exports.getSalleById = async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);
    
    if (!salle) {
      return res.status(404).json({ 
        success: false, 
        message: "Salle introuvable" 
      });
    }

    res.json({
      success: true,
      data: salle
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// POST /api/salles - Créer une salle (ADMIN)
exports.createSalle = async (req, res) => {
  try {
    const { nom, capacite } = req.body;

    // Vérifier si le nom existe déjà
    const existant = await Salle.findOne({ nom });
    if (existant) {
      return res.status(400).json({ 
        success: false, 
        message: "Une salle avec ce nom existe déjà" 
      });
    }

    const salle = await Salle.create({ nom, capacite });

    res.status(201).json({
      success: true,
      message: "Salle créée avec succès",
      data: salle
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// PUT /api/salles/:id - Modifier une salle (ADMIN)
exports.updateSalle = async (req, res) => {
  try {
    const { nom, capacite } = req.body;

    const salle = await Salle.findById(req.params.id);
    if (!salle) {
      return res.status(404).json({ 
        success: false, 
        message: "Salle introuvable" 
      });
    }

    // Vérifier si le nouveau nom existe déjà (sauf pour cette salle)
    if (nom && nom !== salle.nom) {
      const existant = await Salle.findOne({ nom });
      if (existant) {
        return res.status(400).json({ 
          success: false, 
          message: "Une salle avec ce nom existe déjà" 
        });
      }
    }

    // Si capacité réduite, vérifier les réservations existantes
    if (capacite && capacite < salle.capacite) {
      const seancesFutures = await Seance.find({
        salle_id: req.params.id,
        statut: "à venir"
      });

      for (let seance of seancesFutures) {
        const reservations = await Reservation.aggregate([
          { $match: { seance_id: seance._id, statut: "confirmée" } },
          { $group: { _id: null, total: { $sum: "$nombrePlaces" } } }
        ]);

        const placesReservees = reservations[0]?.total || 0;

        if (placesReservees > capacite) {
          return res.status(400).json({
            success: false,
            message: `Impossible de réduire la capacité. Une séance a déjà ${placesReservees} places réservées.`
          });
        }
      }
    }

    const salleMiseAJour = await Salle.findByIdAndUpdate(
      req.params.id,
      { nom, capacite },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Salle modifiée avec succès",
      data: salleMiseAJour
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// DELETE /api/salles/:id - Supprimer une salle (ADMIN)
exports.deleteSalle = async (req, res) => {
  try {
    const salle = await Salle.findById(req.params.id);
    if (!salle) {
      return res.status(404).json({ 
        success: false, 
        message: "Salle introuvable" 
      });
    }

    // Vérifier si la salle a des séances à venir
    const seancesFutures = await Seance.findOne({
      salle_id: req.params.id,
      statut: "à venir"
    });

    if (seancesFutures) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer cette salle. Elle a des séances à venir."
      });
    }

    await Salle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Salle supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};