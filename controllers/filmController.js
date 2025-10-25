// controllers/filmController.js
const Film = require("../models/filmModel");
const Seance = require("../models/seanceModel");

// GET /api/films - Liste tous les films (PUBLIC)
exports.getAllFilms = async (req, res) => {
  try {
    const films = await Film.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: films.length,
      data: films
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// GET /api/films/:id - Détails d'un film (PUBLIC)
exports.getFilmById = async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    
    if (!film) {
      return res.status(404).json({ 
        success: false, 
        message: "Film introuvable" 
      });
    }

    // Récupérer les séances à venir pour ce film
    const seances = await Seance.find({ 
      film_id: req.params.id,
      statut: "à venir"
    })
    .populate("salle_id")
    .sort({ date: 1, heure: 1 });

    res.json({
      success: true,
      data: {
        film,
        seances
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// POST /api/films - Créer un film (ADMIN)
exports.createFilm = async (req, res) => {
  try {
    const { titre, duree, genre, affiche, description } = req.body;

    // Vérifier si le titre existe déjà
    const existant = await Film.findOne({ titre });
    if (existant) {
      return res.status(400).json({ 
        success: false, 
        message: "Un film avec ce titre existe déjà" 
      });
    }

    const film = await Film.create({
      titre,
      duree,
      genre,
      affiche,
      description
    });

    res.status(201).json({
      success: true,
      message: "Film créé avec succès",
      data: film
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// PUT /api/films/:id - Modifier un film (ADMIN)
exports.updateFilm = async (req, res) => {
  try {
    const { titre, duree, genre, affiche, description } = req.body;

    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ 
        success: false, 
        message: "Film introuvable" 
      });
    }

    // Vérifier si le nouveau titre existe déjà (sauf pour ce film)
    if (titre && titre !== film.titre) {
      const existant = await Film.findOne({ titre });
      if (existant) {
        return res.status(400).json({ 
          success: false, 
          message: "Un film avec ce titre existe déjà" 
        });
      }
    }

    const filmMisAJour = await Film.findByIdAndUpdate(
      req.params.id,
      { titre, duree, genre, affiche, description },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Film modifié avec succès",
      data: filmMisAJour
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// DELETE /api/films/:id - Supprimer un film (ADMIN)
exports.deleteFilm = async (req, res) => {
  try {
    const film = await Film.findById(req.params.id);
    if (!film) {
      return res.status(404).json({ 
        success: false, 
        message: "Film introuvable" 
      });
    }

    // Vérifier si le film a des séances à venir
    const seancesFutures = await Seance.findOne({
      film_id: req.params.id,
      statut: "à venir"
    });

    if (seancesFutures) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer ce film. Il a des séances à venir."
      });
    }

    await Film.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Film supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};