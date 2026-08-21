import { cookies } from "next/headers";

const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";

export class ServerApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function serverGetJson<T>(
  path: string,
): Promise<T | null> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.msg) message = body.msg;
    } catch {}
    throw new ServerApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}