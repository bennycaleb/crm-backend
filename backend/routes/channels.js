const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/channels - Récupérer tous les canaux
router.get('/', async (req, res) => {
  try {
    const channels = await Channel.find()
      .populate('assignedOperators.operatorId', 'nom prenom username email')
      .populate('assignedOperators.assignedBy', 'nom prenom username')
      .sort({ createdAt: 1 });
    
    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des canaux:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/channels/:id - Récupérer un canal spécifique
router.get('/:id', async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('assignedOperators.operatorId', 'nom prenom username email')
      .populate('assignedOperators.assignedBy', 'nom prenom username');
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: channel
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du canal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/channels - Créer un nouveau canal
router.post('/', async (req, res) => {
  try {
    const { name, productName, description } = req.body;
    
    if (!name || !productName) {
      return res.status(400).json({
        success: false,
        error: 'Nom et nom du produit requis'
      });
    }
    
    const channel = new Channel({
      name,
      productName,
      description: description || '',
      assignedOperators: [],
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0
      }
    });
    
    await channel.save();
    
    console.log('✅ Canal créé:', channel._id);
    
    res.status(201).json({
      success: true,
      message: 'Canal créé avec succès',
      data: channel
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du canal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/channels/:id - Mettre à jour un canal
router.put('/:id', async (req, res) => {
  try {
    const { name, productName, description, isActive } = req.body;
    
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }
    
    if (name) channel.name = name;
    if (productName) channel.productName = productName;
    if (description !== undefined) channel.description = description;
    if (isActive !== undefined) channel.isActive = isActive;
    
    await channel.save();
    
    res.json({
      success: true,
      message: 'Canal mis à jour avec succès',
      data: channel
    });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du canal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/channels/:id/assign-operator - Assigner un opérateur à un canal
router.post('/:id/assign-operator', async (req, res) => {
  try {
    const { operatorId, assignedBy } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({
        success: false,
        error: 'ID opérateur requis'
      });
    }
    
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }
    
    const operator = await User.findById(operatorId);
    if (!operator || operator.role !== 'operator') {
      return res.status(404).json({
        success: false,
        error: 'Opérateur non trouvé'
      });
    }
    
    // Vérifier si l'opérateur est déjà assigné
    const existingAssignment = channel.assignedOperators.find(
      op => op.operatorId.toString() === operatorId && op.isActive
    );
    
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Opérateur déjà assigné à ce canal'
      });
    }
    
    // Ajouter l'opérateur au canal
    channel.assignedOperators.push({
      operatorId,
      operatorName: `${operator.prenom || ''} ${operator.nom || ''}`.trim() || operator.username,
      assignedAt: new Date(),
      assignedBy: assignedBy || null,
      isActive: true
    });
    
    await channel.save();
    
    console.log(`✅ Opérateur ${operator.username} assigné au canal ${channel.name}`);
    
    res.json({
      success: true,
      message: 'Opérateur assigné avec succès',
      data: channel
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation de l\'opérateur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/channels/:id/remove-operator/:operatorId - Retirer un opérateur d'un canal
router.delete('/:id/remove-operator/:operatorId', async (req, res) => {
  try {
    const { id, operatorId } = req.params;
    
    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Canal non trouvé'
      });
    }
    
    // Désactiver l'assignation au lieu de la supprimer (pour garder l'historique)
    const assignment = channel.assignedOperators.find(
      op => op.operatorId.toString() === operatorId && op.isActive
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Opérateur non assigné à ce canal'
      });
    }
    
    assignment.isActive = false;
    await channel.save();
    
    console.log(`✅ Opérateur ${operatorId} retiré du canal ${channel.name}`);
    
    res.json({
      success: true,
      message: 'Opérateur retiré avec succès',
      data: channel
    });
  } catch (error) {
    console.error('❌ Erreur lors du retrait de l\'opérateur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/channels/:id/orders - Récupérer les commandes d'un canal
router.get('/:id/orders', async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {
      assignedChannel: req.params.id
    };
    
    if (status) {
      filter.status = status;
    }
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des commandes du canal:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/channels/operator/:operatorId - Récupérer les canaux d'un opérateur
router.get('/operator/:operatorId', async (req, res) => {
  try {
    const channels = await Channel.find({
      'assignedOperators.operatorId': req.params.operatorId,
      'assignedOperators.isActive': true,
      isActive: true
    })
      .populate('assignedOperators.operatorId', 'nom prenom username email');
    
    res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des canaux de l\'opérateur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/channels/operator/:operatorId/orders - Récupérer les commandes d'un opérateur depuis ses canaux
router.get('/operator/:operatorId/orders', async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log(`🔍 Recherche des leads pour opérateur: ${req.params.operatorId}`);
    
    // Récupérer les canaux de l'opérateur
    const channels = await Channel.find({
      'assignedOperators.operatorId': req.params.operatorId,
      'assignedOperators.isActive': true,
      isActive: true
    });
    
    console.log(`📊 Canaux trouvés pour l'opérateur: ${channels.length}`, channels.map(c => ({ name: c.name, id: c._id })));
    
    const channelIds = channels.map(ch => ch._id);
    
    if (channelIds.length === 0) {
      console.log(`⚠️ Aucun canal assigné à l'opérateur ${req.params.operatorId}`);
      return res.json({
        success: true,
        data: [],
        total: 0,
        message: 'Aucun canal assigné à cet opérateur'
      });
    }
    
    const filter = {
      assignedChannel: { $in: channelIds }
    };
    
    if (status) {
      filter.status = status;
    }
    
    console.log(`🔍 Filtre de recherche:`, filter);
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log(`✅ Commandes trouvées: ${orders.length}`);
    
    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des commandes de l\'opérateur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/channels/debug/:operatorId - Route de diagnostic pour vérifier l'état
router.get('/debug/:operatorId', async (req, res) => {
  try {
    const operatorId = req.params.operatorId;
    
    // 1. Vérifier l'opérateur
    const operator = await User.findById(operatorId);
    if (!operator) {
      return res.json({
        success: false,
        error: 'Opérateur non trouvé',
        operatorId
      });
    }
    
    // 2. Vérifier les canaux de l'opérateur
    const channels = await Channel.find({
      'assignedOperators.operatorId': operatorId,
      'assignedOperators.isActive': true,
      isActive: true
    });
    
    const channelIds = channels.map(ch => ch._id);
    
    // 3. Vérifier les commandes avec assignedChannel
    const ordersWithChannel = await Order.find({
      assignedChannel: { $in: channelIds },
      status: 'external_pending'
    });
    
    // 4. Vérifier toutes les commandes external_pending (pour voir celles sans canal)
    const allExternalPending = await Order.find({
      status: 'external_pending'
    });
    
    // 5. Vérifier les commandes sans canal
    const ordersWithoutChannel = await Order.find({
      status: 'external_pending',
      assignedChannel: null
    });
    
    res.json({
      success: true,
      debug: {
        operator: {
          id: operator._id,
          username: operator.username,
          role: operator.role
        },
        channels: {
          total: channels.length,
          channels: channels.map(ch => ({
            id: ch._id,
            name: ch.name,
            productName: ch.productName,
            isActive: ch.isActive,
            assignedOperators: ch.assignedOperators.filter(op => op.isActive).length
          }))
        },
        orders: {
          totalExternalPending: allExternalPending.length,
          withChannel: ordersWithChannel.length,
          withoutChannel: ordersWithoutChannel.length,
          ordersWithChannel: ordersWithChannel.map(o => ({
            id: o._id,
            clientName: o.clientName,
            clientPhone: o.clientPhone,
            assignedChannel: o.assignedChannel,
            source: o.channel
          })),
          ordersWithoutChannel: ordersWithoutChannel.map(o => ({
            id: o._id,
            clientName: o.clientName,
            clientPhone: o.clientPhone,
            source: o.channel
          }))
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

