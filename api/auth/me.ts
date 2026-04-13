import handler from "../../../netlify/functions/auth-me.mts";
import { invokeNetlifyHandler } from "../../_shared/invoke-netlify";

export default async function vercelAuthMe(req: Request): Promise<Response> {
  return invokeNetlifyHandler(handler, req);
}
