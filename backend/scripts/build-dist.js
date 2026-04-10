/**
 * Build "dist/" pour hébergeurs qui attendent un dossier de sortie (ex. Hostinger).
 * Copie server.js, routes/, models/ et les manifests npm — pas de .env (à configurer sur le panneau).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const toCopy = [
  ['server.js', 'server.js'],
  ['package-lock.json', 'package-lock.json'],
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

rmrf(dist);
fs.mkdirSync(dist, { recursive: true });

for (const [from, to] of toCopy) {
  const srcPath = path.join(root, from);
  if (!fs.existsSync(srcPath)) {
    console.error('Fichier manquant:', srcPath);
    process.exit(1);
  }
  fs.copyFileSync(srcPath, path.join(dist, to));
}

copyDir(path.join(root, 'routes'), path.join(dist, 'routes'));
copyDir(path.join(root, 'models'), path.join(dist, 'models'));

// package.json dédié au déploiement (dist/) : pas de scripts qui pointent vers scripts/ absents du zip
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const distPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: 'server.js',
  scripts: {
    // Hostinger lance souvent "npm run build" : doit réussir sans fichiers hors dist/
    build: 'node -e "console.log(\\"dist: prêt (aucune compilation)\\"); process.exit(0);"',
    start: 'node server.js',
  },
  dependencies: pkg.dependencies,
  devDependencies: pkg.devDependencies,
  keywords: pkg.keywords,
  author: pkg.author,
  license: pkg.license,
};
fs.writeFileSync(path.join(dist, 'package.json'), JSON.stringify(distPkg, null, 2) + '\n');

console.log('Build OK →', dist);
