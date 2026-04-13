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
ADMIN_BOOTSTRAP_USERNAME="admin"
ADMIN_BOOTSTRAP_PASSWORD="your_admin_password"
```

If you are using Filebase for ROM storage, also configure:

```env
S3_REGION="us-east-1"
S3_ENDPOINT="https://s3.filebase.com"
S3_BUCKET="sfc-rom"
S3_ACCESS_KEY_ID="your_filebase_access_key"
S3_SECRET_ACCESS_KEY="your_filebase_secret_key"
S3_FORCE_PATH_STYLE="true"
FILEBASE_BUCKET="sfc-rom"
FILEBASE_IPFS_RPC_ENDPOINT="https://rpc.filebase.io"
```

Authentication now uses the database session flow:
- Signup creates a player account and a signed session cookie.
- Login verifies the stored password hash and restores the role from the database.
- The admin upload page only appears for the admin account seeded from `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD`.

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

### 6.4 Upload page fails to create a Filebase URL
- Confirm `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`
- Make sure the Filebase bucket exists and the bucket name matches `S3_BUCKET` or `FILEBASE_BUCKET`
- If the signed upload works but registration fails, verify `DATABASE_URL` and the target game row

### 6.5 Deployed app says bucket is not configured
- Open Vercel Project Settings -> Environment Variables.
- Verify these variables exist for the target environment: `DATABASE_URL`, `S3_ENDPOINT`, `S3_BUCKET` (or `FILEBASE_BUCKET`), `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.
- If using `ROM_ADMIN_KEY`, ensure it is set consistently across Preview and Production.
- Redeploy after updating variables.

### 6.6 Upload fails with a license length error
- Keep `licenseType` under 40 characters
- Use short values like `licensed`, `unknown`, or `fan_patch`
- If the database still has the older varchar limit, rerun the ROM/poster migration before trying again

## 7. Operational Checklist (Before Demo)

1. `.env` configured
2. App boots without runtime errors
3. `/api/games` returns list
4. Store page renders data
5. Bucket and library flows function in UI
6. Social pages accessible
