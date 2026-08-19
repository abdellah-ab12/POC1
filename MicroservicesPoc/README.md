# MicroservicesPoc

Projet personnel de pratique DevOps : une architecture microservices .NET (Users / Orders / Notifications) avec Postgres, Redis, et un frontend React branché en direct sur les API.

> Projet perso indépendant, pour pratiquer les outils DevOps (Docker, futur K8s/Vault). Sans lien avec un environnement d'entreprise.

## Sommaire

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du repo](#structure-du-repo)
- [Prérequis](#prérequis)
- [Mise en route](#mise-en-route)
- [Scripts utilitaires](#scripts-utilitaires)
- [Tester l'application](#tester-lapplication)
- [Points d'attention connus](#points-dattention-connus)
- [Roadmap](#roadmap)

## Architecture

Trois microservices indépendants, chacun avec sa propre responsabilité et sa propre base de données (pattern *database per service*), qui communiquent en REST/HTTP :

- **Users.Api** (`:5001`) — gestion des utilisateurs. CRUD complet. Base Postgres dédiée `users_db`.
- **Orders.Api** (`:5002`) — gestion des commandes. Base Postgres dédiée `orders_db`. Avant de créer une commande, appelle `Users.Api` en REST pour vérifier que l'utilisateur existe (renvoie `400` sinon, `503` si `Users.Api` est injoignable).
- **Notifications.Api** (`:5003`) — reçoit une notification (`POST`) et la logue côté serveur. Pas de base de données, pas de persistance : c'est volontaire pour ce POC.

**Redis** est câblé sur les 3 services (`Microsoft.Extensions.Caching.StackExchangeRedis`) mais pas encore exploité dans la logique métier — prévu pour une itération future (ex. cache de la vérification utilisateur dans Orders.Api).

Un **frontend React** (Vite) sert de dashboard : une page dédiée par service, avec formulaires de création/édition/suppression branchés en `fetch` sur les vraies API.

```
Client (navigateur)
     │
     ▼
 Frontend React (Vite, :5173)
     │
     ├──► Users.Api (:5001) ──► users_db (Postgres)
     │
     ├──► Orders.Api (:5002) ──► orders_db (Postgres)
     │        │
     │        └──► appel REST vers Users.Api (validation userId)
     │
     └──► Notifications.Api (:5003) ──► log console (pas de DB)
```

## Stack technique

| Composant | Techno |
|---|---|
| API | .NET 10 (ASP.NET Core Web API), Entity Framework Core |
| Base de données | PostgreSQL 16 (Docker), une base par service |
| Cache | Redis 7 (Docker), câblé mais pas encore utilisé métier |
| Frontend | React + Vite, Tailwind CSS v4 (plugin Vite), lucide-react |
| Communication inter-services | REST/HTTP (`HttpClient` typé côté Orders.Api) |
| CORS | Activé (`AllowAnyOrigin`) sur les 3 API — acceptable en local, à durcir en prod |

## Structure du repo

```
MicroservicesPoc/
├── src/
│   ├── Users.Api/
│   │   ├── Controllers/       (UsersController, HealthController)
│   │   ├── Models/             (User.cs)
│   │   ├── Data/                (UsersDbContext.cs)
│   │   └── Migrations/
│   ├── Orders.Api/
│   │   ├── Controllers/       (OrdersController, HealthController)
│   │   ├── Models/             (Order.cs)
│   │   ├── Data/                (OrdersDbContext.cs)
│   │   ├── Clients/             (IUsersApiClient, UsersApiClient — appel REST vers Users.Api)
│   │   └── Migrations/
│   └── Notifications.Api/
│       ├── Controllers/       (NotificationsController, HealthController)
│       └── Models/             (NotificationRequest.cs)
├── frontend/
│   ├── src/
│   │   ├── components/         (MicroservicesConsole.jsx — le dashboard)
│   │   └── services/            (api.js — appels fetch vers les 3 API)
│   └── .env                     (URLs des API — non versionné, voir scripts/)
├── init-scripts/
│   └── init-multiple-dbs.sh    (crée users_db + orders_db au démarrage de Postgres)
├── scripts/
│   ├── fix-dotnet-ef-path.sh   (répare le PATH de dotnet-ef après reset de VM)
│   └── update-frontend-env.sh  (régénère frontend/.env avec les URLs KodeKloud du jour)
├── docker-compose.yml           (Postgres + Redis)
└── MicroservicesPoc.slnx
```

## Prérequis

- .NET SDK 10
- Docker + Docker Compose
- Node.js (pour le frontend Vite)
- `dotnet-ef` (outil global — voir `scripts/fix-dotnet-ef-path.sh` si `dotnet ef` n'est pas reconnu)

## Mise en route

**1. Lancer l'infrastructure (Postgres + Redis) :**

```bash
docker compose up -d
```

**2. Appliquer les migrations EF Core (crée les tables) :**

```bash
cd src/Users.Api && dotnet ef database update && cd ../..
cd src/Orders.Api && dotnet ef database update && cd ../..
```

**3. Lancer les 3 API (un terminal par service) :**

```bash
cd src/Users.Api && dotnet run          # http://0.0.0.0:5001
cd src/Orders.Api && dotnet run         # http://0.0.0.0:5002
cd src/Notifications.Api && dotnet run  # http://0.0.0.0:5003
```

**4. Lancer le frontend :**

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0   # http://localhost:5173
```

> Sur un environnement type KodeKloud (accès via URLs proxy `*.labs.kodekloud.com`), voir [Scripts utilitaires](#scripts-utilitaires) pour configurer `frontend/.env` et `vite.config.js` (`allowedHosts`).

## Scripts utilitaires

### `scripts/fix-dotnet-ef-path.sh`

Corrige `dotnet ef: command not found`, qui survient après un redémarrage complet de la VM (le `PATH` vers les outils .NET globaux ne survit pas toujours). Installe `dotnet-ef` si besoin et persiste le `PATH` dans `.bashrc` et `.bash_profile`.

```bash
./scripts/fix-dotnet-ef-path.sh
```

### `scripts/update-frontend-env.sh`

Régénère `frontend/.env` avec les URLs des 3 API. Utile sur KodeKloud où l'URL proxy change à chaque nouvelle session.

```bash
./scripts/update-frontend-env.sh <hash-kodekloud>
# exemple : ./scripts/update-frontend-env.sh gm5mkqwnzgzrwqgf
# (le hash = la partie après "port-" dans une URL du type 5173-port-<hash>.labs.kodekloud.com)
```

## Tester l'application

**Via l'UI** : ouvrir le frontend, créer un utilisateur dans l'onglet Users.Api, puis une commande dans Orders.Api en le sélectionnant dans le menu déroulant.

**Via curl :**

```bash
# Health check
curl http://localhost:5001/health

# Créer un utilisateur
curl -X POST http://localhost:5001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","fullName":"Test User"}'

# Créer une commande (remplacer <userId> par un vrai id)
curl -X POST http://localhost:5002/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>","productName":"Clavier","quantity":1}'

# Envoyer une notification
curl -X POST http://localhost:5003/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"<userId>","type":"OrderCreated","message":"Test"}'
```

**Vérifier en base :**

```bash
docker exec -it microservices-postgres psql -U postgres -d users_db -c "SELECT * FROM \"Users\";"
docker exec -it microservices-postgres psql -U postgres -d orders_db -c "SELECT * FROM \"Orders\";"
```

## Points d'attention connus

- **Redémarrage de VM (KodeKloud)** : tout ce qui tourne en premier plan (`dotnet run`, `npm run dev`) s'arrête à chaque reset de session. Docker Compose survit si relancé avec `-d`, mais les **volumes peuvent être recréés vides** — vérifier avec `docker ps -a` et réappliquer les migrations si besoin (`relation "Users" does not exist` = tables absentes, migrations à refaire).
- **CORS en `AllowAnyOrigin`** : acceptable pour ce POC local, à restreindre avant tout déploiement réel.
- **Notifications.Api sans persistance** : c'est voulu — le panneau frontend correspondant se vide à chaque rechargement de page, seul le log serveur fait foi.
- **Connection strings en clair** dans `appsettings.Development.json` : externalisation prévue via Vault dans une itération future.

## Roadmap

- [ ] Script `bootstrap.sh` : automatiser `docker compose up -d` + migrations en une commande
- [ ] Dockeriser les 3 API + le frontend (un `Dockerfile` par service)
- [ ] Déploiement Kubernetes
- [ ] Externalisation des secrets via HashiCorp Vault
- [ ] Utilisation concrète de Redis (cache de validation utilisateur dans Orders.Api)
- [ ] Persistance des notifications (historique consultable)
