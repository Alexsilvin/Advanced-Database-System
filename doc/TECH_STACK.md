# Technical Stack Report

## 1. Overview
NEON-GRID uses a TypeScript-first web stack combining React for frontend UI, Express for backend API/routing, and PostgreSQL for persistent data.

## 2. Frontend
- **React 19**: component-based UI rendering
- **TypeScript**: static typing and developer safety
- **Vite 6**: fast bundling and development tooling
- **Tailwind CSS 4**: utility-first styling
- **Motion**: animation framework
- **Lucide React**: icon set

## 3. Backend
- **Node.js runtime**
- **Express 4**: HTTP server and API routes
- **tsx**: direct TypeScript runtime execution for dev server
- **dotenv**: environment variable loading

## 4. Database
- **PostgreSQL** (via `pg` package)
- Pool-based connection management
- Auto-bootstrap table creation and seed data

## 5. Build and Tooling
- **TypeScript compiler (`tsc`)** for static validation
- **npm scripts**:
  - `npm run dev` -> start app server
  - `npm run build` -> create production frontend bundle
  - `npm run preview` -> preview built frontend
  - `npm run lint` -> TypeScript no-emit check

## 6. Runtime Configuration
- `.env` variables
  - `DATABASE_URL`: PostgreSQL connection string
  - `GEMINI_API_KEY`: API key (present in template environment)
  - `APP_URL`: host URL for deployment environments

## 7. Why This Stack Fits the Project
- TypeScript across frontend/backed reduces integration errors.
- React + Vite provides rapid iteration for UI-heavy store experiences.
- Express is simple for lightweight API route handling.
- PostgreSQL is reliable for relational data such as users, games, ownership, and social links.

## 8. Improvement Opportunities
- Add ORM/migration tooling (e.g., Prisma/Drizzle/Knex) for controlled schema evolution.
- Add test frameworks (Vitest/Jest, Playwright) for automated QA.
- Add containerized deployment support and CI pipelines.
