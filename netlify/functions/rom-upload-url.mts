import type { Context } from "@netlify/functions";
import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let s3Client: S3Client | null = null;

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

function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("S3_SIGNING_CONFIG_MISSING");
    }

    s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    });
  }

  return s3Client;
}

function requireAdminKey(req: Request): boolean {
  const configuredKey = process.env.ROM_ADMIN_KEY;
  if (!configuredKey) {
    return true;
  }

  const headerKey = req.headers.get("x-admin-key");
  return headerKey === configuredKey;
}

function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "rom.bin";
}

function getBucket(): string | null {
  return process.env.S3_BUCKET || process.env.FILEBASE_BUCKET || null;
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
      filename?: string;
      contentType?: string;
      expiresInSeconds?: number;
    };

    if (!body.gameId || !body.filename) {
      return Response.json({ error: "gameId and filename are required" }, { status: 400 });
    }

    const gameRes = await p.query<{ id: string; title: string }>(
      `SELECT id, title
       FROM games
       WHERE id = $1
       LIMIT 1`,
      [body.gameId]
    );

    if (gameRes.rows.length === 0) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    const bucket = getBucket();
    if (!bucket) {
      return Response.json({ error: "S3_BUCKET is not configured" }, { status: 500 });
    }

    const storageKey = `roms/${body.gameId}/${sanitizeFilename(body.filename)}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: body.contentType || "application/octet-stream",
    });

    const expiresInSeconds = Math.min(Math.max(body.expiresInSeconds ?? 300, 60), 900);
    const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });

    return Response.json({
      gameId: gameRes.rows[0].id,
      title: gameRes.rows[0].title,
      uploadUrl,
      storageKey,
      expiresInSeconds,
    });
  } catch (error) {
    console.error("Failed to create ROM upload URL:", error);
    return Response.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
};