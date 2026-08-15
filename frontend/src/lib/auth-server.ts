import { cookies } from "next/headers";
import type { ApiUser } from "@/lib/types";

export type InitialSession = {
  hasToken: boolean;
  user: ApiUser | null;
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function userFromPayload(payload: Record<string, unknown>): ApiUser {
  return {
    id: String(payload.userId ?? ""),
    username: String(payload.username ?? ""),
    usernameOriginal: String(payload.usernameOriginal ?? payload.username ?? ""),
    email: "",
    createdAt: "",
  };
}

export async function getServerSession(): Promise<InitialSession> {
  const store = await cookies();
  const access = store.get("accessToken")?.value;
  const refresh = store.get("refreshToken")?.value;

  const token = access ?? refresh;
  if (!token) return { hasToken: false, user: null };

  const payload = decodeJwtPayload(token);
  return {
    hasToken: true,
    user: payload ? userFromPayload(payload) : null,
  };
}