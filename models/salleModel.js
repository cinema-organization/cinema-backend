const mongoose=require("mongoose");

const salleSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la salle est obligatoire"],
      unique: true,
      trim: true,
    },
    capacite: {
      type: Number,
      required: [true, "La capacité de la salle est obligatoire"],
      min: [10, "la capacité ne doit pas être moin de 10 places"],
      max: [500,"la capacité ne doit pas être superieure à 500 places "],
    },
  },
  { timestamps: true }
);

module.exports=mongoose.model("Salle", salleSchema);
