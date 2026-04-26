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


NEON GRID is a retro-cyber game marketplace built with React, TypeScript, Express, PostgreSQL, and serverless API handlers. The app centers on a storefront, account/auth flow, admin ROM tools, social features, notifications, wallet pages, and a ROM download pipeline backed by object storage.

## What is implemented now

- React 19 + TypeScript frontend with tabbed navigation and responsive layout.
- Storefront, game detail, library, bucket, friends, notifications, messages, groups, wallet, profile, and admin views.
- Session-based auth with signup, login, logout, and `GET /api/auth/me`.
- PostgreSQL-backed catalog loading with mock fallback when the database is offline.
- Admin tooling for overview data, ROM upload URL generation, ROM registration, and direct ROM upload.
- Signed ROM download URL support through the API layer.
- Friends, notifications, messaging, groups, wallet, and purchase history endpoints in the serverless API layer.
- Local persistence for active tab, bucket contents, and library state in `localStorage`.

## NEON GRID Diagrams (Updated)

### 1) System Context Diagram

```mermaid
flowchart LR
	Player[Player User] --> Frontend[React SPA]
	Admin[Admin User] --> Frontend

	Frontend --> ExpressAPI[Local Express API\nserver.ts]
	Frontend --> ServerlessAPI[Vercel API Handlers\napi/*.ts]

	ExpressAPI --> PostgreSQL[(PostgreSQL)]
	ServerlessAPI --> PostgreSQL

	ExpressAPI --> S3[(S3 Compatible Storage)]
	ServerlessAPI --> S3
```

## Architecture Overview

The project is currently in a hybrid phase:

- Feature-based architecture is already active in the frontend and API layout.
- Clean Architecture adoption has started and is being introduced incrementally.

### Feature-Based Architecture (Started)

- Frontend features are grouped under `src/pages/` with shared UI in `src/components/` and integration utilities in `src/services/`.
- Serverless features are grouped under `api/` by behavior: games, bucket, friends, notifications, and user-data.
- Admin-specific capabilities are implemented as dedicated routes and pages rather than mixed into player flows.

### Clean Architecture Adoption (Started)

Current layer mapping:

- Presentation layer:
	- React screens and UI components in `src/pages/`, `src/components/`, `src/hooks/`, and app shell wiring in `src/App.tsx`.
- Domain layer:
	- Domain models and contracts currently centered in `src/types/` and domain decisions in feature logic.
- Data layer:
	- API clients in `src/services/api.ts`, backend handlers in `api/`, and persistence access in `server.ts` and PostgreSQL queries.

Target direction:

- Move business rules from page-level handlers into explicit domain use-cases.
- Keep transport and storage concerns isolated to data adapters.
- Preserve a thin presentation layer that only orchestrates UI state and user interactions.

## How to Run

### Prerequisites

- Node.js LTS (recommended: 20.x)
- npm
- PostgreSQL instance (local or cloud)
- S3-compatible bucket credentials for ROM workflows

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment configuration

Create `.env` in the project root and define the required variables.

Minimum local setup:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
ADMIN_BOOTSTRAP_USERNAME="admin"
ADMIN_BOOTSTRAP_PASSWORD="Admin1234!"
ADMIN_BOOTSTRAP_EMAIL="admin@local.admin"
```

If you use ROM upload/download flows, also configure:

```env
S3_ENDPOINT="https://..."
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET="..."
ROM_ADMIN_KEY="optional_admin_key"
DOWNLOAD_REQUIRE_LIBRARY="false"
```

### 3) Start development server

```bash
npm run dev
```

Then open:

- App: `http://localhost:3000`
- API example: `http://localhost:3000/api/games`

### 4) Quality checks

```bash
npm run lint
npm run build
```

## CI/CD

The project supports two pipeline modes:

### CI validation (GitHub Actions)

- Trigger: push and pull request events.
- Checks:
	- Install dependencies with `npm ci`
	- Lint with `npm run lint`
	- Test with `npm test --if-present`
	- Build with `npm run build`

### Manual distribution build (GitHub Actions)

- Trigger: `workflow_dispatch`.
- Purpose: generate a manual distribution artifact for the NEON console app build output.
- Output: zipped build artifact from `dist/` uploaded to the workflow artifacts.

## Contribution Guidelines

Use pull requests for all non-trivial changes.

- Do not push directly to protected branches.
- Open feature/fix/docs branches from the latest default branch.
- Follow the branching and commit conventions in `CONTRIBUTING.md`.
- Ensure CI passes before requesting review.
- Keep pull requests focused and small enough for fast review cycles.

### 2) Use Case Diagram

