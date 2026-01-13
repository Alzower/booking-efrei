# API Documentation - Booking System

Cette API permet de gérer un système de réservation de salles avec gestion des utilisateurs et authentification.

## Base URL

```
http://localhost:<PORT>/api
```

---

## 🔐 Authentification

### POST `/api/auth`

Authentification d'un utilisateur.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

---

## 👤 Utilisateurs

### GET `/api/users`

Récupère la liste de tous les utilisateurs.

**Permissions:** 🔒 Admin uniquement

**Middleware:** `isAdmin`

**Headers:**

```
Authorization: Bearer <token>
```

**Réponse:**

```json
[
  {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  }
]
```

### GET `/api/users/me`

Récupère les informations de l'utilisateur actuellement connecté.

**Middleware:** `userIsAuth`

**Headers:**

```
Authorization: Bearer <token>
```

**Réponse:**

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

### POST `/api/users`

Crée un nouvel utilisateur (inscription).

**Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Réponse:**

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER"
}
```

### PUT `/api/users/me`

Met à jour les informations de l'utilisateur connecté.

**Middleware:** `userIsAuth`

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "email": "newemail@example.com",
  "firstName": "John",
  "lastName": "Smith"
}
```

**Réponse:**

```json
{
  "id": "user_id",
  "email": "newemail@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "role": "USER"
}
```

### DELETE `/api/users/:id`

Supprime un utilisateur.

**Permissions:** 🔒 Admin uniquement

**Middleware:** `isAdmin`

**Headers:**

```
Authorization: Bearer <token>
```

**Paramètres:**

- `id` (URL) - ID de l'utilisateur

**Réponse:**

```json
{
  "message": "User deleted successfully"
}
```

---

## 🏢 Salles

### GET `/api/rooms`

Récupère la liste de toutes les salles.

**Réponse:**

```json
[
  {
    "id": "room_id",
    "name": "Salle A",
    "capacity": 20,
    "description": "Salle de réunion",
    "equipment": ["Projecteur", "Tableau blanc"]
  }
]
```

### GET `/api/rooms/:id`

Récupère une salle spécifique par son ID.

**Paramètres:**

- `id` (URL) - ID de la salle

**Réponse:**

```json
{
  "id": "room_id",
  "name": "Salle A",
  "capacity": 20,
  "description": "Salle de réunion",
  "equipment": ["Projecteur", "Tableau blanc"]
}
```

### POST `/api/rooms`

Crée une nouvelle salle.

**Permissions:** 🔒 Admin uniquement

**Middleware:** `isAdmin`

**Body:**

```json
{
  "name": "Salle B",
  "capacity": 15,
  "description": "Petite salle de réunion",
  "equipment": ["Écran"]
}
```

**Réponse:**

```json
{
  "id": "room_id",
  "name": "Salle B",
  "capacity": 15,
  "description": "Petite salle de réunion",
  "equipment": ["Écran"]
}
```

### PUT `/api/rooms/:id`

Met à jour une salle existante.

**Permissions:** 🔒 Admin uniquement

**Middleware:** `isAdmin`

**Paramètres:**

- `id` (URL) - ID de la salle

**Body:**

```json
{
  "name": "Salle B - Modifiée",
  "capacity": 18,
  "description": "Salle de réunion mise à jour"
}
```

**Réponse:**

```json
{
  "id": "room_id",
  "name": "Salle B - Modifiée",
  "capacity": 18,
  "description": "Salle de réunion mise à jour"
}
```

### DELETE `/api/rooms/:id`

Supprime une salle.

**Permissions:** 🔒 Admin uniquement

**Middleware:** `isAdmin`

**Paramètres:**

- `id` (URL) - ID de la salle

**Réponse:**

```json
{
  "message": "Room deleted successfully"
}
```

### GET `/api/rooms/:id/availability`

Récupère les horaires de disponibilité d'une salle pour une date donnée.

**Paramètres:**

- `id` (URL) - ID de la salle
- `date` (Query) - Date au format ISO 8601 (ex: 2026-01-15)

**Exemple:**

```
GET /api/rooms/room_id/availability?date=2026-01-15
```

**Réponse (salle disponible toute la journée):**

