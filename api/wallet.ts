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

    // GET /api/wallet - get wallet balance and info
    if (method === 'GET' && pathname === '/api/wallet') {
      const result = await p.query(
        `SELECT id, user_id, balance, created_at, updated_at
         FROM wallets
         WHERE user_id = $1`,
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
        // Create transaction
        const txResult = await p.query(
          `INSERT INTO wallet_transactions 
           (user_id, payment_method_id, transaction_type, amount, status, description)
           VALUES ($1, $2, 'topup', $3, 'completed', $4)
           RETURNING id, amount, status, created_at`,
          [userId, paymentMethodId || null, amount, description || `Wallet topup: $${amount}`]
        );

        // Update wallet balance
        await p.query(
          `UPDATE wallets SET balance = balance + $1, updated_at = NOW()
           WHERE user_id = $2`,
          [amount, userId]
        );

        // Get updated wallet
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
        // Check wallet balance
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

        // Create purchase transaction
        const txResult = await p.query(
          `INSERT INTO wallet_transactions 
           (user_id, transaction_type, amount, status, description)
           VALUES ($1, 'purchase', $2, 'completed', $3)
           RETURNING id`,
          [userId, price, `Game purchase: ${gameId}`]
        );

        const transactionId = txResult.rows[0].id;

        // Deduct from wallet
        await p.query(
          `UPDATE wallets SET balance = balance - $1, updated_at = NOW()
           WHERE user_id = $2`,
          [price, userId]
        );

        // Record purchase
        const purchaseResult = await p.query(
          `INSERT INTO game_purchases (user_id, game_id, price_paid, transaction_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, purchased_at`,
          [userId, gameId, price, transactionId]
        );

        // Get updated balance
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
        `SELECT id, game_id, price_paid, purchased_at
         FROM game_purchases
         WHERE user_id = $1
         ORDER BY purchased_at DESC
         LIMIT 100`,
        [userId]
      );

      res.statusCode = 200;
      res.end(JSON.stringify(result.rows));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Wallet API error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
