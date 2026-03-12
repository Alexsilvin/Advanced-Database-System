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
      const games = [
        ["NEON STRIKE", 29.99, "High-speed glitch combat in the digital void. Master the art of code-warfare.", "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200", "Action"],
        ["VOID RUNNER", 19.99, "Escape the collapsing simulation in this high-octane racing experience.", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200", "Racing"],
        ["CYBER-SOUL", 39.99, "A deep RPG set in a decaying megacity. Every choice alters the grid's fate.", "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200", "RPG"],
        ["GLITCH-BIT", 14.99, "Retro platforming with a broken twist. Navigate through fragmented data.", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200", "Platformer"],
        ["TERMINAL VELOCITY", 24.99, "Tactical shooter in a low-poly digital landscape. Precision is everything.", "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200", "Shooter"],
        ["DATA DRIFTER", 9.99, "Zen-like strategy game about navigating the streams of information.", "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200", "Strategy"]
      ];
      for (const game of games) {
        await p.query(insertQuery, game);
      }
      console.log("Database seeded with expanded catalog.");
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
    const mockGames = [
      { id: 101, title: "NEON STRIKE", price: 29.99, description: "High-speed glitch combat in the digital void. Master the art of code-warfare.", image: "/src/assets/images/f3b7e9f1865a02d3618eb4f41c287bcf.jpg", category: "Action" },
      { id: 102, title: "VOID RUNNER", price: 19.99, description: "Escape the collapsing simulation in this high-octane racing experience.", image: "/src/assets/images/afca124bf35229da8841d24ab2ca8c0f.jpg", category: "Racing" },
      { id: 103, title: "CYBER-SOUL", price: 39.99, description: "A deep RPG set in a decaying megacity. Every choice alters the grid's fate.", image: "/src/assets/images/a0b725d92124a133cfb7e86adb934727.jpg", category: "RPG" },
      { id: 104, title: "GLITCH-BIT", price: 14.99, description: "Retro platforming with a broken twist. Navigate through fragmented data.", image: "/src/assets/images/download.jfif", category: "Platformer" },
      { id: 105, title: "TERMINAL VELOCITY", price: 24.99, description: "Tactical shooter in a low-poly digital landscape. Precision is everything.", image: "/src/assets/images/download (1).jfif", category: "Shooter" },
      { id: 106, title: "DATA DRIFTER", price: 9.99, description: "Zen-like strategy game about navigating the streams of information.", image: "/src/assets/images/download (2).jfif", category: "Strategy" },
      { id: 107, title: "SIGNAL LOST", price: 34.99, description: "Investigate a silent satellite in deep space. A psychological horror protocol.", image: "/src/assets/images/download (3).jfif", category: "Horror" },
      { id: 108, title: "GRID WALKER", price: 44.99, description: "Advanced physics-based parkour in a neo-tokyo megastructure.", image: "/src/assets/images/download (4).jfif", category: "Action" }
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
      console.error("Database query failed, falling back to mock data.");
      res.json(mockGames);
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
