import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";
import net from "net";
import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();

const SESSION_COOKIE_NAME = 'neon-grid-session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type UserRole = 'admin' | 'player';

type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  email: string | null;
};

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'player';
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120_000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualHash = crypto.pbkdf2Sync(password, salt, 120_000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createSessionToken() {
  return `${crypto.randomUUID()}.${crypto.randomBytes(24).toString('hex')}`;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

function getAdminBootstrapCredentials() {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME || 'admin';
  return {
    username,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin1234!',
    email: process.env.ADMIN_BOOTSTRAP_EMAIL || `${username}@local.admin`,
  };
}

function parseCookies(cookieHeader: string | undefined) {
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

type GameRow = {
  id: string;
  title: string;
  rom_storage_key: string | null;
  rom_filename: string | null;
  is_downloadable: boolean;
  platform?: string | null;
  publisher?: string | null;
  edition?: string | null;
  stock_quantity?: number | null;
  warehouse_zone?: string | null;
  discount_percent?: number | null;
};

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error('S3_SIGNING_CONFIG_MISSING');
    }

    s3Client = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  return s3Client;
}

function getBucketName() {
  return process.env.S3_BUCKET || process.env.FILEBASE_BUCKET || null;
}

function requireRomAdminKey(req: express.Request) {
  const configuredKey = process.env.ROM_ADMIN_KEY;
  if (!configuredKey) return true;
  return req.headers['x-admin-key'] === configuredKey;
}

function sanitizeFilename(filename: string) {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'rom.bin';
}

function normalizeLicenseType(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : 'unknown';
  return text.slice(0, 40) || 'unknown';
}

// Lazy initialization of PostgreSQL pool
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("DATABASE_URL is missing. Database features will be disabled until configured.");
      return null;
    }
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
}

