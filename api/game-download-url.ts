import handler from "../netlify/functions/game-download-url.mts";
import { invokeNetlifyHandler } from "./_shared/invoke-netlify";

export default async function vercelGameDownloadUrl(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