```mermaid
flowchart TB
	Player((Player))
	Admin((Admin))

	subgraph Platform[NEON GRID Platform]
		UC1([Browse Game Catalog])
		UC2([View Game Details])
		UC3([Manage Bucket])
		UC4([Manage Library])
		UC5([Manage Friends])
		UC6([View Notifications])
		UC7([Direct Messages and Groups])
		UC8([Wallet Topup and Purchase])
		UC9([Session Login and Signup])
		UC10([Admin Overview])
		UC11([Upload and Register ROM])
		UC12([Generate Signed Download URL])
	end

	Player --> UC1
	Player --> UC2
	Player --> UC3
	Player --> UC4
	Player --> UC5
	Player --> UC6
	Player --> UC7
	Player --> UC8
	Player --> UC9
	Player --> UC12

	Admin --> UC9
	Admin --> UC10
	Admin --> UC11
	Admin --> UC12
```

### 3) Component Architecture Diagram

```mermaid
flowchart LR
	subgraph UI[Frontend React App]
		Pages[Pages and Components]
		ServiceAPI[src/services/api.ts]
		LocalState[Tab and localStorage state]
	end

	subgraph Backend[Backend Layer]
		Express[Express routes in server.ts]
		FnGames[api/games.ts]
		FnBucket[api/bucket.ts]
		FnFriends[api/friends.ts]
		FnNotif[api/notifications.ts]
		FnUserData[api/user-data.ts]
	end

	subgraph Infra[Infrastructure]
		DB[(PostgreSQL)]
		ObjectStorage[(S3 Compatible Bucket)]
	end

	Pages --> ServiceAPI
	ServiceAPI --> Express
	ServiceAPI --> FnGames
	ServiceAPI --> FnBucket
	ServiceAPI --> FnFriends
	ServiceAPI --> FnNotif
	ServiceAPI --> FnUserData
	Pages --> LocalState

	Express --> DB
	FnGames --> DB
	FnBucket --> DB
	FnFriends --> DB
	FnNotif --> DB
	FnUserData --> DB

	Express --> ObjectStorage
	FnGames --> ObjectStorage
```

### 4) Authentication and Session Sequence

```mermaid
sequenceDiagram
	participant U as User
	participant UI as React UI
	participant API as Express Auth API
	participant DB as PostgreSQL

	U->>UI: Submit signup or login form
	UI->>API: POST /api/auth/signup or /api/auth/login
	API->>DB: Validate or create user
	API->>DB: INSERT auth_sessions token_hash
	API-->>UI: Set neon-grid-session cookie

	UI->>API: GET /api/auth/me
	API->>DB: Resolve token hash and user
	DB-->>API: Session user
	API-->>UI: User profile and role
```

### 5) Admin ROM Upload and Download Sequence

```mermaid
sequenceDiagram
	participant A as Admin
	participant UI as Admin Upload Page
	participant API as Express API
	participant S3 as S3 Bucket
	participant DB as PostgreSQL

	A->>UI: Select game and ROM file
	UI->>API: POST /api/rom-upload-url
	API->>DB: Validate game
	API-->>UI: Signed PUT URL + storage key
	UI->>S3: Upload binary with signed URL
	UI->>API: POST /api/register-rom
	API->>DB: Update game ROM metadata
	API-->>UI: ROM registered

	UI->>API: POST /api/game-download-url
	API->>DB: Validate session and game downloadability
	API-->>UI: Signed GET URL
```

### 6) Current Logical Data Model (UML/ER)

```mermaid
erDiagram
	USERS ||--o{ AUTH_SESSIONS : has
	USERS ||--o{ FRIENDS : owns
	USERS ||--o{ NOTIFICATIONS : receives
	USERS ||--o{ MESSAGES : sends
	USERS ||--o{ MESSAGES : receives
	USERS ||--o{ WALLETS : owns
	USERS ||--o{ WALLET_TRANSACTIONS : makes
	USERS ||--o{ GAME_PURCHASES : buys

	GAMES ||--o{ BUCKET_ITEMS : appears_in
	GAMES ||--o{ GAME_PURCHASES : purchased_as
	GAMES ||--o{ NOTIFICATIONS : related_to

	MESSAGE_GROUPS ||--o{ GROUP_MEMBERS : has
	MESSAGE_GROUPS ||--o{ GROUP_MESSAGES : has
	USERS ||--o{ GROUP_MEMBERS : joins
	USERS ||--o{ GROUP_MESSAGES : sends

	USERS {
		uuid id PK
		text username
		text email
		text password_hash
		text password_salt
		text role
	}

	AUTH_SESSIONS {
		text token_hash PK
		uuid user_id FK
		timestamptz expires_at
		timestamptz created_at
	}

	GAMES {
		int id PK
		text title
		numeric price
		text category
		text rom_storage_key
		text rom_filename
		boolean is_downloadable
	}

	BUCKET_ITEMS {
		uuid user_id FK
		int game_id FK
		timestamptz added_at
	}

	FRIENDS {
		uuid id PK
		uuid user_id FK
		uuid friend_id FK
		text status
	}

	NOTIFICATIONS {
		uuid id PK
		uuid user_id FK
		text type
		text message
		boolean is_read
		timestamptz created_at
	}

	MESSAGES {
		uuid id PK
		uuid sender_id FK
		uuid recipient_id FK
		text content
		boolean is_read
		timestamptz created_at
	}

	MESSAGE_GROUPS {
		uuid id PK
		text name
		boolean is_public
		uuid creator_id FK
		timestamptz created_at
		timestamptz updated_at
	}

	GROUP_MEMBERS {
		uuid group_id FK
		uuid user_id FK
		boolean is_admin
	}

	GROUP_MESSAGES {
		uuid id PK
		uuid group_id FK
		uuid sender_id FK
		text content
		timestamptz created_at
	}

	WALLETS {
		uuid id PK
		uuid user_id FK
		numeric balance
		timestamptz updated_at
	}

	WALLET_TRANSACTIONS {
		uuid id PK
		uuid user_id FK
		text transaction_type
		numeric amount
		text status
		timestamptz created_at
	}

	GAME_PURCHASES {
		uuid id PK
		uuid user_id FK
		int game_id FK
		numeric price_paid
		timestamptz purchased_at
	}
```

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Motion.
- Backend runtime for local development: Express in `server.ts`.
- Serverless/API layer: handlers in `api/`.
- Database: PostgreSQL via `pg`.
- Object storage: S3-compatible storage such as Filebase.

