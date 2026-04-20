import type { IncomingMessage, ServerResponse } from "http";
import { Pool } from "pg";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "neon-grid-session";

function getPool(): Pool | null {
  if (!(global as any)._groupPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;
    (global as any)._groupPool = new Pool({ connectionString });
  }
  return (global as any)._groupPool;
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

async function getSessionUser(p: Pool, req: IncomingMessage) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  const tokenHash = hashToken(token);
  const result = await p.query<{ id: string; username: string }>(
    `SELECT u.id, u.username FROM auth_sessions s INNER JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > NOW() LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export default async function addToGroup(req: IncomingMessage, res: ServerResponse) {
  const p = getPool();
  if (!p) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Database not configured" }));
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  try {
    const user = await getSessionUser(p, req);
    if (!user) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Not authenticated" }));
      return;
    }
    let body = "";
    await new Promise((resolve, reject) => {
      req.on("data", chunk => (body += chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });
    const { groupId, username } = JSON.parse(body || "{}");
    if (!groupId || !username) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "groupId and username required" }));
      return;
    }
    // Find user to add
    const target = await p.query<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username]
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
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed to add user to group" }));
  }
}
