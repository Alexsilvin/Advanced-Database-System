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
    console.error("CRITICAL: Database initialization failed!");
    console.error(err);
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
