import handler from "../../../netlify/functions/auth-logout.mts";
import { invokeNetlifyHandler } from "../../_shared/invoke-netlify";

export default async function vercelAuthLogout(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
