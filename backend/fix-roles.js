require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixRoles() {
  try {
    console.log('🔄 Connexion à MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');
    
    // Corriger les rôles
    const result = await User.updateMany(
      { role: 'operateur' },
      { role: 'operator' }
    );
    
    console.log(`✅ ${result.modifiedCount} utilisateur(s) mis à jour`);
    
    // Afficher les utilisateurs après correction
    const users = await User.find({});
    console.log('\n📋 Utilisateurs après correction :');
    users.forEach((user, index) => {
      console.log(`\n👤 Utilisateur ${index + 1}:`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Nom: ${user.nom || 'Non défini'}`);
      console.log(`   Prénom: ${user.prenom || 'Non défini'}`);
    });
    
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixRoles(); 