"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { RecipeStatus } from "@/lib/types";
import styles from "./PublishGlobalButton.module.css";

type PublishGlobalButtonProps = {
  recipeId: string;
  status?: RecipeStatus;
};

export function PublishGlobalButton({
  recipeId,
  status,
}: PublishGlobalButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pending = status === "pending";

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateRecipe(recipeId, { status: "pending" });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't submit this recipe for review",
      );
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <span className={styles.pending}>
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
          <path d="M12 6v6l4 2" />
        </svg>
        Pending review
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={handleClick}
        disabled={busy}
        title="Submit this recipe for manual verification to make it visible to everyone"
        aria-label="Submit recipe for public review"
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
        {busy ? "Submitting…" : "Make public"}
      </button>
      {error && (
        <span className={styles.error} role="alert">
          {error}
        </span>
      )}
    </>
  );
}