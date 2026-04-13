import handler from "../netlify/functions/register-rom.mts";
import { invokeNetlifyHandler } from "./_shared/invoke-netlify";

export default async function vercelRegisterRom(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
