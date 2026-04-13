import handler from "../../../netlify/functions/auth-signup.mts";
import { invokeNetlifyHandler } from "../../_shared/invoke-netlify";

export default async function vercelAuthSignup(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
