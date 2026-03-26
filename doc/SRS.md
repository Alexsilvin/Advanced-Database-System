# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and non-functional requirements for **NEON-GRID**, a game-selling web platform that allows users to browse a catalog, acquire games, and manage a personal library with social context.

### 1.2 Scope
The platform provides:
- Game discovery and browsing
- Game acquisition workflow (bucket/cart to library)
- Library management and installed-state tracking
- Social visibility features (friends, notifications)
- Backend service integration with PostgreSQL for core entities

### 1.3 Definitions
- **Bucket**: Temporary acquisition queue (cart behavior).
- **Library**: User-owned games after successful acquisition.
- **Acquire**: Logical purchase/completion of bucket items.
- **Grid**: Branding term used by UI for the platform network.

## 2. Overall Description

### 2.1 Product Perspective
NEON-GRID is a web application built with a React frontend and Express backend. The backend initializes and seeds a PostgreSQL database and serves API endpoints consumed by the frontend.

### 2.2 Product Functions
- User login entry (UI-gated access)
- Retrieve game catalog from API
- Add game directly to library
- Add/remove games in bucket
- Acquire all bucket items into library
- View owned games in library
- View social pages (friends and notifications)

### 2.3 User Classes
- **Guest User**: Can access login screen.
- **Platform User**: Can browse store, manage bucket and library.
- **Admin/Developer (Operational)**: Configures environment and deployment.

### 2.4 Constraints
- Requires Node.js runtime and npm package management.
- Requires PostgreSQL connection via `DATABASE_URL` for full persistence.
- UI currently stores some feature states in-memory (session-local) and uses mock data for some social functions.

### 2.5 Assumptions and Dependencies
- PostgreSQL server is reachable from application runtime.
- Environment variables are set correctly.
- Browser supports modern JavaScript and CSS.

## 3. Functional Requirements

### FR-1 Authentication Entry
- The system shall display a login screen before entering the main app.
- The system shall allow transition into the app on login submission.

### FR-2 View Store Catalog
- The system shall request game data from `/api/games`.
- The system shall display game cards with title, category, image, description, and price.
- The system shall allow search filtering by game title.

### FR-3 Handle Catalog Fallback
- The system shall show an error state when API/database retrieval fails.
- The backend shall provide fallback/mock game data if the database is unavailable.

### FR-4 Add to Bucket
- The system shall add a game to bucket if it is not already in bucket or library.
- The system shall show updated bucket count in navigation.

### FR-5 Remove from Bucket
- The system shall allow removing individual games from bucket.
- The system shall recompute total acquisition amount.

### FR-6 Acquire Games
- The system shall acquire all bucket items into library when user confirms acquisition.
- The system shall clear bucket after successful acquisition.

### FR-7 Direct Add to Library
- The system shall allow direct acquisition from store views.
- The system shall prevent duplicate ownership entries.

### FR-8 View Library
- The system shall list all owned games.
- The system shall support filtering and sorting in library view.
- The system shall show empty-state guidance when no games are owned.

### FR-9 Friends View
- The system shall provide a friends page showing contact cards and statuses.
- The current implementation may use mock friend data.

### FR-10 Notifications View
- The system shall provide a notifications feed.
- The system shall support marking all notifications as read and dismissing entries.
- The current implementation may use mock notification data.

### FR-11 API Users Retrieval
- The backend shall expose `/api/users` for user listing from database.

### FR-12 Database Initialization
- On server start, the system shall create required tables if they do not exist.
- On empty catalog, the system shall seed initial game records.

## 4. Non-Functional Requirements

### NFR-1 Performance
- API responses for game catalog should be delivered within acceptable local development latency (< 1 second in typical conditions).

### NFR-2 Reliability
- The system should continue to operate with graceful fallback when database connectivity fails.

### NFR-3 Maintainability
- Codebase shall use TypeScript for improved type safety.
- Project structure shall separate components, pages, services, types, and utilities.

### NFR-4 Usability
- UI shall support both desktop and mobile navigation paradigms.
- Core actions (browse, add, acquire, view library) shall be discoverable in primary navigation.

### NFR-5 Security (Current and Target)
- Current: no real authentication or payment integration.
- Target: implement secure authentication, hashed credentials, session management, and secure payment processing.

### NFR-6 Scalability (Target)
- Data model and API should be extensible for larger catalogs and concurrent users.

## 5. External Interface Requirements

### 5.1 User Interface
- Cyberpunk-themed responsive SPA.
- Primary tabs: Store, Library, Friends, Bucket, Notifications.

### 5.2 Software Interfaces
- PostgreSQL database via `pg` connection pool.
- HTTP JSON API from Express backend.

### 5.3 Communications Interfaces
- REST-like API endpoints over HTTP.

## 6. Use Cases

### UC-1 Browse and Acquire Games
- **Actor**: Platform User
- **Precondition**: User is in app.
- **Main Flow**:
  1. User opens Store.
  2. User searches/browses games.
  3. User adds items to bucket or directly acquires.
  4. User opens Bucket and confirms acquisition.
  5. System moves games to Library.
- **Postcondition**: Owned games are in Library.

### UC-2 Manage Library
- **Actor**: Platform User
- **Precondition**: User owns at least one game.
- **Main Flow**:
  1. User opens Library.
  2. User applies filters/sorting/view modes.
  3. System renders resulting game collection.
- **Postcondition**: Library state is visible and manageable.

### UC-3 View Social Feed
- **Actor**: Platform User
- **Main Flow**:
  1. User opens Friends or Notifications.
  2. System displays available social entries.
- **Postcondition**: User sees social context and activity feed.

## 7. Data Requirements Summary

- User records: identity profile
- Game records: catalog metadata
- Library records: ownership relation between users and games
- Friend records: social links and statuses
- Notification records: user event messages (target persisted model)

See complete schema and relationships in [DATABASE_DESIGN.md](./DATABASE_DESIGN.md).

## 8. Acceptance Criteria (High-Level)

1. The app starts with valid environment setup and serves UI at `localhost:3000`.
2. Store page loads catalog from API (or fallback mode).
3. Bucket operations (add/remove/acquire) behave deterministically.
4. Library reflects acquired games without duplication.
5. Database tables initialize automatically when DB is available.
6. Core API endpoints (`/api/games`, `/api/users`) return valid JSON responses.

## 9. Risks and Gaps

- No persistent authentication and authorization yet.
- Acquisition is logical, not connected to payment gateway.
- Friends/notifications currently mock-backed in UI.
- Library and bucket states are currently frontend session states; persistent checkout history is not yet modeled.

## 10. Future Enhancements

- Add users authentication and role-based access
- Add persistent bucket/order/payment entities
- Add friend request workflows and notification persistence
- Add observability (logging, metrics, tracing)
- Add automated unit/integration/end-to-end test suites
