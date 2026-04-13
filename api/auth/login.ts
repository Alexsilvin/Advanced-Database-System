import type { IncomingMessage, ServerResponse } from "http";
import { Pool } from "pg";
import crypto from "crypto";
import { SESSION_COOKIE_NAME } from "../../netlify/functions/_shared/auth.mts";

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: "admin" | "player";
  email: string | null;
  password_hash: string | null;
  password_salt: string | null;
};

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;
    pool = new Pool({ connectionString });
  }
  return pool;
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const actualHash = crypto.pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionToken(): string {
  return `${crypto.randomUUID()}.${crypto.randomBytes(24).toString("hex")}`;
}

function buildSessionCookie(token: string, maxAgeSeconds: number): string {
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

async function issueSession(p: Pool, userId: string): Promise<string> {
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

async function ensureAuthSchema(p: Pool): Promise<void> {
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
}

function sanitizeUsername(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 40) : "";
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export default async function login(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const p = getPool();
  if (!p) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Database not configured" }));
    return;
  }

  try {
    await ensureAuthSchema(p);

    const body = (await readJsonBody(req)) as { username?: unknown; password?: unknown };
    const username = sanitizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Username and password are required" }));
      return;
    }

    const existing = await p.query<UserRow>(
      `SELECT id, username, avatar_url, role, email, password_hash, password_salt
       FROM users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [username]
    );

    const user = existing.rows[0];

    if (!user || !user.password_hash || !user.password_salt || !verifyPassword(password, user.password_salt, user.password_hash)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Invalid credentials" }));
      return;
    }

    const sessionCookie = await issueSession(p, user.id);

    res.statusCode = 200;
    res.setHeader("Set-Cookie", sessionCookie);
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        role: user.role,
        email: user.email,
      })
    );
  } catch (error) {
    console.error("Login failed:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed to log in" }));
  }
}
