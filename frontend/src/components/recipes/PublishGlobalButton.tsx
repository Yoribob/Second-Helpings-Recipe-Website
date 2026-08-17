"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { RecipeStatus } from "@/lib/types";
import styles from "./PublishGlobalButton.module.css";

type PublishGlobalButtonProps = {
  recipeId: string;
  status?: RecipeStatus;
  rejectedReason?: string | null;
};

export function PublishGlobalButton({
  recipeId,
  status,
  rejectedReason,
}: PublishGlobalButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rejected = status === "rejected";

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateRecipe(recipeId, { status: "published" });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't publish this recipe",
      );
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateRecipe(recipeId, { status: "draft" });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't unpublish this recipe",
      );
    } finally {
      setBusy(false);
    }
  };

  if (rejected) {
    return (
      <div className={styles.rejected}>
        <span className={styles.rejectedBadge}>Rejected</span>
        {rejectedReason && (
          <p className={styles.rejectedReason}>{rejectedReason}</p>
        )}
        <button
          type="button"
          className={styles.button}
          onClick={publish}
          disabled={busy}
          title="Make this recipe visible to everyone"
          aria-label="Publish recipe"
        >
          {busy ? "Publishing…" : "Submit again"}
        </button>
        {error && (
          <span className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  if (status === "published") {
    return (
      <>
        <button
          type="button"
          className={styles.unpublish}
          onClick={unpublish}
          disabled={busy}
          title="Remove this recipe from the public site"
          aria-label="Unpublish recipe"
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
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M1 1l22 22" />
          </svg>
          {busy ? "Unpublishing…" : "Unpublish"}
        </button>
        {error && (
          <span className={styles.error} role="alert">
            {error}
          </span>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={publish}
        disabled={busy}
        title="Make this recipe visible to everyone"
        aria-label="Publish recipe"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {busy ? "Publishing…" : "Make public"}
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </>
  );
}