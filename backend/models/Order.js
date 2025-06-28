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
    enum: ['pending', 'validated', 'refused', 'no_answer', 'sent_to_glnet', 'delivered'],
    default: 'pending'
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

module.exports = mongoose.model('Order', orderSchema); 