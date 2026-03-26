# Architecture and System Design

## 1. Architectural Style
NEON-GRID uses a **client-server web architecture**:
- Frontend: React SPA rendered in browser
- Backend: Express API server
- Data: PostgreSQL relational database

In development, the Express server hosts Vite middleware for SPA serving and API handling from one runtime process.

## 2. Logical Components

1. **Presentation Layer (React)**
   - Pages: Store, Library, Friends, Bucket, Notifications, Login
   - Reusable Components: cards, modals, navigation, layout
2. **Application Layer (Client State + Services)**
   - API service module for fetching game catalog
   - UI state management for tab navigation, bucket, library, selection
3. **API Layer (Express)**
   - Route handlers for `/api/games`, `/api/users`
   - DB initialization and seeding logic
4. **Persistence Layer (PostgreSQL)**
   - Tables: users, games, library, friends

## 3. Runtime Request Flow

1. Browser loads SPA from server.
2. React app calls `/api/games`.
3. Express queries PostgreSQL.
4. JSON response is returned to frontend.
5. UI updates store and allows acquisition workflows.

## 4. Current State Management Boundaries

- Persisted in DB:
  - games
  - users
  - relationship tables (`library`, `friends`) available in schema
- In-memory (frontend session):
  - active login flag
  - bucket contents
  - library view state
  - notification read/dismiss states

## 5. Error Handling Strategy

- Backend handles missing `DATABASE_URL` by operating in degraded mode.
- `/api/games` endpoint falls back to mock catalog when DB is unavailable.
- Frontend shows explicit error messaging for DB/API failures.

## 6. Security Posture

Current:
- No production authentication/authorization.
- No payment processing pipeline.

Target:
- Session or token-based authentication
- Role-based endpoint protection
- Input validation and rate limiting
- Secrets management in deployment environment

## 7. Scalability Considerations

- Move session-sensitive state to backend persistence.
- Introduce migration/versioned schema management.
- Add caching for high-traffic game catalog access.
- Add pagination/filtering APIs for large datasets.

## 8. Recommended Next Architecture Steps

1. Introduce data access layer/repository pattern.
2. Add persistent cart and order/payment modules.
3. Add test pyramid: unit, integration, end-to-end.
4. Add CI pipeline with lint/test/build gates.
