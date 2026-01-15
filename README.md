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

### 📄 Documents du projet

| Document            | Description                    | Lien                                                     |
| ------------------- | ------------------------------ | -------------------------------------------------------- |
| 📋 README Principal | Guide principal du projet      | [README.md](./README.md)                                 |
| 🔧 Backend README   | Documentation de l'API backend | [back/README.md](./back/README.md)                       |
| ⚛️ Frontend README  | Guide des composants React     | [client/README.md](./client/README.md)                   |
| 🗄️ Schéma Prisma    | Modèle de base de données      | [back/prisma/schema.prisma](./back/prisma/schema.prisma) |
| 🐳 Docker Compose   | Configuration des conteneurs   | [docker-compose.yml](./docker-compose.yml)               |
| 📦 Package Backend  | Dépendances backend            | [back/package.json](./back/package.json)                 |
| 📦 Package Frontend | Dépendances frontend           | [client/package.json](./client/package.json)             |

### 📊 Rapports de tests

| Document                    | Description                                  | Lien                                                                                                                                     |
| --------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 📄 Rapport tests unitaires  | Rapport des tests unitaires et d'intégration | [EasyBooking - test rapport unitaire et intégration.pdf](./documents/EasyBooking%20-%20test%20rapport%20unitaire%20et%20intégration.pdf) |
| 📄 Plan de tests complet    | Plan de tests complet du projet              | [Plan de tests complet.pdf](./documents/Plan%20de%20tests%20complet.pdf)                                                                 |
| 📄 Rapport tests E2E        | Rapport des tests End-to-End                 | [Test E2E.pdf](./documents/Test%20E2E.pdf)                                                                                               |
| � Rapport de qualité        | Rapport de qualité du projet                 | [Rapport de qualité.pdf](./documents/Rapport%20de%20qualité.pdf)                                                                         |
| �🖼️ Capture tests unitaires | Screenshot des tests unitaires réussis       | [unit-test-pass.png](./documents/unit-test-pass.png)                                                                                     |
| 🖼️ Capture tests E2E        | Screenshot des tests E2E réussis             | [tests-E2E-pass-screen.png](./documents/tests-E2E-pass-screen.png)                                                                       |
| 🖼️ Capture test brute force | Screenshot du test de sécurité brute force   | [pass-brut-force.png](./documents/pass-brut-force.png)                                                                                   |

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
│   ├── 📂 tests/                 # Unit tests and Integration tests
│   │   ├── 📂 auth/             # Auth-user tests
│   │   └── 📂 reservation/      # Reservation tests
│   │   └── 📂 room/             # Room tests
│   │   └── 📂 user/             # User tests
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

- Vitest (Unit tests, Integration tests)
- Playwright (E2E tests)
- Python (Security tests)

---

## 🚀 Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org/) >= 20.x
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

### Configuration backend

Dans le dossier `/back`, créez le fichier `.env` avec les variables d'environnement suivantes :

```env
DATABASE_URL="postgresql://booking_user:booking_password@localhost:5432/booking_db"
JWT_SECRET="votre_secret_jwt_super_securise_minimum_32_caracteres"
```

Si vous souhaitez générer le JWT_SECRET, vous pouvez utiliser la commande suivante dans un terminal Node.js :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Avant de lancer le backend, vous devez démarrer le conteneur Docker PostgreSQL avec la commande suivante (depuis le dossier racine du projet) :

```bash
docker-compose up -d
```

Ensuite, initialisez la base de données avec Prisma :

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed  # (optionnel) Données de test
```

❗ **Assurez-vous que vous n'avez pas de PostgreSQL actif sur votre PC. Sinon, les commandes précédentes ne fonctionneront pas.**

## Lancement

### Backend

```bash
cd back
npm run dev
```

📡 **Le serveur API est accessible sur** → [http://localhost:3000](http://localhost:3000)

### Frontend

```bash
cd client
npm run dev
```

🎉 **L'application est accessible sur** → [http://localhost:5173](http://localhost:5173)

## 🧪 Tests

### Tests unitaires/d'intégration(Backend)

```bash
cd back
npm test                    # Lancer tous les tests
npx vitest --ui             # Mode UI
npm test:report             # Exporter les tests en Excel
```

### Tests unitaires (Frontend)

```bash
cd client
npm test                    # Lancer tous les tests
npm test -- --watch        # Mode watch
npm test -- --coverage     # Avec couverture de code
```

### Tests E2E (Playwright)

Avant de lancer les tests E2E, créez un fichier `.env` dans le dossier `/client`. Vous devrez y renseigner l'email et le mot de passe d'un utilisateur admin existant dans la base de données. Vous pouvez utiliser les données de seed.

```env
ADMIN_EMAIL="admin@booking.com"
ADMIN_PASSWORD="Admin123!"
```

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

**Base URL:** `http://localhost:3000/api`

Pour consulter la liste complète des endpoints disponibles, référez-vous à la [documentation backend](./back/README.md).

### Endpoints principaux

| Catégorie       | Endpoint                  | Description                         |
| --------------- | ------------------------- | ----------------------------------- |
| 🔐 Auth         | `POST /api/auth/register` | Inscription d'un nouvel utilisateur |
| 🔐 Auth         | `POST /api/auth/login`    | Connexion utilisateur               |
| 👤 Users        | `GET /api/users`          | Liste des utilisateurs              |
| 🏢 Rooms        | `GET /api/rooms`          | Liste des salles                    |
| 📅 Reservations | `GET /api/reservations`   | Liste des réservations              |
| 📅 Reservations | `POST /api/reservations`  | Créer une réservation               |

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
      <sub><b>Tran Dang Quang LE</b></sub><br />
    </td>
  </tr>
</table>
