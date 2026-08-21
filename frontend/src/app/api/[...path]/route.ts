import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendUrl(): string {
  return (process.env.API_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const strippedResponseHeaders = new Set([
  ...hopByHopHeaders,
  "content-encoding",
  "content-length",
]);

function buildProxyResponseHeaders(backendRes: Response): Headers {
  const headers = new Headers();

  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (strippedResponseHeaders.has(lower) || lower === "set-cookie") return;
    headers.set(key, value);
  });

  const setCookies =
    typeof backendRes.headers.getSetCookie === "function"
      ? backendRes.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      headers.append("set-cookie", cookie);
    }
  } else {
    const single = backendRes.headers.get("set-cookie");
    if (single) headers.append("set-cookie", single);
  }

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const url = `${getBackendUrl()}/api/${pathSegments.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (hopByHopHeaders.has(lower) || lower === "accept-encoding") return;
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(url, init);
  } catch {
    return NextResponse.json({ msg: "Backend unavailable" }, { status: 502 });
  }

  const body = await backendRes.arrayBuffer();

  return new NextResponse(body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: buildProxyResponseHeaders(backendRes),
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
