const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders - Récupérer toutes les commandes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
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
    }

    // Créer la commande
    const orderData = {
      clientName: finalName,
      clientPhone: finalPhone,
      products: formattedProducts,
      totalAmount: parseFloat(total_amount) || 0,
      status: 'external_pending', // Statut spécial pour les commandes externes
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
    
    console.log('Commande externe sauvegardée:', savedOrder);
    
    res.status(201).json({
      success: true,
      message: 'Commande reçue et enregistrée avec succès',
      order_id: savedOrder._id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande externe:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la commande',
      details: error.message 
    });
  }
});

module.exports = router; 