```json
{
  "message": "La salle est disponible toute la journée",
  "availableTimes": [
    {
      "startTime": "2026-01-15T00:00:00.000Z",
      "endTime": "2026-01-15T23:59:59.999Z"
    }
  ]
}
```

**Réponse (salle partiellement réservée):**

```json
{
  "availableTimes": [
    {
      "startTime": "2026-01-15T00:00:00.000Z",
      "endTime": "2026-01-15T09:00:00.000Z"
    },
    {
      "startTime": "2026-01-15T11:00:00.000Z",
      "endTime": "2026-01-15T14:00:00.000Z"
    },
    {
      "startTime": "2026-01-15T17:00:00.000Z",
      "endTime": "2026-01-15T23:59:59.999Z"
    }
  ]
}
```

---

## 📅 Réservations

**Note:** Tous les endpoints de réservation nécessitent une authentification (`userIsAuth` middleware).

### GET `/api/reservation`

Récupère les réservations de l'utilisateur connecté.

**Headers:**

```
Authorization: Bearer <token>
```

**Réponse:**

```json
[
  {
    "id": "reservation_id",
    "roomId": "room_id",
    "userId": "user_id",
    "startDate": "2026-01-15T09:00:00Z",
    "endDate": "2026-01-15T11:00:00Z",
    "purpose": "Réunion d'équipe"
  }
]
```

### GET `/api/reservation/:date`

Récupère toutes les réservations après une date donnée.

**Headers:**

```
Authorization: Bearer <token>
```

**Paramètres:**

- `date` (URL) - Date au format ISO 8601

**Réponse:**

```json
[
  {
    "id": "reservation_id",
    "roomId": "room_id",
    "userId": "user_id",
    "startDate": "2026-01-15T09:00:00Z",
    "endDate": "2026-01-15T11:00:00Z",
    "purpose": "Réunion d'équipe"
  }
]
```

### GET `/api/reservation/room/:roomId`

Récupère toutes les réservations d'une salle spécifique.

**Permissions:** 🔒 Admin uniquement

**Middleware:** `isAdmin`

**Headers:**

```
Authorization: Bearer <token>
```

**Paramètres:**

- `roomId` (URL) - ID de la salle

**Réponse:**

```json
[
  {
    "id": "reservation_id",
    "roomId": "room_id",
    "userId": "user_id",
    "startDate": "2026-01-15T09:00:00Z",
    "endDate": "2026-01-15T11:00:00Z",
    "purpose": "Réunion d'équipe"
  }
]
```

### POST `/api/reservation`

Crée une nouvelle réservation.

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "roomId": "room_id",
  "startDate": "2026-01-15T09:00:00Z",
  "endDate": "2026-01-15T11:00:00Z",
  "purpose": "Réunion d'équipe"
}
```

**Réponse:**

```json
{
  "id": "reservation_id",
  "roomId": "room_id",
  "userId": "user_id",
  "startDate": "2026-01-15T09:00:00Z",
  "endDate": "2026-01-15T11:00:00Z",
  "purpose": "Réunion d'équipe"
}
```

### DELETE `/api/reservation/:reservationId`

Supprime une réservation.

**Headers:**

```
Authorization: Bearer <token>
```

**Paramètres:**

- `reservationId` (URL) - ID de la réservation

**Réponse:**

```json
{
  "message": "Reservation deleted successfully"
}
```

---

## 🔒 Middlewares

### `userIsAuth`

Vérifie que l'utilisateur est authentifié via un token JWT.

- Appliqué à toutes les routes `/api/reservation/*`

### `isAdmin`

Vérifie que l'utilisateur a le rôle ADMIN.

- Appliqué aux routes de gestion des salles (POST, PUT, DELETE)
- Appliqué à GET `/api/reservation/room/:roomId`

---

## 📝 Codes de statut HTTP

- `200` - Succès
- `201` - Créé avec succès
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Non autorisé (permissions insuffisantes)
- `404` - Ressource non trouvée
- `500` - Erreur serveur

---

## 🚀 Démarrage

1. Installer les dépendances :

```bash
npm install
```

2. Configurer les variables d'environnement dans `.env`

3. Lancer les migrations Prisma :

```bash
npx prisma migrate dev
```

4. Démarrer le serveur :

```bash
npm run dev
```
