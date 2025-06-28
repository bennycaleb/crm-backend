const mongoose = require('mongoose');

async function fixMongoDB() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
    console.log('Connecté à MongoDB');

    // Supprimer l'index problématique
    const db = mongoose.connection.db;
    const collection = db.collection('orders');
    
    console.log('Suppression de l\'index id_1...');
    try {
      await collection.dropIndex('id_1');
      console.log('✅ Index id_1 supprimé avec succès');
    } catch (error) {
      console.log('Index id_1 n\'existe pas ou déjà supprimé');
    }

    // Lister les index restants
    const indexes = await collection.getIndexes();
    console.log('Index restants:', Object.keys(indexes));

    // Tester la création d'une commande
    console.log('\n🧪 Test de création d\'une commande...');
    const Order = require('./backend/models/Order');
    
    const testOrder = new Order({
      clientName: 'Test Client',
      clientPhone: '0123456789',
      products: [{
        name: 'Produit Test',
        quantity: 1,
        price: 25.50
      }],
      totalAmount: 25.50,
      status: 'validated',
      operator: 'Opérateur Test',
      channel: 'Téléphone'
    });

    const savedOrder = await testOrder.save();
    console.log('✅ Commande créée avec succès:', savedOrder._id);

    // Récupérer toutes les commandes
    const allOrders = await Order.find();
    console.log(`📊 Total des commandes: ${allOrders.length}`);

    // Afficher les commandes validées
    const validatedOrders = await Order.find({ status: 'validated' });
    console.log(`✅ Commandes validées: ${validatedOrders.length}`);

    console.log('\n🎉 Test terminé avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fixMongoDB(); 