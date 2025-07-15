const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: String, // 'admin' ou 'operator'
  nom: String,
  prenom: String,
  email: String,
  telephone: String,
  currentCallClient: { type: mongoose.Schema.Types.Mixed, default: null },
  operatorStatus: { type: String, default: 'Hors ligne' }, // 'Connecté', 'Hors ligne', 'Pause', 'Formation'
  operatorStatusTimes: {
    Connecté: { type: Number, default: 0 },
    'Hors ligne': { type: Number, default: 0 },
    Pause: { type: Number, default: 0 },
    Formation: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema); 