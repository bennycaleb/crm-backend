require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const registrationRoutes = require('./routes/registration');
const shopifyRoutes = require('./routes/shopify');
const ordersRoutes = require('./routes/orders');
const multer = require('multer');
const glnetRoutes = require('./routes/glnet');
const http = require('http');
const socketIo = require('socket.io');
const usersRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const recallsRoutes = require('./routes/recalls');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ton-domaine.com', 'https://www.ton-domaine.com'] 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log('\n=== NOUVELLE REQUÊTE ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Méthode:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Params:', JSON.stringify(req.params, null, 2));
  console.log('========================\n');
  next();
});

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration de multer pour traiter les fichiers PDF
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// Connexion à MongoDB avec options minimales pour éviter les conflits TLS
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority'
};

// Utiliser l'URI MongoDB Atlas sans paramètres TLS (laissé à MongoDB)
let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';

// Pour MongoDB Atlas, ajouter seulement les paramètres de base
if (mongoUri.includes('mongodb+srv://')) {
  const separator = mongoUri.includes('?') ? '&' : '?';
  mongoUri += `${separator}retryWrites=true&w=majority`;
}

mongoose.connect(mongoUri, mongoOptions)
.then(() => {
  console.log('✅ Connecté à MongoDB avec succès');
  console.log('📊 Base de données:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
})
.catch(err => {
  console.error('❌ Erreur de connexion à MongoDB:', err.message);
  console.error('🔍 Détails:', {
    code: err.code,
    codeName: err.codeName,
    name: err.name
  });
  
  // En production, on peut choisir de redémarrer ou continuer
  if (process.env.NODE_ENV === 'production') {
    console.log('🔄 Tentative de reconnexion dans 5 secondes...');
    setTimeout(() => {
      mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    }, 5000);
  }
});

// Gestion des événements de connexion MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Déconnecté de MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Reconnecté à MongoDB');
});

// Route de santé pour Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', registrationRoutes);
app.use('/api', shopifyRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api', glnetRoutes);
app.use('/api', usersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/recalls', recallsRoutes);

// Socket.IO pour les communications en temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  // Gestion des statuts d'opérateur
  socket.on('operator-status', (data) => {
    console.log('Statut opérateur:', data);
    socket.broadcast.emit('operator-status-update', data);
  });

  // Gestion des appels
  socket.on('call-event', (data) => {
    console.log('Événement appel:', data);
    socket.broadcast.emit('call-update', data);
  });

  // Gestion des nouvelles commandes
  socket.on('new-order', (data) => {
    console.log('Nouvelle commande:', data);
    socket.broadcast.emit('order-created', data);
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Route racine
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'API CRM Backend', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      orders: '/api/orders',
      registration: '/api/registration'
    }
  });
});

// Middleware pour gérer les erreurs 404
app.use((req, res, next) => {
  console.log('Route non trouvée:', req.method, req.url);
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Le fichier est trop volumineux. Taille maximale: 5MB'
      });
    }
  }
  res.status(500).json({
    message: 'Une erreur est survenue sur le serveur',
    error: err.message
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
}); 
