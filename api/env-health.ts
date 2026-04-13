import type { IncomingMessage, ServerResponse } from "http";
import { Pool } from "pg";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "neon-grid-session";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;
    pool = new Pool({ connectionString });
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

const BUCKET_ENV_CANDIDATES = [
  "S3_BUCKET",
  "FILEBASE_BUCKET",
  "S3_BUCKET_NAME",
  "FILEBASE_BUCKET_NAME",
];

const REQUIRED_ENV = [
  "DATABASE_URL",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
];

const OPTIONAL_ENV = ["S3_REGION", "S3_FORCE_PATH_STYLE", "DOWNLOAD_REQUIRE_LIBRARY"];

function getConfiguredBucketEnvName(): string | null {
  for (const name of BUCKET_ENV_CANDIDATES) {
    if (process.env[name]) {
      return name;
    }
  }
  return null;
}

function getMissingVars(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]);
}

async function isAuthorized(req: IncomingMessage): Promise<boolean> {
  const configuredAdminKey = process.env.ROM_ADMIN_KEY;
  const headerAdminKey = req.headers["x-admin-key"];

  if (configuredAdminKey && headerAdminKey === configuredAdminKey) {
    return true;
  }

  const p = getPool();
  if (!p) {
    return false;
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) return false;

    const tokenHash = hashToken(token);
    const result = await p.query(
      `SELECT u.role FROM auth_sessions s INNER JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW() LIMIT 1`,
      [tokenHash]
    );

    return result.rows[0]?.role === "admin";
  } catch {
    return false;
  }
}

export default async function envHealth(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const authorized = await isAuthorized(req);
  if (!authorized) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Unauthorized. Sign in as admin or send x-admin-key matching ROM_ADMIN_KEY." }));
    return;
  }

  const configuredBucketEnv = getConfiguredBucketEnvName();
  const missingRequired = getMissingVars(REQUIRED_ENV);
  const missingOptional = getMissingVars(OPTIONAL_ENV);

  if (!configuredBucketEnv) {
    missingRequired.push("one of: " + BUCKET_ENV_CANDIDATES.join(", "));
  }

  const ok = missingRequired.length === 0;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      status: ok ? "ok" : "missing_required_env",
      missingRequired,
      missingOptional,
      configuredBucketEnv,
      checkedAt: new Date().toISOString(),
    })
  );
}
