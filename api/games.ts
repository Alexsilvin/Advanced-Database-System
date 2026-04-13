import handler from "../netlify/functions/games.mts";
import { invokeNetlifyHandler } from "./_shared/invoke-netlify";

export default async function vercelGames(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
