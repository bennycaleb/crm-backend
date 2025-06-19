# Backend CRM Admin

## Prérequis
- Node.js >= 16
- MongoDB local ou MongoDB Atlas

## Installation

```
cd backend
npm install
```

## Configuration
Créer un fichier '.env` dans le dossier backend :

```
MONGODB_URI=mongodb://localhost:27017/crm
PORT=5000
```

## Lancement

```
npm start
```

L'API sera disponible sur http://localhost:5000/api/orders

## Structure
- `models/Order.js` : schéma des commandes
- `models/User.js` : schéma des utilisateurs
- `models/Log.js` : schéma des logs/journalisation
- `server.js` : serveur Express principal 

# Trigger redeploy on Render 