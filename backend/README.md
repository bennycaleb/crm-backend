# CRM Backend - Configuration MongoDB

## 🚀 Configuration rapide

### 1. Créer une base de données MongoDB Atlas

1. **Allez sur [mongodb.com/atlas](https://mongodb.com/atlas)**
2. **Créez un compte gratuit** ou connectez-vous
3. **Créez un cluster gratuit (M0)**
4. **Configurez la sécurité :**
   - Créez un utilisateur : `crm-admin` / `CrmSecure2024!`
   - Autorisez l'accès depuis n'importe où (0.0.0.0/0)
5. **Obtenez l'URI de connexion**

### 2. Configuration des variables d'environnement

Créez un fichier `.env` dans le dossier `backend/` :

```env
# MongoDB Atlas (remplacez avec votre URI)
MONGODB_URI=mongodb+srv://crm-admin:CrmSecure2024!@cluster0.xxxxx.mongodb.net/crm?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=development

# JWT Secret (générez une clé aléatoire)
JWT_SECRET=your-super-secret-jwt-key-here

# CORS Origins
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

### 3. Test et initialisation

```bash
# Tester la connexion MongoDB
npm run test-mongodb

# Initialiser la base de données avec des données de test
npm run init-db

# Ou faire les deux en une fois
npm run setup
```

### 4. Démarrer le serveur

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📋 Comptes de test créés

Après l'initialisation, vous aurez ces comptes :

- **Admin :** `admin@crm.com` / `password`
- **Opérateur :** `operator@crm.com` / `password`

## 🔧 Configuration Render

### Variables d'environnement sur Render

Dans votre dashboard Render, ajoutez ces variables :

1. `MONGODB_URI` : Votre URI MongoDB Atlas
2. `NODE_ENV` : `production`
3. `JWT_SECRET` : Une clé secrète aléatoire
4. `ALLOWED_ORIGINS` : `https://your-frontend-domain.com`

### Redéploiement

Après avoir configuré les variables d'environnement :

1. Allez dans "Manual Deploy"
2. Cliquez sur "Deploy latest commit"

## 🐛 Dépannage

### Erreur "Authentication failed"

- Vérifiez le nom d'utilisateur et mot de passe dans l'URI
- Assurez-vous que l'utilisateur a les bonnes permissions
- Vérifiez que l'IP est autorisée dans Network Access

### Erreur "Connection timeout"

- Vérifiez que l'URI est correct
- Assurez-vous que le cluster MongoDB Atlas est actif
- Vérifiez les paramètres de sécurité réseau

### Erreur "Invalid URI"

- Vérifiez le format de l'URI MongoDB
- Assurez-vous que les caractères spéciaux sont encodés

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans Render
2. Testez la connexion localement avec `npm run test-mongodb`
3. Vérifiez la configuration MongoDB Atlas 