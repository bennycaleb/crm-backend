require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function createAdmin() {
  try {
    // Connexion à MongoDB Atlas
    console.log('Connexion à MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('❌ Un compte admin existe déjà');
      process.exit(0);
    }

    // Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer le compte admin
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      nom: 'Administrateur',
      prenom: 'Système'
    });

    await adminUser.save();
    console.log('✅ Compte admin créé avec succès !');
    console.log('📋 Identifiants :');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

createAdmin(); 