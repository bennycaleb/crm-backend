const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/users - retourne tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs' });
  }
});

// POST /api/users/:id/current-call - Met à jour le currentCallClient d'un utilisateur
router.post('/users/:id/current-call', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentCallClient } = req.body;
    const user = await User.findByIdAndUpdate(
      id,
      { currentCallClient },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du current call' });
  }
});

// DELETE /api/users/:id - Supprime un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'utilisateur" });
  }
});

// POST /api/users/:id/reset-password - Réinitialise le mot de passe d'un utilisateur
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ error: 'Nouveau mot de passe requis' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la réinitialisation du mot de passe' });
  }
});

module.exports = router; 