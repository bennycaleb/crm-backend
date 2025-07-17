require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

console.log('🚀 Création de l\'utilisateur admin sur Render...');
console.log('🌐 Environnement:', process.env.NODE_ENV || 'development');

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

async function createAdminUserOnRender() {
  try {
    console.log('🔄 Connexion à MongoDB Atlas...');
    
    // Utiliser l'URI MongoDB Atlas depuis les variables d'environnement Render
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI non définie dans les variables d\'environnement');
      console.log('💡 Assurez-vous que MONGODB_URI est configurée sur Render');
      process.exit(1);
    }
    
    console.log('🔗 URI MongoDB:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Masquer les credentials
    
    await mongoose.connect(mongoUri, mongoOptions);
    console.log('✅ Connecté à MongoDB Atlas');
    console.log('📊 Base de données:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);

    // Vérifier si l'utilisateur admin existe déjà
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  L\'utilisateur admin existe déjà');
      console.log('🔄 Mise à jour du mot de passe...');
      
      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Mettre à jour le mot de passe
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.nom = 'Admin';
      existingAdmin.prenom = 'Système';
      
      await existingAdmin.save();
      console.log('✅ Mot de passe admin mis à jour sur MongoDB Atlas');
    } else {
      console.log('👤 Création de l\'utilisateur admin...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Créer l'utilisateur admin
      const adminUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        nom: 'Admin',
        prenom: 'Système'
      });
      
      await adminUser.save();
      console.log('✅ Utilisateur admin créé avec succès sur MongoDB Atlas');
    }

    console.log('\n🎉 Opération terminée sur Render !');
    console.log('\n📋 Informations de connexion :');
    console.log('   👤 Username: admin');
    console.log('   🔑 Password: admin123');
    console.log('   👑 Role: admin');
    console.log('\n🔗 Vous pouvez maintenant vous connecter depuis Netlify vers Render !');

    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB Atlas');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    console.error('🔍 Détails:', {
      code: error.code,
      codeName: error.codeName,
      name: error.name
    });
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Vérifiez que votre URI MongoDB Atlas est correcte');
    }
    
    process.exit(1);
  }
}

createAdminUserOnRender(); 