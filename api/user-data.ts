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

    // Route to appropriate handler based on pathname
    if (pathname.startsWith('/api/messages')) {
      return handleMessages(req, res, pathname, method, url, userId, p);
    }
    if (pathname.startsWith('/api/groups')) {
      return handleGroups(req, res, pathname, method, url, userId, p);
    }
    if (pathname.startsWith('/api/wallet')) {
      return handleWallet(req, res, pathname, method, url, userId, p);
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('User data API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// ============================================================
// MESSAGES HANDLER
// ============================================================
async function handleMessages(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  method: string,
  url: URL,
  userId: string,
  p: Pool
): Promise<void> {
  // GET /api/messages - list conversations or get specific conversation
  if (method === 'GET' && pathname === '/api/messages') {
    const otherUserId = url.searchParams.get('with');

    if (otherUserId) {
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
}

// ============================================================
// GROUPS HANDLER
// ============================================================
async function handleGroups(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  method: string,
  url: URL,
  userId: string,
  p: Pool
): Promise<void> {
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

    await p.query(
      `UPDATE message_groups SET updated_at = NOW() WHERE id = $1`,
      [groupId]
    );

    res.statusCode = 201;
    res.end(JSON.stringify(result.rows[0]));
    return;
  }

  // POST /api/groups/[id]/members - add member to group
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
}

// ============================================================
// WALLET HANDLER
// ============================================================
async function handleWallet(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  method: string,
  url: URL,
  userId: string,
  p: Pool
): Promise<void> {
  // GET /api/wallet - get wallet balance
  if (method === 'GET' && pathname === '/api/wallet') {
    const result = await p.query(
      `SELECT id, user_id, balance, created_at, updated_at FROM wallets WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Wallet not found' }));
      return;
    }

    res.statusCode = 200;
    res.end(JSON.stringify(result.rows[0]));
    return;
  }

  // POST /api/wallet/topup - add funds to wallet
  if (method === 'POST' && pathname === '/api/wallet/topup') {
    const body = JSON.parse(await readBody(req));
    const { amount, paymentMethodId, description } = body;

    if (!amount || amount <= 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid amount' }));
      return;
    }

    await p.query('BEGIN');
    try {
      const txResult = await p.query(
        `INSERT INTO wallet_transactions 
         (user_id, payment_method_id, transaction_type, amount, status, description)
         VALUES ($1, $2, 'topup', $3, 'completed', $4)
         RETURNING id, amount, status, created_at`,
        [userId, paymentMethodId || null, amount, description || `Wallet topup: $${amount}`]
      );

      await p.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
        [amount, userId]
      );

      const walletResult = await p.query(
        `SELECT balance FROM wallets WHERE user_id = $1`,
        [userId]
      );

      await p.query('COMMIT');

      res.statusCode = 201;
      res.end(JSON.stringify({
        transaction: txResult.rows[0],
        newBalance: walletResult.rows[0].balance,
      }));
    } catch (error) {
      await p.query('ROLLBACK');
      throw error;
    }
    return;
  }

  // GET /api/wallet/transactions - get transaction history
  if (method === 'GET' && pathname === '/api/wallet/transactions') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const result = await p.query(
      `SELECT id, transaction_type, amount, status, description, created_at
       FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.statusCode = 200;
    res.end(JSON.stringify(result.rows));
    return;
  }

  // POST /api/wallet/purchase - purchase a game
  if (method === 'POST' && pathname === '/api/wallet/purchase') {
    const body = JSON.parse(await readBody(req));
    const { gameId, price } = body;

    if (!gameId || !price || price <= 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid gameId or price' }));
      return;
    }

    await p.query('BEGIN');
    try {
      const walletResult = await p.query(
        `SELECT balance FROM wallets WHERE user_id = $1`,
        [userId]
      );

      if (walletResult.rows.length === 0 || walletResult.rows[0].balance < price) {
        await p.query('ROLLBACK');
        res.statusCode = 402;
        res.end(JSON.stringify({ error: 'Insufficient balance' }));
        return;
      }

      const txResult = await p.query(
        `INSERT INTO wallet_transactions 
         (user_id, transaction_type, amount, status, description)
         VALUES ($1, 'purchase', $2, 'completed', $3)
         RETURNING id`,
        [userId, price, `Game purchase: ${gameId}`]
      );

      const transactionId = txResult.rows[0].id;

      await p.query(
        `UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2`,
        [price, userId]
      );

      const purchaseResult = await p.query(
        `INSERT INTO game_purchases (user_id, game_id, price_paid, transaction_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, purchased_at`,
        [userId, gameId, price, transactionId]
      );

      const updatedWallet = await p.query(
        `SELECT balance FROM wallets WHERE user_id = $1`,
        [userId]
      );

      await p.query('COMMIT');

      res.statusCode = 201;
      res.end(JSON.stringify({
        purchase: purchaseResult.rows[0],
        newBalance: updatedWallet.rows[0].balance,
      }));
    } catch (error) {
      await p.query('ROLLBACK');
      throw error;
    }
    return;
  }

  // GET /api/wallet/purchases - get purchase history
  if (method === 'GET' && pathname === '/api/wallet/purchases') {
    const result = await p.query(
      `SELECT id, game_id, price_paid, purchased_at FROM game_purchases
       WHERE user_id = $1 ORDER BY purchased_at DESC LIMIT 100`,
      [userId]
    );

    res.statusCode = 200;
    res.end(JSON.stringify(result.rows));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
}
