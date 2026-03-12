import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

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
      ssl: {
        rejectUnauthorized: false // Required for many online providers like Supabase/Neon
      }
    });
  }
  return pool;
}

async function initDb() {
  const p = getPool();
  if (!p) return;

  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        avatar TEXT
      );
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title TEXT,
        price REAL,
        description TEXT,
        image TEXT,
        category TEXT
      );
      CREATE TABLE IF NOT EXISTS library (
        user_id INTEGER REFERENCES users(id),
        game_id INTEGER REFERENCES games(id)
      );
      CREATE TABLE IF NOT EXISTS friends (
        user_id INTEGER REFERENCES users(id),
        friend_id INTEGER REFERENCES users(id),
        status TEXT -- 'pending', 'accepted'
      );
    `);

    const res = await p.query("SELECT COUNT(*) FROM games");
    if (parseInt(res.rows[0].count) === 0) {
      const insertQuery = "INSERT INTO games (title, price, description, image, category) VALUES ($1, $2, $3, $4, $5)";
      await p.query(insertQuery, ["NEON STRIKE", 29.99, "High-speed glitch combat in the digital void.", "https://picsum.photos/seed/neon/800/450", "Action"]);
      await p.query(insertQuery, ["VOID RUNNER", 19.99, "Escape the collapsing simulation.", "https://picsum.photos/seed/void/800/450", "Racing"]);
      await p.query(insertQuery, ["CYBER-SOUL", 39.99, "A deep RPG set in a decaying megacity.", "https://picsum.photos/seed/cyber/800/450", "RPG"]);
      await p.query(insertQuery, ["GLITCH-BIT", 9.99, "Retro platforming with a broken twist.", "https://picsum.photos/seed/glitch/800/450", "Platformer"]);
      console.log("Database seeded successfully.");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  await initDb();

  // API Routes
  app.get("/api/games", async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: "Database not configured" });
    try {
      const result = await p.query("SELECT * FROM games");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/users", async (req, res) => {
    const p = getPool();
    if (!p) return res.status(500).json({ error: "Database not configured" });
    try {
      const result = await p.query("SELECT * FROM users");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
