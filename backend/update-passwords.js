const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const updates = [
  { username: 'LBC.m', password: 'LBClbc@242' },
  { username: 'L.benny', password: 'Viegout@242' },
  { username: 'Van.v', password: 'Van@242' }
];

async function updatePasswords() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const { username, password } of updates) {
    const hash = await bcrypt.hash(password, 10);
    const res = await User.updateOne({ username }, { $set: { password: hash } });
    console.log(`Mot de passe mis à jour pour ${username} :`, res.modifiedCount ? 'OK' : 'Non trouvé');
  }
  await mongoose.disconnect();
  console.log('Terminé.');
}

updatePasswords().catch(err => { console.error(err); process.exit(1); }); 