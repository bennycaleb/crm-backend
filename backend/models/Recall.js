const mongoose = require('mongoose');

const RecallSchema = new mongoose.Schema({
  operator: { type: String, required: true }, // username de l'opérateur
  clientName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  recallDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recall', RecallSchema); 