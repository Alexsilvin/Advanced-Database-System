import type { IncomingMessage, ServerResponse } from "http";

export default async function gameDownloadUrl(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 501;
  res.end(JSON.stringify({ error: "Game download not yet available on Vercel. Please use Netlify deployment." }));
}
