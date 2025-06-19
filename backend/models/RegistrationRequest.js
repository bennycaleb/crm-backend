const mongoose = require('mongoose');

const RegistrationRequestSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telephone: { type: String, required: true },
  passeportFile: { type: String, required: true },
  experience: { type: String, enum: ['oui', 'non'], required: true },
  role: { type: String, enum: ['admin', 'operateur'], required: true },
  status: { type: String, enum: ['en_attente', 'approuve', 'refuse'], default: 'en_attente' },
  dateDemande: { type: Date, default: Date.now },
  dateTraitement: { type: Date },
  traitePar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('RegistrationRequest', RegistrationRequestSchema); 