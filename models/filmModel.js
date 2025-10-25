const mongoose=require("mongoose");

const filmSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre du film est obligatoire"],
      trim: true,
      minlength:[2,"le titre doit contenir au moin 2 caractères"],
    },
    duree: {
      type: Number,
      required: [true, "La durée du film est obligatoire"],
      min: [1, "La durée doit être d'au moins 1 minute"],
      max: [300,"La durée ne peut pas dépasser 300 minutes (5 heures)"],
    },
    genre: {
      type: String,
      enum: ["Action", "Comédie", "Drame", "Horreur", "Science-Fiction","Thriller", "Romance","Animation"],
      required: [true, "Le genre du film est obligatoire"],
    },
    affiche: {
      type: String,
      default: "default-poster.jpg",
      match: [/^https?:\/\/.+\..+/, "URL d'affiche invalide"],
    },
    description: {
      type: String,
      maxlength: [500, "La description ne doit pas dépasser 500 caractères"],
    },
  },
  { timestamps: true }
);

module.exports=mongoose.model("Film", filmSchema);
