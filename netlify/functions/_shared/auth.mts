import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

export const SESSION_COOKIE_NAME = "neon-grid-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type UserRole = "admin" | "player";

export type SessionUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  email: string | null;
};

let pool: pg.Pool | null = null;
let schemaReady = false;

function normalizeRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "player";
}

function getAdminBootstrapCredentials() {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME || "admin";
  return {
    username,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || "Admin1234!",
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || `${username}@local.admin`,
  };
}

export function getPool(): pg.Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return null;
    }

    pool = new Pool({ connectionString });
  }

  return pool;
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualHash = crypto.pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
  return `${crypto.randomUUID()}.${crypto.randomBytes(24).toString("hex")}`;
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function buildSessionCookie(token: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${maxAgeSeconds}`,
  ]
    .filter(Boolean)
    .join("; ");
}

function buildClearedSessionCookie() {
  const secure = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function ensureAuthSchema(p: pg.Pool) {
  if (schemaReady) return;

  await p.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE,
      avatar_url TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      password_salt TEXT,
      role TEXT NOT NULL DEFAULT 'player'
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player';`);
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT;`);
  await p.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email) WHERE email IS NOT NULL;`);

  const admin = getAdminBootstrapCredentials();
  const adminCredentials = hashPassword(admin.password);

  await p.query(
    `INSERT INTO users (username, avatar_url, email, password_hash, password_salt, role)
     VALUES ($1, NULL, $2, $3, $4, 'admin')
     ON CONFLICT (username)
     DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash, password_salt = EXCLUDED.password_salt`,
    [admin.username, admin.email, adminCredentials.hash, adminCredentials.salt]
  );

  schemaReady = true;
}

export async function issueSession(p: pg.Pool, userId: string): Promise<string> {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await p.query(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt.toISOString()]
  );

  return buildSessionCookie(token, Math.floor(SESSION_TTL_MS / 1000));
}

export async function getSessionUserFromRequest(req: Request, p: pg.Pool): Promise<SessionUser | null> {
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const result = await p.query<SessionUser>(
    `SELECT u.id, u.username, u.avatar_url, u.role, u.email
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    ...row,
    role: normalizeRole(row.role),
  };
}

export async function clearSessionFromRequest(req: Request, p: pg.Pool): Promise<string> {
  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE_NAME];

  if (token) {
    const tokenHash = hashToken(token);
    await p.query(`DELETE FROM auth_sessions WHERE token_hash = $1`, [tokenHash]);
  }

  return buildClearedSessionCookie();
}