## Key Screens

- Welcome, login, and signup flow.
- Store and game detail browsing.
- Library and bucket management.
- Friends, notifications, messages, and groups.
- Wallet balance, top-up, purchase history, and purchase flow.
- Admin dashboard and ROM upload page.

## API Surface

### Local Express server

- `GET /api/games` returns the catalog and falls back to seeded mock games if the database is unavailable.
- `GET /api/users` returns user rows.
- `POST /api/users` creates or updates a user row.
- `GET /api/admin/overview` returns admin summary data for authenticated admins.
- `POST /api/auth/signup` creates an account and issues a session cookie.
- `POST /api/auth/login` authenticates a user and issues a session cookie.
- `GET /api/auth/me` returns the current session user.
- `POST /api/auth/logout` clears the session.
- `POST /api/rom-upload-url` creates a signed upload URL for a ROM.
- `POST /api/register-rom` stores ROM metadata for a game.
- `POST /api/admin/upload-rom` uploads a ROM directly through the server.
- `POST /api/game-download-url` creates a signed download URL for a ROM.

### Serverless/API handlers in `api/`

- `api/games.ts` handles catalog reads and signed download URL requests.
- `api/bucket.ts` manages bucket items.
- `api/friends.ts` manages friend search and friend creation.
- `api/notifications.ts` manages notification reads, deletes, and mark-all-read.
- `api/user-data.ts` handles messages, groups, and wallet operations.
- `api/enrich-posters.ts` is currently a placeholder that returns a not-implemented response on Vercel.

## Environment Variables

Create a `.env` file with the values your deployment needs. Common variables used by the app are:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
S3_ENDPOINT="https://..."
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_BUCKET="..."
ROM_ADMIN_KEY="optional_admin_key"
DOWNLOAD_REQUIRE_LIBRARY="false"
ADMIN_BOOTSTRAP_USERNAME="admin"
ADMIN_BOOTSTRAP_PASSWORD="Admin1234!"
ADMIN_BOOTSTRAP_EMAIL="admin@local.admin"
GEMINI_API_KEY="optional_if_used_for_poster_workflows"
```

`S3_BUCKET` can also be provided through the aliases used in the API layer when deploying with Filebase-style settings.

## Development

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

The dev server starts the Vite frontend only. API requests under `/api` are proxied to the standalone backend (default `http://localhost:3001`).

### Other scripts

- `npm run build` builds the frontend.
- `npm run preview` previews the production build.
- `npm run lint` runs the TypeScript check.
- `npm run clean` removes `dist/`.

## Deployment Notes

- The local frontend runs with Vite; backend now lives in the separate `backend/` project.
- `api/` contains the serverless-style handlers used by hosted deployments.
- `vercel.json` rewrites `/api/*` to the API handlers during deployment.
- The catalog endpoint is resilient and can serve mock data when PostgreSQL is offline.
- ROM download features depend on the database, session cookie, and object storage configuration.

## Current Behavior Notes

- Auth is session-cookie based using the `neon-grid-session` cookie.
- The store persists tab, bucket, and library state locally for a smoother UX.
- Admin uploads are protected by the configured admin key and the admin session check.
- Poster enrichment is not active in the current Vercel handler and returns a not-implemented response there.

## Repository Layout

- `src/` frontend app, pages, components, hooks, services, types, and utilities.
- `api/` API handlers for bucket, friends, games, notifications, user data, and admin workflows.
- `backend/` (separate project) contains the standalone Express server and database bootstrap.
- `doc/` architecture, API, database, runbook, and SRS documentation.
- `vercel.json` deployment rewrite configuration.

## Notes

The documentation in this repository is intentionally split between the current implementation and the longer-term database design. If you are extending the app, keep the README aligned with the routes and data shape that are actually live in the codebase.