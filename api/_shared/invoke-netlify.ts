import type { Context } from "@netlify/functions";
import type { IncomingMessage, IncomingHttpHeaders, ServerResponse } from "http";

type NetlifyStyleHandler = (req: Request, context: Context) => Promise<Response> | Response;

type NodeRequestWithBody = IncomingMessage & {
  body?: unknown;
};

function addRequestHeaders(target: Headers, source: IncomingHttpHeaders) {
  for (const [key, value] of Object.entries(source)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        target.append(key, item);
      }
      continue;
    }

    target.set(key, value);
  }
}

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

async function getBodyInit(req: NodeRequestWithBody): Promise<BodyInit | undefined> {
  const method = (req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return undefined;
  }

  if (req.body == null) {
    const rawBody = await readRawBody(req);
    return rawBody.length > 0 ? rawBody : undefined;
  }

  if (Buffer.isBuffer(req.body) || typeof req.body === "string" || req.body instanceof Uint8Array) {
    return req.body;
  }

  return JSON.stringify(req.body);
}

async function toWebRequest(req: NodeRequestWithBody): Promise<Request> {
  const headers = new Headers();
  addRequestHeaders(headers, req.headers);

  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const hostValue = Array.isArray(host) ? host[0] : host;
  const protocolValue = Array.isArray(protocol) ? protocol[0] : protocol;
  const url = new URL(req.url || "/", `${protocolValue}://${hostValue}`);

  const body = await getBodyInit(req);
  return new Request(url.toString(), {
    method: req.method || "GET",
    headers,
    body,
  });
}

async function writeWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const body = Buffer.from(await response.arrayBuffer());
  res.end(body);
}

export function createVercelHandler(handler: NetlifyStyleHandler) {
  return async function vercelHandler(req: NodeRequestWithBody, res: ServerResponse): Promise<void> {
    const request = await toWebRequest(req);
    const response = await handler(request, {} as Context);
    await writeWebResponse(res, response);
  };
}

export async function invokeNetlifyHandler(
  handler: (req: Request, context: Context) => Promise<Response> | Response,
  req: Request
): Promise<Response> {
  return handler(req, {} as Context);
}