async function initDb() {
  const p = getPool();
  if (!p) return;

  try {
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
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title TEXT,
        price REAL,
        description TEXT,
        image TEXT,
        category TEXT,
        platform TEXT,
        publisher TEXT,
        edition TEXT,
        stock_quantity INT NOT NULL DEFAULT 0,
        warehouse_zone TEXT,
        discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
        rom_storage_key TEXT,
        rom_filename TEXT,
        rom_size_bytes BIGINT,
        rom_sha256 TEXT,
        license_type TEXT,
        is_downloadable BOOLEAN NOT NULL DEFAULT TRUE
      );
      CREATE TABLE IF NOT EXISTS library (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        game_id INT REFERENCES games(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, game_id)
      );
      CREATE TABLE IF NOT EXISTS friends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'accepted',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, friend_id),
        CHECK (user_id <> friend_id)
      );
      CREATE TABLE IF NOT EXISTS bucket_items (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, game_id)
      );
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        last_four TEXT,
        is_default BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS wallets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payment_method_id TEXT REFERENCES payment_methods(id) ON DELETE SET NULL,
        transaction_type TEXT NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed',
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_tier TEXT NOT NULL DEFAULT 'rookie',
        subtotal_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        currency_code CHAR(3) NOT NULL DEFAULT 'XAF',
        status TEXT NOT NULL DEFAULT 'completed',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1,
        unit_price NUMERIC(12,2) NOT NULL,
        discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (order_id, game_id)
      );
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payment_method_id TEXT REFERENCES payment_methods(id) ON DELETE SET NULL,
        wallet_transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
        amount NUMERIC(12,2) NOT NULL,
        currency_code CHAR(3) NOT NULL DEFAULT 'XAF',
        status TEXT NOT NULL DEFAULT 'completed',
        provider TEXT NOT NULL DEFAULT 'wallet',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS game_purchases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE SET NULL,
        price_paid NUMERIC(12,2) NOT NULL,
        purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, game_id)
      );
    `);

    await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'player';`);
    await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
    await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
    await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS platform TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS publisher TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS edition TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS warehouse_zone TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS rom_storage_key TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS rom_filename TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS rom_size_bytes BIGINT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS rom_sha256 TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS license_type TEXT;`);
    await p.query(`ALTER TABLE games ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN NOT NULL DEFAULT TRUE;`);

    await p.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (email) WHERE email IS NOT NULL;`);

    const admin = getAdminBootstrapCredentials();
    const adminCredentials = hashPassword(admin.password);
    await p.query(
      `INSERT INTO users (username, avatar_url, email, password_hash, password_salt, role)
       VALUES ($1, NULL, $2, $3, $4, 'admin')
       ON CONFLICT (username)
       DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash, password_salt = EXCLUDED.password_salt`,
      [admin.username, admin.email, adminCredentials.hash, adminCredentials.salt]
    );

    const res = await p.query("SELECT COUNT(*) FROM games");
    if (parseInt(res.rows[0].count) === 0) {
      const insertQuery = "INSERT INTO games (title, price, description, image, category, platform, publisher, edition, stock_quantity, warehouse_zone, discount_percent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)";
      const games = [
        ["NEON STRIKE", 29.99, "High-speed glitch combat in the digital void. Master the art of code-warfare.", "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200", "Action", "PC / Console", "GridForge", "Collector's Cut", 18, "A1", 0],
        ["VOID RUNNER", 19.99, "Escape the collapsing simulation in this high-octane racing experience.", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200", "Racing", "PC", "GridForge", "Standard", 24, "B2", 0],
        ["CYBER-SOUL", 39.99, "A deep RPG set in a decaying megacity. Every choice alters the grid's fate.", "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200", "RPG", "PC / Cloud", "Neon Atlas", "Deluxe", 12, "C1", 5],
        ["GLITCH-BIT", 14.99, "Retro platforming with a broken twist. Navigate through fragmented data.", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200", "Platformer", "Handheld / PC", "PixelPulse", "Arcade", 30, "A3", 0],
        ["TERMINAL VELOCITY", 24.99, "Tactical shooter in a low-poly digital landscape. Precision is everything.", "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200", "Shooter", "PC", "GridForge", "Tactical", 20, "B1", 0],
        ["DATA DRIFTER", 9.99, "Zen-like strategy game about navigating the streams of information.", "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200", "Strategy", "PC / Tablet", "Neon Atlas", "Indie", 40, "D4", 0]
      ];
      for (const game of games) {
        await p.query(insertQuery, game);
      }
      console.log("Database seeded with expanded catalog.");
    }
  } catch (err) {
    console.error("CRITICAL: Database initialization failed!");
    console.error(err);
  }
}

async function getSessionUser(req: express.Request) {
  const p = getPool();
  if (!p) return null;

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await p.query<UserRow>(
    `SELECT u.id, u.username, u.avatar_url, u.role, u.email
     FROM auth_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

async function issueSession(res: express.Response, userId: string) {
  const p = getPool();
  if (!p) throw new Error('Database not configured');

  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await p.query(
    `INSERT INTO auth_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt.toISOString()]
  );

  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions());
}

