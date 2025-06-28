const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders - Récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// POST /api/orders - Créer une nouvelle commande
router.post('/', async (req, res) => {
  try {
    const { clientName, clientPhone, products, totalAmount, status = 'pending' } = req.body;
    
    const order = new Order({
      clientName,
      clientPhone,
      products,
      totalAmount,
      status
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// PUT /api/orders/:id - Mettre à jour le statut d'une commande
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json(order);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// POST /api/orders/:id/send-to-glnet - Envoyer une commande à gl-net
router.post('/:id/send-to-glnet', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la commande
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Simuler l'envoi à gl-net (ici vous pouvez intégrer l'API gl-net réelle)
    console.log('Envoi de la commande à gl-net:', {
      orderId: order._id,
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      products: order.products,
      totalAmount: order.totalAmount
    });

    // Mettre à jour le statut de la commande
    order.status = 'sent_to_glnet';
    order.sentToGlNetAt = new Date();
    await order.save();

    res.json({ 
      message: 'Commande envoyée à gl-net avec succès',
      order 
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi à gl-net:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// GET /api/orders/validated - Récupérer seulement les commandes validées
router.get('/validated', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'validated' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes validées:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router; 