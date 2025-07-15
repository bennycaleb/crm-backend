const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// POST /api/auth/login - Authentification utilisateur
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Récupérer l'utilisateur depuis la base de données
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ username: username });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Vérifier le rôle
    if (user.role !== role) {
      return res.status(401).json({ error: 'Rôle incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
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
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'authentification' });
  }
});

module.exports = router; 