const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

// POST /api/auth/login - Authentification utilisateur
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const userLogin = typeof username === 'string' ? username.trim() : '';

    if (!userLogin || !password || !role) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      console.error('Auth: MongoDB non connectée (readyState=', mongoose.connection.readyState, ')');
      return res.status(503).json({
        error: 'Service indisponible : base de données non connectée. Vérifiez MONGODB_URI sur le serveur.'
      });
    }

    const user = await User.findOne({ username: userLogin }).lean();

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le rôle
    if (user.role !== role) {
      return res.status(401).json({ error: 'Rôle incorrect' });
    }

    // Vérifier le mot de passe (hash bcrypt attendu ; sinon compare peut lever une exception)
    if (user.password == null || typeof user.password !== 'string') {
      console.error('Auth: utilisateur sans mot de passe hashé en base:', userLogin);
      return res.status(500).json({ error: 'Compte utilisateur invalide côté serveur' });
    }
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (e) {
      console.error('Auth: erreur bcrypt pour', userLogin, e.message);
      return res.status(500).json({
        error: 'Erreur serveur lors de l\'authentification (mot de passe: format invalide en base)'
      });
    }
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    // Connexion réussie
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom
      }
    });

  } catch (error) {
    console.error('Erreur d\'authentification:', error && error.message, error && error.stack);
    res.status(500).json({ error: 'Erreur serveur lors de l\'authentification' });
  }
});

module.exports = router; 