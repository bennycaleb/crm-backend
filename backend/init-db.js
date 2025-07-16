require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');
const RegistrationRequest = require('./models/RegistrationRequest');

console.log('🚀 Initialisation de la base de données...');

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority'
};

async function initializeDatabase() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', mongoOptions);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les données existantes
    console.log('🧹 Nettoyage des données existantes...');
    await User.deleteMany({});
    await Order.deleteMany({});
    await RegistrationRequest.deleteMany({});

    // Créer un utilisateur admin par défaut
    console.log('👤 Création de l\'utilisateur admin...');
    const adminUser = new User({
      username: 'admin',
      nom: 'Admin',
      prenom: 'Système',
      email: 'admin@crm.com',
      telephone: '+1234567890',
      role: 'admin',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      isActive: true,
      dateCreation: new Date()
    });
    await adminUser.save();
    console.log('✅ Utilisateur admin créé');

    // Créer un utilisateur opérateur par défaut
    console.log('👤 Création de l\'utilisateur opérateur...');
    const operatorUser = new User({
      username: 'operator',
      nom: 'Opérateur',
      prenom: 'Test',
      email: 'operator@crm.com',
      telephone: '+1234567891',
      role: 'operator',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      isActive: true,
      dateCreation: new Date()
    });
    await operatorUser.save();
    console.log('✅ Utilisateur opérateur créé');

    // Créer quelques commandes de test
    console.log('📦 Création de commandes de test...');
    const testOrders = [
      {
        clientName: 'Jean Dupont',
        clientPhone: '+33123456789',
        products: [
          { name: 'Produit A', quantity: 2, price: 29.99 },
          { name: 'Produit B', quantity: 1, price: 49.99 }
        ],
        status: 'pending',
        totalAmount: 109.97,
        createdAt: new Date(),
        operator: operatorUser.username
      },
      {
        clientName: 'Marie Martin',
        clientPhone: '+33987654321',
        products: [
          { name: 'Produit C', quantity: 3, price: 19.99 }
        ],
        status: 'validated',
        totalAmount: 59.97,
        createdAt: new Date(Date.now() - 86400000), // Hier
        operator: operatorUser.username
      }
    ];

    for (const orderData of testOrders) {
      const order = new Order(orderData);
      await order.save();
    }
    console.log('✅ Commandes de test créées');

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('\n📋 Comptes de test créés :');
    console.log('   👤 Admin: admin@crm.com / password');
    console.log('   👤 Opérateur: operator@crm.com / password');
    console.log('\n📦 Commandes de test créées :');
    console.log('   - CMD-001 (en attente)');
    console.log('   - CMD-002 (traitée)');

    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

initializeDatabase(); 