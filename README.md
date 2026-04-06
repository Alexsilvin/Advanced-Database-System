<p align="center">
   <img src="https://capsule-render.vercel.app/api?type=waving&height=260&color=0:00f3ff,50:ff2f6d,100:08090f&text=NEON%20GRID&fontColor=ffffff&fontSize=78&fontAlignY=40&animation=twinkling&desc=Retro%20Game%20Store%20Platform&descAlignY=64&descSize=19" alt="NEON GRID banner" />
</p>

<p align="center">
   <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=700&size=18&pause=1200&color=00F3FF&center=true&vCenter=true&width=920&lines=React%20%2B%20TypeScript%20Frontend;Express%20%2B%20PostgreSQL%20Backend;Admin%20ROM%20Upload%20%7C%20Authenticated%20Signed%20Downloads;Cyber-Retro%20Storefront%20Experience" alt="Animated project intro" />
</p>

<p align="center">
   <img src="https://img.shields.io/badge/THEME-Neon%20Cyber-08090f?style=for-the-badge&logo=codemagic&logoColor=00f3ff&labelColor=0f111a" alt="Theme Neon Cyber" />
   <img src="https://img.shields.io/badge/FRONTEND-React%20%2B%20TypeScript-0f111a?style=for-the-badge&logo=react&logoColor=00f3ff&labelColor=08090f" alt="Frontend React TypeScript" />
   <img src="https://img.shields.io/badge/BACKEND-Express%20%2B%20PostgreSQL-0f111a?style=for-the-badge&logo=postgresql&logoColor=ff2f6d&labelColor=08090f" alt="Backend Express PostgreSQL" />
   <img src="https://img.shields.io/badge/AUTH-Session%20Role%20Based-0f111a?style=for-the-badge&logo=shield&logoColor=00f3ff&labelColor=08090f" alt="Session Role Based Auth" />
   <img src="https://img.shields.io/badge/STORAGE-Filebase%20S3%20Signed%20URLs-0f111a?style=for-the-badge&logo=amazons3&logoColor=ff2f6d&labelColor=08090f" alt="Filebase S3 Signed URLs" />
</p>

<p align="center">
   <img src="https://img.shields.io/badge/STATUS-Prototype%20%E2%86%92%20Production%20Path-08090f?style=flat-square&logo=vercel&logoColor=00f3ff&labelColor=0f111a" alt="Status Prototype to Production Path" />
</p>

<p align="center">
   <b>NEON GRID</b> is a full-stack retro game marketplace prototype inspired by modern digital storefronts, rebuilt with a neon-cyber aesthetic and database-first architecture.
</p>

<p align="center">
   <a href="#1-project-vision">Project Vision</a> •
   <a href="#3-technical-architecture">Technical Architecture</a> •
   <a href="#6-suggested-postgresql-ddl-target">Target Database DDL</a> •
   <a href="#11-practical-next-steps-database-driven-completion">Next Steps</a>
</p>

## Platform Snapshot

This project is a full-stack prototype of a digital game store focused on NES/retro titles.

The current codebase includes:
- A React + TypeScript frontend with Store, Library, Friends, Bucket (cart), Notifications, and Game Detail pages.
- An Express + PostgreSQL backend with seeded catalog and resilient fallback behavior.
- Admin upload flows and authenticated signed-download support for ROM assets.
- A clear path to evolve into a production-grade, database-driven commerce platform.

## Diagrams (Top-Level Showcase)

### 1) System Context
```mermaid
flowchart LR
   U[Player] --> FE[React Frontend SPA]
   FE --> API[Express API Server]
   API --> DB[(PostgreSQL)]
   API --> NF[Netlify Function /games]
   DB --> ADM[Admin / Staff]
```

### 2) Use Case Diagram
```mermaid
flowchart TB
   Player((Player))
   Admin((Admin))

   subgraph Platform[Retro Game Store Platform]
      UC1([Browse Catalog])
      UC2([View Game Details])
      UC3([Add To Bucket])
      UC4([Acquire / Checkout])
      UC5([View Library])
      UC6([Manage Friends])
      UC7([View Notifications])
      UC8([Authenticate Session])
      UC9([Manage Catalog])
      UC10([Monitor Orders])
   end

   Player --> UC1
   Player --> UC2
   Player --> UC3
   Player --> UC4
   Player --> UC5
   Player --> UC6
   Player --> UC7
   Player --> UC8

   Admin --> UC9
   Admin --> UC10
```

