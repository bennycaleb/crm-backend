const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Route pour récupérer toutes les commandes
router.get('/orders', async (req, res) => {
  try {
    console.log('Récupération des commandes...');
    const orders = await Order.find().sort({ dateCreation: -1 });
    console.log(`${orders.length} commandes trouvées`);
    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// Route pour créer une nouvelle commande
router.post('/orders', async (req, res) => {
  try {
    console.log('Création d\'une nouvelle commande:', req.body);
    
    // Vérifier si l'ID existe déjà
    const existingOrder = await Order.findOne({ id: req.body.id });
    if (existingOrder) {
      return res.status(400).json({ error: 'Une commande avec cet ID existe déjà' });
    }

    const order = new Order(req.body);
    const savedOrder = await order.save();
    
    console.log('Commande créée avec succès:', savedOrder.id);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// Route pour mettre à jour une commande
router.put('/orders/:id', async (req, res) => {
  try {
    console.log('Mise à jour de la commande:', req.params.id);
    
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    console.log('Commande mise à jour avec succès');
    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

// Route pour supprimer une commande
router.delete('/orders/:id', async (req, res) => {
  try {
    console.log('Suppression de la commande:', req.params.id);
    
    const order = await Order.findOneAndDelete({ id: req.params.id });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    console.log('Commande supprimée avec succès');
    res.json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la commande:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message
    });
  }
});

module.exports = router; 