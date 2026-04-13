import type { IncomingMessage, ServerResponse } from "http";
import { Pool } from "pg";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "neon-grid-session";

type SessionUser = {
  id: string;
  username: string;
};

type FriendRow = {
  id: string;
  username: string;
  status: "online" | "offline" | "playing";
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

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function ensureFriendsSchema(p: Pool): Promise<void> {
  await p.query(`
    CREATE TABLE IF NOT EXISTS friends (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, friend_id),
      CHECK (user_id != friend_id)
    );
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
    `SELECT u.id, u.username
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export default async function friends(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const p = getPool();
  if (!p) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Database not configured" }));
    return;
  }

  try {
    await ensureFriendsSchema(p);

    const user = await getSessionUser(p, req);
    if (!user) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Not authenticated" }));
      return;
    }

    if (req.method === "GET") {
      const result = await p.query<FriendRow>(
        `SELECT
           f.id,
           u.username,
           CASE
             WHEN EXISTS (
               SELECT 1
               FROM auth_sessions s2
               WHERE s2.user_id = u.id AND s2.expires_at > NOW()
             ) THEN 'online'
             ELSE 'offline'
           END::text AS status
         FROM friends f
         INNER JOIN users u ON u.id = f.friend_id
         WHERE f.user_id = $1 AND f.status = 'accepted'
         ORDER BY u.username ASC`,
        [user.id]
      );

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ friends: result.rows }));
      return;
    }

    if (req.method === "POST") {
      const body = (await readJsonBody(req)) as { username?: unknown };
      const targetUsername = typeof body.username === "string" ? body.username.trim() : "";

      if (!targetUsername) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "username is required" }));
        return;
      }

      if (targetUsername.toLowerCase() === user.username.toLowerCase()) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "You cannot add yourself" }));
        return;
      }

      const target = await p.query<{ id: string; username: string }>(
        `SELECT id, username FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
        [targetUsername]
      );

      if (target.rows.length === 0) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "User not found" }));
        return;
      }

      const friend = target.rows[0];

      await p.query(`BEGIN`);
      await p.query(
        `INSERT INTO friends (user_id, friend_id, status)
         VALUES ($1, $2, 'accepted')
         ON CONFLICT (user_id, friend_id)
         DO UPDATE SET status = EXCLUDED.status`,
        [user.id, friend.id]
      );
      await p.query(
        `INSERT INTO friends (user_id, friend_id, status)
         VALUES ($1, $2, 'accepted')
         ON CONFLICT (user_id, friend_id)
         DO UPDATE SET status = EXCLUDED.status`,
        [friend.id, user.id]
      );
      await p.query(
        `INSERT INTO notifications (user_id, type, actor_id, message, is_read)
         VALUES ($1, 'friend', $2, $3, false)`,
        [friend.id, user.id, `${user.username} added you to GRID_CONTACTS.`]
      );
      await p.query(`COMMIT`);

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
  } catch (error) {
    await p.query(`ROLLBACK`).catch(() => undefined);
    console.error("Friends API failed:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Friends request failed" }));
  }
}