### 3) Main Purchase Sequence
```mermaid
sequenceDiagram
   participant P as Player
   participant UI as React UI
   participant API as Express API
   participant DB as PostgreSQL

   P->>UI: Open Store
   UI->>API: GET /api/games
   API->>DB: SELECT * FROM games
   DB-->>API: catalog rows
   API-->>UI: game list JSON

   P->>UI: Add game to bucket
   UI->>API: POST /api/bucket/items (target)
   API->>DB: INSERT bucket_item
   DB-->>API: ok
   API-->>UI: bucket updated

   P->>UI: Acquire all
   UI->>API: POST /api/orders (target)
   API->>DB: BEGIN
   API->>DB: INSERT orders
   API->>DB: INSERT order_items
   API->>DB: INSERT library entries
   API->>DB: DELETE bucket_items
   API->>DB: COMMIT
   DB-->>API: success
   API-->>UI: acquisition completed
```

### 4) Domain Class Diagram
```mermaid
classDiagram
   class User {
      +uuid id
      +string username
      +string email
      +string password_hash
      +string avatar_url
      +string role
      +datetime created_at
   }

   class Game {
      +uuid id
      +string title
      +string slug
      +numeric price
      +string category
      +decimal rating_avg
      +jsonb min_specs
      +jsonb rec_specs
   }

   class BucketItem {
      +uuid user_id
      +uuid game_id
      +int quantity
      +datetime added_at
   }

   class Order {
      +uuid id
      +uuid user_id
      +numeric subtotal
      +numeric tax_amount
      +numeric total_amount
      +string status
      +datetime created_at
   }

   class OrderItem {
      +uuid order_id
      +uuid game_id
      +numeric unit_price
   }

   class LibraryItem {
      +uuid user_id
      +uuid game_id
      +datetime acquired_at
   }

   class Friendship {
      +uuid requester_id
      +uuid addressee_id
      +string status
      +datetime created_at
   }

   class Notification {
      +uuid id
      +uuid user_id
      +string type
      +string title
      +text body
      +boolean is_read
      +datetime created_at
   }

   User "1" --> "*" BucketItem
   User "1" --> "*" Order
   User "1" --> "*" LibraryItem
   User "1" --> "*" Notification
   User "1" --> "*" Friendship
   Game "1" --> "*" BucketItem
   Game "1" --> "*" LibraryItem
   Order "1" --> "*" OrderItem
   Game "1" --> "*" OrderItem
```

### 5) Order State Diagram
```mermaid
stateDiagram-v2
   [*] --> DRAFT
   DRAFT --> PENDING_PAYMENT
   PENDING_PAYMENT --> PAID
   PENDING_PAYMENT --> FAILED
   FAILED --> PENDING_PAYMENT
   PAID --> FULFILLED
   PAID --> REFUNDED
   FULFILLED --> [*]
   REFUNDED --> [*]
```

### 6) Final Database ER Diagram (Target)
```mermaid
erDiagram
   USERS ||--o{ USER_SESSIONS : has
   USERS ||--o{ BUCKET_ITEMS : owns
   USERS ||--o{ ORDERS : places
   USERS ||--o{ LIBRARY_ITEMS : owns
   USERS ||--o{ FRIENDSHIPS : initiates
   USERS ||--o{ FRIENDSHIPS : receives
   USERS ||--o{ NOTIFICATIONS : receives
   USERS ||--o{ REVIEWS : writes

   GAMES ||--o{ BUCKET_ITEMS : appears_in
   GAMES ||--o{ ORDER_ITEMS : sold_as
   GAMES ||--o{ LIBRARY_ITEMS : owned_as
   GAMES ||--o{ REVIEWS : reviewed_in

   ORDERS ||--o{ ORDER_ITEMS : contains
   ORDERS ||--|| PAYMENTS : paid_by

   USERS {
      uuid id PK
      varchar username UK
      varchar email UK
      varchar password_hash
      varchar avatar_url
      varchar role
      timestamptz created_at
   }

   GAMES {
      uuid id PK
      varchar title
      varchar slug UK
      numeric price
      varchar category
      text description
      varchar image_url
      decimal rating_avg
      integer rating_count
      jsonb min_specs
      jsonb rec_specs
      boolean is_active
      timestamptz created_at
   }

   BUCKET_ITEMS {
      uuid user_id FK
      uuid game_id FK
      integer quantity
      timestamptz added_at
   }

   ORDERS {
      uuid id PK
      uuid user_id FK
      varchar status
      numeric subtotal
      numeric tax_amount
      numeric discount_amount
      numeric total_amount
      char currency_code
      timestamptz created_at
   }

   ORDER_ITEMS {
      uuid order_id FK
      uuid game_id FK
      numeric unit_price
      integer quantity
      numeric line_total
   }

   PAYMENTS {
      uuid id PK
      uuid order_id FK
      varchar provider
      varchar status
      varchar external_ref
      numeric amount
      timestamptz paid_at
   }

   LIBRARY_ITEMS {
      uuid user_id FK
      uuid game_id FK
      uuid order_id FK
      timestamptz acquired_at
   }

   FRIENDSHIPS {
      uuid requester_id FK
      uuid addressee_id FK
      varchar status
      timestamptz created_at
      timestamptz updated_at
   }

   NOTIFICATIONS {
      uuid id PK
      uuid user_id FK
      varchar type
      varchar title
      text body
      boolean is_read
      timestamptz created_at
      timestamptz read_at
   }

   REVIEWS {
      uuid user_id FK
      uuid game_id FK
      smallint rating
      text comment
      timestamptz created_at
   }

   USER_SESSIONS {
      uuid id PK
      uuid user_id FK
      varchar token_hash
      timestamptz expires_at
      timestamptz created_at
   }
```

