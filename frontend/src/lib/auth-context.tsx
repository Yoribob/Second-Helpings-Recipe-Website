"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, refreshAccessToken } from "@/lib/api";
import type { ApiUser } from "@/lib/types";
import type { InitialSession } from "@/lib/auth-server";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: ApiUser | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    email: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialSession,
  children,
}: {
  initialSession: InitialSession;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<ApiUser | null>(initialSession.user);
  const [status, setStatus] = useState<AuthStatus>(
    initialSession.user
      ? "authenticated"
      : initialSession.hasToken
        ? "loading"
        : "anonymous",
  );
  const router = useRouter();

  useEffect(() => {
    if (!initialSession.hasToken) return;

    let cancelled = false;

    async function restore() {
      try {
        const me = await api.getMe();
        if (!cancelled) {
          setUser(me.user);
          setStatus("authenticated");
        }
      } catch {
        try {
          const refreshed = await refreshAccessToken();
          const me = refreshed ? await api.getMe() : null;
          if (!cancelled) {
            setUser(me?.user ?? null);
            setStatus(me ? "authenticated" : "anonymous");
          }
        } catch {
          if (!cancelled) {
            setUser(null);
            setStatus("anonymous");
          }
        }
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [initialSession.hasToken]);

  const login = useCallback(async (username: string, password: string) => {
    await api.login({ username, password });
    const me = await api.getMe();
    setUser(me.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (username: string, password: string, email: string) => {
      await api.register({ username, password, email });
      const me = await api.getMe();
      setUser(me.user);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setStatus("anonymous");
    router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}