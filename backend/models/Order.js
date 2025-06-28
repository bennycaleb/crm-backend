const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  phone: { type: String, required: true },
  adresse: { type: String, required: true },
  date: { type: String, required: true },
  produit: { type: String, required: true },
  quantite: { type: Number, default: 1 },
  prix: { type: Number, default: 0 },
  statut: { 
    type: String, 
    enum: ['En attente', 'Validée', 'Expédiée', 'Livrée', 'Refus', 'Appel sans réponse', 'Rappel', 'Poubelle'],
    default: 'En attente' 
  },
  logistique: { type: Boolean, default: false },
  operateur: { type: String, default: 'Opérateur' },
  canal: { type: String, default: 'Téléphone' },
  historique: [{
    date: { type: String, required: true },
    action: { type: String, required: true },
    utilisateur: { type: String, required: true }
  }],
  dateCreation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema); 