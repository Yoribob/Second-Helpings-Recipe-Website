"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { RecipeComment } from "@/lib/types";
import styles from "./RatingSection.module.css";

const STARS = [1, 2, 3, 4, 5];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type RatingSectionProps = {
  recipeId: string;
  myRating: number | null;
  comments: RecipeComment[];
  average?: number | null;
  count?: number | null;
  readOnly?: boolean;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {STARS.map((value) => (
        <span
          key={value}
          className={value <= rating ? styles.starFilled : styles.starEmpty}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function RatingSection({
  recipeId,
  myRating,
  comments,
  average,
  readOnly = false,
}: RatingSectionProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { status } = useAuth();
  const authenticated = status === "authenticated";

  const [savingRating, setSavingRating] = useState(false);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ownComment = comments.find((comment) => comment.mine);

  const requireLogin = () => {
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  };

  const handleRate = async (value: number) => {
    if (!authenticated) {
      requireLogin();
      return;
    }
    setSavingRating(true);
    setPendingRating(value);
    setRatingError(null);
    try {
      await api.rateRecipe(recipeId, value);
      router.refresh();
    } catch (err) {
      setRatingError(
        err instanceof ApiError ? err.message : "Couldn't save your rating",
      );
      setPendingRating(null);
    } finally {
      setSavingRating(false);
    }
  };

  const handlePostComment = async () => {
    if (!authenticated) {
      requireLogin();
      return;
    }
    const text = commentText.trim();
    if (!text || posting) return;
    if (picked === 0) {
      setCommentError("Choose a star rating first.");
      return;
    }
    setPosting(true);
    setCommentError(null);
    try {
      await api.createComment(recipeId, text);
      router.refresh();
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : "Couldn't post your comment",
      );
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingId) return;
    setDeletingId(commentId);
    setCommentError(null);
    try {
      await api.deleteComment(recipeId, commentId);
      router.refresh();
    } catch (err) {
      setCommentError(
        err instanceof ApiError ? err.message : "Couldn't delete the comment",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const picked = pendingRating ?? myRating ?? 0;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Rate this recipe</h2>

      {readOnly ? (
        <div
          className={styles.picker}
          role="img"
          aria-label={`${(average ?? 0).toFixed(1)} out of 5 stars average`}
          style={{ pointerEvents: "none" }}
        >
          {[...STARS].reverse().map((value) => (
            <span
              key={value}
              className={`${styles.pickerStar}${
                value <= Math.ceil(average ?? 0)
                  ? ` ${styles.pickerStarSelected}`
                  : ""
              }`}
              aria-hidden="true"
            >
              ★
            </span>
          ))}
        </div>
      ) : (
        <>
          <div className={styles.picker} role="radiogroup" aria-label="Star rating">
            {[...STARS].reverse().map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.pickerStar}${
                  value <= picked ? ` ${styles.pickerStarSelected}` : ""
                }`}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                disabled={savingRating}
                onClick={() => handleRate(value)}
              >
                ★
              </button>
            ))}
          </div>

          {ratingError && (
            <p className={styles.error} role="alert">
              {ratingError}
            </p>
          )}

          {!ownComment && (
            <div className={styles.form}>
              <textarea
                className={styles.textarea}
                rows={4}
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Share your thoughts on this recipe…"
              />
              <button
                type="button"
                className={styles.submit}
                onClick={handlePostComment}
                disabled={posting}
              >
                {posting
                  ? "Posting…"
                  : authenticated
                    ? "Post comment"
                    : "Log in to comment"}
              </button>
              {commentError && (
                <p className={styles.error} role="alert">
                  {commentError}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <h3 className={styles.commentsTitle}>Comments</h3>
      <ul className={styles.comments}>
        {comments.length === 0 && <li className={styles.empty}>No comments yet.</li>}
        {comments.map((comment) => (
          <li key={comment.id} className={styles.comment}>
            <div className={styles.commentHeader}>
              <div className={styles.commentAuthorRow}>
                <span className={styles.commentAuthor}>
                  {comment.author.usernameOriginal}
                </span>
                {comment.rating != null && <StarRow rating={comment.rating} />}
                <span className={styles.commentDate}>
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              {comment.mine && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={deletingId === comment.id}
                >
                  {deletingId === comment.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
            <p className={styles.commentText}>{comment.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}