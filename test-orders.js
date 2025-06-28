const { API_URL } = require('./src/apiConfig');

// Données de test pour créer des commandes
const testOrders = [
  {
    clientName: "Jean Dupont",
    clientPhone: "0123456789",
    products: [
      { name: "Produit A", quantity: 2, price: 25.50 },
      { name: "Produit B", quantity: 1, price: 15.00 }
    ],
    totalAmount: 66.00,
    status: "pending"
  },
  {
    clientName: "Marie Martin",
    clientPhone: "0987654321",
    products: [
      { name: "Produit C", quantity: 3, price: 10.00 }
    ],
    totalAmount: 30.00,
    status: "pending"
  },
  {
    clientName: "Pierre Durand",
    clientPhone: "0555666777",
    products: [
      { name: "Produit A", quantity: 1, price: 25.50 },
      { name: "Produit D", quantity: 2, price: 20.00 }
    ],
    totalAmount: 65.50,
    status: "pending"
  }
];

async function createTestOrders() {
  console.log('Création des commandes de test...');
  
  for (const orderData of testOrders) {
    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        console.log(`✅ Commande créée: ${order.clientName} - ${order.totalAmount}€`);
      } else {
        console.error(`❌ Erreur lors de la création de la commande: ${orderData.clientName}`);
      }
    } catch (error) {
      console.error(`❌ Erreur: ${error.message}`);
    }
  }
  
  console.log('Test terminé !');
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  createTestOrders();
}

module.exports = { createTestOrders }; 