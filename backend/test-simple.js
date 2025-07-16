require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔧 Test de connexion MongoDB ultra-simple...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('📦 Version Mongoose:', mongoose.version);

// URI MongoDB Atlas RECOMMANDÉE (pas de shards multiples, pas de ports)
const mongoUri = 'mongodb+srv://crmuser:CRM2024!@ac-rzss8de-shard-00-00.o43fjpy.mongodb.net/crm?retryWrites=true&w=majority';

console.log('🔗 Tentative de connexion à MongoDB...');
console.log('🌐 URI (masquée):', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Test de connexion avec options minimales
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connexion MongoDB réussie !');
  console.log('📊 Base de données:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:');
  console.error('📝 Message:', err.message);
  console.error('🔍 Code:', err.code);
  console.error('🏷️  Nom:', err.name);
})
.finally(() => {
  mongoose.disconnect();
  console.log('🔌 Connexion fermée');
  process.exit(0);
}); 