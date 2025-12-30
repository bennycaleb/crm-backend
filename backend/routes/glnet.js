const express = require('express');
const router = express.Router();
const axios = require('axios');

// Fonction pour envoyer à gl-net
const sendToGlnet = async (req, res) => {
  try {
    const order = req.body;
    console.log('\n=== ENVOI À GL-NET ===');
    console.log('gl-net: Données reçues:', JSON.stringify(order, null, 2));
    
    // Vérifier que l'URL et la clé API sont configurées
    if (!process.env.GLNET_API_URL) {
      throw new Error('GLNET_API_URL n\'est pas configurée dans les variables d\'environnement');
    }
    if (!process.env.GLNET_API_KEY) {
      throw new Error('GLNET_API_KEY n\'est pas configurée dans les variables d\'environnement');
    }
    
    // Utiliser directement le payload reçu
    const payload = order;
    console.log('gl-net: Payload formaté:', JSON.stringify(payload, null, 2));
    console.log('gl-net: URL utilisée:', process.env.GLNET_API_URL);
    console.log('gl-net: API Key configurée:', process.env.GLNET_API_KEY ? 'Oui (masquée)' : 'Non');
    console.log('gl-net: Headers envoyés:', JSON.stringify({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apiKey': process.env.GLNET_API_KEY ? '***' : 'MANQUANTE'
    }, null, 2));
    console.log('gl-net: Envoi à l\'API...');

    try {
      // Essayer différents formats de headers selon la documentation gl-net
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Ajouter la clé API - essayer plusieurs formats possibles
      if (process.env.GLNET_API_KEY) {
        // Format 1: apiKey dans les headers (comme dans l'email)
        headers['apiKey'] = process.env.GLNET_API_KEY;
        // Format 2: Authorization Bearer (alternative)
        // headers['Authorization'] = `Bearer ${process.env.GLNET_API_KEY}`;
        // Format 3: X-API-Key (alternative)
        // headers['X-API-Key'] = process.env.GLNET_API_KEY;
      }
      
      console.log('gl-net: Headers finaux:', JSON.stringify(headers, null, 2));
      console.log('gl-net: URL complète:', process.env.GLNET_API_URL);
      
      const response = await axios({
        method: 'POST',
        url: process.env.GLNET_API_URL,
        data: payload,
        headers: headers,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accepte tous les statuts entre 200 et 499
        },
        timeout: 30000 // 30 secondes de timeout
      });

      console.log('gl-net: Status de la réponse:', response.status);
      console.log('gl-net: Headers de la réponse:', JSON.stringify(response.headers, null, 2));
      console.log('gl-net: Réponse reçue:', JSON.stringify(response.data, null, 2));

      if (response.status === 405) {
        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          url: process.env.GLNET_API_URL,
          method: 'POST'
        };
        console.error('gl-net: Erreur 405 - Détails complets:', JSON.stringify(errorDetails, null, 2));
        throw new Error(`Méthode HTTP non autorisée (405). URL: ${process.env.GLNET_API_URL}. Vérifiez la documentation de l'API gl-net ou le Swagger UI.`);
      }

      if (response.status >= 400) {
        console.error('gl-net: Erreur dans la réponse:', response.status, response.data);
        throw new Error(`Erreur gl-net (${response.status}): ${JSON.stringify(response.data)}`);
      }

      console.log('=== ENVOI RÉUSSI ===\n');
      res.json({ 
        message: `Commande ${order.Shipping?.Reference || 'inconnue'} envoyée à gl-net avec succès`,
        glnetResponse: response.data
      });
    } catch (apiError) {
      console.error('gl-net: Erreur API détaillée:');
      console.error('- Message:', apiError.message);
      console.error('- Code:', apiError.code);
      console.error('- Status:', apiError.response?.status);
      console.error('- Data:', apiError.response?.data);
      console.error('- Headers:', apiError.response?.headers);
      console.error('=== FIN ERREUR ===\n');
      throw apiError;
    }
  } catch (error) {
    console.error('gl-net: Erreur détaillée:', error);
    
    // Message d'erreur plus explicite
    let errorMessage = error.message;
    let errorDetails = error.message;
    
    if (error.message.includes('GLNET_API_URL') || error.message.includes('GLNET_API_KEY')) {
      errorMessage = 'Configuration gl-net manquante. Veuillez configurer GLNET_API_URL et GLNET_API_KEY dans les variables d\'environnement.';
      errorDetails = error.message;
    } else if (error.response?.data) {
      errorMessage = error.response.data.message || JSON.stringify(error.response.data);
      errorDetails = error.response.data;
    }
    
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de l\'envoi à gl-net',
      error: errorMessage,
      details: errorDetails,
      hint: error.message.includes('GLNET_API') 
        ? 'Configurez les variables d\'environnement GLNET_API_URL et GLNET_API_KEY sur Render' 
        : undefined
    });
  }
};

// Routes
router.post('/ship', sendToGlnet);
router.post('/send-to-glnet/:orderId', sendToGlnet);

// Exporter le router et la fonction
module.exports = router;
module.exports.sendToGlnet = sendToGlnet; 