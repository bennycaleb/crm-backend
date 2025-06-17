const express = require('express');
const router = express.Router();
const ShopifyOrder = require('../models/ShopifyOrder');
const axios = require('axios');
const glnet = require('./glnet');

// Route pour recevoir les commandes Shopify
router.post('/shopify/order', async (req, res) => {
  try {
    const orderData = req.body;
    const shopifyOrderId = orderData.id ? orderData.id.toString() : undefined;
    if (!shopifyOrderId) {
      return res.status(400).json({ error: 'ID de commande Shopify manquant' });
    }
    await ShopifyOrder.create({
      shopifyOrderId,
      data: orderData
    });
    console.log('Nouvelle commande Shopify enregistrée:', shopifyOrderId);
    res.status(201).json({ message: 'Commande Shopify enregistrée' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ message: 'Commande déjà enregistrée' });
    }
    console.error('Erreur enregistrement commande Shopify:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer toutes les commandes Shopify
router.get('/shopify/orders', async (req, res) => {
  try {
    console.log('Récupération des commandes Shopify...');
    const orders = await ShopifyOrder.find().sort({ dateReception: -1 });
    console.log(`${orders.length} commandes trouvées`);
    res.json(orders);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour envoyer à gl-net
router.post('/shopify/send-to-glnet/:orderId', async (req, res) => {
  console.log('\n=== DÉBUT DE L\'ENVOI À GLNET ===');
  console.log('Headers reçus:', req.headers);
  console.log('Body reçu:', req.body);
  console.log('OrderId reçu:', req.params.orderId);
  
  const { orderId } = req.params;
  const order = await ShopifyOrder.findOne({ shopifyOrderId: orderId });
  if (!order) {
    console.log('Commande non trouvée:', orderId);
    return res.status(404).json({ error: 'Commande introuvable' });
  }
  console.log('Commande trouvée dans MongoDB:', JSON.stringify(order, null, 2));

  // Mapping minimal conforme à la demande gl-net
  const shopify = order.data;
  const consignee = shopify.shipping_address || {};
  const firstItem = shopify.line_items && shopify.line_items[0] ? shopify.line_items[0] : {};
  const uniqueReference = `SHOPIFY-${orderId}-${Date.now()}`;
  const glnetPayload = {
    Shipping: {
      Account: "TEST",
      Reference: uniqueReference,
      TransitGatewayId: "CDG",
      Agent: "FR-NTUPS",
      ServiceCode: "ECO",
      COD: 0,
      OnLineCOD: 0,
      IOSS: "",
      Incoterm: "DDP",
      WeightUnit: "kg",
      DimensionUnit: "cm",
      Currency: shopify.currency || "EUR",
      OrderFulfillment: true,
      Warehouse: "CDG"
    },
    Consignee: {
      CompanyName: consignee.company || "",
      ContactName: consignee.name || shopify.customer?.first_name + ' ' + shopify.customer?.last_name || "Destinataire inconnu",
      Street: consignee.address1 || "Adresse inconnue",
      AddressLine2: consignee.address2 || "",
      AddressLine3: "",
      PostCode: consignee.zip || "00000",
      City: consignee.city || "Ville inconnue",
      State: "",
      Country: consignee.country_code || "FR",
      Email: shopify.email || "noemail@example.com",
      Phone: consignee.phone || "0000000000",
      SecondPhone: "",
      Eori: "",
      Notes: "",
      Reference1: "",
      Reference2: ""
    },
    Items: shopify.line_items?.map(item => ({
      Code: item.sku || "",
      Reference: "",
      Description: item.title || "Produit",
      GoodsOrigin: "",
      HSCode: "",
      Quantity: item.quantity || 1,
      Value: item.price ? parseFloat(item.price) : 0,
      Weight: item.grams ? item.grams / 1000 : 0.1,
      Dutiable: true
    })) || [
      {
        Code: "",
        Reference: "",
        Description: "Produit",
        GoodsOrigin: "",
        HSCode: "",
        Quantity: 1,
        Value: 0,
        Weight: 0.1,
        Dutiable: true
      }
    ]
  };

  console.log('Payload formaté pour glnet:', JSON.stringify(glnetPayload, null, 2));

  try {
    // Créer une nouvelle requête avec le payload
    const glnetReq = {
      ...req,
      body: glnetPayload
    };
    
    // Appeler directement la fonction sendToGlnet
    await glnet.sendToGlnet(glnetReq, res);
    console.log('=== FIN DE L\'ENVOI À GLNET ===\n');
  } catch (error) {
    console.error('Erreur lors de l\'appel à sendToGlnet:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi à glnet',
      details: error.message
    });
  }
});

module.exports = router; 