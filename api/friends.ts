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

type UserSearchRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: "admin" | "player";
  email: string | null;
  is_friend: boolean;
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
      const requestUrl = new URL(req.url || "/api/friends", `http://${req.headers.host || "localhost"}`);
      const searchTerm = requestUrl.searchParams.get("search")?.trim() || "";

      if (searchTerm) {
        // Show all users matching the search, with online/offline and friend status
        const result = await p.query<{
          id: string;
          username: string;
          avatar_url: string | null;
          role: string;
          email: string | null;
          is_friend: boolean;
          status: 'online' | 'offline';
        }>(
          `SELECT
             u.id,
             u.username,
             u.avatar_url,
             COALESCE(u.role, 'player')::text AS role,
             u.email,
             EXISTS(
               SELECT 1
               FROM friends f
               WHERE f.user_id = $1 AND f.friend_id = u.id AND f.status = 'accepted'
             ) AS is_friend,
             CASE WHEN EXISTS (
               SELECT 1 FROM auth_sessions s2 WHERE s2.user_id = u.id AND s2.expires_at > NOW()
             ) THEN 'online' ELSE 'offline' END AS status
           FROM users u
           WHERE u.id <> $1
             AND (
               u.username ILIKE $2 || '%'
               OR u.username ILIKE '%' || $2 || '%'
             )
           ORDER BY
             CASE WHEN u.username ILIKE $2 || '%' THEN 0 ELSE 1 END,
             u.username ASC
           LIMIT 12`,
          [user.id, searchTerm.slice(0, 40)]
        );
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ users: result.rows }));
        return;
      }

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
      const body = (await readJsonBody(req)) as { username?: unknown, groupId?: unknown };
      const targetUsername = typeof body.username === "string" ? body.username.trim() : "";
      const groupId = typeof body.groupId === "string" ? body.groupId.trim() : undefined;

      // Add to group logic
      if (groupId && targetUsername) {
        // Find user to add
        const target = await p.query<{ id: string }>(
          `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
          [targetUsername]
        );
        if (target.rows.length === 0) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }
        const targetId = target.rows[0].id;
        // Check if requester is a member of the group
        const isMember = await p.query(
          `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 LIMIT 1`,
          [groupId, user.id]
        );
        if (isMember.rows.length === 0) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: "You are not a member of this group" }));
          return;
        }
        // Add user to group
        await p.query(
          `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT (group_id, user_id) DO NOTHING`,
          [groupId, targetId]
        );
        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Add friend logic (default)
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
      // Check if already friends or pending
      const existing = await p.query<{ status: string }>(
        `SELECT status FROM friends WHERE user_id = $1 AND friend_id = $2`,
        [user.id, friend.id]
      );
      let status = 'pending';
      if (existing.rows.length > 0 && existing.rows[0].status === 'accepted') {
        status = 'accepted';
      } else {
        // Check if reciprocal request exists (mutual pending)
        const reciprocal = await p.query<{ status: string }>(
          `SELECT status FROM friends WHERE user_id = $1 AND friend_id = $2`,
          [friend.id, user.id]
        );
        if (reciprocal.rows.length > 0 && reciprocal.rows[0].status === 'pending') {
          status = 'accepted';
        }
      }
      // Insert or update friend request
      await p.query(
        `INSERT INTO friends (user_id, friend_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, friend_id)
         DO UPDATE SET status = EXCLUDED.status`,
        [user.id, friend.id, status]
      );
      if (status === 'accepted') {
        // Accept reciprocal
        await p.query(
          `UPDATE friends SET status = 'accepted' WHERE user_id = $1 AND friend_id = $2`,
          [friend.id, user.id]
        );
        await p.query(
          `INSERT INTO notifications (user_id, type, actor_id, message, is_read)
           VALUES ($1, 'friend', $2, $3, false)`,
          [friend.id, user.id, `${user.username} accepted your friend request.`]
        );
      } else {
        // Notify recipient of friend request
        await p.query(
          `INSERT INTO notifications (user_id, type, actor_id, message, is_read)
           VALUES ($1, 'friend', $2, $3, false)`,
          [friend.id, user.id, `${user.username} sent you a friend request.`]
        );
      }
      await p.query(`COMMIT`);
      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, status }));
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
