import type { IncomingMessage, ServerResponse } from 'http';
import { Pool } from 'pg';
import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'neon-grid-session';
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
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

async function getSessionUser(req: IncomingMessage): Promise<string | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) return null;

    const tokenHash = hashToken(token);
    const result = await p.query(
      `SELECT user_id FROM auth_sessions WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1`,
      [tokenHash]
    );

    return result.rows[0]?.user_id || null;
  } catch {
    return null;
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const userId = await getSessionUser(req);
  if (!userId) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const p = getPool();
  if (!p) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Database not configured' }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    const url = new URL(req.url || '', 'http://localhost');
    const pathname = url.pathname;
    const method = req.method || 'GET';

    // GET /api/groups - list groups user is member of
    if (method === 'GET' && pathname === '/api/groups') {
      const result = await p.query(
        `SELECT mg.id, mg.name, mg.description, mg.is_public, mg.creator_id,
                COUNT(gm.id) as member_count,
                u.username as creator_username
         FROM message_groups mg
         JOIN group_members gm ON mg.id = gm.group_id
         JOIN users u ON mg.creator_id = u.id
         WHERE gm.user_id = $1
         GROUP BY mg.id, u.username
         ORDER BY mg.updated_at DESC`,
        [userId]
      );

      res.statusCode = 200;
      res.end(JSON.stringify(result.rows));
      return;
    }

    // POST /api/groups - create new group
    if (method === 'POST' && pathname === '/api/groups') {
      const body = JSON.parse(await readBody(req));
      const { name, description, isPublic } = body;

      if (!name) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Group name required' }));
        return;
      }

      await p.query('BEGIN');
      try {
        const groupResult = await p.query(
          `INSERT INTO message_groups (name, description, creator_id, is_public)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, description, is_public, creator_id, created_at`,
          [name, description || null, userId, isPublic !== false]
        );

        const groupId = groupResult.rows[0].id;

        // Add creator as admin member
        await p.query(
          `INSERT INTO group_members (group_id, user_id, is_admin)
           VALUES ($1, $2, TRUE)`,
          [groupId, userId]
        );

        await p.query('COMMIT');
        res.statusCode = 201;
        res.end(JSON.stringify(groupResult.rows[0]));
      } catch (error) {
        await p.query('ROLLBACK');
        throw error;
      }
      return;
    }

    // GET /api/groups/[id]/messages - get group messages
    const groupMessagesMatch = pathname.match(/^\/api\/groups\/([^/]+)\/messages$/);
    if (method === 'GET' && groupMessagesMatch) {
      const groupId = groupMessagesMatch[1];

      // Verify user is member
      const memberCheck = await p.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'Not a member of this group' }));
        return;
      }

      const result = await p.query(
        `SELECT gm.id, gm.group_id, gm.sender_id, gm.content, gm.created_at,
                u.username as sender_username
         FROM group_messages gm
         JOIN users u ON gm.sender_id = u.id
         WHERE gm.group_id = $1
         ORDER BY gm.created_at DESC
         LIMIT 100`,
        [groupId]
      );

      res.statusCode = 200;
      res.end(JSON.stringify(result.rows.reverse()));
      return;
    }

    // POST /api/groups/[id]/messages - send group message
    const postGroupMessageMatch = pathname.match(/^\/api\/groups\/([^/]+)\/messages$/);
    if (method === 'POST' && postGroupMessageMatch) {
      const groupId = postGroupMessageMatch[1];
      const body = JSON.parse(await readBody(req));
      const { content } = body;

      if (!content) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Message content required' }));
        return;
      }

      // Verify user is member
      const memberCheck = await p.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
        [groupId, userId]
      );

      if (memberCheck.rows.length === 0) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'Not a member of this group' }));
        return;
      }

      const result = await p.query(
        `INSERT INTO group_messages (group_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, group_id, sender_id, content, created_at`,
        [groupId, userId, content]
      );

      // Update group's updated_at
      await p.query(
        `UPDATE message_groups SET updated_at = NOW() WHERE id = $1`,
        [groupId]
      );

      res.statusCode = 201;
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // POST /api/groups/[id]/members - join/add member to group
    const addMemberMatch = pathname.match(/^\/api\/groups\/([^/]+)\/members$/);
    if (method === 'POST' && addMemberMatch) {
      const groupId = addMemberMatch[1];
      const body = JSON.parse(await readBody(req));
      const { userId: targetUserId } = body;

      if (!targetUserId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'User ID required' }));
        return;
      }

      // Check if user is admin
      const adminCheck = await p.query(
        `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND is_admin = TRUE`,
        [groupId, userId]
      );

      if (adminCheck.rows.length === 0) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'Only admins can add members' }));
        return;
      }

      try {
        await p.query(
          `INSERT INTO group_members (group_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (group_id, user_id) DO NOTHING`,
          [groupId, targetUserId]
        );

        res.statusCode = 201;
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Failed to add member' }));
      }
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Groups API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
