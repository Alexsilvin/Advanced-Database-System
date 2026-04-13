import handler from "../netlify/functions/env-health.mts";
import { invokeNetlifyHandler } from "./_shared/invoke-netlify";

export default async function vercelEnvHealth(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
