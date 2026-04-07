import type { Context } from "@netlify/functions";
import { ensureAuthSchema, getPool, issueSession, hashPassword } from "./_shared/auth.mts";

function sanitizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 40) : "";
}

function sanitizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 160) : "";
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
      email?: string;
      password?: string;
    };

    const username = sanitizeUsername(body.username);
    const email = sanitizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";

    if (!username || !email || password.length < 6) {
      return Response.json({ error: "Invalid signup payload" }, { status: 400 });
    }

    const existingUser = await p.query(
      `SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1`,
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return Response.json({ error: "Username or email already exists" }, { status: 409 });
    }

    const credentials = hashPassword(password);

    const created = await p.query<{
      id: string;
      username: string;
      avatar_url: string | null;
      role: "admin" | "player";
      email: string | null;
    }>(
      `INSERT INTO users (username, email, password_hash, password_salt, role)
       VALUES ($1, $2, $3, $4, 'player')
       RETURNING id, username, avatar_url, role, email`,
      [username, email, credentials.hash, credentials.salt]
    );

    const user = created.rows[0];
    const sessionCookie = await issueSession(p, user.id);

    return Response.json(user, {
      status: 201,
      headers: {
        "Set-Cookie": sessionCookie,
      },
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return Response.json({ error: "Failed to sign up" }, { status: 500 });
  }
};
