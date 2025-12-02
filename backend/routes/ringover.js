 const express = require('express');
const router = express.Router();
const RingoverCall = require('../models/RingoverCall');
const Order = require('../models/Order');
const User = require('../models/User');

// Middleware pour vérifier la clé webhook Ringover
const verifyWebhookKey = (req, res, next) => {
  const webhookKey = req.headers.authorization;
  const expectedKey = process.env.RINGOVER_WEBHOOK_KEY;
  
  if (!expectedKey) {
    console.warn('⚠️ RINGOVER_WEBHOOK_KEY non configurée dans les variables d\'environnement');
    // En développement, on peut autoriser sans clé
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
  }
  
  if (webhookKey && webhookKey === expectedKey) {
    return next();
  }
  
  console.warn('⚠️ Clé webhook Ringover invalide ou manquante');
  // Ringover ignore les codes d'erreur, donc on retourne 200 même en cas d'erreur
  return res.status(200).json({ message: 'Webhook reçu' });
};

// Route pour recevoir les webhooks Ringover
router.post('/webhook', verifyWebhookKey, async (req, res) => {
  try {
    const { event, resource, timestamp, data } = req.body;
    
    console.log('📞 Webhook Ringover reçu:', {
      event,
      resource,
      timestamp,
      callId: data?.call_id,
      from: data?.from_number,
      to: data?.to_number
    });
    
    if (resource !== 'call') {
      return res.status(200).json({ message: 'Webhook ignoré (ressource non call)' });
    }
    
    // Extraire les données de l'appel
    const callData = {
      ringoverId: data.id || `call-${data.call_id}-${Date.now()}`,
      callId: data.call_id,
      channelId: data.channel_id || null,
      event: event,
      direction: data.direction,
      status: data.status || event,
      fromNumber: data.from_number,
      toNumber: data.to_number,
      userId: data.user_id || null,
      userName: data.user_name || '',
      isInternal: data.is_internal || false,
      isAnonymous: data.is_anonymous || false,
      startTime: data.start_time ? new Date(data.start_time * 1000) : new Date(),
      answerTime: data.answer_time ? new Date(data.answer_time * 1000) : null,
      hangupTime: data.hangup_time ? new Date(data.hangup_time * 1000) : null,
      duration: data.duration || 0,
      ivrData: data.ivr_data || null,
      rawData: req.body,
      // Initialiser le statut selon l'événement
      callStatus: event === 'ringing' && data.direction === 'inbound' ? 'en_attente' : 
                  event === 'answered' ? 'en_cours' :
                  event === 'missed' ? 'manqué' :
                  event === 'hangup' ? 'terminé' : 'en_attente'
    };
    
    // Chercher un contact existant dans le CRM par numéro de téléphone
    if (event === 'ringing' || event === 'answered' || event === 'missed') {
      const phoneNumber = callData.direction === 'inbound' 
        ? callData.fromNumber 
        : callData.toNumber;
      
      // Normaliser le numéro (enlever les espaces, +, etc.)
      const normalizedPhone = phoneNumber.replace(/[\s\+\-\(\)]/g, '');
      
      // Chercher dans les commandes
      const matchingOrder = await Order.findOne({
        $or: [
          { clientPhone: { $regex: normalizedPhone.slice(-9), $options: 'i' } },
          { clientPhone: phoneNumber }
        ]
      }).sort({ createdAt: -1 });
      
      if (matchingOrder) {
        callData.contactId = matchingOrder._id;
        console.log('✅ Contact trouvé dans le CRM:', matchingOrder._id);
      }
    }
    
    // Mettre à jour ou créer l'appel
    const existingCall = await RingoverCall.findOne({ 
      callId: callData.callId 
    });
    
    if (existingCall) {
      // Mettre à jour l'appel existant
      Object.assign(existingCall, callData);
      
      // Mettre à jour le statut selon l'événement si l'appel n'est pas déjà assigné
      if (!existingCall.assignedOperator) {
        if (event === 'answered') {
          existingCall.callStatus = 'en_cours';
        } else if (event === 'missed') {
          existingCall.callStatus = 'manqué';
        } else if (event === 'hangup') {
          existingCall.callStatus = 'terminé';
        } else if (event === 'ringing' && callData.direction === 'inbound') {
          existingCall.callStatus = 'en_attente';
        }
      } else {
        // Si l'appel est assigné, mettre à jour le statut selon l'événement
        if (event === 'answered') {
          existingCall.callStatus = 'en_cours';
        } else if (event === 'hangup') {
          existingCall.callStatus = 'terminé';
        } else if (event === 'missed') {
          existingCall.callStatus = 'manqué';
        }
      }
      
      await existingCall.save();
      console.log('✅ Appel mis à jour:', existingCall._id);
    } else {
      // Créer un nouvel appel
      const newCall = new RingoverCall(callData);
      await newCall.save();
      console.log('✅ Nouvel appel enregistré:', newCall._id);
    }
    
    // Retourner 200 (Ringover ignore les autres codes)
    res.status(200).json({ 
      success: true, 
      message: 'Webhook traité avec succès' 
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement du webhook Ringover:', error);
    // Retourner 200 même en cas d'erreur (Ringover ignore les autres codes)
    res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour récupérer tous les appels
router.get('/calls', async (req, res) => {
  try {
    const { 
      direction, 
      event, 
      fromNumber, 
      toNumber,
      callStatus,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = req.query;
    
    // Construire le filtre
    const filter = {};
    
    if (direction) filter.direction = direction;
    if (event) filter.event = event;
    if (callStatus) filter.callStatus = callStatus;
    if (fromNumber) filter.fromNumber = { $regex: fromNumber, $options: 'i' };
    if (toNumber) filter.toNumber = { $regex: toNumber, $options: 'i' };
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }
    
    // Récupérer les appels
    const calls = await RingoverCall.find(filter)
      .populate('contactId', 'clientName clientPhone email')
      .populate('assignedOperator', 'nom prenom username')
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    // Compter le total
    const total = await RingoverCall.countDocuments(filter);
    
    res.json({
      success: true,
      data: calls,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des appels:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour récupérer un appel spécifique
router.get('/calls/:id', async (req, res) => {
  try {
    const call = await RingoverCall.findById(req.params.id)
      .populate('contactId', 'clientName clientPhone email products totalAmount status')
      .populate('assignedOperator', 'nom prenom username email');
    
    if (!call) {
      return res.status(404).json({ 
        success: false, 
        error: 'Appel non trouvé' 
      });
    }
    
    res.json({
      success: true,
      data: call
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'appel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour obtenir les statistiques des appels
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }
    
    const stats = {
      total: await RingoverCall.countDocuments(filter),
      inbound: await RingoverCall.countDocuments({ ...filter, direction: 'inbound' }),
      outbound: await RingoverCall.countDocuments({ ...filter, direction: 'outbound' }),
      answered: await RingoverCall.countDocuments({ ...filter, event: 'answered' }),
      missed: await RingoverCall.countDocuments({ ...filter, event: 'missed' }),
      ringing: await RingoverCall.countDocuments({ ...filter, event: 'ringing' }),
      voicemail: await RingoverCall.countDocuments({ ...filter, event: 'voicemail' })
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour assigner un appel à un opérateur
router.put('/calls/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { operatorId, operatorName, assignedBy } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID opérateur requis' 
      });
    }
    
    const call = await RingoverCall.findById(id);
    if (!call) {
      return res.status(404).json({ 
        success: false, 
        error: 'Appel non trouvé' 
      });
    }
    
    // Mettre à jour l'assignation
    call.assignedOperator = operatorId;
    call.assignedOperatorName = operatorName || '';
    call.callStatus = 'assigné';
    call.assignedAt = new Date();
    call.assignedBy = assignedBy || null;
    
    await call.save();
    
    console.log(`✅ Appel ${id} assigné à l'opérateur ${operatorName || operatorId}`);
    
    res.json({
      success: true,
      message: 'Appel assigné avec succès',
      data: call
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation de l\'appel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour réassigner un appel à un autre opérateur
router.put('/calls/:id/reassign', async (req, res) => {
  try {
    const { id } = req.params;
    const { operatorId, operatorName, assignedBy } = req.body;
    
    if (!operatorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID opérateur requis' 
      });
    }
    
    const call = await RingoverCall.findById(id);
    if (!call) {
      return res.status(404).json({ 
        success: false, 
        error: 'Appel non trouvé' 
      });
    }
    
    // Mettre à jour l'assignation
    call.assignedOperator = operatorId;
    call.assignedOperatorName = operatorName || '';
    call.callStatus = 'assigné';
    call.assignedAt = new Date();
    call.assignedBy = assignedBy || null;
    
    await call.save();
    
    console.log(`✅ Appel ${id} réassigné à l'opérateur ${operatorName || operatorId}`);
    
    res.json({
      success: true,
      message: 'Appel réassigné avec succès',
      data: call
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la réassignation de l\'appel:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour récupérer les appels en file d'attente (non assignés)
router.get('/calls/queue', async (req, res) => {
  try {
      const calls = await RingoverCall.find({
      direction: 'inbound',
      event: { $in: ['ringing', 'answered'] },
      callStatus: 'en_attente',
      assignedOperator: null
    })
      .populate('contactId', 'clientName clientPhone email')
      .populate('assignedOperator', 'nom prenom username')
      .sort({ startTime: 1 }) // Plus ancien en premier
      .limit(50);
    
    res.json({
      success: true,
      data: calls,
      total: calls.length
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la file d\'attente:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour mettre à jour le statut d'un appel
router.put('/calls/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { callStatus } = req.body;
    
    const validStatuses = ['en_attente', 'assigné', 'en_cours', 'terminé', 'manqué'];
    if (!validStatuses.includes(callStatus)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Statut invalide' 
      });
    }
    
    const call = await RingoverCall.findByIdAndUpdate(
      id,
      { callStatus, updatedAt: new Date() },
      { new: true }
    );
    
    if (!call) {
      return res.status(404).json({ 
        success: false, 
        error: 'Appel non trouvé' 
      });
    }
    
    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: call
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/ringover/initiate-call - Initier un appel via l'API Ringover (Callback)
// Le callback fonctionne ainsi :
// 1. Ringover appelle d'abord l'opérateur (from_number)
// 2. Quand l'opérateur décroche, Ringover appelle automatiquement le client (to_number)
router.post('/initiate-call', async (req, res) => {
  try {
    const { phoneNumber, userId, operatorPhoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone requis'
      });
    }

    let apiKey = process.env.RINGOVER_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Clé API Ringover non configurée. Veuillez configurer RINGOVER_API_KEY dans les variables d\'environnement.'
      });
    }

    // Nettoyer la clé API (enlever les espaces, retours à la ligne, etc.)
    apiKey = apiKey.trim();
    
    // Vérifier que la clé n'est pas vide après nettoyage
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Clé API Ringover vide après nettoyage. Vérifiez la variable RINGOVER_API_KEY dans Render.'
      });
    }

    // Format du numéro du client (to_number) pour Ringover
    // Ringover attend un integer (int64) sans le + ni les espaces
    // Format attendu: 33611223344 (33 + numéro sans le 0 initial)
    let toNumber = phoneNumber.replace(/\D/g, ''); // Enlever tous les caractères non numériques
    
    // Si le numéro commence par 33, on le garde tel quel
    if (toNumber.startsWith('33') && toNumber.length > 2) {
      // Le numéro est déjà au format international (33...)
      // Vérifier qu'il n'y a pas de double 33
      if (toNumber.startsWith('3333')) {
        toNumber = '33' + toNumber.substring(4); // Enlever le double 33
      }
    } else if (toNumber.startsWith('0')) {
      // Numéro français commençant par 0, remplacer par 33
      toNumber = '33' + toNumber.substring(1);
    } else if (!toNumber.startsWith('33')) {
      // Numéro sans indicatif, ajouter 33
      toNumber = '33' + toNumber;
    }

    // Format du numéro de l'opérateur (from_number) si fourni
    let fromNumber = null;
    if (operatorPhoneNumber) {
      fromNumber = operatorPhoneNumber.replace(/\D/g, '');
      if (fromNumber.startsWith('0')) {
        fromNumber = '33' + fromNumber.substring(1);
      } else if (fromNumber.startsWith('+33')) {
        fromNumber = fromNumber.replace('+33', '33');
      } else if (!fromNumber.startsWith('33')) {
        fromNumber = '33' + fromNumber;
      }
      fromNumber = parseInt(fromNumber, 10); // Convertir en integer
    }

    // Convertir to_number en integer
    const toNumberInt = parseInt(toNumber, 10);

    // Préparer le body de la requête
    const requestBody = {
      to_number: toNumberInt, // Numéro du client (integer)
      from_number: fromNumber, // Numéro de l'opérateur (integer ou null)
      timeout: 45, // Timeout en secondes (20-300)
      device: 'ALL' // Appeler sur tous les appareils de l'opérateur
    };

    console.log('📞 Tentative d\'appel Ringover:');
    console.log('  - Endpoint: https://public-api.ringover.com/v2/callback');
    console.log('  - to_number:', toNumberInt);
    console.log('  - from_number:', fromNumber);
    console.log('  - API Key présent:', !!apiKey);
    console.log('  - API Key longueur:', apiKey ? apiKey.length : 0);
    console.log('  - API Key (premiers 10 caractères):', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    console.log('  - Request Body:', JSON.stringify(requestBody));

    // Essayer d'abord avec "Bearer {token}", puis sans si ça ne fonctionne pas
    // Certaines APIs Ringover peuvent nécessiter le format Bearer
    const authHeaders = [
      apiKey, // Format 1: Clé API directement
      `Bearer ${apiKey}`, // Format 2: Bearer + clé API
    ];

    let ringoverResponse;
    let lastError;
    let responseText = null;
    
    // Essayer les deux formats d'authentification
    for (let i = 0; i < authHeaders.length; i++) {
      const authHeader = authHeaders[i];
      console.log(`  - Tentative ${i + 1}/2 avec format: ${i === 0 ? 'Direct' : 'Bearer'}`);
      
      try {
        console.log(`  - Authorization header: ${authHeader.substring(0, 20)}...`);
        ringoverResponse = await fetch('https://public-api.ringover.com/v2/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(requestBody)
        });

        // Lire le body une seule fois
        responseText = await ringoverResponse.text();

        // Si on obtient une réponse autre que 401, on arrête
        if (ringoverResponse.status !== 401) {
          console.log(`  ✅ Format ${i === 0 ? 'Direct' : 'Bearer'} fonctionne (Status: ${ringoverResponse.status})`);
          break;
        } else {
          console.log(`  ❌ Format ${i === 0 ? 'Direct' : 'Bearer'} échoue (401 Unauthorized)`);
          lastError = responseText; // Stocker l'erreur sans relire le body
        }
      } catch (error) {
        console.error(`  ❌ Erreur avec format ${i === 0 ? 'Direct' : 'Bearer'}:`, error.message);
        lastError = error.message;
      }
    }

    // Si aucune réponse n'a été obtenue, retourner une erreur
    if (!ringoverResponse) {
      return res.status(500).json({
        success: false,
        error: `Erreur d'authentification Ringover. Tous les formats ont échoué. Dernière erreur: ${lastError || 'Inconnue'}`
      });
    }

    // Utiliser le texte déjà lu (ne pas relire le body)
    let errorData = responseText;

    // Essayer de parser en JSON si possible
    try {
      const jsonData = JSON.parse(responseText);
      errorData = jsonData;
    } catch (e) {
      // Si ce n'est pas du JSON, garder le texte
    }

    if (!ringoverResponse.ok) {
      console.error('❌ Erreur API Ringover:');
      console.error('  - Status:', ringoverResponse.status);
      console.error('  - Status Text:', ringoverResponse.statusText);
      console.error('  - Response:', errorData);
      
      // Message d'erreur plus détaillé
      let errorMessage = `Erreur Ringover (${ringoverResponse.status}): `;
      if (typeof errorData === 'object' && errorData.message) {
        errorMessage += errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage += errorData;
      } else {
        errorMessage += JSON.stringify(errorData);
      }

      return res.status(ringoverResponse.status).json({
        success: false,
        error: errorMessage
      });
    }

    // Parser la réponse JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { message: 'Appel initié avec succès' };
    }
    
    console.log('✅ Callback initié via Ringover:', result);
    console.log('📞 Workflow: Ringover va appeler l\'opérateur, puis le client automatiquement');
    
    res.json({
      success: true,
      message: 'Appel initié avec succès. Ringover va appeler l\'opérateur, puis le client automatiquement.',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'initiation de l\'appel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;


