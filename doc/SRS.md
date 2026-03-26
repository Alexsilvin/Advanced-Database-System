# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification defines the current, implemented behavior of the Advanced Database System project (NEONGRID game-store web application). It reflects what is already present in the codebase as of March 2026.

### 1.2 Scope
The system is a single-page web application for browsing a game catalog, viewing game details, managing a local in-memory library and acquisition bucket, viewing mock friends/notifications, and simulating game installation in a stylized neon interface.

The project includes:
- Frontend: React + TypeScript + Vite + Tailwind CSS.
- Runtime server: Express development server exposing REST endpoints.
- Optional PostgreSQL integration using DATABASE_URL.
- Netlify serverless function for deployment-time API routing.

### 1.3 Definitions, Acronyms, and Abbreviations
- SRS: Software Requirements Specification.
- SPA: Single Page Application.
- UI: User Interface.
- API: Application Programming Interface.
- DB: Database.
- FR: Functional Requirement.
- NFR: Non-Functional Requirement.

### 1.4 References
- README.md
- package.json
- server.ts
- netlify/functions/games.mts
- src/App.tsx
- src/services/api.ts
- src/types/index.ts
- src/pages/*
- src/components/*

### 1.5 Document Overview
Section 2 describes the system context and constraints. Section 3 lists detailed functional and non-functional requirements derived from the current implementation.

---

## 2. Overall Description

### 2.1 Product Perspective
The system is currently a client-heavy SPA with lightweight backend endpoints. Core user state (login session flag, selected tab, library, bucket, installation status) is stored in frontend memory and is not persisted across reloads.

Backend data source behavior:
- If PostgreSQL is configured and available, game data may be read from DB tables.
- If DB is unavailable or empty, mock game data is returned.

### 2.2 Product Functions (Implemented)
- Login screen with immediate entry flow (no credential validation).
- Store page with featured carousel, category sections, and searchable catalog.
- Game details page with title, description, price, category, rating, and min/recommended specs.
- Add game to library directly or via acquisition bucket.
- Bucket management with remove item and acquire all actions.
- Library page with grid/list modes, sorting (recent/name/hours), and installed filter.
- Simulated download/install progress per game in library items.
- Friends page with mock contacts.
- Notifications page with mock notifications, dismiss, and mark-all-read.
- Desktop sidebar and mobile bottom navigation.
- Header search, notifications shortcut, and bucket shortcut.

### 2.3 User Classes and Characteristics
- End user (player): Browses catalog, acquires games, manages library.
- Project developers/maintainers: Configure DB connection and deploy runtime.

### 2.4 Operating Environment
- Node.js runtime for local development.
- Browser-based client (modern desktop and mobile browsers).
- PostgreSQL (optional) via DATABASE_URL.
- Netlify Functions runtime for deployed API routing.

### 2.5 Design and Implementation Constraints
- Frontend stack is fixed to React 19 + TypeScript + Vite.
- Styling uses Tailwind CSS v4 plus custom CSS effects.
- API client calls /api/games only.
- No persistent client state storage is implemented (no localStorage/sessionStorage usage for core state).
- Authentication is visual/flow-only and does not enforce identity.

### 2.6 Assumptions and Dependencies
- Assumes API route /api/games is reachable in active environment.
- Assumes image assets and/or URLs used by game cards are accessible.
- Assumes DATABASE_URL is provided for DB-backed mode.

---

## 3. Specific Requirements

## 3.1 External Interface Requirements

### 3.1.1 User Interface Requirements
1. The system shall present a neon/cyber themed UI with animated transitions and glitch effects.
2. The system shall provide desktop navigation using a left sidebar.
3. The system shall provide mobile navigation using a fixed bottom nav.
4. The header shall include a search input (desktop), notifications button, bucket button, and user badge.
5. The login page shall include USER_ID and PASS_KEY fields with a CONNECT TO GRID button.

### 3.1.2 Software Interface Requirements
1. Frontend shall request game catalog data via HTTP GET /api/games.
2. Local dev backend shall expose GET /api/games and GET /api/users.
3. Netlify deployment shall route /api/* requests to /.netlify/functions/:splat.
4. If DB is unavailable, backend layers shall return mock game catalog responses.

### 3.1.3 Communications Interface Requirements
1. API communication shall use JSON payloads.
2. Game list responses shall be arrays of objects compatible with Game type shape.

## 3.2 Functional Requirements

### 3.2.1 Authentication and Entry
- FR-1: The system shall block access to application tabs until login action is triggered.
- FR-2: The login submit action shall set application state to logged-in without validating credentials.
- FR-3: The login sequence shall include a short transition delay before entering the main app.

### 3.2.2 Game Catalog Retrieval
- FR-4: On initial app load, the system shall request game catalog data once.
- FR-5: If request succeeds with array data, games state shall be populated.
- FR-6: If request fails or returns invalid payload, dbError shall be set and store shall show error panel.
- FR-7: If backend DB query fails/offline, backend shall provide mock games as fallback.

### 3.2.3 Store and Search
- FR-8: The system shall filter games by title using case-insensitive search term matching.
- FR-9: The store shall render trending and most-downloaded sections from filtered data.
- FR-10: The store shall render top-sellers panel from first five games in source list.
- FR-11: Selecting a game card or featured item shall open game-detail tab for that game.

### 3.2.4 Game Detail and Acquisition
- FR-12: The game detail page shall display category, rating, price, description, and hardware specs.
- FR-13: Users shall be able to add non-owned games to bucket.
- FR-14: Users shall be able to acquire a game directly to library.
- FR-15: A game already in library shall display owned state and download action.

### 3.2.5 Bucket Management
- FR-16: Bucket tab shall list all games whose IDs are present in bucket state.
- FR-17: Users shall be able to remove an item from bucket.
- FR-18: Users shall be able to acquire all bucket items; acquired IDs are appended to library.
- FR-19: Acquire-all action shall clear bucket after transfer.

### 3.2.6 Library Management
- FR-20: Library tab shall show only games whose IDs exist in library state.
- FR-21: Library shall support grid and list visual modes.
- FR-22: Library shall support sorting by name (A-Z); other sort options are present but not fully differentiated in logic.
- FR-23: Library installed filter shall show only items marked installed in current session.
- FR-24: Library item install action shall simulate download progress from 0 to 100 and then mark installed.

### 3.2.7 Friends and Notifications
- FR-25: Friends tab shall display predefined mock friends data.
- FR-26: Notifications tab shall display predefined notifications data.
- FR-27: Notifications tab shall support per-item dismiss action.
- FR-28: Notifications tab shall support mark-all-read action.

### 3.2.8 Navigation and Layout
- FR-29: Desktop sidebar shall navigate among store, library, and friends tabs.
- FR-30: Header icons and mobile nav shall navigate to notifications and bucket tabs.
- FR-31: Footer shall display static system status text.

### 3.2.9 Data Model Requirements
- FR-32: Game entity shall include id, title, price, description, image, category.
- FR-33: Game entity may include optional rating, minSpecs, and recSpecs.
- FR-34: Friend entity shall include username and status, with optional current game.

## 3.3 Database Requirements

### 3.3.1 Local Dev Server Initialization
When DATABASE_URL is available, startup initialization shall create tables if missing:
- users(id, username, avatar)
- games(id, title, price, description, image, category)
- library(user_id, game_id)
- friends(user_id, friend_id, status)

### 3.3.2 Seeding Behavior
- If games table exists and count is zero, seed data shall be inserted.
- API may still return a larger mock list in fallback situations.

## 3.4 Non-Functional Requirements

### 3.4.1 Performance
- NFR-1: Initial screen transitions should remain smooth under normal browser conditions.
- NFR-2: Catalog filtering shall run client-side with immediate visual feedback.

### 3.4.2 Reliability and Availability
- NFR-3: System shall remain usable even when DB is unavailable by using mock game fallback.
- NFR-4: Frontend shall handle failed game fetch by showing explicit error state.

### 3.4.3 Security
- NFR-5: No secure authentication/authorization is currently implemented; this is a known limitation.
- NFR-6: Database credentials are expected via environment variable and not hardcoded.

### 3.4.4 Usability
- NFR-7: UI controls shall include visible iconography and labels suitable for desktop and mobile navigation.
- NFR-8: Bucket and notification counters shall provide quick state awareness.

### 3.4.5 Maintainability
- NFR-9: Codebase shall remain modular with separation across pages, components, services, hooks, and types.
- NFR-10: TypeScript strict mode shall be enabled to improve type safety.

### 3.4.6 Portability
- NFR-11: Application shall run in local dev server mode and Netlify deployment mode.

## 3.5 Current Gaps (Observed from Implementation)
1. Login does not validate username/password or persist sessions.
2. Library, bucket, installed status, and notifications are not persisted between reloads.
3. Friends and notifications are mock data only.
4. Some interactive buttons (for example membership/upgrade prompts) are UI-only and not wired to backend actions.
5. API currently centers on game retrieval; write operations for user/library/friends are not implemented.

---

## 4. Acceptance Criteria (Implementation-Reflective)
1. A user can enter from login and access main app tabs.
2. A user can search for games and open game details.
3. A user can add games to bucket and acquire all to library.
4. A user can install games in library and see progress simulation.
5. Notifications can be dismissed and marked as read.
6. If DB is unavailable, application still receives game data via fallback and remains functional.

---

## 5. Revision Information
- Version: 1.0
- Date: 2026-03-26
- Basis: Current repository implementation (code-reflective SRS)
