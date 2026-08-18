"use client";

import Link from "next/link";
import styles from "./EditRecipeButton.module.css";

type EditRecipeButtonProps = {
  recipeId: string;
  hasPendingEdit?: boolean;
};

export function EditRecipeButton({
  recipeId,
  hasPendingEdit = false,
}: EditRecipeButtonProps) {
  if (hasPendingEdit) {
    return (
      <span className={styles.pending} title="Your edits are awaiting admin review">
        Edit pending review
      </span>
    );
  }

  return (
    <Link
      href={`/recipes/${recipeId}/edit`}
      className={styles.edit}
      title="Edit this recipe"
      aria-label="Edit recipe"
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
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      Edit
    </Link>
  );
}
