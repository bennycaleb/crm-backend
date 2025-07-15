require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Configuration des connexions
const ATLAS_URI = 'mongodb+srv://LBC_m:LBClbc%40242@cluster0.7i4gd18.mongodb.net/crm?retryWrites=true&w=majority';

// Mots de passe par défaut pour chaque utilisateur
const DEFAULT_PASSWORDS = {
  'L.benny': 'benny123',
  'Van.v': 'van123',
  'LBC.m': 'admin123',
  'CALEB.n': 'caleb123',
  'C.zenny': 'zenny123'
};

async function resetPasswords() {
  let client;
  
  try {
    console.log('🔧 Réinitialisation des mots de passe...\n');
    
    // Connexion à MongoDB Atlas
    console.log('📡 Connexion à MongoDB Atlas...');
    client = new MongoClient(ATLAS_URI);
    await client.connect();
    console.log('✅ Connecté à MongoDB Atlas');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Récupérer tous les utilisateurs
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Utilisateurs trouvés: ${users.length}\n`);
    
    // Mettre à jour les mots de passe
    for (const user of users) {
      const username = user.username;
      const defaultPassword = DEFAULT_PASSWORDS[username];
      
      if (defaultPassword) {
        console.log(`🔄 Mise à jour du mot de passe pour: ${username}`);
        
        // Hasher le nouveau mot de passe
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
        
        // Mettre à jour l'utilisateur
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`   ✅ Mot de passe mis à jour: ${defaultPassword}`);
      } else {
        console.log(`⚠️  Aucun mot de passe par défaut trouvé pour: ${username}`);
      }
    }
    
    console.log('\n🎉 Réinitialisation terminée !');
    console.log('\n📋 Mots de passe par défaut:');
    Object.entries(DEFAULT_PASSWORDS).forEach(([username, password]) => {
      console.log(`   - ${username}: ${password}`);
    });
    
    console.log('\n✅ Tu peux maintenant te connecter avec ces identifiants !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

resetPasswords().catch(console.error); 