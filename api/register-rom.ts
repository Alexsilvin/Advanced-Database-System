import type { IncomingMessage, ServerResponse } from "http";

export default async function registerRom(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 501;
  res.end(JSON.stringify({ error: "ROM registration not yet available on Vercel. Please use Netlify deployment." }));
}
