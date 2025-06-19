const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

fs.appendFileSync('debug.log', `[${new Date().toISOString()}] Fichier registration.js chargé\n`);

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/passports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'passeport-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  }
});

// Route pour soumettre une demande d'inscription
router.post('/register', upload.single('passeportFile'), async (req, res) => {
  try {
    // Pour debug : log détaillé
    console.log('=== Début de la requête d\'inscription ===');
    console.log('Headers:', req.headers);
    console.log('Body reçu:', req.body);
    console.log('Fichier reçu:', req.file);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);

    const nom = req.body.nom;
    const prenom = req.body.prenom;
    const email = req.body.email;
    const telephone = req.body.telephone || req.body.whatsapp; // Accepte les deux noms de champ
    const experience = req.body.experience;
    const role = req.body.role || req.body['role'];

    if (!req.file) {
      console.log('Erreur: Fichier manquant');
      return res.status(400).json({
        message: 'Le fichier du passeport est requis (champ passeportFile manquant ou mauvais type)'
      });
    }

    // Vérifier si l'email existe déjà
    const existingRequest = await RegistrationRequest.findOne({ email });

    if (existingRequest) {
      console.log('Erreur: Email déjà utilisé');
      // Supprimer le fichier téléchargé si la demande existe déjà
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'Une demande avec cet email existe déjà'
      });
    }

    // Créer une nouvelle demande d'inscription
    const registrationRequest = new RegistrationRequest({
      nom,
      prenom,
      email,
      telephone,
      passeportFile: req.file.path,
      experience,
      role
    });

    await registrationRequest.save();
    console.log('=== Inscription réussie ===');

    res.status(201).json({
      message: 'Demande d\'inscription soumise avec succès'
    });
  } catch (error) {
    console.error('=== Erreur détaillée ===');
    console.error('Type d\'erreur:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    // Supprimer le fichier téléchargé en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      message: 'Une erreur est survenue lors de la soumission de la demande',
      error: error.message
    });
  }
});

// Route pour obtenir toutes les demandes d'inscription (admin uniquement)
router.get('/requests', async (req, res) => {
  try {
    const requests = await RegistrationRequest.find()
      .sort({ dateDemande: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes'
    });
  }
});

// Route pour approuver une demande d'inscription (admin uniquement)
router.post('/approve/:requestId', async (req, res) => {
  try {
    console.log('Début approbation', req.params, req.body);
    const { requestId } = req.params;
    const { username, password } = req.body;

    const request = await RegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        message: 'Demande non trouvée'
      });
    }

    if (request.status !== 'en_attente') {
      return res.status(400).json({
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: request.role,
      nom: request.nom,
      prenom: request.prenom
    });

    await newUser.save();

    // Mettre à jour le statut de la demande
    request.status = 'approuve';
    request.dateTraitement = new Date();
    request.traitePar = null; // Pas d'authentification, donc pas d'admin associé
    await request.save();

    res.json({
      message: 'Demande approuvée et utilisateur créé avec succès'
    });
  } catch (error) {
    const logMsg = `[${new Date().toISOString()}] Erreur approbation: ${error.message}\nStack: ${error.stack}\nParams: ${JSON.stringify(req.params)}\nBody: ${JSON.stringify(req.body)}\n\n`;
    fs.appendFileSync('debug.log', logMsg);
    console.error('Erreur lors de l\'approbation de la demande:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de l\'approbation de la demande',
      error: error.message,
      stack: error.stack
    });
  }
});

// Route pour refuser une demande d'inscription (admin uniquement)
router.post('/reject/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await RegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        message: 'Demande non trouvée'
      });
    }

    if (request.status !== 'en_attente') {
      return res.status(400).json({
        message: 'Cette demande a déjà été traitée'
      });
    }

    request.status = 'refuse';
    request.dateTraitement = new Date();
    request.traitePar = req.user._id;
    request.raisonRefus = reason;
    await request.save();

    res.json({
      message: 'Demande refusée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du refus de la demande:', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors du refus de la demande'
    });
  }
});

module.exports = router; 