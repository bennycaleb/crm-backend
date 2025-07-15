const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// GET /api/users - Liste tous les utilisateurs
router.get('/', async (req, res) => {
  try {
    // Utiliser directement la collection MongoDB pour récupérer tous les utilisateurs
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    // Ne pas renvoyer les mots de passe
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      // S'assurer que currentCall est bien inclus
      userWithoutPassword.currentCall = user.currentCall || null;
      return userWithoutPassword;
    });
    
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// (Optionnel) PATCH /api/users/:id - Modifier le rôle ou l'état d'un utilisateur
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const user = await User.findByIdAndUpdate(id, update, { new: true, fields: '-password' });
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Réinitialiser le mot de passe d'un utilisateur
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'Nouveau mot de passe requis' });
    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await User.findByIdAndUpdate(id, { password: hashed }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Mettre à jour le champ currentCall d'un utilisateur (opérateur)
router.post('/:id/current-call', async (req, res) => {
  try {
    const { id } = req.params;
    const { client, phone } = req.body;
    const updated = await User.findByIdAndUpdate(id, { currentCall: client ? { client, phone } : null }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ message: 'currentCall mis à jour' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router; 