Composite keys and uniqueness constraints are enforced in the SQL DDL section below (Mermaid ER syntax is limited for multi-column key declarations).

## 1. Project Vision

Build a reliable retro game marketplace where players can:
- Discover curated classic/retro titles.
- Add games to a bucket and complete acquisition.
- Maintain a personal library of owned games.
- Interact through social features (friends + notifications).

The long-term objective is to move from UI-local state to full server persistence backed by a strong relational schema.

## 2. Current Implementation Status

### Implemented
- React SPA with polished game-store UX.
- Game catalog loading from `/api/games`.
- PostgreSQL bootstrap (`users`, `games`, `library`, `friends`) in server startup.
- Resilient mock fallback when DB is offline.
- Local persistence for session-like UX via `localStorage`:
   - login flag
   - active tab
   - bucket IDs
   - library IDs

### Partially Implemented / Mocked
- Login is UI-only (no auth backend yet).
- Friends and notifications are mock data in frontend state.
- Checkout/acquisition logic is local state, not transactional DB writes.

## 3. Technical Architecture

- Frontend: React 19 + TypeScript + Vite + Tailwind + Motion.
- Backend: Express 4 (`server.ts`) with TypeScript runtime via `tsx`.
- Data: PostgreSQL through `pg` connection pool.
- Deployment support: Netlify function for games endpoint in `netlify/functions/games.mts`.

## 4. Routing and Feature Mapping

### Frontend Navigation (Tab-Based)
- `store`: catalog browsing and featured carousel
- `game-detail`: per-game deep view and acquisition actions
- `library`: owned games collection
- `bucket`: checkout staging area
- `friends`: social list interactions
- `notifications`: event feed UI

### Backend API (Current)
- `GET /api/games`: returns DB games; falls back to mock list on failure.
- `GET /api/users`: returns users from DB.

### Backend API (Recommended Next)
- `POST /api/auth/login`
- `GET/POST/DELETE /api/bucket`
- `POST /api/orders`
- `GET /api/library/:userId`
- `POST /api/friends/request`
- `PATCH /api/friends/:id`
- `GET/PATCH /api/notifications`

## 5. Database-First Design (Critical Section)

This section defines the predicted final schema to guide implementation.

### Cardinality and Integrity Rules
- One user can place many orders; each order belongs to one user.
- One order contains one or many order items.
- One game can appear in many order items.
- One user owns many games through `library_items`; each game can belong to many users.
- One user can have many active bucket items.
- Friendships are user-to-user with a directional pair (`requester_id`, `addressee_id`) and controlled status.
- Notifications are one-to-many from user.
- Payments are one-to-one with orders (enforced by unique `order_id`).

### Constraints to Enforce
- Composite PKs on join tables (`bucket_items`, `library_items`, `order_items`, `reviews`).
- Unique constraints on `users.username`, `users.email`, `games.slug`.
- Checks:
   - price/amount fields non-negative
   - friendship status in (`pending`, `accepted`, `blocked`)
   - order status in (`draft`, `pending_payment`, `paid`, `fulfilled`, `failed`, `refunded`)
   - review rating range 1..5
