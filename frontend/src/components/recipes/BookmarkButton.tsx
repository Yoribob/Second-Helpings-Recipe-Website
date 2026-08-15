"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useBookmarks } from "@/lib/bookmark-context";
import styles from "./BookmarkButton.module.css";

type BookmarkButtonProps = {
  recipeId: string;
  size?: "md" | "sm";
};

export function BookmarkButton({ recipeId, size = "md" }: BookmarkButtonProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { status } = useAuth();
  const { bookmarkedIds, ready, toggle } = useBookmarks();

  const isBookmarked = bookmarkedIds.includes(recipeId);
  const active = status === "authenticated" && isBookmarked;

  const handleClick = () => {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    toggle(recipeId);
  };

  const sizeClass = size === "sm" ? styles.sm : styles.md;

  return (
    <button
      type="button"
      className={`${active ? styles.active : styles.icon} ${sizeClass}`}
      onClick={handleClick}
      disabled={!ready}
      aria-pressed={active}
      aria-label={active ? "Remove bookmark" : "Add bookmark"}
      title={active ? "Remove bookmark" : "Add bookmark"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}