# LeadImmo API

Backend REST de l'application [LeadImmo](https://github.com/nicolas234567/LeadImmo_Saas_Immobilier) — Node.js, Express 5, PostgreSQL.

---

## Stack

| | |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Base de données | PostgreSQL (`pg`) |
| Auth | JWT (`jsonwebtoken`) + bcryptjs |
| Upload | multer → stockage binaire en colonne `bytea` |
| Config | dotenv |

## Démarrage

```bash
cd LeadImmo_backend
npm install
node index.js          # ou npx nodemon index.js
```

Créer un `.env` dans `LeadImmo_backend/` :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadimmo
DB_USER=<utilisateur postgres>
DB_PASSWORD=<mot de passe>
JWT_SECRET=<clé secrète longue et aléatoire>
```

## Structure

```
LeadImmo_backend/
├── index.js                   # Point d'entrée
├── db.js                      # Pool PostgreSQL
├── auth/
│   ├── login.js               # POST /auth/login
│   ├── createAccount.js       # POST /auth/createAccount (auth requise)
│   └── createAccountAgency.js # POST /auth/createAccountAgency (public)
├── app/
│   ├── accounts.js            # CRUD /accounts
│   ├── leads.js               # CRUD /leads
│   └── properties.js          # CRUD /properties
└── middleware/
    └── auth.js                # Vérification JWT
```

## Base de données

### `agencies`
| Colonne | Type | |
|---|---|---|
| id | SERIAL PK | |
| name | TEXT | Nom de l'agence |
| email | TEXT | |

### `users`
| Colonne | Type | |
|---|---|---|
| id | SERIAL PK | |
| email | TEXT UNIQUE | |
| password | TEXT | Hash bcrypt |
| role | TEXT | |
| agency_id | INTEGER FK | |
| created_at | TIMESTAMP | |

### `properties`
| Colonne | Type | |
|---|---|---|
| id | SERIAL PK | |
| agency_id | INTEGER | |
| title | TEXT | |
| address | TEXT | |
| price | NUMERIC | |
| status | TEXT | `available` \| `under_offer` \| `sold` |
| image_data | BYTEA | Optionnelle |
| image_mimetype | TEXT | |
| created_at | TIMESTAMP | |

### `leads`
| Colonne | Type | |
|---|---|---|
| id | SERIAL PK | |
| agency_id | INTEGER | |
| property_id | INTEGER FK | Optionnel |
| name | TEXT | |
| email | TEXT | |
| phone | TEXT | |
| status | TEXT | `new` \| `contacted` \| `visiting` \| `offer` |
| budget | NUMERIC | Optionnel |
| notes | TEXT | Optionnel |
| created_at | TIMESTAMP | |

---

## Endpoints

Toutes les routes sauf `/auth/login` et `/auth/createAccountAgency` nécessitent :
```
Authorization: Bearer <token>
```

### Authentification

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/createAccountAgency` | Non | Crée une agence + premier compte (transaction) |
| POST | `/auth/createAccount` | Oui | Ajoute un compte dans l'agence connectée |
| POST | `/auth/login` | Non | Retourne un JWT (durée 1 h) |

**`POST /auth/createAccountAgency`**
```json
{ "email": "admin@agence.com", "password": "...", "agency_name": "Mon Agence" }
```

**`POST /auth/createAccount`**
```json
{ "email": "user@example.com", "password": "..." }
```

**`POST /auth/login`** → `{ "token": "<jwt>" }`

---

### Comptes (`/accounts`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/accounts` | Liste les comptes de l'agence |
| PATCH | `/accounts/:id` | Modifie l'email d'un compte |
| DELETE | `/accounts/:id` | Supprime un compte (minimum 1 requis) |

---

### Biens (`/properties`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/properties` | Liste les biens (sans image_data) |
| GET | `/properties/:id` | Détail d'un bien |
| GET | `/properties/:id/image` | Image binaire du bien |
| POST | `/properties` | Crée un bien (multipart/form-data) |
| PATCH | `/properties/:id` | Met à jour un bien |
| DELETE | `/properties/:id` | Supprime un bien |

Champs pour `POST` / `PATCH` : `title`, `address`, `price`, `status` (défaut : `available`), `image` (fichier, max 5 Mo).

---

### Leads (`/leads`)

| Méthode | Route | Description |
|---|---|---|
| GET | `/leads` | Liste les leads avec le titre du bien associé |
| GET | `/leads/:id` | Détail d'un lead |
| POST | `/leads` | Crée un lead |
| PATCH | `/leads/:id` | Met à jour un lead |
| DELETE | `/leads/:id` | Supprime un lead |

Champs pour `POST` / `PATCH` : `name`, `email`, `phone` (requis) — `property_id`, `status`, `budget`, `notes` (optionnels).

---

## Authentification & isolation

Le middleware JWT injecte `req.user = { user_id, agency_id }` sur toutes les routes protégées. Chaque requête SQL filtre sur `agency_id` — un utilisateur ne peut jamais voir les données d'une autre agence.