async function findAvailablePort(preferredPort: number, host: string) {
  const tryPort = (port: number) => new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen({ port, host }, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          resolve(port);
        }
      });
    });
  });

  try {
    return await tryPort(preferredPort);
  } catch {
    for (let port = preferredPort + 1; port <= preferredPort + 50; port += 1) {
      try {
        return await tryPort(port);
      } catch {
        continue;
      }
    }

    throw new Error(`Unable to find an open port near ${preferredPort}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = await findAvailablePort(3000, "0.0.0.0");

  app.use(express.json());

  // Initialize DB
  await initDb();

  // API Routes
  app.get("/api/games", async (req, res) => {
    const p = getPool();
    const defaultSpecs = {
      min: { os: "Windows 10 64-bit", processor: "Intel Core i5-4460 / AMD FX-6300", memory: "8 GB RAM", graphics: "NVIDIA GeForce GTX 760 / AMD Radeon R7 260x", storage: "20 GB available space" },
      rec: { os: "Windows 11 64-bit", processor: "Intel Core i7-8700K / AMD Ryzen 5 3600X", memory: "16 GB RAM", graphics: "NVIDIA GeForce RTX 2060 / AMD Radeon RX 5600 XT", storage: "20 GB available space" }
    };

    const mockGames = [
      { id: 101, title: "NEON STRIKE", price: 29.99, description: "High-speed glitch combat in the digital void. Master the art of code-warfare.", image: "/src/assets/images/f3b7e9f1865a02d3618eb4f41c287bcf.jpg", category: "Action", rating: "9.2/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 102, title: "VOID RUNNER", price: 19.99, description: "Escape the collapsing simulation in this high-octane racing experience.", image: "/src/assets/images/afca124bf35229da8841d24ab2ca8c0f.jpg", category: "Racing", rating: "8.5/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 103, title: "CYBER-SOUL", price: 39.99, description: "A deep RPG set in a decaying megacity. Every choice alters the grid's fate.", image: "/src/assets/images/a0b725d92124a133cfb7e86adb934727.jpg", category: "RPG", rating: "9.5/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 104, title: "GLITCH-BIT", price: 14.99, description: "Retro platforming with a broken twist. Navigate through fragmented data.", image: "/src/assets/images/download.jfif", category: "Platformer", rating: "7.8/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 105, title: "TERMINAL VELOCITY", price: 24.99, description: "Tactical shooter in a low-poly digital landscape. Precision is everything.", image: "/src/assets/images/download (1).jfif", category: "Shooter", rating: "8.9/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 106, title: "DATA DRIFTER", price: 9.99, description: "Zen-like strategy game about navigating the streams of information.", image: "/src/assets/images/download (2).jfif", category: "Strategy", rating: "8.2/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 107, title: "SIGNAL LOST", price: 34.99, description: "Investigate a silent satellite in deep space. A psychological horror protocol.", image: "/src/assets/images/download (3).jfif", category: "Horror", rating: "9.0/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 108, title: "GRID WALKER", price: 44.99, description: "Advanced physics-based parkour in a neo-tokyo megastructure.", image: "/src/assets/images/download (4).jfif", category: "Action", rating: "8.7/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 109, title: "WATCH DOGS", price: 49.99, description: "Hack the city and control everything in this open-world techno-thriller.", image: "/src/assets/images/♥ watch dogs ♥.jfif", category: "Action", rating: "8.4/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 110, title: "UNTIL DAWN", price: 29.99, description: "Survival horror where every decision can mean life or death for the characters.", image: "/src/assets/images/𝐔𝐧𝐭𝐢𝐥 𝐃𝐚𝐰𝐧.jfif", category: "Horror", rating: "9.1/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 111, title: "PHANTOM GRID", price: 19.99, description: "High-stakes stealth in a virtual panopticon.", image: "/src/assets/images/0a5cac79375e59f07ea6a33a1ecd3dae.jpg", category: "Stealth", rating: "8.0/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 112, title: "CYBER PULSE", price: 14.99, description: "Rhythm-based combat in a neon-drenched reality.", image: "/src/assets/images/289d5dac4711f0a54b9eee93e125b77c.jpg", category: "Action", rating: "7.5/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 113, title: "VECTOR DRIFT", price: 9.99, description: "Physics-based drifting through abstract geometric landscapes.", image: "/src/assets/images/65baa3787ab8313b4784602b043324d0.jpg", category: "Racing", rating: "8.3/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 114, title: "NULL POINTER", price: 24.99, description: "Mystery investigation in a city made of data leaks.", image: "/src/assets/images/6d68914b25272af09cd89a150117bc50.jpg", category: "Mystery", rating: "8.8/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 115, title: "STATIC CORE", price: 34.99, description: "Defense mechanism simulation against an invading virus.", image: "/src/assets/images/7b6d2d0931d132477c462762d4d105e8.jpg", category: "Strategy", rating: "7.9/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 116, title: "GHOST SHELL", price: 44.99, description: "Exploration through the remains of a forgotten internet.", image: "/src/assets/images/df6a644a133319b2c20f7c501ea7ae1d.jpg", category: "Exploration", rating: "9.3/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 117, title: "NEO SPECTER", price: 19.99, description: "Supernatural entity hunting in a digital wasteland.", image: "/src/assets/images/f5d837f70cf9a502245348efb3d48773.jpg", category: "Action", rating: "8.6/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec },
      { id: 118, title: "CORE DUMP", price: 14.99, description: "Chaotic arena brawler with destructible code environments.", image: "/src/assets/images/fe3039c9dde62dfd179915be1ea5905d.jpg", category: "Action", rating: "8.1/10", minSpecs: defaultSpecs.min, recSpecs: defaultSpecs.rec }
    ];

    if (!p) {
      console.warn("DB_OFFLINE: Serving mock data.");
      return res.json(mockGames);
    }

    try {
      const result = await p.query("SELECT * FROM games");
      if (result.rows.length === 0) return res.json(mockGames);
      res.json(result.rows);
    } catch (err) {
      console.error("Database query failed:", err);
      console.warn("Falling back to mock data.");
      res.json(mockGames);
    }
  });

  app.get("/api/users", async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: "Database not configured" });
    try {
      const result = await p.query("SELECT id, username, avatar_url, email, role FROM users");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: "Database not configured" });

    try {
      const { username, avatarUrl, role } = req.body ?? {};
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: "username is required" });
      }

      const requestedRole = role === 'admin' ? 'admin' : 'player';
      const adminKey = req.headers['x-admin-key'];
      const configuredKey = process.env.ROM_ADMIN_KEY;
      const finalRole = requestedRole === 'admin' && configuredKey && adminKey !== configuredKey ? 'player' : requestedRole;

      const result = await p.query(
        `INSERT INTO users (username, avatar_url, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (username)
         DO UPDATE SET avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url), role = CASE WHEN users.role = 'admin' THEN 'admin' ELSE EXCLUDED.role END
         RETURNING *`,
        [username.trim(), avatarUrl || null, finalRole]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Failed to create user:", err);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get('/api/admin/overview', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    try {
      const sessionUser = await getSessionUser(req);
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const [userCounts, gameCounts, recentUsers, recentGames] = await Promise.all([
        p.query(
          `SELECT
             COUNT(*)::int AS total_users,
             COUNT(*) FILTER (WHERE role = 'admin')::int AS admin_users,
             COUNT(*) FILTER (WHERE role = 'player')::int AS player_users
           FROM users`
        ),
        p.query(
          `SELECT COUNT(*)::int AS total_games FROM games`
        ),
        p.query(
          `SELECT id, username, role, email
           FROM users
           ORDER BY username ASC
           LIMIT 5`
        ),
        p.query(
          `SELECT id, title, category, price, image_url AS image
           FROM games
           ORDER BY id DESC
           LIMIT 5`
        ),
      ]);

      res.json({
        summary: {
          totalUsers: Number(userCounts.rows[0]?.total_users ?? 0),
          adminUsers: Number(userCounts.rows[0]?.admin_users ?? 0),
          playerUsers: Number(userCounts.rows[0]?.player_users ?? 0),
          totalGames: Number(gameCounts.rows[0]?.total_games ?? 0),
        },
        recentUsers: recentUsers.rows,
        recentGames: recentGames.rows,
      });
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
      res.status(500).json({ error: 'Failed to fetch admin overview' });
    }
  });

  app.post('/api/auth/signup', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    try {
      const { username, email, password } = req.body ?? {};
      if (!username || !password || !email) {
        return res.status(400).json({ error: 'username, email, and password are required' });
      }

      if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid signup payload' });
      }

      const passwordData = hashPassword(password);
      const result = await p.query<UserRow>(
        `INSERT INTO users (username, email, password_hash, password_salt, role)
         VALUES ($1, $2, $3, $4, 'player')
         RETURNING id, username, avatar_url, role, email`,
        [username.trim(), email.trim().toLowerCase(), passwordData.hash, passwordData.salt]
      );

      await issueSession(res, result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Failed to sign up user:', err);
      res.status(500).json({ error: 'Failed to sign up user' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    try {
      const { username, password } = req.body ?? {};
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'username and password are required' });
      }

      const result = await p.query<UserRow & { password_hash: string | null; password_salt: string | null }>(
        `SELECT id, username, avatar_url, role, email, password_hash, password_salt
         FROM users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username.trim()]
      );

      const user = result.rows[0];
      if (!user || !user.password_hash || !user.password_salt || !verifyPassword(password, user.password_salt, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      await issueSession(res, user.id);
      res.json({ id: user.id, username: user.username, avatar_url: user.avatar_url, role: normalizeRole(user.role), email: user.email });
    } catch (err) {
      console.error('Failed to log in user:', err);
      res.status(500).json({ error: 'Failed to log in user' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      res.json(user);
    } catch (err) {
      console.error('Failed to read session:', err);
      res.status(500).json({ error: 'Failed to read session' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(200).json({ ok: true });

    try {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies[SESSION_COOKIE_NAME];
      if (token) {
        await p.query(`DELETE FROM auth_sessions WHERE token_hash = $1`, [hashToken(token)]);
      }

      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      res.json({ ok: true });
    } catch (err) {
      console.error('Failed to log out:', err);
      res.status(500).json({ error: 'Failed to log out' });
    }
  });

  app.post('/api/rom-upload-url', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    if (!requireRomAdminKey(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { gameId, filename, contentType, expiresInSeconds } = req.body ?? {};
      if (!gameId || !filename) {
        return res.status(400).json({ error: 'gameId and filename are required' });
      }

      const gameRes = await p.query<{ id: string; title: string }>(
        `SELECT id, title
         FROM games
         WHERE id = $1
         LIMIT 1`,
        [String(gameId)]
      );

      if (gameRes.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const bucket = getBucketName();
      if (!bucket) {
        return res.status(500).json({ error: 'S3_BUCKET is not configured' });
      }

      const storageKey = `roms/${String(gameId)}/${sanitizeFilename(String(filename))}`;
      const uploadUrl = await getSignedUrl(
        getS3Client(),
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          ContentType: contentType || 'application/octet-stream',
        }),
        { expiresIn: Math.min(Math.max(Number(expiresInSeconds) || 300, 60), 900) }
      );

      return res.json({
        gameId: gameRes.rows[0].id,
        title: gameRes.rows[0].title,
        uploadUrl,
        storageKey,
        expiresInSeconds: Math.min(Math.max(Number(expiresInSeconds) || 300, 60), 900),
      });
    } catch (err) {
      console.error('Failed to create ROM upload URL:', err);
      return res.status(500).json({ error: 'Failed to create upload URL' });
    }
  });

  app.post('/api/register-rom', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    if (!requireRomAdminKey(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { gameId, romStorageKey, romFilename, romSizeBytes, romSha256, licenseType, isDownloadable } = req.body ?? {};
      if (!gameId || !romStorageKey) {
        return res.status(400).json({ error: 'gameId and romStorageKey are required' });
      }

      const updateRes = await p.query(
        `UPDATE games
         SET rom_storage_key = $1,
             rom_filename = $2,
             rom_size_bytes = $3,
             rom_sha256 = $4,
             license_type = $5,
             is_downloadable = $6
         WHERE id = $7
         RETURNING id, title, rom_storage_key, rom_filename, is_downloadable`,
        [
          String(romStorageKey),
          romFilename || null,
          romSizeBytes || null,
          romSha256 || null,
          licenseType || 'unknown',
          isDownloadable ?? true,
          String(gameId),
        ]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.json({ game: updateRes.rows[0] });
    } catch (err) {
      console.error('Failed to register ROM metadata:', err);
      return res.status(500).json({ error: 'Failed to register ROM metadata' });
    }
  });

  app.post('/api/admin/upload-rom', express.raw({ type: 'application/octet-stream', limit: '200mb' }), async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    try {
      const sessionUser = await getSessionUser(req);
      if (!sessionUser || sessionUser.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const requestUrl = new URL(req.originalUrl, 'http://localhost');
      const gameId = String(requestUrl.searchParams.get('gameId') || '').trim();
      const filename = String(requestUrl.searchParams.get('filename') || '').trim();
      const licenseType = normalizeLicenseType(requestUrl.searchParams.get('licenseType'));
      const contentType = String(req.headers['content-type'] || 'application/octet-stream').trim() || 'application/octet-stream';
      const isDownloadable = String(requestUrl.searchParams.get('isDownloadable') || 'true').toLowerCase() !== 'false';
      const romSha256 = String(requestUrl.searchParams.get('romSha256') || '').trim();

      if (!gameId || !filename) {
        return res.status(400).json({ error: 'x-game-id and x-filename are required' });
      }

      const body = req.body;
      if (!body || !(body instanceof Buffer) || body.length === 0) {
        return res.status(400).json({ error: 'ROM file body is empty' });
      }

      const gameRes = await p.query<{ id: string; title: string }>(
        `SELECT id, title
         FROM games
         WHERE id = $1
         LIMIT 1`,
        [gameId]
      );

      if (gameRes.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const bucket = getBucketName();
      if (!bucket) {
        return res.status(500).json({ error: 'S3_BUCKET is not configured' });
      }

      const storageKey = `roms/${gameId}/${sanitizeFilename(filename)}`;
      await getS3Client().send(new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: body,
        ContentType: contentType,
      }));

      const updateRes = await p.query(
        `UPDATE games
         SET rom_storage_key = $1,
             rom_filename = $2,
             rom_size_bytes = $3,
             rom_sha256 = $4,
             license_type = LEFT($5, 40),
             is_downloadable = $6
         WHERE id = $7
         RETURNING id, title, rom_storage_key, rom_filename, is_downloadable`,
        [storageKey, filename, body.length, romSha256 || null, licenseType, isDownloadable, gameId]
      );

      return res.json({
        game: updateRes.rows[0],
      });
    } catch (err) {
      console.error('Failed to upload ROM through admin proxy:', err);
      return res.status(500).json({ error: 'Failed to upload ROM' });
    }
  });

  app.post('/api/game-download-url', async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: 'Database not configured' });

    try {
      const sessionUser = await getSessionUser(req);
      if (!sessionUser) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { gameId, expiresInSeconds } = req.body ?? {};
      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      const gameRes = await p.query<GameRow>(
        `SELECT id, title, rom_storage_key, rom_filename, is_downloadable
         FROM games
         WHERE id = $1
         LIMIT 1`,
        [String(gameId)]
      );

      if (gameRes.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const game = gameRes.rows[0];
      if (!game.is_downloadable || !game.rom_storage_key) {
        return res.status(400).json({ error: 'This game is not downloadable' });
      }

      const requireLibrary = process.env.DOWNLOAD_REQUIRE_LIBRARY === 'true';
      if (requireLibrary) {
        const entitlementRes = await p.query(
          `SELECT 1
           FROM library
           WHERE user_id = $1 AND game_id = $2
           LIMIT 1`,
          [sessionUser.id, String(gameId)]
        );

        if (entitlementRes.rows.length === 0) {
          return res.status(403).json({ error: 'User does not own this game' });
        }
      }

      const bucket = getBucketName();
      if (!bucket) {
        return res.status(500).json({ error: 'S3_BUCKET is not configured' });
      }

      const signedUrl = await getSignedUrl(
        getS3Client(),
        new GetObjectCommand({
          Bucket: bucket,
          Key: game.rom_storage_key,
          ResponseContentDisposition: `attachment; filename="${game.rom_filename || `${game.title}.zip`}"`,
        }),
        { expiresIn: Math.min(Math.max(Number(expiresInSeconds) || 60, 30), 300) }
      );

      return res.json({
        gameId: game.id,
        title: game.title,
        signedUrl,
        expiresInSeconds: Math.min(Math.max(Number(expiresInSeconds) || 60, 30), 300),
        userId: sessionUser.id,
      });
    } catch (err) {
      console.error('Failed to generate ROM download URL:', err);
      return res.status(500).json({ error: 'Failed to create signed download URL' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEON-GRID Server running on http://localhost:${PORT}`);
  });
}

startServer();
