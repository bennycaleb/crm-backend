const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Channel = require('../models/Channel');

// GET /api/orders - Récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log('=== DEBUG BACKEND ===');
    console.log('Nombre de commandes trouvées:', orders.length);
    console.log('Commandes brutes:', orders.map(o => ({ 
      id: o._id, 
      status: o.status, 
      clientName: o.clientName,
      clientPhone: o.clientPhone 
    })));
    
    // Mapping pour compatibilité frontend
    const mappedOrders = orders.map(order => {
      // Découper le nom complet si possible
      let nom = '', prenom = '';
      if (order.clientName) {
        const parts = order.clientName.split(' ');
        nom = parts[0] || '';
        prenom = parts.slice(1).join(' ') || '';
      }
      return {
        id: order._id,
        nom,
        prenom,
        phone: order.clientPhone,
        email: order.email || '',
        adresse: order.address || '',
        produit: order.products && order.products[0] ? order.products[0].name : '',
        quantite: order.products && order.products[0] ? order.products[0].quantity : 1,
        prix: order.products && order.products[0] ? order.products[0].price : order.totalAmount,
        statut: order.status,
        date: order.deliveryDate || (order.createdAt ? order.createdAt.toISOString().split('T')[0] : ''),
        logistique: order.logistics || false,
        historique: order.history || [],
        payment_status: 'paid',
        // Champs backend natifs pour compatibilité admin
        ...order.toObject()
      };
    });
    
    console.log('Commandes mappées:', mappedOrders.map(o => ({ 
      id: o.id, 
      statut: o.statut, 
      status: o.status, 
      nom: o.nom,
      phone: o.phone 
    })));
    console.log('=== FIN DEBUG BACKEND ===');
    
    res.json(mappedOrders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// POST /api/orders - Créer une nouvelle commande
router.post('/', async (req, res) => {
  try {
    console.log('Données reçues (détail):', JSON.stringify(req.body, null, 2));
    
    // Accepter les deux formats (nouveau et ancien)
    const {
      // Format nouveau
      clientName, clientPhone, products, totalAmount,
      // Format ancien (frontend actuel)
      nom, prenom, phone, adresse, produit, quantite, prix, statut, date,
      // Autres champs
      id, operateur, canal, historique, logistique
    } = req.body;
    
    // Construire l'objet commande selon le format reçu
    let orderData = {};
    
    if (clientName && clientPhone) {
      // Format nouveau
      orderData = {
        clientName,
        clientPhone,
        products: products || [],
        totalAmount: totalAmount || 0,
        status: statut || 'pending'
      };
    } else if (nom && phone) {
      // Format ancien (frontend actuel)
      orderData = {
        clientName: `${nom} ${prenom || ''}`.trim(),
        clientPhone: phone,
        products: [{
          name: produit || '',
          quantity: parseInt(quantite) || 1,
          price: parseFloat(prix) || 0
        }],
        totalAmount: parseFloat(prix) || 0,
        status: statut || 'pending',
        // Garder les champs supplémentaires
        address: adresse,
        deliveryDate: date,
        operator: operateur,
        channel: canal,
        history: historique || [],
        logistics: logistique || false
        // Ne pas inclure orderId pour éviter l'erreur de clé dupliquée
      };
    } else {
      return res.status(400).json({ error: 'Données manquantes: nom/prénom et téléphone requis' });
    }

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    console.log('Commande sauvegardée:', savedOrder);
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
    const { 
      status, 
      leadStatus, 
      leadNotes, 
      assignedOperator, 
      lastCallAttempt,
      history 
    } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (leadStatus !== undefined) updateData.leadStatus = leadStatus;
    if (leadNotes !== undefined) updateData.leadNotes = leadNotes;
    if (assignedOperator !== undefined) updateData.assignedOperator = assignedOperator;
    if (lastCallAttempt !== undefined) updateData.lastCallAttempt = lastCallAttempt ? new Date(lastCallAttempt) : null;
    if (history && Array.isArray(history)) {
      // Ajouter les nouvelles entrées d'historique
      const order = await Order.findById(id);
      if (order) {
        updateData.history = [...(order.history || []), ...history];
      }
    }

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('assignedChannel', 'name productName').populate('assignedOperator', 'username prenom nom');

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

// POST /api/orders/external - Route pour les développeurs externes
router.post('/external', async (req, res) => {
  try {
    console.log('=== COMMANDE EXTERNE REÇUE ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const {
      // Format standard
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      products,
      total_amount,
      order_id,
      source = 'external',
      // Format alternatif pour compatibilité (sweetbodyshop.fr)
      name,
      phone_number,
      email,
      product
    } = req.body;

    // Déterminer les valeurs à utiliser (priorité au format standard)
    const finalName = customer_name || name;
    const finalPhone = customer_phone || phone_number;
    const finalEmail = customer_email || email;

    // Validation des champs requis
    if (!finalName || !finalPhone) {
      return res.status(400).json({ 
        error: 'Champs requis manquants',
        required: ['customer_name/name', 'customer_phone/phone_number'],
        received: { 
          customer_name: finalName, 
          customer_phone: finalPhone,
          original_data: req.body
        }
      });
    }

    // Formatage des produits
    let formattedProducts = [];
    if (Array.isArray(products)) {
      formattedProducts = products.map(product => ({
        name: product.name || product.title || 'Produit',
        quantity: parseInt(product.quantity) || 1,
        price: parseFloat(product.price) || 0
      }));
    } else if (products) {
      // Format simple avec un seul produit
      formattedProducts = [{
        name: products.name || products.title || 'Produit',
        quantity: parseInt(products.quantity) || 1,
        price: parseFloat(products.price) || 0
      }];
    } else if (product) {
      // Format simple avec juste le nom du produit
      formattedProducts = [{
        name: product,
        quantity: 1,
        price: 0
      }];
    } else {
      // Si aucun produit n'est fourni, créer un produit par défaut pour les commandes de landing page
      formattedProducts = [{
        name: 'Demande de contact - Landing Page',
        quantity: 1,
        price: 0
      }];
    }

    // Créer la commande
    const orderData = {
      clientName: finalName,
      clientPhone: finalPhone,
      email: finalEmail || '',
      products: formattedProducts,
      totalAmount: parseFloat(total_amount) || 0,
      status: 'external_pending', // Statut spécial pour les commandes externes - v2
      address: customer_address || '',
      deliveryDate: new Date().toISOString().split('T')[0],
      operator: '',
      channel: source,
      history: [{
        date: new Date().toISOString().split('T')[0],
        action: `Importée depuis ${source}`,
        utilisateur: 'API Externe'
      }],
      logistics: false,
      orderId: order_id || `EXT-${Date.now()}`
    };

    const order = new Order(orderData);
    const savedOrder = await order.save();
    
    // Assigner automatiquement la commande au canal correspondant
    // Méthode 1: Chercher par source (ex: landing-page-mrbigcream -> MR BIG)
    let matchingChannel = null;
    
    if (source && source.includes('landing-page-')) {
      // Extraire le nom du produit depuis le source (ex: landing-page-mrbigcream -> mrbigcream)
      const sourceProduct = source.replace('landing-page-', '').replace(/-/g, ' ');
      
      // Normaliser pour la recherche (enlever les espaces, mettre en minuscules)
      const normalizedSource = sourceProduct.replace(/\s+/g, '').toLowerCase();
      
      // Chercher tous les canaux actifs
      const allChannels = await Channel.find({ isActive: true });
      
      // Chercher le canal dont le nom ou productName correspond (insensible à la casse)
      for (const channel of allChannels) {
        const normalizedChannelName = channel.name.replace(/\s+/g, '').toLowerCase();
        const normalizedProductName = channel.productName.replace(/\s+/g, '').toLowerCase();
        
        if (normalizedChannelName.includes(normalizedSource) || 
            normalizedProductName.includes(normalizedSource) ||
            normalizedSource.includes(normalizedChannelName) ||
            normalizedSource.includes(normalizedProductName)) {
          matchingChannel = channel;
          console.log(`✅ Canal trouvé par source: ${source} -> ${channel.name}`);
          break;
        }
      }
    }
    
    // Méthode 2: Si pas trouvé par source, chercher par nom du produit
    if (!matchingChannel && formattedProducts.length > 0) {
      const productName = formattedProducts[0].name;
      
      // Chercher le canal correspondant au produit
      matchingChannel = await Channel.findOne({
        $or: [
          { productName: { $regex: productName, $options: 'i' } },
          { name: { $regex: productName, $options: 'i' } }
        ],
        isActive: true
      });
      
      if (matchingChannel) {
        console.log(`✅ Canal trouvé par produit: ${productName} -> ${matchingChannel.name}`);
      }
    }
    
    // Assigner le canal si trouvé
    if (matchingChannel) {
      savedOrder.assignedChannel = matchingChannel._id;
      await savedOrder.save();
      
      // Mettre à jour les statistiques du canal
      matchingChannel.stats.totalOrders += 1;
      matchingChannel.stats.pendingOrders += 1;
      await matchingChannel.save();
      
      console.log(`✅ Commande ${savedOrder._id} assignée au canal: ${matchingChannel.name}`);
    } else {
      console.log(`⚠️ Aucun canal trouvé pour source: ${source}, produit: ${formattedProducts[0]?.name || 'N/A'}`);
      console.log(`🔍 Canaux disponibles:`, await Channel.find({ isActive: true }).select('name productName'));
    }
    
    console.log('Commande externe sauvegardée:', savedOrder);
    
    res.status(201).json({
      success: true,
      message: 'Commande reçue et enregistrée avec succès',
      order_id: savedOrder._id,
      status: 'pending',
      channel: savedOrder.assignedChannel || null
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande externe:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la commande',
      details: error.message 
    });
  }
});

// POST /api/orders/reassign-channels - Réassigner les commandes existantes aux canaux
router.post('/reassign-channels', async (req, res) => {
  try {
    // Récupérer toutes les commandes externes sans canal assigné
    const ordersWithoutChannel = await Order.find({
      status: 'external_pending',
      assignedChannel: null
    });

    let reassigned = 0;
    let notFound = 0;

    for (const order of ordersWithoutChannel) {
      let matchingChannel = null;
      const source = order.channel || '';

      // Chercher par source
      if (source && source.includes('landing-page-')) {
        const sourceProduct = source.replace('landing-page-', '').replace(/-/g, ' ');
        const normalizedSource = sourceProduct.replace(/\s+/g, '').toLowerCase();

        const allChannels = await Channel.find({ isActive: true });
        
        for (const channel of allChannels) {
          const normalizedChannelName = channel.name.replace(/\s+/g, '').toLowerCase();
          const normalizedProductName = channel.productName.replace(/\s+/g, '').toLowerCase();

          if (normalizedChannelName.includes(normalizedSource) || 
              normalizedProductName.includes(normalizedSource) ||
              normalizedSource.includes(normalizedChannelName) ||
              normalizedSource.includes(normalizedProductName)) {
            matchingChannel = channel;
            break;
          }
        }
      }

      // Si trouvé, assigner
      if (matchingChannel) {
        order.assignedChannel = matchingChannel._id;
        await order.save();

        matchingChannel.stats.totalOrders += 1;
        matchingChannel.stats.pendingOrders += 1;
        await matchingChannel.save();

        reassigned++;
        console.log(`✅ Commande ${order._id} réassignée au canal: ${matchingChannel.name}`);
      } else {
        notFound++;
        console.log(`⚠️ Aucun canal trouvé pour commande ${order._id}, source: ${source}`);
      }
    }

    res.json({
      success: true,
      message: `Réassignation terminée`,
      reassigned,
      notFound,
      total: ordersWithoutChannel.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la réassignation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/orders/:id - Supprimer une commande
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== SUPPRESSION COMMANDE ===');
    console.log('ID à supprimer:', req.params.id);
    
    const { id } = req.params;
    
    // Rechercher et supprimer la commande
    const deletedOrder = await Order.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      console.log('Commande non trouvée pour suppression');
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    console.log('Commande supprimée avec succès:', deletedOrder._id);
    res.json({ 
      success: true, 
      message: 'Commande supprimée avec succès',
      deletedOrder 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la commande:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression',
      details: error.message 
    });
  }
});

module.exports = router; 