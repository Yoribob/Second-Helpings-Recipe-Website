import { NextRequest, NextResponse } from "next/server";

function getBackendUrl(): string | null {
  const url = process.env.API_URL;
  return url ? url.replace(/\/$/, "") : null;
}

export function middleware(request: NextRequest) {
  const backendUrl = getBackendUrl();
  if (!backendUrl) return NextResponse.next();

  const destination = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    `${backendUrl}/`,
  );

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: "/api/:path*",
};
