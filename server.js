// server.js
const cors=require("cors");
const express = require("express");
const app = express();
require("dotenv").config();
const connectDB = require("./config/db");

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
  res.send("Bienvenue dans le backend du système de cinéma 🎬");
});
app.use((req, res) => {
  res.status(404).json({ message: "Route non trouvée ❌" });
});
  /*res.json({ message: "API Cinema Management - Backend fonctionnel" });*/

// Lancement serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));