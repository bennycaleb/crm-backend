# API Documentation - Envoi de Commandes

## Endpoint pour les développeurs externes

### URL
```
POST http://localhost:3001/api/orders/external
```

### Headers requis
```
Content-Type: application/json
```

### Format de données attendu

#### Exemple simple (un seul produit)
```json
{
  "customer_name": "Jean Dupont",
  "customer_phone": "0612345678",
  "customer_email": "jean.dupont@email.com",
  "customer_address": "25 rue Pelleport, 33800 Bordeaux",
  "products": {
    "name": "Produit A",
    "quantity": 2,
    "price": 59.99
  },
  "total_amount": 119.98,
  "order_id": "CMD-2024-001",
  "source": "votre-site-web"
}
```

#### Exemple avec plusieurs produits
```json
{
  "customer_name": "Marie Martin",
  "customer_phone": "0622334455",
  "customer_email": "marie.martin@email.com",
  "customer_address": "10 avenue de Paris, 75000 Paris",
  "products": [
    {
      "name": "Produit A",
      "quantity": 1,
      "price": 29.99
    },
    {
      "name": "Produit B",
      "quantity": 3,
      "price": 15.50
    }
  ],
  "total_amount": 76.49,
  "order_id": "CMD-2024-002",
  "source": "ecommerce-partner"
}
```

### Champs requis
- `customer_name` : Nom complet du client
- `customer_phone` : Numéro de téléphone du client

### Champs optionnels
- `customer_email` : Email du client
- `customer_address` : Adresse de livraison
- `products` : Produit(s) commandé(s) (objet ou tableau)
- `total_amount` : Montant total de la commande
- `order_id` : Identifiant unique de la commande (généré automatiquement si non fourni)
- `source` : Source de la commande (ex: "site-web", "ecommerce", etc.)

### Réponse de succès
```json
{
  "success": true,
  "message": "Commande reçue et enregistrée avec succès",
  "order_id": "507f1f77bcf86cd799439011",
  "status": "pending"
}
```

### Réponse d'erreur
```json
{
  "error": "Champs requis manquants",
  "required": ["customer_name", "customer_phone"],
  "received": {
    "customer_name": "Jean Dupont",
    "customer_phone": null
  }
}
```

## Exemples d'utilisation

### JavaScript (fetch)
```javascript
const orderData = {
  customer_name: "Jean Dupont",
  customer_phone: "0612345678",
  customer_email: "jean.dupont@email.com",
  customer_address: "25 rue Pelleport, 33800 Bordeaux",
  products: {
    name: "Produit A",
    quantity: 2,
    price: 59.99
  },
  total_amount: 119.98,
  order_id: "CMD-2024-001",
  source: "votre-site-web"
};

fetch('http://localhost:3001/api/orders/external', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Commande envoyée avec succès:', data.order_id);
  } else {
    console.error('Erreur:', data.error);
  }
})
.catch(error => {
  console.error('Erreur réseau:', error);
});
```

### PHP (cURL)
```php
$orderData = [
    'customer_name' => 'Jean Dupont',
    'customer_phone' => '0612345678',
    'customer_email' => 'jean.dupont@email.com',
    'customer_address' => '25 rue Pelleport, 33800 Bordeaux',
    'products' => [
        'name' => 'Produit A',
        'quantity' => 2,
        'price' => 59.99
    ],
    'total_amount' => 119.98,
    'order_id' => 'CMD-2024-001',
    'source' => 'votre-site-web'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:3001/api/orders/external');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode === 201 && $data['success']) {
    echo "Commande envoyée avec succès: " . $data['order_id'];
} else {
    echo "Erreur: " . $data['error'];
}
```

### Python (requests)
```python
import requests
import json

order_data = {
    "customer_name": "Jean Dupont",
    "customer_phone": "0612345678",
    "customer_email": "jean.dupont@email.com",
    "customer_address": "25 rue Pelleport, 33800 Bordeaux",
    "products": {
        "name": "Produit A",
        "quantity": 2,
        "price": 59.99
    },
    "total_amount": 119.98,
    "order_id": "CMD-2024-001",
    "source": "votre-site-web"
}

response = requests.post(
    'http://localhost:3001/api/orders/external',
    headers={'Content-Type': 'application/json'},
    data=json.dumps(order_data)
)

if response.status_code == 201:
    data = response.json()
    if data['success']:
        print(f"Commande envoyée avec succès: {data['order_id']}")
    else:
        print(f"Erreur: {data['error']}")
else:
    print(f"Erreur HTTP: {response.status_code}")
```

## Notes importantes

1. **Statut automatique** : Toutes les commandes reçues via cette API sont automatiquement marquées comme "pending" (en attente)
2. **Assignation opérateur** : Les commandes seront automatiquement assignées aux opérateurs disponibles
3. **Historique** : Chaque commande conserve un historique de ses actions
4. **Validation** : Les données sont validées côté serveur avant l'enregistrement
5. **Logs** : Toutes les commandes reçues sont loggées pour le suivi

## Support

Pour toute question ou problème avec l'API, contactez l'équipe technique. 