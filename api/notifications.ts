import type { IncomingMessage, ServerResponse } from "http";
import { Pool } from "pg";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "neon-grid-session";

type SessionUser = {
  id: string;
};

type NotificationRow = {
  id: string;
  type: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor_username: string | null;
};

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
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }

  return cookies;
}

async function ensureNotificationsSchema(p: Pool): Promise<void> {
  await p.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      game_id INT REFERENCES games(id) ON DELETE SET NULL,
      friend_request_id UUID REFERENCES friends(id) ON DELETE CASCADE,
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function getSessionUser(p: Pool, req: IncomingMessage): Promise<SessionUser | null> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await p.query<SessionUser>(
    `SELECT u.id
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export default async function notifications(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const p = getPool();
  if (!p) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Database not configured" }));
    return;
  }

  try {
    await ensureNotificationsSchema(p);

    const user = await getSessionUser(p, req);
    if (!user) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Not authenticated" }));
      return;
    }

    if (req.method === "PATCH") {
      const url = new URL(req.url || "/api/notifications", `http://${req.headers.host || "localhost"}`);
      const action = (url.searchParams.get("action") || "").toLowerCase();

      if (action === "mark-all-read") {
        await p.query(
          `UPDATE notifications
           SET is_read = true
           WHERE user_id = $1`,
          [user.id]
        );
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Unsupported notification action" }));
      return;
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url || "/api/notifications", `http://${req.headers.host || "localhost"}`);
      const id = (url.searchParams.get("id") || "").trim();

      if (id) {
        await p.query(
          `DELETE FROM notifications
           WHERE user_id = $1 AND id = $2`,
          [user.id, id]
        );
      } else {
        await p.query(
          `DELETE FROM notifications
           WHERE user_id = $1`,
          [user.id]
        );
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const result = await p.query<NotificationRow>(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at, actor.username as actor_username
       FROM notifications n
       LEFT JOIN users actor ON actor.id = n.actor_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [user.id]
    );

    const notifications = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.actor_username
        ? `${row.actor_username.toUpperCase()} // ${row.type.toUpperCase()}`
        : row.type.toUpperCase(),
      message: row.message ?? "New activity in your account.",
      time: row.created_at,
      read: row.is_read,
    }));

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ notifications }));
  } catch (error) {
    console.error("Notifications API failed:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed to fetch notifications" }));
  }
}
