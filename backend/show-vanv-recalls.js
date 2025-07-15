const mongoose = require('mongoose');
const Recall = require('./models/Recall');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm');
  const recalls = await Recall.find({ operator: 'Van.v' });
  console.log('Rappels pour Van.v :');
  for (const r of recalls) {
    console.log(`- Client: ${r.clientName}, Téléphone: ${r.clientPhone}, Date: ${r.recallDate}`);
  }
  if (recalls.length === 0) {
    console.log('Aucun rappel trouvé pour Van.v');
  }
  await mongoose.disconnect();
}

main(); 