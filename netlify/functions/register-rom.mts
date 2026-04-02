import type { Context } from "@netlify/functions";
import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return null;
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

function requireAdminKey(req: Request): boolean {
  const configuredKey = process.env.ROM_ADMIN_KEY;
  if (!configuredKey) {
    return true;
  }

  const headerKey = req.headers.get("x-admin-key");
  return headerKey === configuredKey;
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!requireAdminKey(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const p = getPool();
  if (!p) {
    return Response.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const body = (await req.json()) as {
      gameId?: string;
      romStorageKey?: string;
      romFilename?: string;
      romSizeBytes?: number;
      romSha256?: string;
      licenseType?: string;
      isDownloadable?: boolean;
    };

    if (!body.gameId || !body.romStorageKey) {
      return Response.json({ error: "gameId and romStorageKey are required" }, { status: 400 });
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
        body.romStorageKey,
        body.romFilename || null,
        body.romSizeBytes || null,
        body.romSha256 || null,
        body.licenseType || "unknown",
        body.isDownloadable ?? true,
        body.gameId,
      ]
    );

    if (updateRes.rows.length === 0) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    return Response.json({ game: updateRes.rows[0] });
  } catch (error) {
    console.error("Failed to register ROM metadata:", error);
    return Response.json({ error: "Failed to register ROM metadata" }, { status: 500 });
  }
};
