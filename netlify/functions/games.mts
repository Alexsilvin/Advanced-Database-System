import type { Context } from "@netlify/functions";
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("DATABASE_URL is missing. Database features will be disabled.");
      return null;
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

const mockGames = [
  { id: 101, title: "NEON STRIKE", price: 29.99, description: "High-speed glitch combat in the digital void. Master the art of code-warfare.", image: "/src/assets/images/f3b7e9f1865a02d3618eb4f41c287bcf.jpg", category: "Action" },
  { id: 102, title: "VOID RUNNER", price: 19.99, description: "Escape the collapsing simulation in this high-octane racing experience.", image: "/src/assets/images/afca124bf35229da8841d24ab2ca8c0f.jpg", category: "Racing" },
  { id: 103, title: "CYBER-SOUL", price: 39.99, description: "A deep RPG set in a decaying megacity. Every choice alters the grid's fate.", image: "/src/assets/images/a0b725d92124a133cfb7e86adb934727.jpg", category: "RPG" },
  { id: 104, title: "GLITCH-BIT", price: 14.99, description: "Retro platforming with a broken twist. Navigate through fragmented data.", image: "/src/assets/images/download.jfif", category: "Platformer" },
  { id: 105, title: "TERMINAL VELOCITY", price: 24.99, description: "Tactical shooter in a low-poly digital landscape. Precision is everything.", image: "/src/assets/images/download (1).jfif", category: "Shooter" },
  { id: 106, title: "DATA DRIFTER", price: 9.99, description: "Zen-like strategy game about navigating the streams of information.", image: "/src/assets/images/download (2).jfif", category: "Strategy" },
  { id: 107, title: "SIGNAL LOST", price: 34.99, description: "Investigate a silent satellite in deep space. A psychological horror protocol.", image: "/src/assets/images/download (3).jfif", category: "Horror" },
  { id: 108, title: "GRID WALKER", price: 44.99, description: "Advanced physics-based parkour in a neo-tokyo megastructure.", image: "/src/assets/images/download (4).jfif", category: "Action" },
];

async function initDb(p: pg.Pool) {
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        title TEXT,
        price REAL,
        description TEXT,
        image TEXT,
        category TEXT
      );
    `);

    const res = await p.query("SELECT COUNT(*) FROM games");
    if (parseInt(res.rows[0].count) === 0) {
      const insertQuery = "INSERT INTO games (title, price, description, image, category) VALUES ($1, $2, $3, $4, $5)";
      const seedGames = [
        ["NEON STRIKE", 29.99, "High-speed glitch combat in the digital void. Master the art of code-warfare.", "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1200", "Action"],
        ["VOID RUNNER", 19.99, "Escape the collapsing simulation in this high-octane racing experience.", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200", "Racing"],
        ["CYBER-SOUL", 39.99, "A deep RPG set in a decaying megacity. Every choice alters the grid's fate.", "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1200", "RPG"],
        ["GLITCH-BIT", 14.99, "Retro platforming with a broken twist. Navigate through fragmented data.", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200", "Platformer"],
        ["TERMINAL VELOCITY", 24.99, "Tactical shooter in a low-poly digital landscape. Precision is everything.", "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1200", "Shooter"],
        ["DATA DRIFTER", 9.99, "Zen-like strategy game about navigating the streams of information.", "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200", "Strategy"],
      ];
      for (const game of seedGames) {
        await p.query(insertQuery, game);
      }
      console.log("Database seeded with game catalog.");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}

export default async (req: Request, context: Context) => {
  const p = getPool();

  if (!p) {
    console.warn("DB_OFFLINE: Serving mock data.");
    return Response.json(mockGames);
  }

  try {
    await initDb(p);
    const result = await p.query("SELECT * FROM games");
    if (result.rows.length === 0) {
      return Response.json(mockGames);
    }
    return Response.json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    console.warn("Falling back to mock data.");
    return Response.json(mockGames);
  }
};
