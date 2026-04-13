import handler from "../netlify/functions/rom-upload-url.mts";
import { invokeNetlifyHandler } from "./_shared/invoke-netlify";

export default async function vercelRomUploadUrl(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
