import type { Context } from "@netlify/functions";
import { ensureAuthSchema, getPool, getSessionUserFromRequest } from "./_shared/auth.mts";

const BUCKET_ENV_CANDIDATES = [
  "S3_BUCKET",
  "FILEBASE_BUCKET",
  "S3_BUCKET_NAME",
  "FILEBASE_BUCKET_NAME",
] as const;

const REQUIRED_ENV = [
  "DATABASE_URL",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
] as const;

const OPTIONAL_ENV = ["S3_REGION", "S3_FORCE_PATH_STYLE", "DOWNLOAD_REQUIRE_LIBRARY"] as const;

function getConfiguredBucketEnvName(): string | null {
  for (const name of BUCKET_ENV_CANDIDATES) {
    if (process.env[name]) {
      return name;
    }
  }
  return null;
}

function getMissingVars(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]);
}

async function isAuthorized(req: Request): Promise<boolean> {
  const configuredAdminKey = process.env.ROM_ADMIN_KEY;
  const headerAdminKey = req.headers.get("x-admin-key");

  if (configuredAdminKey && headerAdminKey === configuredAdminKey) {
    return true;
  }

  const p = getPool();
  if (!p) {
    return false;
  }

  try {
    await ensureAuthSchema(p);
    const sessionUser = await getSessionUserFromRequest(req, p);
    return sessionUser?.role === "admin";
  } catch {
    return false;
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const authorized = await isAuthorized(req);
  if (!authorized) {
    return Response.json(
      {
        error:
          "Unauthorized. Sign in as admin or send x-admin-key matching ROM_ADMIN_KEY.",
      },
      { status: 401 }
    );
  }

  const configuredBucketEnv = getConfiguredBucketEnvName();
  const missingRequired = getMissingVars(REQUIRED_ENV);
  const missingOptional = getMissingVars(OPTIONAL_ENV);

  if (!configuredBucketEnv) {
    missingRequired.push("one of: " + BUCKET_ENV_CANDIDATES.join(", "));
  }

  const ok = missingRequired.length === 0;

  return Response.json(
    {
      status: ok ? "ok" : "missing_required_env",
      missingRequired,
      missingOptional,
      configuredBucketEnv,
      checkedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
};
