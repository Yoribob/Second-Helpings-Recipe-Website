"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import styles from "./page.module.css";

export function NotificationsContent() {
  const router = useRouter();
  const { status } = useAuth();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login?next=/notifications");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    api
      .getNotifications()
      .then((data) => {
        if (!cancelled) setItems(data.notifications);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const handleOpen = async (item: AppNotification) => {
    if (!item.read) {
      
      setItems((current) =>
        current.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
      api.markNotificationRead(item.id).catch(() => {});
    }

    if (item.recipeId) {
      router.push(`/recipes/${encodeURIComponent(item.recipeId)}`);
    }
  };

  if (status === "loading" || status === "anonymous") {
    return <p className={styles.empty}>Loading your notifications…</p>;
  }

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            {loading
              ? "Loading…"
              : `${items.length} ${items.length === 1 ? "notification" : "notifications"}${
                  unreadCount > 0 ? ` · ${unreadCount} unread` : ""
                }`}
          </p>
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading your notifications…</p>
      ) : loadError ? (
        <p className={styles.empty}>Couldn&apos;t load your notifications.</p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>
          No notifications yet. We&apos;ll let you know here when something
          happens to your recipes, like when one is approved or rejected.
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.item}${
                  item.read ? ` ${styles.read}` : ""
                }`}
                onClick={() => handleOpen(item)}
              >
                {!item.read && (
                  <span className={styles.dot} aria-hidden="true" />
                )}
                <span className={styles.itemBody}>
                  <span className={styles.message}>{item.message}</span>
                  <span className={styles.meta}>
                    {item.type === "rejected" ? "Rejected" : "Approved"}
                    {" · "}
                    {formatDate(item.createdAt)}
                    {item.recipeId && " · View recipe"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}