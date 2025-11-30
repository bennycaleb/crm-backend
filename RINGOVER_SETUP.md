# Configuration Ringover - Guide d'installation

## 📋 Prérequis

1. Un compte Ringover actif
2. Accès à votre tableau de bord Ringover
3. Une clé API Ringover (optionnelle pour les webhooks)

## 🔧 Configuration Backend

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env` :

```env
RINGOVER_WEBHOOK_KEY=votre_cle_webhook_ringover
```

**Note** : La clé webhook est optionnelle en développement mais recommandée en production pour sécuriser les webhooks.

### 2. URL du webhook à configurer dans Ringover

Dans votre tableau de bord Ringover, configurez les webhooks suivants :

**URL du webhook** : `https://votre-backend-url.onrender.com/api/ringover/webhook`

**Événements à activer** :
- ✅ `call_ringing` - Appel en sonnerie
- ✅ `call_answered` - Appel répondu
- ✅ `call_missed` - Appel manqué
- ✅ `call_hangup` - Appel raccroché
- ✅ `call_voicemail` - Message vocal reçu

### 3. Configuration dans Ringover Dashboard

1. Connectez-vous à votre [tableau de bord Ringover](https://app.ringover.com)
2. Allez dans **Paramètres** → **Développeurs** → **Webhooks**
3. Cliquez sur **Ajouter un webhook**
4. Entrez l'URL : `https://votre-backend-url.onrender.com/api/ringover/webhook`
5. Sélectionnez les événements listés ci-dessus
6. Copiez la **clé webhook** générée
7. Ajoutez-la dans votre fichier `.env` comme `RINGOVER_WEBHOOK_KEY`

## 📱 Utilisation dans le CRM

Une fois configuré, les appels apparaîtront automatiquement dans l'onglet **"Appels Ringover"** du CRM.

### Fonctionnalités disponibles :

- ✅ **Affichage en temps réel** : Les appels sont mis à jour toutes les 10 secondes
- ✅ **Filtrage** : Par direction (entrant/sortant), événement, numéro
- ✅ **Association automatique** : Les appels entrants sont automatiquement associés aux contacts existants dans le CRM si le numéro correspond
- ✅ **Historique complet** : Tous les appels sont enregistrés avec leurs détails (durée, horodatage, etc.)

## 🔍 Endpoints API disponibles

### POST `/api/ringover/webhook`
Endpoint pour recevoir les webhooks Ringover (utilisé automatiquement par Ringover)

### GET `/api/ringover/calls`
Récupérer tous les appels avec filtres optionnels :
- `direction` : `inbound` ou `outbound`
- `event` : `ringing`, `answered`, `missed`, `hangup`, `voicemail`
- `fromNumber` : Numéro appelant
- `toNumber` : Numéro appelé
- `startDate` : Date de début (format ISO)
- `endDate` : Date de fin (format ISO)
- `limit` : Nombre de résultats (défaut: 100)
- `offset` : Offset pour pagination (défaut: 0)

### GET `/api/ringover/calls/:id`
Récupérer un appel spécifique par son ID

### GET `/api/ringover/stats`
Récupérer les statistiques des appels :
- Total d'appels
- Appels entrants/sortants
- Appels répondus/manqués
- etc.

## 🧪 Test de l'intégration

1. Passez un appel vers votre numéro Ringover
2. Vérifiez dans le CRM que l'appel apparaît dans l'onglet "Appels Ringover"
3. Vérifiez que les détails de l'appel sont corrects (numéro, direction, événement)

## ⚠️ Notes importantes

- Les webhooks Ringover nécessitent que votre backend soit accessible publiquement (HTTPS)
- La clé webhook est vérifiée pour sécuriser les webhooks (sauf en développement)
- Les appels sont automatiquement associés aux contacts du CRM si le numéro correspond
- Les données sont stockées dans MongoDB dans la collection `ringovercalls`

## 🆘 Dépannage

### Les appels n'apparaissent pas dans le CRM

1. Vérifiez que les webhooks sont bien configurés dans Ringover
2. Vérifiez les logs du backend pour voir si les webhooks sont reçus
3. Vérifiez que l'URL du webhook est correcte et accessible
4. Vérifiez que les événements sont bien activés dans Ringover

### Erreur "Clé webhook invalide"

1. Vérifiez que `RINGOVER_WEBHOOK_KEY` est bien défini dans `.env`
2. Vérifiez que la clé correspond à celle générée dans Ringover
3. En développement, cette vérification est désactivée automatiquement


