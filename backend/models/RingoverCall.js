const mongoose = require('mongoose');

const ringoverCallSchema = new mongoose.Schema({
  // Identifiants Ringover
  ringoverId: {
    type: String,
    required: true,
    unique: true
  },
  callId: {
    type: Number,
    required: true
  },
  channelId: {
    type: Number,
    default: null
  },
  
  // Informations de l'appel
  event: {
    type: String,
    enum: ['ringing', 'answered', 'missed', 'hangup', 'voicemail'],
    required: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true
  },
  status: {
    type: String,
    default: 'ringing'
  },
  
  // Numéros de téléphone
  fromNumber: {
    type: String,
    required: true
  },
  toNumber: {
    type: String,
    required: true
  },
  
  // Informations utilisateur
  userId: {
    type: Number,
    default: null
  },
  userName: {
    type: String,
    default: ''
  },
  
  // Métadonnées
  isInternal: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  // Horodatage
  startTime: {
    type: Date,
    required: true
  },
  answerTime: {
    type: Date,
    default: null
  },
  hangupTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // en secondes
    default: 0
  },
  
  // Données IVR (si applicable)
  ivrData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Contact associé (si trouvé dans le CRM)
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  
  // Gestion de l'assignation (pour l'admin)
  assignedOperator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedOperatorName: {
    type: String,
    default: ''
  },
  callStatus: {
    type: String,
    enum: ['en_attente', 'assigné', 'en_cours', 'terminé', 'manqué'],
    default: 'en_attente'
  },
  assignedAt: {
    type: Date,
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Données brutes du webhook
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Date de création dans le CRM
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
ringoverCallSchema.index({ callId: 1 });
ringoverCallSchema.index({ fromNumber: 1 });
ringoverCallSchema.index({ toNumber: 1 });
ringoverCallSchema.index({ event: 1 });
ringoverCallSchema.index({ direction: 1 });
ringoverCallSchema.index({ startTime: -1 });
ringoverCallSchema.index({ createdAt: -1 });
ringoverCallSchema.index({ callStatus: 1 });
ringoverCallSchema.index({ assignedOperator: 1 });

// Middleware pour mettre à jour updatedAt
ringoverCallSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RingoverCall', ringoverCallSchema);


