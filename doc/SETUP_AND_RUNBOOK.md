# Setup, Configuration, and Runbook

## 1. Prerequisites
- Node.js (LTS recommended)
- npm
- PostgreSQL database instance

## 2. Environment Setup

1. Create `.env` from `.env.example`.
2. Configure the following variables:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
GEMINI_API_KEY="your_key_if_needed"
APP_URL="http://localhost:3000"
```

## 3. Install and Run

```bash
npm install
npm run dev
```

Expected:
- Server starts on `http://localhost:3000`
- DB initialization executes automatically when `DATABASE_URL` is valid

## 4. Validate Database Connectivity
Use the helper script:

```bash
npx tsx tmp_test_db.ts
```

Expected output:
- Connection success message
- Current database timestamp query result

## 5. Build and Preview

```bash
npm run build
npm run preview
```

## 6. Runbook Operations

### 6.1 App starts but no games shown
- Verify `DATABASE_URL`
- Check server console for DB warnings
- Check `/api/games` directly in browser

### 6.2 API `/api/users` fails
- Ensure DB configured and reachable
- Ensure `users` table exists (auto-init should create it)

### 6.3 Local UI loads but DB unavailable
- System serves fallback mock catalog for `/api/games`
- Update DB settings and restart app

## 7. Operational Checklist (Before Demo)

1. `.env` configured
2. App boots without runtime errors
3. `/api/games` returns list
4. Store page renders data
5. Bucket and library flows function in UI
6. Social pages accessible
