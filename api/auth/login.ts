import handler from "../../../netlify/functions/auth-login.mts";
import { invokeNetlifyHandler } from "../../_shared/invoke-netlify";

export default async function vercelAuthLogin(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
