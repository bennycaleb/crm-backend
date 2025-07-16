require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 Test de connexion MongoDB...');
console.log('🔗 URI:', process.env.MONGODB_URI ? 'Configuré' : 'Non configuré');

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

async function testConnection() {
  try {
    console.log('🔄 Tentative de connexion...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', mongoOptions);
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Base de données:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Test d'une opération simple
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Collections existantes:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('👋 Déconnecté avec succès');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('🔍 Code d\'erreur:', error.code);
    console.error('📝 Nom de l\'erreur:', error.name);
    
    if (error.code === 8000) {
      console.log('\n💡 Solution: Vérifiez vos identifiants MongoDB Atlas');
      console.log('   - Nom d\'utilisateur et mot de passe corrects');
      console.log('   - IP autorisée dans Network Access');
      console.log('   - Utilisateur avec les bonnes permissions');
    }
    
    process.exit(1);
  }
}

testConnection(); 