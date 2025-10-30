// server.js
const cors=require("cors");
const express = require("express");
const app = express();
require("dotenv").config();
const connectDB = require("./config/db");
const cron = require("node-cron");
const moment = require("moment");
const Seance = require("./models/seanceModel");

// Middlewares
app.use(express.json());

app.use(cors());

// Connexion DB
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/films", require("./routes/filmRoutes"));
app.use("/api/salles", require("./routes/salleRoutes"));
app.use("/api/seances", require("./routes/seanceRoutes"));
app.use("/api/reservations", require("./routes/reservationRoutes"));
app.use('/api/stats', require('./routes/statsRoutes'));

// Route de test
app.get("/", (req, res) => {
  res.send("Bienvenue dans le backend du système de cinéma 🎬🎬🎬");
});
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée ❌" });
});

// 🚀 Tâche planifiée (cron job)
cron.schedule("*/5 * * * *", async () => {
  console.log("⏰ Vérification automatique des séances...");

  try {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // ✅ Mise à jour directe sans passer par le save() qui déclenche la validation
    const result = await Seance.updateMany(
      {
        $or: [
          // Séances avec date passée
          { date: { $lt: today } },
          // Séances d'aujourd'hui avec heure passée
          {
            date: today,
            heure: { $lt: now.toTimeString().slice(0, 5) } // Format HH:mm
          }
        ],
        statut: { $ne: "terminée" }
      },
      { $set: { statut: "terminée" } }
    );

    console.log(`✅ ${result.modifiedCount} séances mises à jour (terminées)`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des statuts :", error.message);
  }
});


// Lancement serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));