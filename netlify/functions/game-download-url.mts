import type { Context } from "@netlify/functions";
import pg from "pg";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ensureAuthSchema, getSessionUserFromRequest } from "./_shared/auth.mts";

const { Pool } = pg;

type GameRow = {
  id: string;
  title: string;
  rom_storage_key: string | null;
  rom_filename: string | null;
  is_downloadable: boolean;
};

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

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.S3_REGION || "auto";
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("S3_SIGNING_CONFIG_MISSING");
    }

    s3Client = new S3Client({
      region,
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

function getBucket(): string | null {
  return (
    process.env.S3_BUCKET ||
    process.env.FILEBASE_BUCKET ||
    process.env.S3_BUCKET_NAME ||
    process.env.FILEBASE_BUCKET_NAME ||
    null
  );
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const p = getPool();
  if (!p) {
    return Response.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    await ensureAuthSchema(p);

    const sessionUser = await getSessionUserFromRequest(req, p);
    if (!sessionUser) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = (await req.json()) as {
      gameId?: string;
      expiresInSeconds?: number;
    };

    const gameId = body.gameId;
    if (!gameId) {
      return Response.json({ error: "gameId is required" }, { status: 400 });
    }

    const expiresInSeconds = Math.min(Math.max(body.expiresInSeconds ?? 60, 30), 300);

    const gameRes = await p.query<GameRow>(
      `SELECT id, title, rom_storage_key, rom_filename, is_downloadable
       FROM games
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [gameId]
    );

    if (gameRes.rows.length === 0) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    const game = gameRes.rows[0];
    if (!game.is_downloadable || !game.rom_storage_key) {
      return Response.json({ error: "This game is not downloadable" }, { status: 400 });
    }

    const requireLibrary = process.env.DOWNLOAD_REQUIRE_LIBRARY === "true";
    if (requireLibrary) {
      const entitlementRes = await p.query(
        `SELECT 1
         FROM library_items
         WHERE user_id = $1 AND game_id = $2
         LIMIT 1`,
        [sessionUser.id, gameId]
      );

      if (entitlementRes.rows.length === 0) {
        return Response.json({ error: "User does not own this game" }, { status: 403 });
      }
    }

    const bucket = getBucket();
    if (!bucket) {
      return Response.json(
        {
          error:
            "Bucket is not configured. Set S3_BUCKET (or FILEBASE_BUCKET/S3_BUCKET_NAME/FILEBASE_BUCKET_NAME).",
        },
        { status: 500 }
      );
    }

    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: game.rom_storage_key,
      ResponseContentDisposition: `attachment; filename=\"${game.rom_filename || `${game.title}.zip`}\"`,
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

    return Response.json({
      gameId: game.id,
      title: game.title,
      userId: sessionUser.id,
      signedUrl,
      expiresInSeconds,
    });
  } catch (error) {
    console.error("Failed to generate ROM download URL:", error);
    return Response.json({ error: "Failed to create signed download URL" }, { status: 500 });
  }
};
