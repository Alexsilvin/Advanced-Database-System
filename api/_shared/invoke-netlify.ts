import type { Context } from "@netlify/functions";

export async function invokeNetlifyHandler(
  handler: (req: Request, context: Context) => Promise<Response> | Response,
  req: Request
): Promise<Response> {
  return handler(req, {} as Context);
}
