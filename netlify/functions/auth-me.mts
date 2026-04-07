import type { Context } from "@netlify/functions";
import { ensureAuthSchema, getPool, getSessionUserFromRequest } from "./_shared/auth.mts";

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
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

    return Response.json(sessionUser, { status: 200 });
  } catch (error) {
    console.error("Session check failed:", error);
    return Response.json({ error: "Failed to fetch session" }, { status: 500 });
  }
};
