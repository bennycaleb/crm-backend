const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  action: String, // vue, modif, suppression, export, etc.
  utilisateur: String, // username ou id
  date: { type: Date, default: Date.now },
  commandeId: String,
  details: String
});

module.exports = mongoose.model('Log', LogSchema); 