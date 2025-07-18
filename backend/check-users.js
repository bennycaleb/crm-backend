require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('🔄 Connexion à MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');
    
    const users = await User.find({});
    console.log(`\n📋 ${users.length} utilisateur(s) dans la base de données :`);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
    } else {
      users.forEach((user, index) => {
        console.log(`\n👤 Utilisateur ${index + 1}:`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Nom: ${user.nom || 'Non défini'}`);
        console.log(`   Prénom: ${user.prenom || 'Non défini'}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

checkUsers(); 