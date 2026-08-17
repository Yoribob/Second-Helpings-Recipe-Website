"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./AuthNav.module.css";

export function AuthNav() {
  const { user, status, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status === "loading") return null;

  if (!user) {
    return (
      <div className={styles.actions}>
        <Link href="/login" className={styles.link}>
          Log in
        </Link>
        <Link href="/register" className={styles.cta}>
          Sign up
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className={styles.actions}>
      <div className={styles.menu} ref={rootRef}>
        <button
          type="button"
          className={styles.userButton}
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Account menu for ${user.usernameOriginal}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className={styles.userName} title={user.usernameOriginal}>
            {user.usernameOriginal}
          </span>
        </button>

        {open && (
          <div className={styles.dropdown} role="menu">
            <Link
              href="/notifications"
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              Notifications
            </Link>
            <Link
              href="/bookmarks"
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              Bookmarks
            </Link>
            <Link
              href="/recipes/my"
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              My recipes
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className={styles.dropdownItem}
                onClick={() => setOpen(false)}
              >
                Moderation
              </Link>
            )}
            <div className={styles.divider} role="separator" />
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}