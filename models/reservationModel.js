const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seance_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seance",
      required: true,
    },
    nombrePlaces: {
      type: Number,
      required: [true, "Le nombre de places est obligatoire"],
      min: [1, "Il faut réserver au moins une place"],
    },
    statut: {
      type: String,
      enum: ["confirmée", "annulée"],
      default: "confirmée",
    },
  },
  { timestamps: true }
);

// 🧠 MÉTHODES MÉTIER DANS LE MODÈLE

/**
 * Vérifie la disponibilité des places pour cette réservation
 * Implémente la règle métier : placesRestantes = salle.capacite - placesReservees
 */
reservationSchema.methods.validerDisponibilite = async function() {
  const Seance = mongoose.model("Seance");
  const Salle = mongoose.model("Salle");
  
  const seance = await Seance.findById(this.seance_id).populate('salle_id');
  if (!seance || seance.statut !== "à venir") {
    throw new Error("Séance non disponible");
  }

  // Calculer places déjà réservées
  const placesReservees = await mongoose.model("Reservation").aggregate([
    {
      $match: {
        seance_id: this.seance_id,
        statut: "confirmée"
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$nombrePlaces" }
      }
    }
  ]);

  const totalReserve = placesReservees[0]?.total || 0;
  const placesRestantes = seance.salle_id.capacite - totalReserve;

  return this.nombrePlaces <= placesRestantes;
};

/**
 * Vérifie s'il existe déjà une réservation confirmée pour ce user et cette séance
 * Implémente la règle : "Un user ne peut pas avoir 2 réservations confirmées pour même séance"
 */
reservationSchema.methods.verifierDoublon = async function() {
  const reservationExistante = await mongoose.model("Reservation").findOne({
    user_id: this.user_id,
    seance_id: this.seance_id,
    statut: "confirmée",
    _id: { $ne: this._id }
  });

  return !!reservationExistante;
};

/**
 * Annule la réservation (changement de statut)
 * Implémente la règle : "Annulation = changement statut (pas suppression)"
 */
reservationSchema.methods.annuler = function() {
  this.statut = "annulée";
  return this.save();
};

/**
 * Vérifie si la réservation peut être annulée
 * Implémente la règle : "Annulation possible si séance pas encore passée"
 */
reservationSchema.methods.peutEtreAnnulee = async function() {
  const Seance = mongoose.model("Seance");
  const seance = await Seance.findById(this.seance_id);
  
  if (!seance) return false;
  
  const maintenant = new Date();
  const dateSeance = new Date(seance.date);
  
  return dateSeance > maintenant;
};

// 🎯 HOOKS pour validation automatique
reservationSchema.pre("save", async function(next) {
  if (this.isNew || this.isModified('nombrePlaces') || this.isModified('seance_id')) {
    if (this.statut === "confirmée") {
      // Validation disponibilité
      const disponibilite = await this.validerDisponibilite();
      if (!disponibilite) {
        return next(new Error("Places insuffisantes pour cette séance"));
      }

      // Validation doublon
      const doublon = await this.verifierDoublon();
      if (doublon) {
        return next(new Error("Vous avez déjà une réservation confirmée pour cette séance"));
      }
    }
  }
  next();
});

// 📊 INDEX pour performance et intégrité des données
reservationSchema.index({ user_id: 1, seance_id: 1 }, { 
  unique: true, 
  partialFilterExpression: { statut: "confirmée" } 
});


module.exports=mongoose.model("Reservation", reservationSchema);
