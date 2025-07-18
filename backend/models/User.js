const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { 
    type: String, 
    enum: ['admin', 'operator'], // Standardisation des rôles
    default: 'operator'
  },
  nom: String,
  prenom: String
});

module.exports = mongoose.model('User', UserSchema); 