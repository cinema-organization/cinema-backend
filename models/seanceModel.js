const mongoose= require("mongoose");
const Film = require("./filmModel");

const seanceSchema = new mongoose.Schema(
  {
    film_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Film",
      required: true,
    },
    salle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salle",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "La date de la séance est obligatoire"],
      validate: {
        validator: function (value) {
          return value >= new Date();
        },
        message: "La date doit être postérieure ou égale à aujourd'hui",
      },
    },
    heure: {
      type: String,
      required: [true, "L'heure de la séance est obligatoire"],
      match: [/^([0-1]\d|2[0-3]):([0-5]\d)$/, "Format d'heure invalide (ex: 18:30)"],
    },
    statut: {
      type: String,
      enum: ["à venir", "terminée"],
      default: "à venir",
    },
  },
  { timestamps: true }
);

//
// 🧠 Méthodes métier
//

// Calculer automatiquement le statut
seanceSchema.methods.calculerStatut = function () {
  const maintenant = new Date();
  const [h, m] = this.heure.split(":").map(Number);
  const debut = new Date(this.date);
  debut.setHours(h, m);

  if (debut > maintenant) this.statut = "à venir";
  else this.statut = "terminée";
};

// Vérifier chevauchement de séance dans la même salle
seanceSchema.methods.verifierChevauchement = async function () {
  const film = await Film.findById(this.film_id);
  const dureeFilm = film ? film.duree : 0;

  const [h, m] = this.heure.split(":").map(Number);
  const debut = new Date(this.date);
  debut.setHours(h, m);
  const fin = new Date(debut.getTime() + dureeFilm * 60000);

  const seancesExistantes = await mongoose.model("Seance").find({
    salle_id: this.salle_id,
    date: this.date,
    _id: { $ne: this._id },
  }).populate("film_id");

  for (let s of seancesExistantes) {
    const [h2, m2] = s.heure.split(":").map(Number);
    const debut2 = new Date(s.date);
    debut2.setHours(h2, m2);
    const fin2 = new Date(debut2.getTime() + s.film_id.duree * 60000);

    const chevauchement = debut < fin2 && fin > debut2;
    if (chevauchement) return true;
  }

  return false;
};

// Avant sauvegarde : mettre à jour statut et vérifier chevauchement
seanceSchema.pre("save", async function (next) {
  this.calculerStatut();

  const chevauchement = await this.verifierChevauchement();
  if (chevauchement) {
    return next(new Error("Chevauchement détecté avec une autre séance dans cette salle."));
  }

  next();
});


module.exports=mongoose.model("Seance", seanceSchema);
