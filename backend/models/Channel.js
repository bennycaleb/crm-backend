const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  // Opérateurs assignés à ce canal (par l'admin)
  assignedOperators: [{
    operatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    operatorName: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Statistiques du canal
  stats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    pendingOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    }
  },
  // Actif ou non
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les recherches rapides
channelSchema.index({ productName: 1 });
channelSchema.index({ isActive: 1 });
channelSchema.index({ 'assignedOperators.operatorId': 1 });

// Middleware pour mettre à jour updatedAt
channelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Channel', channelSchema);

