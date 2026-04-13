import type { IncomingMessage, ServerResponse } from "http";
import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) return null;
    pool = new Pool({ connectionString });
  }
  return pool;
}

export default async function games(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const p = getPool();
  if (!p) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Database not configured" }));
    return;
  }

  try {
    const result = await p.query("SELECT * FROM games WHERE is_active = true ORDER BY created_at DESC");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result.rows));
  } catch (error) {
    console.error("Failed to fetch games:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Failed to fetch games" }));
  }
}
