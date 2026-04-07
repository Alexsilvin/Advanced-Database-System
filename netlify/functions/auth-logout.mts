import type { Context } from "@netlify/functions";
import { clearSessionFromRequest, ensureAuthSchema, getPool } from "./_shared/auth.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const p = getPool();
  if (!p) {
    return Response.json({ ok: true }, { status: 200 });
  }

  try {
    await ensureAuthSchema(p);
    const clearedCookie = await clearSessionFromRequest(req, p);

    return Response.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": clearedCookie,
        },
      }
    );
  } catch (error) {
    console.error("Logout failed:", error);
    return Response.json({ error: "Failed to log out" }, { status: 500 });
  }
};
