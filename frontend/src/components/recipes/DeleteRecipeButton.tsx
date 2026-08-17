"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import styles from "./DeleteRecipeButton.module.css";

export function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.deleteRecipe(recipeId);
      router.push("/recipes/my");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't delete this recipe",
      );
      setBusy(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className={styles.confirmWrap}>
        <span className={styles.confirmText}>Delete this recipe?</span>
        <button
          type="button"
          className={styles.confirmDelete}
          onClick={handleDelete}
          disabled={busy}
        >
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          className={styles.cancel}
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={busy}
        >
          Cancel
        </button>
        {error && (
          <span className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={styles.delete}
      onClick={() => setConfirming(true)}
      title="Permanently delete this recipe"
      aria-label="Delete recipe"
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
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
      Delete
    </button>
  );
}