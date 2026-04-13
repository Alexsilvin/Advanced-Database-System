import handler from "../netlify/functions/enrich-posters.mts";
import { invokeNetlifyHandler } from "./_shared/invoke-netlify";

export default async function vercelEnrichPosters(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
