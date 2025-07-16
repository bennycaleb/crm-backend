require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log('✅ Connecté à MongoDB');
  
  // Vérifier si l'utilisateur admin existe
  const db = mongoose.connection.db;
  const adminUser = await db.collection('users').findOne({ username: 'admin' });
  
  if (adminUser) {
    console.log('✅ Utilisateur admin trouvé:');
    console.log('- Username:', adminUser.username);
    console.log('- Role:', adminUser.role);
    console.log('- Nom:', adminUser.nom);
    console.log('- Prénom:', adminUser.prenom);
  } else {
    console.log('❌ Utilisateur admin non trouvé');
    console.log('Création de l\'utilisateur admin...');
    
    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const newAdmin = {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      nom: 'Administrateur',
      prenom: 'Système',
      email: 'admin@crm.com',
      dateCreation: new Date()
    };
    
    await db.collection('users').insertOne(newAdmin);
    console.log('✅ Utilisateur admin créé avec succès');
  }
  
  mongoose.connection.close();
})
.catch(err => {
  console.error('❌ Erreur:', err);
}); 