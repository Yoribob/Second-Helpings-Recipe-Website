"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type BookmarksContextValue = {
  bookmarkedIds: string[];
  ready: boolean;
  toggle: (recipeId: string) => Promise<void>;
};

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, status } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    api
      .getBookmarks()
      .then(({ ids }) => {
        if (!cancelled) {
          setBookmarkedIds(ids);
          setFetched(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookmarkedIds([]);
          setFetched(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, user?.id]);

  const ready = status === "anonymous" || (status === "authenticated" && fetched);
  const ids = status === "authenticated" ? bookmarkedIds : [];

  const toggle = useCallback(
    async (recipeId: string) => {
      const wasBookmarked = bookmarkedIds.includes(recipeId);
      setBookmarkedIds((current) =>
        wasBookmarked
          ? current.filter((id) => id !== recipeId)
          : [...current, recipeId],
      );
      try {
        if (wasBookmarked) {
          await api.removeBookmark(recipeId);
        } else {
          await api.addBookmark(recipeId);
        }
      } catch {
        setBookmarkedIds((current) =>
          wasBookmarked
            ? [...current, recipeId]
            : current.filter((id) => id !== recipeId),
        );
      }
    },
    [bookmarkedIds],
  );

  return (
    <BookmarksContext.Provider value={{ bookmarkedIds: ids, ready, toggle }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}