- Foreign keys with cascade policies where appropriate:
   - deleting users should clear sessions/notifications/bucket entries.
   - deleting games should be restricted if referenced by historical `order_items`.

## 6. Suggested PostgreSQL DDL (Target)

```sql
-- Requires pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   username VARCHAR(40) NOT NULL UNIQUE,
   email VARCHAR(160) NOT NULL UNIQUE,
   password_hash TEXT NOT NULL,
   avatar_url TEXT,
   role VARCHAR(20) NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE games (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   title VARCHAR(140) NOT NULL,
   slug VARCHAR(160) NOT NULL UNIQUE,
   price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
   category VARCHAR(60) NOT NULL,
   description TEXT NOT NULL,
   image_url TEXT,
   rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
   rating_count INT NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
   min_specs JSONB,
   rec_specs JSONB,
   is_active BOOLEAN NOT NULL DEFAULT TRUE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bucket_items (
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
   quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
   added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY (user_id, game_id)
);

CREATE TABLE orders (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
   status VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'pending_payment', 'paid', 'fulfilled', 'failed', 'refunded')),
   subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
   tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
   discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
   total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
   currency_code CHAR(3) NOT NULL DEFAULT 'USD',
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
   order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
   game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
   unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
   quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
   line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
   PRIMARY KEY (order_id, game_id)
);

CREATE TABLE payments (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
   provider VARCHAR(40) NOT NULL,
   status VARCHAR(25) NOT NULL CHECK (status IN ('initiated', 'authorized', 'captured', 'failed', 'refunded')),
   external_ref VARCHAR(120),
   amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
   paid_at TIMESTAMPTZ
);

CREATE TABLE library_items (
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   game_id UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
   order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
   acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY (user_id, game_id)
);

CREATE TABLE friendships (
   requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY (requester_id, addressee_id),
   CHECK (requester_id <> addressee_id)
);

CREATE TABLE notifications (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   type VARCHAR(25) NOT NULL,
   title VARCHAR(180) NOT NULL,
   body TEXT NOT NULL,
   is_read BOOLEAN NOT NULL DEFAULT FALSE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   read_at TIMESTAMPTZ
);

CREATE TABLE reviews (
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
   rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
   comment TEXT,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
   PRIMARY KEY (user_id, game_id)
);

CREATE TABLE user_sessions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   token_hash TEXT NOT NULL,
   expires_at TIMESTAMPTZ NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_category ON games(category);
CREATE INDEX idx_games_title ON games(title);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

## 7. Transaction Blueprint (Acquire All)

Use a single DB transaction for checkout:
1. Lock bucket rows for user.
2. Compute totals from current game prices.
3. Insert `orders` row.
4. Insert `order_items` rows.
5. Insert `payments` status update.
6. Insert into `library_items` (ignore duplicates safely).
7. Remove processed `bucket_items`.
8. Commit.

This guarantees consistency and prevents partial acquisition states.

## 8. Website Feature Showcase

- Immersive retro-cyber visual language with animated UI components.
- Fast catalog browsing and featured carousel.
- Game detail pages with specs, category, and rating.
- Bucket workflow with total calculation and confirmations.
- Library ownership tracking experience.
- Social and notifications experience ready to be connected to backend persistence.

## 9. Repository Structure

- `src/`: frontend app (pages, components, hooks, services, types).
- `server.ts`: Express API server + DB bootstrap logic.
- `netlify/functions/games.mts`: serverless games endpoint variant.
- `doc/`: formal project documents (architecture, API, SRS, DB design, runbook, UML).

## 10. Local Setup

### Prerequisites
- Node.js LTS
- npm
- PostgreSQL instance (local or cloud)

### Environment
Create `.env` from `.env.example` and fill:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
GEMINI_API_KEY="optional_if_unused"
APP_URL="http://localhost:3000"
```

### Run
```bash
npm install
npm run dev
```

Then open:
- App: `http://localhost:3000`
- API: `http://localhost:3000/api/games`

## 11. Practical Next Steps (Database-Driven Completion)

1. Add migration files from the target DDL above.
2. Replace local bucket/library logic with API-backed persistence.
3. Implement auth and session management.
4. Implement transactional checkout endpoint.
5. Wire friends/notifications to real tables.
6. Add automated tests for integrity constraints and checkout transaction flow.

## 12. Notes for Team and Review

- Current implementation is excellent for demonstration and UI validation.
- The schema above is designed for correctness, cardinality clarity, and future scalability.
- You can now use this README as the database contract for proceeding with backend implementation.
