require('dotenv').config();
const { MongoClient } = require('mongodb');

const ATLAS_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
const OPERATOR = 'L.benny'; // Pour la démo, tu pourras changer ensuite

async function addOperatorToOrders() {
  const client = new MongoClient(ATLAS_URI);
  try {
    await client.connect();
    const db = client.db();
    const orders = db.collection('orders');
    const result = await orders.updateMany(
      { operator: { $exists: false } },
      { $set: { operator: OPERATOR } }
    );
    console.log(`Commandes modifiées : ${result.modifiedCount}`);
  } catch (err) {
    console.error('Erreur :', err);
  } finally {
    await client.close();
  }
}

addOperatorToOrders(); 