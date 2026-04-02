import type { Context } from "@netlify/functions";
import pg from "pg";

const { Pool } = pg;

type Candidate = {
  imageUrl: string;
  sourceUrl: string;
  source: "rawg" | "igdb";
  confidence: number;
};

type GameRow = {
  id: string;
  title: string;
  image_url: string | null;
};

let pool: pg.Pool | null = null;
let igdbTokenCache: { token: string; expiresAt: number } | null = null;

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
  const configuredKey = process.env.POSTER_ENRICH_ADMIN_KEY;
  if (!configuredKey) {
    return true;
  }

  const headerKey = req.headers.get("x-admin-key");
  return headerKey === configuredKey;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleSimilarity(a: string, b: string): number {
  const left = normalizeText(a);
  const right = normalizeText(b);

  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const leftTokens = new Set(left.split(" "));
  const rightTokens = new Set(right.split(" "));

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }

  const denominator = Math.max(leftTokens.size, rightTokens.size);
  return denominator === 0 ? 0 : overlap / denominator;
}

function buildConfidence(score: number, sourceBoost: number): number {
  const base = Math.min(Math.max(score, 0), 1);
  return Math.min(1, Number((base * 0.85 + sourceBoost).toFixed(3)));
}

async function fetchRawgPoster(title: string): Promise<Candidate | null> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    key: apiKey,
    search: title,
    page_size: "5",
  });

  const res = await fetch(`https://api.rawg.io/api/games?${params.toString()}`);
  if (!res.ok) return null;

  const payload = (await res.json()) as {
    results?: Array<{ name: string; background_image?: string; slug?: string }>;
  };

  if (!payload.results?.length) return null;

  let best: Candidate | null = null;
  for (const candidate of payload.results) {
    if (!candidate.background_image || !candidate.name) continue;

    const similarity = titleSimilarity(title, candidate.name);
    const confidence = buildConfidence(similarity, 0.08);

    if (!best || confidence > best.confidence) {
      best = {
        imageUrl: candidate.background_image,
        source: "rawg",
        sourceUrl: `https://rawg.io/games/${candidate.slug || ""}`,
        confidence,
      };
    }
  }

  return best;
}

async function getIgdbToken(): Promise<string | null> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (igdbTokenCache && igdbTokenCache.expiresAt > now + 30_000) {
    return igdbTokenCache.token;
  }

  const tokenRes = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!tokenRes.ok) return null;

  const payload = (await tokenRes.json()) as { access_token: string; expires_in: number };

  igdbTokenCache = {
    token: payload.access_token,
    expiresAt: now + payload.expires_in * 1000,
  };

  return payload.access_token;
}

async function fetchIgdbPoster(title: string): Promise<Candidate | null> {
  const clientId = process.env.IGDB_CLIENT_ID;
  const token = await getIgdbToken();
  if (!clientId || !token) return null;

  const query = `fields name,slug,cover.url; search \"${title.replace(/\"/g, "")}\"; limit 5;`;

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: query,
  });

  if (!res.ok) return null;

  const payload = (await res.json()) as Array<{
    name?: string;
    slug?: string;
    cover?: { url?: string };
  }>;

  if (!payload.length) return null;

  let best: Candidate | null = null;
  for (const candidate of payload) {
    if (!candidate.name || !candidate.cover?.url) continue;

    const similarity = titleSimilarity(title, candidate.name);
    const confidence = buildConfidence(similarity, 0.12);

    if (!best || confidence > best.confidence) {
      const normalizedUrl = candidate.cover.url.startsWith("//")
        ? `https:${candidate.cover.url}`
        : candidate.cover.url;
      const highRes = normalizedUrl.replace("t_thumb", "t_cover_big");

      best = {
        imageUrl: highRes,
        source: "igdb",
        sourceUrl: `https://www.igdb.com/games/${candidate.slug || ""}`,
        confidence,
      };
    }
  }

  return best;
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
    const body = (await req.json().catch(() => ({}))) as {
      limit?: number;
      force?: boolean;
      minConfidence?: number;
    };

    const limit = Math.min(Math.max(body.limit ?? 10, 1), 50);
    const force = Boolean(body.force);
    const minConfidence = Math.min(Math.max(body.minConfidence ?? 0.65, 0), 1);

    const query = force
      ? `SELECT id, title, image_url FROM games WHERE is_active = TRUE ORDER BY created_at DESC LIMIT $1`
      : `SELECT id, title, image_url FROM games WHERE is_active = TRUE AND (image_url IS NULL OR image_url = '') ORDER BY created_at DESC LIMIT $1`;

    const gamesRes = await p.query<GameRow>(query, [limit]);

    const updated: Array<{ id: string; title: string; source: string; confidence: number }> = [];
    const skipped: Array<{ id: string; title: string; reason: string }> = [];

    for (const game of gamesRes.rows) {
      const rawgCandidate = await fetchRawgPoster(game.title);
      const igdbCandidate = await fetchIgdbPoster(game.title);

      let winner: Candidate | null = null;
      if (rawgCandidate && igdbCandidate) {
        winner = rawgCandidate.confidence >= igdbCandidate.confidence ? rawgCandidate : igdbCandidate;
      } else {
        winner = rawgCandidate || igdbCandidate;
      }

      if (!winner || winner.confidence < minConfidence) {
        skipped.push({ id: game.id, title: game.title, reason: "No confident match" });
        continue;
      }

      await p.query(
        `UPDATE games
         SET image_url = $1,
             poster_source = $2,
             poster_source_url = $3,
             poster_confidence = $4,
             poster_last_checked_at = now()
         WHERE id = $5`,
        [winner.imageUrl, winner.source, winner.sourceUrl, winner.confidence, game.id]
      );

      updated.push({
        id: game.id,
        title: game.title,
        source: winner.source,
        confidence: winner.confidence,
      });
    }

    return Response.json({
      attempted: gamesRes.rows.length,
      updated,
      skipped,
      minConfidence,
    });
  } catch (error) {
    console.error("Poster enrichment failed:", error);
    return Response.json({ error: "Poster enrichment failed" }, { status: 500 });
  }
};
