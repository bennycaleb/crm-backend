# Guide de Déploiement Frontend - CRM

## ✅ **Nouvelles Corrections Déployées**

### **Modifications apportées :**
- **Section "Commandes"** : Garde les commandes externes (`external_pending`)
- **Section "Commandes à traiter"** : Interface complète identique à "Commandes" + commandes validées par opérateurs
- **Exports Excel/PDF** : Adaptés selon l'onglet actif
- **Formulaire complet** : Création/modification dans "Commandes à traiter"

## 🚀 **Options de Déploiement**

### **Option 1 : Netlify (Recommandé)**
```bash
# Si Netlify CLI est installé
netlify deploy --prod --dir=build

# Ou via l'interface web Netlify
# 1. Aller sur netlify.com
# 2. Drag & drop le dossier build/
# 3. Ou connecter votre repository Git
```

### **Option 2 : Vercel**
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### **Option 3 : GitHub Pages**
```bash
# Ajouter dans package.json
"homepage": "https://votre-username.github.io/votre-repo"

# Déployer
npm run deploy
```

### **Option 4 : Hébergeur Classique**
- Uploader le contenu du dossier `build/` sur votre hébergeur
- Fichiers principaux : `index.html`, `static/`, `_redirects`

## 📁 **Fichiers de Déploiement**

### **Archive prête :**
- `frontend-deploy.zip` (3.3 MB) - Contient tout le nécessaire

### **Dossier build/ :**
- `index.html` - Page principale
- `static/` - CSS, JS, assets
- `_redirects` - Configuration Netlify
- `asset-manifest.json` - Manifeste des assets

## 🔧 **Configuration**

### **API Backend :**
- URL : `https://crm-backend-nwl9.onrender.com`
- Déployé automatiquement sur Render

### **Variables d'environnement :**
- Aucune requise (API URL dans `src/apiConfig.js`)

## ✅ **Vérification Post-Déploiement**

1. **Section "Commandes"** : Affiche les commandes externes
2. **Section "Commandes à traiter"** : Interface complète avec formulaire
3. **Exports** : Fonctionnent dans les deux sections
4. **API** : Connexion au backend fonctionnelle

## 🆘 **Support**

En cas de problème :
1. Vérifier la console du navigateur
2. Contrôler la connexion API
3. Vérifier les logs de déploiement

---
**Dernière mise à jour :** 22 juillet 2025
**Version :** Avec corrections "Commandes à traiter" 