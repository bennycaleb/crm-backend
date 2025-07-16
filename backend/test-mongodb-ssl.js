require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔧 Test de connexion MongoDB avec options SSL/TLS améliorées...');
console.log('📅 Timestamp:', new Date().toISOString());

// Options de connexion améliorées pour résoudre les problèmes SSL/TLS
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority',
  ssl: true,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  connectTimeoutMS: 15000,
  heartbeatFrequencyMS: 10000,
  readPreference: 'primary',
  readConcern: { level: 'local' }
};

// Forcer l'utilisation de l'URI Atlas si non définie ou si localhost
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri || mongoUri.includes('localhost')) {
  console.log('💡 Utilisation forcée de l\'URI MongoDB Atlas pour le test...');
  mongoUri = 'mongodb+srv://crmuser:CRM2024!@ac-rzss8de-shard-00-00.o43fjpy.mongodb.net/crm?retryWrites=true&w=majority';
}

// Ajoute les paramètres nécessaires S'ILS NE SONT PAS déjà présents
function addParam(uri, key, value) {
  const regex = new RegExp(`[?&]${key}=`);
  if (!regex.test(uri)) {
    const sep = uri.includes('?') ? '&' : '?';
    uri += `${sep}${key}=${value}`;
  }
  return uri;
}

mongoUri = addParam(mongoUri, 'ssl', 'true');
mongoUri = addParam(mongoUri, 'tls', 'true');
mongoUri = addParam(mongoUri, 'tlsAllowInvalidCertificates', 'false');
mongoUri = addParam(mongoUri, 'tlsAllowInvalidHostnames', 'false');
mongoUri = addParam(mongoUri, 'retryWrites', 'true');
mongoUri = addParam(mongoUri, 'w', 'majority');

console.log('🔗 URI MongoDB finale avec paramètres SSL/TLS');
console.log('🌐 URI (masquée):', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Test de connexion
mongoose.connect(mongoUri, mongoOptions)
.then(() => {
  console.log('✅ Connexion MongoDB réussie !');
  console.log('📊 Base de données:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
  console.log('👤 User:', mongoose.connection.user);
  
  // Test d'une opération simple
  return mongoose.connection.db.admin().ping();
})
.then(() => {
  console.log('🏓 Ping MongoDB réussi !');
  console.log('✅ Toutes les vérifications sont passées');
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:');
  console.error('📝 Message:', err.message);
  console.error('🔍 Code:', err.code);
  console.error('🏷️  Nom:', err.name);
  
  if (err.reason) {
    console.error('🔍 Raison détaillée:', err.reason);
  }
  
  console.log('\n💡 Suggestions de résolution:');
  console.log('1. Vérifiez que l\'IP de Render est dans la whitelist MongoDB Atlas');
  console.log('2. Vérifiez les identifiants de connexion');
  console.log('3. Vérifiez que le cluster MongoDB Atlas est actif');
  console.log('4. Essayez de redémarrer le service sur Render');
})
.finally(() => {
  mongoose.disconnect();
  console.log('🔌 Connexion fermée');
  process.exit(0);
}); 