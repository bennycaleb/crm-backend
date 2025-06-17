const express = require('express');
const router = express.Router();
const axios = require('axios');

// Fonction pour envoyer à gl-net
const sendToGlnet = async (req, res) => {
  try {
    const order = req.body;
    console.log('gl-net: Données reçues:', JSON.stringify(order, null, 2));
    
    // Utiliser directement le payload reçu
    const payload = order;
    console.log('gl-net: Payload formaté:', JSON.stringify(payload, null, 2));
    console.log('gl-net: URL utilisée:', 'https://traxis.app/external/api/shipments/booking');
    console.log('gl-net: Headers envoyés:', JSON.stringify({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apiKey': '167ff33ef0f14631924a213281a6b217'
    }, null, 2));
    console.log('gl-net: Envoi à l\'API...');

    try {
      const response = await axios({
        method: 'POST',
        url: 'https://traxis.app/external/api/shipments/booking',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apiKey': '167ff33ef0f14631924a213281a6b217'
        },
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accepte tous les statuts entre 200 et 499
        }
      });

      console.log('gl-net: Status de la réponse:', response.status);
      console.log('gl-net: Headers de la réponse:', response.headers);
      console.log('gl-net: Réponse reçue:', JSON.stringify(response.data, null, 2));

      if (response.status === 405) {
        throw new Error('Méthode HTTP non autorisée. Vérifiez la documentation de l\'API gl-net.');
      }

      res.json({ 
        message: `Commande ${order.Shipping?.Reference || 'inconnue'} envoyée à gl-net avec succès`,
        glnetResponse: response.data
      });
    } catch (apiError) {
      console.error('gl-net: Erreur API:', apiError.response ? apiError.response.data : apiError.message);
      throw apiError;
    }
  } catch (error) {
    console.error('gl-net: Erreur détaillée:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi à gl-net',
      error: error.response ? error.response.data : error.message
    });
  }
};

// Routes
router.post('/ship', sendToGlnet);
router.post('/send-to-glnet/:orderId', sendToGlnet);

// Exporter le router et la fonction
module.exports = router;
module.exports.sendToGlnet = sendToGlnet; 