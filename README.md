<div align="center">

# 🎓 Booking EFREI

### Système de réservation de salles de classe

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Démarrage rapide](#-démarrage-rapide) •
[Documentation](#-documentation) •
[API](#-api-endpoints) •
[Tests](#-tests) •
[Sécurité](#-sécurité)

</div>

---

## 📋 Table des matières

- [📖 À propos](#-à-propos)
- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🚀 Démarrage rapide](#-démarrage-rapide)
- [📁 Structure du projet](#-structure-du-projet)
- [🔧 Configuration](#-configuration)
- [📚 Documentation](#-documentation)
- [🧪 Tests](#-tests)
- [🛡️ Sécurité](#️-sécurité)
- [🌐 API Endpoints](#-api-endpoints)
- [👥 Contributeurs](#-contributeurs)

---

## 📖 À propos

**Booking EFREI** est une application web full-stack permettant aux étudiants et professeurs de l'EFREI de réserver des salles de classe. Le système offre une interface intuitive avec calendrier interactif et gestion complète des réservations.

### 🎯 Objectif du projet

- Faciliter la réservation de salles de classe
- Éviter les conflits de réservation
- Fournir une vue d'ensemble des disponibilités
- Gérer les utilisateurs et leurs permissions

---

## ✨ Fonctionnalités

<table>
<tr>
<td width="50%">

### 🔐 Authentification

- ✅ Inscription / Connexion sécurisée
- ✅ JWT Token avec expiration 7 jours
- ✅ Hashage bcrypt des mots de passe
- ✅ Middleware d'authentification
- ✅ Protection contre le brute force

</td>
<td width="50%">

### 📅 Réservations

- ✅ Calendrier interactif (FullCalendar)
- ✅ Vue journalière / hebdomadaire / mensuelle
- ✅ Création / Modification / Suppression
- ✅ Vérification des conflits
- ✅ Filtres par salle et date

</td>
</tr>
<tr>
<td width="50%">

### 🏢 Gestion des salles

- ✅ Liste des salles disponibles
- ✅ Détails et capacité
- ✅ Disponibilité en temps réel
- ✅ Recherche et filtres

</td>
<td width="50%">

### 👤 Gestion utilisateurs

- ✅ Profils utilisateurs
- ✅ Rôles (Admin / User)
- ✅ Historique des réservations
- ✅ Paramètres de compte

</td>
</tr>
</table>

---

## 🏗️ Architecture

```mermaid
graph TB
    A[Client React] -->|HTTP/JSON| B[Express API]
    B -->|Prisma ORM| C[(PostgreSQL)]
    B -->|JWT Auth| D[Middleware]
    D -->|Verify Token| B
    E[Tests Sécurité] -.->|Brute Force| B
```

### 🔧 Stack technique

**Frontend** ([`/client`](./client))

- React 19.2 + TypeScript
- Vite (Build tool)
- TailwindCSS 4.1 (Styling)
- FullCalendar (Interface calendrier)
- React Router (Navigation)

**Backend** ([`/back`](./back))

- Node.js + Express 5.1
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT + Bcrypt
- Express Rate Limit

**Tests** ([`/tests`](./tests))

- Vitest (Unit tests)
- Python (Security tests)

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) >= 18.x
- [PostgreSQL](https://www.postgresql.org/) >= 14.x
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- [Python](https://www.python.org/) >= 3.7 (pour tests de sécurité)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/votre-username/booking-efrei.git
cd booking-efrei

# 2. Installer les dépendances backend
cd back
npm install

# 3. Installer les dépendances frontend
cd ../client
npm install
```

### Configuration

```bash
# 1. Créer le fichier .env dans /back
cd ../back
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/booking_efrei"
JWT_SECRET="votre_secret_jwt_super_securise"
PORT=3000
EOF

# 2. Configurer la base de données
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # (optionnel) Données de test
```

### Lancement

```bash
# Terminal 1 - Backend (port 3000)
cd back
npm run dev

# Terminal 2 - Frontend (port 5173)
cd client
npm run dev
```

🎉 **L'application est accessible sur** → [http://localhost:5173](http://localhost:5173)

### 🐳 Avec Docker Compose

```bash
# Lancer tous les services
docker-compose up -d

# Arrêter les services
docker-compose down
```

---

## 📁 Structure du projet

```
booking-efrei/
├── 📂 back/                      # Backend Express + Prisma
│   ├── 📂 controller/            # Logique métier
│   │   ├── 📂 auth/              # Authentification
│   │   ├── 📂 reservation/       # Gestion réservations
│   │   ├── 📂 room/              # Gestion salles
│   │   └── 📂 user/              # Gestion utilisateurs
│   ├── 📂 db/                    # Configuration Prisma
│   │   └── 📄 prisma.ts         # Client Prisma
│   ├── 📂 helper/                # Fonctions utilitaires
│   ├── 📂 middleware/            # Middlewares Express
│   │   ├── 📄 userIsAuth.ts     # Vérification JWT
│   │   └── 📄 admin.ts          # Vérification role admin
│   ├── 📂 routes/                # Routes API
│   │   ├── 📄 auth.ts           # Routes authentification
│   │   ├── 📄 user.ts           # Routes utilisateurs
│   │   ├── 📄 room.ts           # Routes salles
│   │   └── 📄 reservation.ts    # Routes réservations
│   ├── 📂 prisma/                # Schéma & Migrations
│   │   ├── 📄 schema.prisma     # Modèle de données
│   │   └── 📂 migrations/       # Migrations SQL
│   ├── 📄 index.ts              # Point d'entrée
│   ├── 📄 app.ts                # Configuration Express
│   └── 📄 package.json          # Dépendances backend
│
├── 📂 client/                    # Frontend React
│   ├── 📂 src/
│   │   ├── 📂 components/       # Composants réutilisables
│   │   ├── 📂 pages/            # Pages de l'application
│   │   │   ├── 📄 Login.tsx    # Page connexion
│   │   │   ├── 📄 Register.tsx # Page inscription
│   │   │   ├── 📄 Dashboard.tsx # Tableau de bord
│   │   │   ├── 📄 Calendar.tsx # Calendrier réservations
│   │   │   └── 📄 Rooms.tsx    # Liste des salles
│   │   ├── 📂 services/         # Services API
│   │   │   ├── 📄 auth.ts      # Service authentification
│   │   │   ├── 📄 reservation.ts # Service réservations
│   │   │   └── 📄 room.ts      # Service salles
│   │   ├── 📄 App.tsx           # Composant principal
│   │   └── 📄 main.tsx          # Point d'entrée
│   └── 📄 package.json          # Dépendances frontend
│
├── 📂 tests/                     # Tests
│   └── 📂 security/             # Tests de sécurité
│       ├── 📄 brute_force.py   # Test brute force
│       ├── 📄 wordlist.txt     # Liste mots de passe
│       ├── 📄 requirements.txt # Dépendances Python
│       └── 📄 setup.sh         # Script d'installation
│
├── 📄 docker-compose.yml        # Configuration Docker
└── 📄 README.md                 # Ce fichier
```

### 🔍 Fichiers importants

| Fichier              | Description                                                                | Lien                                     |
| -------------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| 🔧 Configuration API | [`back/app.ts`](./back/app.ts)                                             | Configuration Express, CORS, middlewares |
| 🗄️ Modèle de données | [`back/prisma/schema.prisma`](./back/prisma/schema.prisma)                 | Schéma de la base de données             |
| 🔐 Authentification  | [`back/controller/auth/auth-user.ts`](./back/controller/auth/auth-user.ts) | Logique de connexion/JWT                 |
| 🛡️ Middleware Auth   | [`back/middleware/userIsAuth.ts`](./back/middleware/userIsAuth.ts)         | Vérification du token JWT                |
| 📅 Calendrier        | [`client/src/pages/Calendar.tsx`](./client/src/pages/Calendar.tsx)         | Interface de réservation                 |
| 🔌 Routes API        | [`back/routes/`](./back/routes/)                                           | Toutes les routes de l'API               |

---

## 🔧 Configuration

### Variables d'environnement Backend

Créez un fichier [`.env`](./back/.env) dans le dossier `/back` :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/booking_efrei"

# JWT
JWT_SECRET="votre_secret_jwt_tres_securise_minimum_32_caracteres"

# Serveur
PORT=3000
NODE_ENV=development
```

### Variables d'environnement Frontend

Créez un fichier [`.env`](./client/.env) dans le dossier `/client` :

```env
# URL de l'API backend
VITE_API_URL=http://localhost:3000/api
```

---

## 📚 Documentation

### 📖 Documentation du code

- [**Backend**](./back/README.md) - Documentation de l'API et des contrôleurs
- [**Frontend**](./client/README.md) - Guide des composants React
- [**Base de données**](./back/prisma/schema.prisma) - Schéma Prisma

### 🔗 Ressources externes

- [Documentation Express](https://expressjs.com/)
- [Documentation React](https://react.dev/)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation FullCalendar](https://fullcalendar.io/docs)
- [Documentation TailwindCSS](https://tailwindcss.com/docs)

---

## 🧪 Tests

### Tests unitaires (Backend)

```bash
cd back
npm test                    # Lancer tous les tests
npm test -- --watch        # Mode watch
npm test -- --coverage     # Avec couverture de code
```

### Tests unitaires (Frontend)

```bash
cd client
npm test                    # Lancer tous les tests
npm test -- --watch        # Mode watch
npm test -- --coverage     # Avec couverture de code
```

### Tests E2E (Playwright)

```bash
cd client
npx playwright test         # Lancer les tests E2E
npx playwright test --ui    # Mode UI interactif
```

---

## 🛡️ Sécurité

### Tests de sécurité - Brute Force

Le projet inclut des tests de sécurité pour vérifier la résistance aux attaques par force brute.

#### 📂 [Tests de sécurité](./tests/security/)

```bash
cd tests/security

# 1. Configurer l'environnement Python
./setup.sh

# 2. Activer l'environnement virtuel
source venv/bin/activate

# 3. Lancer le test de brute force
python brute_force.py --email test@example.com
```

#### Fichiers de sécurité

| Fichier               | Description                                             | Lien                           |
| --------------------- | ------------------------------------------------------- | ------------------------------ |
| 🔓 Script brute force | [`brute_force.py`](./tests/security/brute_force.py)     | Test d'attaque par force brute |
| 📝 Wordlist           | [`wordlist.txt`](./tests/security/wordlist.txt)         | 65 mots de passe courants      |
| 📦 Dépendances        | [`requirements.txt`](./tests/security/requirements.txt) | Packages Python requis         |
| ⚙️ Setup              | [`setup.sh`](./tests/security/setup.sh)                 | Installation automatique       |

### 🔐 Mesures de sécurité implémentées

✅ **Authentification**

- Hashage des mots de passe avec bcrypt (10 rounds)
- Tokens JWT signés et expirables (7 jours)
- Vérification du token sur toutes les routes protégées

✅ **Protection contre le brute force**

- Délai côté serveur (~10s par tentative)
- Rate limiting avec `express-rate-limit`
- Blocage temporaire après échecs multiples

✅ **Bonnes pratiques**

- Variables d'environnement pour les secrets
- CORS configuré
- Validation des entrées utilisateur
- Pas de fuites d'informations sensibles dans les erreurs

---

## 🌐 API Endpoints

Base URL: `http://localhost:3000/api`

### 🔐 Authentification

| Méthode | Endpoint                             | Description           | Auth requise |
| ------- | ------------------------------------ | --------------------- | ------------ |
| `POST`  | [`/api/auth`](./back/routes/auth.ts) | Connexion utilisateur | ❌           |

**Exemple de requête** :

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Réponse** :

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 👤 Utilisateurs

| Méthode  | Endpoint                              | Description              | Auth requise |
| -------- | ------------------------------------- | ------------------------ | ------------ |
| `POST`   | [`/api/users`](./back/routes/user.ts) | Créer un utilisateur     | ❌           |
| `GET`    | `/api/users`                          | Liste des utilisateurs   | ✅           |
| `GET`    | `/api/users/:id`                      | Détails d'un utilisateur | ✅           |
| `PUT`    | `/api/users/:id`                      | Modifier un utilisateur  | ✅           |
| `DELETE` | `/api/users/:id`                      | Supprimer un utilisateur | ✅ Admin     |

### 🏢 Salles

| Méthode  | Endpoint                              | Description         | Auth requise |
| -------- | ------------------------------------- | ------------------- | ------------ |
| `GET`    | [`/api/rooms`](./back/routes/room.ts) | Liste des salles    | ❌           |
| `GET`    | `/api/rooms/:id`                      | Détails d'une salle | ❌           |
| `POST`   | `/api/rooms`                          | Créer une salle     | ✅ Admin     |
| `PUT`    | `/api/rooms/:id`                      | Modifier une salle  | ✅ Admin     |
| `DELETE` | `/api/rooms/:id`                      | Supprimer une salle | ✅ Admin     |

### 📅 Réservations

| Méthode  | Endpoint                                           | Description               | Auth requise |
| -------- | -------------------------------------------------- | ------------------------- | ------------ |
| `GET`    | [`/api/reservation`](./back/routes/reservation.ts) | Liste des réservations    | ✅           |
| `GET`    | `/api/reservation/:id`                             | Détails d'une réservation | ✅           |
| `POST`   | `/api/reservation`                                 | Créer une réservation     | ✅           |
| `PUT`    | `/api/reservation/:id`                             | Modifier une réservation  | ✅           |
| `DELETE` | `/api/reservation/:id`                             | Supprimer une réservation | ✅           |

### 🔑 Authentification des requêtes

Pour les routes protégées, incluez le token JWT dans le header :

```bash
curl http://localhost:3000/api/reservation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 👥 Contributeurs

<table>
  <tr>
    <td align="center">
      <img src="https://via.placeholder.com/100" width="100px;" alt=""/><br />
      <sub><b>Glenn GUILLARD</b></sub><br />
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100" width="100px;" alt=""/><br />
      <sub><b>Erwan Marega</b></sub><br />
    </td>
    <td align="center">
      <img src="https://via.placeholder.com/100" width="100px;" alt=""/><br />
      <sub><b>Tran Dang Quang</b></sub><br />
    </td>
  </tr>
</table>

