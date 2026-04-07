import type { Context } from "@netlify/functions";
import { ensureAuthSchema, getPool, issueSession, verifyPassword } from "./_shared/auth.mts";

function sanitizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 40) : "";
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

    const body = (await req.json()) as {
      username?: string;
      password?: string;
    };

    const username = sanitizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !password) {
      return Response.json({ error: "Username and password are required" }, { status: 400 });
    }

    const existing = await p.query<{
      id: string;
      username: string;
      avatar_url: string | null;
      role: "admin" | "player";
      email: string | null;
      password_hash: string | null;
      password_salt: string | null;
    }>(
      `SELECT id, username, avatar_url, role, email, password_hash, password_salt
       FROM users
       WHERE LOWER(username) = LOWER($1)
       LIMIT 1`,
      [username]
    );

    const user = existing.rows[0];

    if (!user || !user.password_hash || !user.password_salt || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const sessionCookie = await issueSession(p, user.id);

    return Response.json(
      {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        role: user.role,
        email: user.email,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookie,
        },
      }
    );
  } catch (error) {
    console.error("Login failed:", error);
    return Response.json({ error: "Failed to log in" }, { status: 500 });
  }
};
