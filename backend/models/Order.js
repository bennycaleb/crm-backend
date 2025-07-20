const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  products: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'external_pending', 'validated', 'refused', 'no_answer', 'sent_to_glnet', 'delivered'],
    default: 'pending'
  },
  // Champs supplémentaires pour compatibilité avec le frontend
  address: {
    type: String,
    default: ''
  },
  deliveryDate: {
    type: String,
    default: ''
  },
  operator: {
    type: String,
    default: ''
  },
  channel: {
    type: String,
    default: ''
  },
  history: [{
    date: String,
    action: String,
    utilisateur: String
  }],
  logistics: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  sentToGlNetAt: {
    type: Date,
    default: null
  }
});

// Supprimer les index existants qui causent des problèmes
orderSchema.index({ orderId: 1 }, { unique: false });

module.exports = mongoose.model('Order', orderSchema); 