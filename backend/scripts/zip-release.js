/**
 * Crée crm-backend-dist.zip à partir de dist/ (après npm run build).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const zipOut = path.join(root, 'crm-backend-dist.zip');
const readmeSrc = path.join(__dirname, 'DEPLOY_LISEZMOI.txt');

if (!fs.existsSync(path.join(dist, 'server.js'))) {
  console.error('dist/ est vide ou incomplet. Lance d’abord : npm run build');
  process.exit(1);
}

if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, path.join(dist, 'DEPLOY_LISEZMOI.txt'));
}

if (fs.existsSync(zipOut)) {
  fs.unlinkSync(zipOut);
}

execSync(`cd "${dist}" && zip -r -q "${zipOut}" .`, { stdio: 'inherit' });
console.log('');
console.log('Archive créée :', zipOut);
