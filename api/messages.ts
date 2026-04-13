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

    // GET /api/messages - list conversations or get specific conversation
    if (method === 'GET' && pathname === '/api/messages') {
      const otherUserId = url.searchParams.get('with');

      if (otherUserId) {
        // Get conversation with specific user
        const result = await p.query(
          `SELECT m.id, m.sender_id, m.recipient_id, m.content, m.is_read, m.created_at,
                  s.username as sender_username, r.username as recipient_username
           FROM messages m
           LEFT JOIN users s ON m.sender_id = s.id
           LEFT JOIN users r ON m.recipient_id = r.id
           WHERE (m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1)
           ORDER BY m.created_at DESC
           LIMIT 100`,
          [userId, otherUserId]
        );
        res.statusCode = 200;
        res.end(JSON.stringify(result.rows.reverse()));
      } else {
        // Get list of conversations (latest message from each user)
        const result = await p.query(
          `WITH latest_messages AS (
             SELECT 
               CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as other_user_id,
               MAX(created_at) as latest_at
             FROM messages
             WHERE sender_id = $1 OR recipient_id = $1
             GROUP BY other_user_id
           )
           SELECT 
             lm.other_user_id,
             u.username,
             u.avatar,
             m.content as last_message,
             m.created_at as last_message_at,
             COUNT(CASE WHEN m.recipient_id = $1 AND m.is_read = FALSE THEN 1 END) as unread_count
           FROM latest_messages lm
           JOIN users u ON u.id = lm.other_user_id
           JOIN messages m ON 
             ((m.sender_id = $1 AND m.recipient_id = lm.other_user_id) OR
              (m.sender_id = lm.other_user_id AND m.recipient_id = $1))
             AND m.created_at = lm.latest_at
           GROUP BY lm.other_user_id, u.username, u.avatar, m.content, m.created_at
           ORDER BY m.created_at DESC`,
          [userId]
        );
        res.statusCode = 200;
        res.end(JSON.stringify(result.rows));
      }
      return;
    }

    // POST /api/messages - send message
    if (method === 'POST' && pathname === '/api/messages') {
      const body = JSON.parse(await readBody(req));
      const { recipientId, content } = body;

      if (!recipientId || !content) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing recipientId or content' }));
        return;
      }

      const result = await p.query(
        `INSERT INTO messages (sender_id, recipient_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
        [userId, recipientId, content]
      );

      res.statusCode = 201;
      res.end(JSON.stringify(result.rows[0]));
      return;
    }

    // PATCH /api/messages - mark messages as read
    if (method === 'PATCH' && pathname === '/api/messages') {
      const body = JSON.parse(await readBody(req));
      const { senderId } = body;

      if (!senderId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing senderId' }));
        return;
      }

      await p.query(
        `UPDATE messages SET is_read = TRUE, read_at = NOW()
         WHERE recipient_id = $1 AND sender_id = $2`,
        [userId, senderId]
      );

      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Messages API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
