# LeadImmo API

API REST backend de l'application [LeadImmo](https://github.com/nicolas234567/LeadImmo_Saas_Immobilier), développée avec Node.js, Express et PostgreSQL.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Base de données | PostgreSQL (driver `pg`) |
| Authentification | JWT (`jsonwebtoken`) |
| Hash mot de passe | bcryptjs |
| Upload fichiers | multer (stockage en mémoire → colonne bytea) |
| Config | dotenv |

## Démarrage

```bash
cd LeadImmo_backend
npm install
node index.js       # ou : npx nodemon index.js (rechargement auto)
```

Le serveur écoute sur le port **3000** par défaut.

## Variables d'environnement

Créer un fichier `.env` dans `LeadImmo_backend/` :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadimmo
DB_USER=<utilisateur postgres>
DB_PASSWORD=<mot de passe>
JWT_SECRET=<clé secrète longue et aléatoire>
```

## Structure du projet

```
LeadImmo_backend/
├── index.js            # Point d'entrée — monte les routes
├── db.js               # Pool de connexion PostgreSQL
├── auth/
│   ├── login.js        # POST /auth/login
│   └── createAccount.js# POST /auth/createAccount
├── app/
│   ├── leads.js        # CRUD /leads
│   └── properties.js   # CRUD /properties (+ upload image)
└── middleware/
    └── auth.js         # Vérification JWT (Bearer token)
```

## Schéma de base de données

### Table `users`

| Colonne | Type | Description |
|---|---|---|
| id | SERIAL PK | Identifiant |
| email | TEXT UNIQUE | Adresse email |
| password | TEXT | Hash bcrypt |
| agency_id | INTEGER | Agence associée |

### Table `properties`

| Colonne | Type | Description |
|---|---|---|
| id | SERIAL PK | Identifiant |
| agency_id | INTEGER | Agence propriétaire |
| title | TEXT | Titre du bien |
| address | TEXT | Adresse |
| price | NUMERIC | Prix |
| status | TEXT | `available` \| `under_offer` \| `sold` |
| image_data | BYTEA | Image binaire (optionnelle) |
| image_mimetype | TEXT | Type MIME de l'image |
| created_at | TIMESTAMP | Date de création |

### Table `leads`

| Colonne | Type | Description |
|---|---|---|
| id | SERIAL PK | Identifiant |
| agency_id | INTEGER | Agence propriétaire |
| property_id | INTEGER FK | Bien associé (optionnel) |
| name | TEXT | Nom du lead |
| email | TEXT | Email |
| phone | TEXT | Téléphone |
| status | TEXT | `new` \| `contacted` \| `visiting` \| `offer` |
| budget | NUMERIC | Budget estimé (optionnel) |
| notes | TEXT | Notes libres (optionnel) |
| created_at | TIMESTAMP | Date de création |

---

## Référence des endpoints

Toutes les routes sauf `/auth/*` nécessitent un header :
```
Authorization: Bearer <token>
```

### Authentification

#### `POST /auth/createAccount`
Crée un compte utilisateur.

**Body JSON :**
```json
{ "email": "user@example.com", "password": "motdepasse" }
```
**Réponse 201 :** objet utilisateur créé (sans mot de passe en clair).

---

#### `POST /auth/login`
Connecte un utilisateur et retourne un token JWT (durée : 1 h).

**Body JSON :**
```json
{ "email": "user@example.com", "password": "motdepasse" }
```
**Réponse 200 :**
```json
{ "token": "<jwt>" }
```

---

### Biens immobiliers (`/properties`)

#### `GET /properties`
Retourne la liste des biens de l'agence connectée.

**Réponse 200 :** tableau de biens (sans `image_data`).

---

#### `GET /properties/:id`
Retourne un bien par son identifiant.

**Réponse 200 :** objet bien. **404** si introuvable.

---

#### `GET /properties/:id/image`
Retourne l'image binaire du bien.

**Réponse 200 :** contenu binaire avec header `Content-Type` correspondant. **404** si pas d'image.

---

#### `POST /properties`
Crée un nouveau bien. Supporte l'upload d'image via `multipart/form-data`.

**Body (`multipart/form-data` ou JSON) :**
| Champ | Type | Obligatoire |
|---|---|---|
| title | string | oui |
| address | string | oui |
| price | number | oui |
| status | string | non (défaut : `available`) |
| image | fichier image | non (max 5 Mo) |

**Réponse 201 :** objet bien créé.

---

#### `PATCH /properties/:id`
Met à jour un bien existant. Si une image est fournie, elle remplace l'ancienne.

**Body :** mêmes champs que `POST /properties`.

**Réponse 200 :** objet bien mis à jour. **404** si introuvable.

---

#### `DELETE /properties/:id`
Supprime un bien.

**Réponse 200 :** `{ "message": "Bien supprimé" }`. **404** si introuvable.

---

### Leads (`/leads`)

#### `GET /leads`
Retourne la liste des leads de l'agence connectée, avec le titre du bien associé.

**Réponse 200 :** tableau de leads.

---

#### `GET /leads/:id`
Retourne un lead par son identifiant.

**Réponse 200 :** objet lead. **404** si introuvable.

---

#### `POST /leads`
Crée un nouveau lead.

**Body JSON :**
| Champ | Type | Obligatoire |
|---|---|---|
| name | string | oui |
| email | string | oui |
| phone | string | oui |
| property_id | string\|null | non |
| status | string | non (défaut : `new`) |
| budget | number | non |
| notes | string | non |

**Réponse 201 :** objet lead créé.

---

#### `PATCH /leads/:id`
Met à jour un lead existant.

**Body JSON :** mêmes champs que `POST /leads`.

**Réponse 200 :** objet lead mis à jour. **404** si introuvable.

---

#### `DELETE /leads/:id`
Supprime un lead.

**Réponse 200 :** `{ "message": "Lead supprimé" }`. **404** si introuvable.

---

## Middleware d'authentification

`middleware/auth.js` est appliqué sur toutes les routes `/leads` et `/properties`. Il :
1. Lit le header `Authorization: Bearer <token>`
2. Vérifie le JWT avec `JWT_SECRET`
3. Injecte `req.user = { user_id, agency_id }` pour les handlers suivants
4. Retourne **401** si token absent, **403** si token invalide ou expiré

L'isolation des données par agence est assurée par le filtre `agency_id = req.user.agency_id` dans chaque requête SQL.
