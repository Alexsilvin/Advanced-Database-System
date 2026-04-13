import type { IncomingMessage, ServerResponse } from "http";
import crypto from "crypto";
import { SESSION_COOKIE_NAME } from "../../netlify/functions/_shared/auth.mts";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;
    const { Pool: PgPool } = require("pg");
    pool = new PgPool({ connectionString });
  }
  return pool;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function buildClearedSessionCookie(): string {
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

async function ensureAuthSchema(p: any): Promise<void> {
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

export default async function logout(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const p = getPool();
  if (!p) {
    res.statusCode = 200;
    res.setHeader("Set-Cookie", buildClearedSessionCookie());
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  try {
    await ensureAuthSchema(p);

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];

    if (token) {
      const tokenHash = hashToken(token);
      await p.query(`DELETE FROM auth_sessions WHERE token_hash = $1`, [tokenHash]);
    }

    const clearedCookie = buildClearedSessionCookie();

    res.statusCode = 200;
    res.setHeader("Set-Cookie", clearedCookie);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("Logout failed:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed to log out" }));
  }
}
